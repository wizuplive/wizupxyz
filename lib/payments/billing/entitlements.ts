export type BillingMode = 'production' | 'test';

export type BillingSubscriptionStatus =
  | 'active'
  | 'grace'
  | 'inactive'
  | 'expired'
  | 'canceled'
  | 'rollback_required';

export type BillingEventType =
  | 'invoice_created'
  | 'payment_detected'
  | 'payment_confirming'
  | 'payment_completed'
  | 'entitlement_granted'
  | 'payment_failed'
  | 'payment_expired'
  | 'rollback_required'
  | 'manual_reconciliation_requested';

export type BillingEntitlementPlanKind =
  | 'activate_subscription'
  | 'already_active'
  | 'mutation_disabled'
  | 'test_mode_ignored'
  | 'payment_pending'
  | 'payment_confirming'
  | 'payment_failed'
  | 'payment_expired'
  | 'rollback_required'
  | 'manual_reconciliation_required';

export type BillingPaymentRecord = {
  id: string;
  user_id: string;
  provider: 'nowpayments';
  status: string;
  amount: number | string;
  currency: string;
  provider_payment_id: string | null;
  req_id: string | null;
  pay_id: string | null;
  created_at: string;
};

export type BillingSubscriptionRecord = {
  id?: string;
  user_id: string;
  status: string;
  plan_id: string;
  provider: 'nowpayments';
  provider_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
};

export type BillingEvent = {
  type: BillingEventType;
  provider: 'nowpayments';
  paymentId: string;
  userId: string;
  providerPaymentId: string | null;
  providerInvoiceId: string | null;
  at: string;
  mode: BillingMode;
};

export type BillingEntitlementPlan = {
  kind: BillingEntitlementPlanKind;
  subscription: BillingSubscriptionRecord | null;
  billingEvents: BillingEvent[];
  entitlementGranted: boolean;
  retryable: boolean;
};

const ACTIVE_STATUSES = new Set(['active', 'trialing']);
const GRACE_STATUSES = new Set(['past_due', 'grace']);
const TEST_PAYMENT_PREFIX = 'wizup-testmode-';
const DEFAULT_PLAN_ID = 'pro_creator';
const DEFAULT_PERIOD_DAYS = 30;
const DEFAULT_PAYMENT_TIMEOUT_MINUTES = 60;

function addDays(value: string, days: number) {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}

function providerReference(payment: BillingPaymentRecord) {
  return payment.provider_payment_id ?? payment.pay_id ?? payment.req_id ?? payment.id;
}

function event(
  type: BillingEventType,
  input: {
    payment: BillingPaymentRecord;
    mode: BillingMode;
    now: string;
  }
): BillingEvent {
  return {
    type,
    provider: 'nowpayments',
    paymentId: input.payment.id,
    userId: input.payment.user_id,
    providerPaymentId: input.payment.provider_payment_id ?? input.payment.pay_id,
    providerInvoiceId: input.payment.req_id,
    at: input.now,
    mode: input.mode,
  };
}

export function normalizeBillingSubscriptionStatus(status: string): BillingSubscriptionStatus {
  const normalized = status.trim().toLowerCase();

  if (ACTIVE_STATUSES.has(normalized)) {
    return 'active';
  }

  if (GRACE_STATUSES.has(normalized)) {
    return 'grace';
  }

  if (normalized === 'expired') {
    return 'expired';
  }

  if (normalized === 'canceled' || normalized === 'cancelled') {
    return 'canceled';
  }

  if (normalized === 'rollback_required') {
    return 'rollback_required';
  }

  return 'inactive';
}

export function isBillingSubscriptionMutationEnabled() {
  return ['1', 'true', 'yes', 'on'].includes(
    (process.env.WIZUP_BILLING_SUBSCRIPTION_MUTATIONS_ENABLED ?? '').trim().toLowerCase()
  );
}

