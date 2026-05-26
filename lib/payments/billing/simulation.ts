import { createHmac } from 'node:crypto';

import type { BillingEntitlementPlan } from './entitlements';
import type { NowPaymentsPaymentWebhookPayload } from '../nowpayments/types';

export type WebhookScenarioKind =
  | 'normal'
  | 'duplicate_replay'
  | 'stale_webhook'
  | 'rollback_or_refund'
  | 'late_callback_race'
  | 'payment_expiration';

const WEBHOOK_PATH = '/api/payments/nowpayments/webhook';
const TEST_MODE_WEBHOOK_PATH = '/api/payments/nowpayments/test-mode/webhook';
const REDACTED_KEYS = new Set([
  'pay_address',
  'purchase_id',
  'payout_hash',
  'invoice_url',
  'payment_url',
]);

function toSortedValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(toSortedValue);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((accumulator, key) => {
        accumulator[key] = toSortedValue((value as Record<string, unknown>)[key]);
        return accumulator;
      }, {});
  }

  return value;
}

export function normalizeTunnelBaseUrl(value: string) {
  const url = new URL(value);
  if (!url.pathname || url.pathname === '/') {
    url.pathname = WEBHOOK_PATH;
  }

  if (
    !url.pathname.endsWith(WEBHOOK_PATH) &&
    !url.pathname.endsWith(TEST_MODE_WEBHOOK_PATH)
  ) {
    url.pathname = WEBHOOK_PATH;
  }

  url.search = '';
  url.hash = '';
  return url.toString();
}

export function buildNowPaymentsSignature(
  payload: NowPaymentsPaymentWebhookPayload,
  ipnSecret: string
) {
  return createHmac('sha512', ipnSecret)
    .update(JSON.stringify(toSortedValue(payload)))
    .digest('hex');
}

export function buildNowPaymentsReplayRequest(input: {
  payload: NowPaymentsPaymentWebhookPayload;
  ipnSecret: string;
  targetUrl: string;
}) {
  return {
    method: 'POST',
    url: normalizeTunnelBaseUrl(input.targetUrl),
    headers: {
      'content-type': 'application/json',
      'x-nowpayments-sig': buildNowPaymentsSignature(input.payload, input.ipnSecret),
    },
    body: JSON.stringify(input.payload),
  };
}

export function classifyWebhookScenario(input: {
  payload: NowPaymentsPaymentWebhookPayload;
  existingProcessed?: boolean;
  existingPaymentStatus?: string;
  now?: string;
  eventCreatedAt?: string;
  staleAfterMinutes?: number;
}): { kind: WebhookScenarioKind; diagnostics: string[] } {
  const diagnostics: string[] = [];
  const payloadStatus = input.payload.payment_status.trim().toLowerCase();
  const paymentStatus = input.existingPaymentStatus?.trim().toLowerCase();

  if (input.existingProcessed) {
    diagnostics.push('event_id already processed');
    return { kind: 'duplicate_replay', diagnostics };
  }

  if (
    input.now &&
    input.eventCreatedAt &&
    isStale(input.eventCreatedAt, input.now, input.staleAfterMinutes ?? 60)
  ) {
    diagnostics.push('webhook event exceeded stale threshold');
    return { kind: 'stale_webhook', diagnostics };
  }

  if (payloadStatus === 'refunded') {
    diagnostics.push('provider requested rollback/refund handling');
    return { kind: 'rollback_or_refund', diagnostics };
  }

  if (payloadStatus === 'expired') {
    diagnostics.push('provider marked payment expired');
    return { kind: 'payment_expiration', diagnostics };
  }

  if (
    paymentStatus === 'completed' &&
    ['failed', 'expired', 'waiting', 'partially_paid'].includes(payloadStatus)
  ) {
    diagnostics.push('late callback would conflict with completed payment');
    return { kind: 'late_callback_race', diagnostics };
  }

  diagnostics.push('normal provider callback');
  return { kind: 'normal', diagnostics };
}

export function buildMutationPreview(input: {
  billingPlan: BillingEntitlementPlan;
  killSwitchEnabled: boolean;
  mutationFlagEnabled: boolean;
}) {
  if (input.killSwitchEnabled) {
    return {
      wouldMutate: false,
      reason: 'kill_switch_enabled',
      billingAction: input.billingPlan.kind,
      entitlementGranted: false,
    };
  }

  if (!input.mutationFlagEnabled) {
    return {
      wouldMutate: false,
      reason: 'mutation_flag_disabled',
      billingAction: input.billingPlan.kind,
      entitlementGranted: false,
    };
  }

  return {
    wouldMutate: input.billingPlan.kind === 'activate_subscription',
    reason: input.billingPlan.kind,
    billingAction: input.billingPlan.kind,
    entitlementGranted: input.billingPlan.entitlementGranted,
  };
}

export function redactProviderPayload(payload: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(payload).map(([key, value]) => [
      key,
      REDACTED_KEYS.has(key) ? '[redacted]' : value,
    ])
  );
}

function isStale(createdAt: string, now: string, staleAfterMinutes: number) {
  const createdTime = new Date(createdAt).getTime();
  const nowTime = new Date(now).getTime();

  if (!Number.isFinite(createdTime) || !Number.isFinite(nowTime)) {
    return false;
  }

  return nowTime - createdTime >= staleAfterMinutes * 60 * 1000;
}
