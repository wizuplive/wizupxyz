#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createClient } from '@supabase/supabase-js';

import {
  buildBillingEntitlementPlan,
} from '../../lib/payments/billing/entitlements.ts';
import {
  buildMutationPreview,
  buildNowPaymentsReplayRequest,
  classifyWebhookScenario,
  normalizeTunnelBaseUrl,
  redactProviderPayload,
} from '../../lib/payments/billing/simulation.ts';
import {
  applyNowPaymentsTransition,
  buildNowPaymentsEventId,
} from '../../lib/payments/nowpayments/completion.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const fixtureDirectory = path.join(root, '.hermes-runs', 'nowpayments-fixtures');

function readEnvFile(file = '.env.local') {
  const values = {};
  try {
    const text = readFileSync(path.join(root, file), 'utf8');
    for (const line of text.split(/\r?\n/)) {
      if (!line || line.trim().startsWith('#') || !line.includes('=')) {
        continue;
      }
      const [key, ...rest] = line.split('=');
      values[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '');
    }
  } catch {
    // Env file is optional for commands that do not touch Supabase or signing.
  }
  return values;
}

function getEnv(name, envFile) {
  return process.env[name] ?? envFile[name] ?? '';
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value.startsWith('--')) {
      const key = value.slice(2);
      const next = argv[index + 1];
      if (!next || next.startsWith('--')) {
        args[key] = true;
      } else {
        args[key] = next;
        index += 1;
      }
    } else {
      args._.push(value);
    }
  }
  return args;
}

async function readJson(file) {
  return JSON.parse(await readFile(path.resolve(root, file), 'utf8'));
}