export function buildBillingEntitlementPlan(input: {
  payment: BillingPaymentRecord;
  existingSubscription: BillingSubscriptionRecord | null;
  mode: BillingMode;
  mutationsEnabled: boolean;
  now: string;
  paymentTimeoutMinutes?: number;
}): BillingEntitlementPlan {
  const baseEvents = [event('payment_detected', input)];
  const paymentStatus = input.payment.status.trim().toLowerCase();

  if (input.mode === 'test' || input.payment.id.startsWith(TEST_PAYMENT_PREFIX)) {
    return plan('test_mode_ignored', null, baseEvents, false, false);
  }

  if (paymentStatus === 'pending') {
    if (isPaymentTimedOut(input.payment.created_at, input.now, input.paymentTimeoutMinutes)) {
      return plan('payment_expired', null, [...baseEvents, event('payment_expired', input)], false, false);
    }

    return plan('payment_pending', null, [...baseEvents, event('invoice_created', input)], false, true);
  }

  if (paymentStatus === 'confirming' || paymentStatus === 'processing') {
    return plan('payment_confirming', null, [...baseEvents, event('payment_confirming', input)], false, true);
  }

  if (paymentStatus === 'failed') {
    return plan('payment_failed', null, [...baseEvents, event('payment_failed', input)], false, true);
  }

  if (paymentStatus === 'expired') {
    return plan('payment_expired', null, [...baseEvents, event('payment_expired', input)], false, false);
  }

  if (paymentStatus === 'rollback_required') {
    return plan('rollback_required', null, [...baseEvents, event('rollback_required', input)], false, false);
  }

  if (paymentStatus !== 'completed') {
    return plan(
      'manual_reconciliation_required',
      null,
      [...baseEvents, event('manual_reconciliation_requested', input)],
      false,
      true
    );
  }

  const completedEvents = [...baseEvents, event('payment_completed', input)];
  const providerSubscriptionId = providerReference(input.payment);

  if (
    input.existingSubscription?.provider_subscription_id &&
    input.existingSubscription.provider_subscription_id === providerSubscriptionId &&
    normalizeBillingSubscriptionStatus(input.existingSubscription.status) === 'active'
  ) {
    return plan('already_active', input.existingSubscription, completedEvents, true, false);
  }

  if (!input.mutationsEnabled) {
    return plan('mutation_disabled', null, completedEvents, false, false);
  }

  const currentPeriodStart = input.now;
  const currentPeriodEnd =
    input.existingSubscription?.current_period_end &&
    new Date(input.existingSubscription.current_period_end) > new Date(input.now)
      ? addDays(input.existingSubscription.current_period_end, DEFAULT_PERIOD_DAYS)
      : addDays(input.now, DEFAULT_PERIOD_DAYS);

  const subscription: BillingSubscriptionRecord = {
    id: input.existingSubscription?.id,
    user_id: input.payment.user_id,
    status: 'active',
    plan_id: input.existingSubscription?.plan_id ?? DEFAULT_PLAN_ID,
    provider: 'nowpayments',
    provider_subscription_id: providerSubscriptionId,
    current_period_start: currentPeriodStart,
    current_period_end: currentPeriodEnd,
    cancel_at_period_end: false,
  };

  return plan(
    'activate_subscription',
    subscription,
    [...completedEvents, event('entitlement_granted', input)],
    true,
    true
  );
}

function isPaymentTimedOut(
  createdAt: string,
  now: string,
  timeoutMinutes = DEFAULT_PAYMENT_TIMEOUT_MINUTES
) {
  const createdTime = new Date(createdAt).getTime();
  const nowTime = new Date(now).getTime();

  if (!Number.isFinite(createdTime) || !Number.isFinite(nowTime)) {
    return false;
  }

  return nowTime - createdTime >= timeoutMinutes * 60 * 1000;
}

function plan(
  kind: BillingEntitlementPlanKind,
  subscription: BillingSubscriptionRecord | null,
  billingEvents: BillingEvent[],
  entitlementGranted: boolean,
  retryable: boolean
): BillingEntitlementPlan {
  return { kind, subscription, billingEvents, entitlementGranted, retryable };
}
