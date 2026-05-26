import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildMutationPreview,
  buildNowPaymentsReplayRequest,
  classifyWebhookScenario,
  normalizeTunnelBaseUrl,
  redactProviderPayload,
} from '../lib/payments/billing/simulation.ts';

const payload = {
  payment_status: 'finished',
  order_id: 'payment-1',
  payment_id: 123,
  invoice_id: 456,
  pay_currency: 'ethbase',
  pay_amount: '0.0001',
};

test('normalizes temporary tunnel URLs to the webhook endpoint', () => {
  assert.equal(
    normalizeTunnelBaseUrl('https://example.ngrok-free.app/'),
    'https://example.ngrok-free.app/api/payments/nowpayments/webhook'
  );
  assert.equal(
    normalizeTunnelBaseUrl('https://hooks.example.com/api/payments/nowpayments/webhook'),
    'https://hooks.example.com/api/payments/nowpayments/webhook'
  );
  assert.equal(
    normalizeTunnelBaseUrl('http://localhost:3000/api/payments/nowpayments/test-mode/webhook'),
    'http://localhost:3000/api/payments/nowpayments/test-mode/webhook'
  );
});

test('builds signed replay request without exposing the signing secret', () => {
  const replay = buildNowPaymentsReplayRequest({
    payload,
    ipnSecret: 'secret',
    targetUrl: 'http://localhost:3000/api/payments/nowpayments/webhook',
  });

  assert.equal(replay.method, 'POST');
  assert.equal(replay.headers['content-type'], 'application/json');
  assert.equal(typeof replay.headers['x-nowpayments-sig'], 'string');
  assert.equal(replay.headers['x-nowpayments-sig'].length, 128);
  assert.ok(!JSON.stringify(replay).includes('secret'));
});

test('classifies duplicate stale rollback race and expiration scenarios', () => {
  assert.equal(classifyWebhookScenario({ payload, existingProcessed: true }).kind, 'duplicate_replay');
  assert.equal(
    classifyWebhookScenario({
      payload,
      existingPaymentStatus: 'completed',
      now: '2026-05-26T10:00:00.000Z',
      eventCreatedAt: '2026-05-26T08:00:00.000Z',
      staleAfterMinutes: 60,
    }).kind,
    'stale_webhook'
  );
  assert.equal(
    classifyWebhookScenario({
      payload: { ...payload, payment_status: 'refunded' },
      existingPaymentStatus: 'completed',
    }).kind,
    'rollback_or_refund'
  );
  assert.equal(
    classifyWebhookScenario({
      payload: { ...payload, payment_status: 'failed' },
      existingPaymentStatus: 'completed',
    }).kind,
    'late_callback_race'
  );
  assert.equal(
    classifyWebhookScenario({
      payload: { ...payload, payment_status: 'expired' },
      existingPaymentStatus: 'pending',
    }).kind,
    'payment_expiration'
  );
});

test('builds dry-run mutation preview with kill switch enforced', () => {
  const preview = buildMutationPreview({
    billingPlan: {
      kind: 'activate_subscription',
      subscription: null,
      billingEvents: [],
      entitlementGranted: true,
      retryable: true,
    },
    killSwitchEnabled: true,
    mutationFlagEnabled: true,
  });

  assert.equal(preview.wouldMutate, false);
  assert.equal(preview.reason, 'kill_switch_enabled');
});

test('redacts provider payload archives', () => {
  const redacted = redactProviderPayload({
    ...payload,
    pay_address: '0xabc',
    purchase_id: 'purchase-secret',
  });

  assert.equal(redacted.pay_address, '[redacted]');
  assert.equal(redacted.purchase_id, '[redacted]');
  assert.equal(redacted.payment_status, 'finished');
});
