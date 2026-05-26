import assert from 'node:assert/strict';
import test from 'node:test';

import {
  applyNowPaymentsTransition,
  buildNowPaymentsEventId,
  normalizeNowPaymentsCompletionStatus,
} from '../lib/payments/nowpayments/completion.ts';

const basePayment = {
  provider: 'nowpayments',
  status: 'pending',
  provider_payment_id: null,
  req_id: null,
  pay_id: null,
};

test('normalizes NOWPayments statuses into internal payment states', () => {
  assert.equal(normalizeNowPaymentsCompletionStatus('waiting'), 'pending');
  assert.equal(normalizeNowPaymentsCompletionStatus('confirming'), 'confirming');
  assert.equal(normalizeNowPaymentsCompletionStatus('confirmed'), 'completed');
  assert.equal(normalizeNowPaymentsCompletionStatus('finished'), 'completed');
  assert.equal(normalizeNowPaymentsCompletionStatus('expired'), 'expired');
  assert.equal(normalizeNowPaymentsCompletionStatus('failed'), 'failed');
  assert.equal(normalizeNowPaymentsCompletionStatus('refunded'), 'rollback_required');
});

test('builds stable event ids from provider payment id before invoice id', () => {
  assert.equal(
    buildNowPaymentsEventId({ payment_status: 'finished', payment_id: 123, invoice_id: 456 }, '{}'),
    'payment:123'
  );
  assert.equal(
    buildNowPaymentsEventId({ payment_status: 'waiting', invoice_id: 456 }, '{}'),
    'invoice:456'
  );
});

test('accepts first completed callback and marks payment complete without entitlement unlock', () => {
  const transition = applyNowPaymentsTransition({
    payment: basePayment,
    payload: {
      payment_status: 'finished',
      order_id: 'payment-1',
      payment_id: 123,
      invoice_id: 456,
      pay_currency: 'ethbase',
    },
    eventId: 'payment:123',
    existingEventProcessed: false,
    now: '2026-05-25T12:00:00.000Z',
  });

  assert.equal(transition.action, 'transition');
  assert.equal(transition.nextPayment.status, 'completed');
  assert.equal(transition.unlockSubscription, false);
  assert.equal(transition.eventLog.processed, true);
});

test('rejects replayed processed callbacks without changing payment state', () => {
  const transition = applyNowPaymentsTransition({
    payment: { ...basePayment, status: 'completed' },
    payload: { payment_status: 'finished', order_id: 'payment-1', payment_id: 123 },
    eventId: 'payment:123',
    existingEventProcessed: true,
    now: '2026-05-25T12:00:00.000Z',
  });

  assert.equal(transition.action, 'replay_ignored');
  assert.equal(transition.nextPayment.status, 'completed');
});

test('ignores duplicate completed callbacks for terminal completed payment', () => {
  const transition = applyNowPaymentsTransition({
    payment: { ...basePayment, status: 'completed', provider_payment_id: '123' },
    payload: { payment_status: 'finished', order_id: 'payment-1', payment_id: 123 },
    eventId: 'payment:123-duplicate',
    existingEventProcessed: false,
    now: '2026-05-25T12:00:00.000Z',
  });

  assert.equal(transition.action, 'duplicate_ignored');
  assert.equal(transition.nextPayment.status, 'completed');
});

test('does not downgrade completed payment after late failed callback', () => {
  const transition = applyNowPaymentsTransition({
    payment: { ...basePayment, status: 'completed' },
    payload: { payment_status: 'failed', order_id: 'payment-1', payment_id: 123 },
    eventId: 'payment:123-failed',
    existingEventProcessed: false,
    now: '2026-05-25T12:00:00.000Z',
  });

  assert.equal(transition.action, 'terminal_preserved');
  assert.equal(transition.nextPayment.status, 'completed');
});
