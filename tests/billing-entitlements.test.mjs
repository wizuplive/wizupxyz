import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildBillingEntitlementPlan,
  normalizeBillingSubscriptionStatus,
} from '../lib/payments/billing/entitlements.ts';

const completedPayment = {
  id: 'payment-1',
  user_id: 'user-1',
  provider: 'nowpayments',
  status: 'completed',
  amount: 0.25,
  currency: 'usd',
  provider_payment_id: 'provider-payment-1',
  req_id: 'invoice-1',
  pay_id: 'provider-payment-1',
  created_at: '2026-05-26T08:00:00.000Z',
};

test('normalizes internal subscription statuses with grace support', () => {
  assert.equal(normalizeBillingSubscriptionStatus('active'), 'active');
  assert.equal(normalizeBillingSubscriptionStatus('past_due'), 'grace');
  assert.equal(normalizeBillingSubscriptionStatus('trialing'), 'active');
  assert.equal(normalizeBillingSubscriptionStatus('expired'), 'expired');
  assert.equal(normalizeBillingSubscriptionStatus('canceled'), 'canceled');
  assert.equal(normalizeBillingSubscriptionStatus('anything_else'), 'inactive');
});

test('plans entitlement grant for completed production payment when mutations are enabled', () => {
  const plan = buildBillingEntitlementPlan({
    payment: completedPayment,
    existingSubscription: null,
    mode: 'production',
    mutationsEnabled: true,
    now: '2026-05-26T09:00:00.000Z',
  });

  assert.equal(plan.kind, 'activate_subscription');
  assert.equal(plan.billingEvents.at(-1).type, 'entitlement_granted');
  assert.equal(plan.subscription?.status, 'active');
  assert.equal(plan.subscription?.provider_subscription_id, 'provider-payment-1');
});

test('does not grant entitlement when subscription mutations are disabled', () => {
  const plan = buildBillingEntitlementPlan({
    payment: completedPayment,
    existingSubscription: null,
    mode: 'production',
    mutationsEnabled: false,
    now: '2026-05-26T09:00:00.000Z',
  });

  assert.equal(plan.kind, 'mutation_disabled');
  assert.equal(plan.subscription, null);
  assert.equal(plan.billingEvents.at(-1).type, 'payment_completed');
});

test('prevents TEST_MODE payments from mutating production subscriptions', () => {
  const plan = buildBillingEntitlementPlan({
    payment: { ...completedPayment, id: 'wizup-testmode-payment-1' },
    existingSubscription: null,
    mode: 'test',
    mutationsEnabled: true,
    now: '2026-05-26T09:00:00.000Z',
  });

  assert.equal(plan.kind, 'test_mode_ignored');
  assert.equal(plan.subscription, null);
});

test('is idempotent when provider transaction already owns an active subscription', () => {
  const plan = buildBillingEntitlementPlan({
    payment: completedPayment,
    existingSubscription: {
      id: 'sub-1',
      user_id: 'user-1',
      status: 'active',
      plan_id: 'pro_creator',
      provider: 'nowpayments',
      provider_subscription_id: 'provider-payment-1',
      current_period_start: '2026-05-26T08:00:00.000Z',
      current_period_end: '2026-06-25T08:00:00.000Z',
      cancel_at_period_end: false,
    },
    mode: 'production',
    mutationsEnabled: true,
    now: '2026-05-26T09:00:00.000Z',
  });

  assert.equal(plan.kind, 'already_active');
  assert.equal(plan.subscription?.id, 'sub-1');
});

test('failed and expired payments plan recovery without entitlement grant', () => {
  for (const status of ['failed', 'expired']) {
    const plan = buildBillingEntitlementPlan({
      payment: { ...completedPayment, status },
      existingSubscription: null,
      mode: 'production',
      mutationsEnabled: true,
      now: '2026-05-26T09:00:00.000Z',
    });

    assert.equal(plan.kind, status === 'failed' ? 'payment_failed' : 'payment_expired');
    assert.equal(plan.subscription, null);
    assert.notEqual(plan.billingEvents.at(-1).type, 'entitlement_granted');
  }
});

test('stale pending payments time out without entitlement grant', () => {
  const plan = buildBillingEntitlementPlan({
    payment: { ...completedPayment, status: 'pending', created_at: '2026-05-26T07:00:00.000Z' },
    existingSubscription: null,
    mode: 'production',
    mutationsEnabled: true,
    now: '2026-05-26T09:00:00.000Z',
    paymentTimeoutMinutes: 60,
  });

  assert.equal(plan.kind, 'payment_expired');
  assert.equal(plan.subscription, null);
  assert.equal(plan.billingEvents.at(-1).type, 'payment_expired');
});

test('rollback required never grants entitlement', () => {
  const plan = buildBillingEntitlementPlan({
    payment: { ...completedPayment, status: 'rollback_required' },
    existingSubscription: null,
    mode: 'production',
    mutationsEnabled: true,
    now: '2026-05-26T09:00:00.000Z',
  });

  assert.equal(plan.kind, 'rollback_required');
  assert.equal(plan.subscription, null);
  assert.equal(plan.billingEvents.at(-1).type, 'rollback_required');
});
