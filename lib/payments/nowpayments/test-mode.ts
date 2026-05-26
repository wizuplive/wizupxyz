import { appendFile, mkdir } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import path from 'node:path';

import type { NowPaymentsInvoiceRequest } from './types';

export const NOWPAYMENTS_TEST_MODE_ORDER_PREFIX = 'wizup-testmode-';
export const NOWPAYMENTS_TEST_MODE_PAY_CURRENCY = 'ethbase';
export const NOWPAYMENTS_TEST_MODE_PRICE_AMOUNT = 0.25;
export const NOWPAYMENTS_TEST_MODE_PRICE_CURRENCY = 'usd';

const TEST_MODE_ENABLED_VALUES = new Set(['1', 'true', 'yes', 'on']);
const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

export type TestModeGuardResult =
  | { ok: true }
  | { ok: false; status: number; error: string };

function isEnabled(value: string | undefined) {
  return TEST_MODE_ENABLED_VALUES.has((value ?? '').trim().toLowerCase());
}

function splitHost(value: string | null) {
  if (!value) {
    return null;
  }

  const first = value.trim().split(',')[0]?.trim();
  if (!first) {
    return null;
  }

  if (first.startsWith('[')) {
    const end = first.indexOf(']');
    return end > -1 ? first.slice(0, end + 1) : first;
  }

  return first.split(':')[0]?.trim() || null;
}

function isLocalHostname(value: string | null) {
  return Boolean(value && LOCAL_HOSTNAMES.has(value.toLowerCase()));
}

export function validateNowPaymentsTestModeRequest(
  request: Request,
  options: { requireToken?: boolean } = {}
): TestModeGuardResult {
  if (!isEnabled(process.env.WIZUP_NOWPAYMENTS_TEST_MODE)) {
    return { ok: false, status: 404, error: 'Not found' };
  }

  const requestUrl = new URL(request.url);
  const host = splitHost(request.headers.get('host'));
  const forwardedHost = splitHost(request.headers.get('x-forwarded-host'));
  const origin = request.headers.get('origin');
  let originHost: string | null = null;

  if (origin) {
    try {
      originHost = splitHost(new URL(origin).host);
    } catch {
      return { ok: false, status: 404, error: 'Not found' };
    }
  }

  if (
    !isLocalHostname(requestUrl.hostname) ||
    !isLocalHostname(host) ||
    (forwardedHost && !isLocalHostname(forwardedHost)) ||
    (originHost && !isLocalHostname(originHost))
  ) {
    return { ok: false, status: 404, error: 'Not found' };
  }

  if (options.requireToken ?? true) {
    const expectedToken = process.env.WIZUP_NOWPAYMENTS_TEST_TOKEN?.trim();
    const requestToken = request.headers.get('x-wizup-test-token')?.trim();

    if (!expectedToken || requestToken !== expectedToken) {
      return { ok: false, status: 401, error: 'Unauthorized' };
    }
  }

  return { ok: true };
}

export function createNowPaymentsTestModeInvoiceRequest(params: {
  orderId: string;
  notifyUrl: string;
  successUrl: string;
  cancelUrl: string;
}): NowPaymentsInvoiceRequest {
  return {
    price_amount: NOWPAYMENTS_TEST_MODE_PRICE_AMOUNT,
    price_currency: NOWPAYMENTS_TEST_MODE_PRICE_CURRENCY,
    pay_currency: NOWPAYMENTS_TEST_MODE_PAY_CURRENCY,
    order_id: params.orderId,
    order_description: 'WIZUP TEST_MODE ETHBASE payment validation',
    ipn_callback_url: params.notifyUrl,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  };
}

export function createNowPaymentsTestModeOrderId() {
  return `${NOWPAYMENTS_TEST_MODE_ORDER_PREFIX}${randomUUID()}`;
}

export async function appendNowPaymentsTestModeWebhookLog(entry: Record<string, unknown>) {
  const directory = path.join(process.cwd(), '.hermes-runs', 'nowpayments-test-mode');
  await mkdir(directory, { recursive: true });
  await appendFile(
    path.join(directory, 'webhooks.jsonl'),
    `${JSON.stringify({ receivedAt: new Date().toISOString(), ...entry })}\n`,
    'utf8'
  );
}