async function writeJson(file, value) {
  const target = path.resolve(root, file);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function fixtureName(prefix, payload) {
  const id = payload.payment_id ?? payload.invoice_id ?? createHash('sha256').update(JSON.stringify(payload)).digest('hex').slice(0, 12);
  return `${prefix}-${id}.json`;
}

function getSupabase(envFile) {
  const url = getEnv('NEXT_PUBLIC_SUPABASE_URL', envFile);
  const key = getEnv('SUPABASE_SERVICE_ROLE_KEY', envFile);
  if (!url || !key) {
    throw new Error('Missing Supabase service env for inspection command');
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function commandCapture(args) {
  const payload = await readJson(args.payload);
  const archive = {
    capturedAt: new Date().toISOString(),
    source: args.source ?? 'manual',
    payload: redactProviderPayload(payload),
    rawPayloadSha256: createHash('sha256').update(JSON.stringify(payload)).digest('hex'),
  };
  const output = args.out ?? path.join('.hermes-runs', 'nowpayments-fixtures', fixtureName('captured', payload));
  await writeJson(output, archive);
  console.log(JSON.stringify({ ok: true, output }, null, 2));
}

async function commandReplay(args, envFile) {
  const payloadFile = args.payload ?? args.fixture;
  const input = await readJson(payloadFile);
  const payload = input.payload && input.rawPayloadSha256 ? input.payload : input;
  const secret = getEnv('NOWPAYMENTS_IPN_SECRET', envFile);
  if (!secret) {
    throw new Error('Missing NOWPAYMENTS_IPN_SECRET');
  }

  const targetUrl = normalizeTunnelBaseUrl(String(args.url ?? 'http://localhost:3000'));
  const replay = buildNowPaymentsReplayRequest({ payload, ipnSecret: secret, targetUrl });
  const response = await fetch(replay.url, {
    method: replay.method,
    headers: replay.headers,
    body: replay.body,
  });
  const body = await response.text();
  console.log(JSON.stringify({
    ok: response.ok,
    status: response.status,
    target: replay.url,
    response: safeJson(body),
  }, null, 2));
}

async function commandReplayLatestNp(args, envFile) {
  const admin = getSupabase(envFile);
  const npId = args.npId ?? (await loadLatestProviderPaymentId(admin));
  if (!npId) {
    throw new Error('No latest NOWPayments provider_payment_id found');
  }

  const apiBase = (getEnv('NOWPAYMENTS_API_URL', envFile) || 'https://api.nowpayments.io/v1').replace(/\/+$/, '');
  const apiKey = getEnv('NOWPAYMENTS_API_KEY', envFile);
  const ipnSecret = getEnv('NOWPAYMENTS_IPN_SECRET', envFile);

  if (!apiKey || !ipnSecret) {
    throw new Error('Missing NOWPayments API key or IPN secret');
  }

  const paymentLookup = await admin
    .from('payments')
    .select('id, provider_payment_id, req_id, pay_id')
    .eq('provider', 'nowpayments')
    .or(`provider_payment_id.eq.${npId},pay_id.eq.${npId},req_id.eq.${npId}`)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (paymentLookup.error) {
    throw new Error(paymentLookup.error.message);
  }

  const providerResponse = await fetch(`${apiBase}/payment/${npId}`, {
    headers: {
      Accept: 'application/json',
      'x-api-key': apiKey,
    },
  });
  const providerPayload = await providerResponse.json();

  if (!providerResponse.ok) {
    throw new Error(providerPayload.message ?? `NOWPayments payment lookup failed: ${providerResponse.status}`);
  }

  const payload = {
    ...providerPayload,
    order_id: providerPayload.order_id ?? paymentLookup.data?.id,
    payment_id: providerPayload.payment_id ?? npId,
    invoice_id: providerPayload.invoice_id ?? paymentLookup.data?.req_id,
  };
  const targetUrl = String(
    args.url ??
      (args.testMode
        ? 'http://localhost:3000/api/payments/nowpayments/test-mode/webhook'
        : 'http://localhost:3000/api/payments/nowpayments/webhook')
  );
  const replay = buildNowPaymentsReplayRequest({ payload, ipnSecret, targetUrl });
  const response = await fetch(replay.url, {
    method: replay.method,
    headers: replay.headers,
    body: replay.body,
  });
  const body = await response.text();

  console.log(JSON.stringify({
    ok: response.ok,
    npId,
    paymentId: paymentLookup.data?.id ?? null,
    target: replay.url,
    providerStatus: payload.payment_status ?? null,
    responseStatus: response.status,
    response: safeJson(body),
  }, null, 2));
}

async function commandSimulate(args) {
  const fixture = await readJson(args.payload ?? args.fixture);
  const payload = fixture.payload && fixture.rawPayloadSha256 ? fixture.payload : fixture;
  const scenario = String(args.scenario ?? 'duplicate');
  const mutated = { ...payload };

  if (scenario === 'duplicate') {
    // No mutation. Reuse same event id payload.
  } else if (scenario === 'stale') {
    mutated.updated_at = args.updatedAt ?? '2026-05-26T08:00:00.000Z';
  } else if (scenario === 'rollback' || scenario === 'refund') {
    mutated.payment_status = 'refunded';
  } else if (scenario === 'race') {
    mutated.payment_status = 'failed';
  } else if (scenario === 'expiration') {
    mutated.payment_status = 'expired';
  } else {
    throw new Error(`Unknown scenario: ${scenario}`);
  }

  const output = args.out ?? path.join('.hermes-runs', 'nowpayments-fixtures', fixtureName(`simulated-${scenario}`, mutated));
  await writeJson(output, mutated);
  const classification = classifyWebhookScenario({
    payload: mutated,
    existingProcessed: scenario === 'duplicate',
    existingPaymentStatus: scenario === 'race' ? 'completed' : args.existingPaymentStatus,
    eventCreatedAt: scenario === 'stale' ? mutated.updated_at : undefined,
    now: args.now ?? '2026-05-26T10:00:00.000Z',
  });
  console.log(JSON.stringify({ ok: true, output, classification }, null, 2));
}

async function commandPreview(args) {
  const payment = await readJson(args.payment);
  const subscription = args.subscription ? await readJson(args.subscription) : null;
  const plan = buildBillingEntitlementPlan({
    payment,
    existingSubscription: subscription,
    mode: args.mode === 'test' ? 'test' : 'production',
    mutationsEnabled: args.mutations === 'enabled',
    now: args.now ?? new Date().toISOString(),
  });
  const preview = buildMutationPreview({
    billingPlan: plan,
    killSwitchEnabled: args.killSwitch !== 'off',
    mutationFlagEnabled: args.mutations === 'enabled',
  });
  console.log(JSON.stringify({ ok: true, plan, preview }, null, 2));
}

async function commandInspect(args, envFile) {
  const admin = getSupabase(envFile);
  const paymentId = args.paymentId;
  if (!paymentId) {
    throw new Error('--paymentId is required');
  }

  const [payment, events, subscriptions] = await Promise.all([
    admin.from('payments').select('*').eq('id', paymentId).maybeSingle(),
    admin.from('webhook_events').select('event_id,event_type,payload,processed,created_at').eq('provider', 'nowpayments').order('created_at', { ascending: true }),
    admin.from('subscriptions').select('*').eq('provider', 'nowpayments').order('created_at', { ascending: false }).limit(20),
  ]);

  if (payment.error) throw new Error(payment.error.message);
  if (events.error) throw new Error(events.error.message);
  if (subscriptions.error) throw new Error(subscriptions.error.message);

  const matchingEvents = (events.data ?? []).filter((event) => {
    const payload = event.payload ?? {};
    return payload.order_id === paymentId || payload?.wizup_billing?.events?.some?.((item) => item.paymentId === paymentId);
  });

  console.log(JSON.stringify({
    ok: true,
    payment: payment.data,
    timeline: matchingEvents,
    subscriptions: subscriptions.data,
  }, null, 2));
}

async function commandRollback(args) {
  const payment = await readJson(args.payment);
  const rollbackPayment = {
    ...payment,
    status: 'rollback_required',
  };
  const plan = buildBillingEntitlementPlan({
    payment: rollbackPayment,
    existingSubscription: args.subscription ? await readJson(args.subscription) : null,
    mode: 'production',
    mutationsEnabled: false,
    now: args.now ?? new Date().toISOString(),
  });
  console.log(JSON.stringify({
    ok: true,
    dryRun: true,
    action: 'manual_rollback_preview',
    plan,
  }, null, 2));
}

async function loadLatestProviderPaymentId(admin) {
  const result = await admin
    .from('payments')
    .select('provider_payment_id, pay_id')
    .eq('provider', 'nowpayments')
    .not('provider_payment_id', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data?.provider_payment_id ?? result.data?.pay_id ?? null;
}

function safeJson(value) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const command = args._[0];
  const envFile = readEnvFile();
  await mkdir(fixtureDirectory, { recursive: true });

  if (getEnv('WIZUP_BILLING_SIMULATION_KILL_SWITCH', envFile) === '1' && command !== 'preview') {
    throw new Error('Simulation kill-switch is enabled');
  }

  if (command === 'capture') return commandCapture(args);
  if (command === 'replay') return commandReplay(args, envFile);
  if (command === 'replay-latest-np') return commandReplayLatestNp(args, envFile);
  if (command === 'simulate') return commandSimulate(args);
  if (command === 'preview') return commandPreview(args);
  if (command === 'inspect') return commandInspect(args, envFile);
  if (command === 'rollback') return commandRollback(args);

  console.log(JSON.stringify({
    ok: false,
    usage: [
      'capture --payload payload.json [--out fixture.json]',
      'replay --payload payload.json --url http://localhost:3000',
      'replay-latest-np [--npId 4790799988] [--testMode]',
      'simulate --payload payload.json --scenario duplicate|stale|rollback|race|expiration',
      'preview --payment payment.json [--subscription subscription.json] [--mutations enabled]',
      'inspect --paymentId uuid',
      'rollback --payment payment.json [--subscription subscription.json]',
    ],
  }, null, 2));
}

main().catch((error) => {
  console.error(JSON.stringify({ ok: false, error: error.message }, null, 2));
  process.exitCode = 1;
});
