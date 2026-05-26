import {
  buildBillingEntitlementPlan,
  isBillingSubscriptionMutationEnabled,
  type BillingEntitlementPlan,
  type BillingMode,
  type BillingPaymentRecord,
  type BillingSubscriptionRecord,
} from './entitlements';

export type BillingSupabaseClient = {
  from: (table: string) => any;
};

export type ReconcileBillingEntitlementInput = {
  admin: BillingSupabaseClient;
  paymentId: string;
  mode: BillingMode;
  sourceEventId: string;
  now?: string;
  mutationsEnabled?: boolean;
};

const MAX_RETRY_ATTEMPTS = 3;

async function withRetry<T>(operation: () => Promise<T>) {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === MAX_RETRY_ATTEMPTS) {
        break;
      }
    }
  }

  throw lastError;
}

export async function reconcileBillingEntitlement(
  input: ReconcileBillingEntitlementInput
): Promise<BillingEntitlementPlan> {
  const now = input.now ?? new Date().toISOString();
  const payment = await loadPayment(input.admin, input.paymentId);
  const existingSubscription = await loadExistingSubscription(input.admin, payment.user_id);
  const plan = buildBillingEntitlementPlan({
    payment,
    existingSubscription,
    mode: input.mode,
    mutationsEnabled: input.mutationsEnabled ?? isBillingSubscriptionMutationEnabled(),
    now,
  });

  await appendBillingAuditEvents(input.admin, input.sourceEventId, plan);

  if (plan.kind === 'activate_subscription' && plan.subscription) {
    const subscription = plan.subscription;
    await withRetry(async () => {
      if (subscription.id) {
        const result = await input.admin
          .from('subscriptions')
          .update({
            status: subscription.status,
            plan_id: subscription.plan_id,
            provider: subscription.provider,
            provider_subscription_id: subscription.provider_subscription_id,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
            cancel_at_period_end: subscription.cancel_at_period_end,
            updated_at: now,
          })
          .eq('id', subscription.id);

        const response = (await (result as unknown as Promise<{ error: { message: string } | null }>));
        if (response.error) {
          throw new Error(response.error.message);
        }
        return;
      }

      const result = await input.admin.from('subscriptions').insert({
        user_id: subscription.user_id,
        status: subscription.status,
        plan_id: subscription.plan_id,
        provider: subscription.provider,
        provider_subscription_id: subscription.provider_subscription_id,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: now,
      });

      if (result.error) {
        throw new Error(result.error.message);
      }
    });
  }

  return plan;
}

async function loadPayment(admin: BillingSupabaseClient, paymentId: string) {
  const result = await admin
    .from('payments')
    .select('id, user_id, provider, status, amount, currency, provider_payment_id, req_id, pay_id, created_at')
    .eq('provider', 'nowpayments')
    .eq('id', paymentId)
    .maybeSingle();

  if (result.error) {
    throw new Error(result.error.message);
  }

  if (!result.data) {
    throw new Error('Payment not found for billing reconciliation');
  }

  return result.data as BillingPaymentRecord;
}

async function loadExistingSubscription(admin: BillingSupabaseClient, userId: string) {
  const result = await admin
    .from('subscriptions')
    .select('id, user_id, status, plan_id, provider, provider_subscription_id, current_period_start, current_period_end, cancel_at_period_end')
    .eq('user_id', userId)
    .eq('provider', 'nowpayments')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (result.error) {
    throw new Error(result.error.message);
  }

  return (result.data as BillingSubscriptionRecord | null) ?? null;
}

async function appendBillingAuditEvents(
  admin: BillingSupabaseClient,
  sourceEventId: string,
  plan: BillingEntitlementPlan
) {
  const result = await admin.from('webhook_events').upsert(
    {
      provider: 'nowpayments',
      event_id: `billing:${sourceEventId}`,
      event_type: plan.kind,
      payload: {
        wizup_billing: {
          kind: plan.kind,
          entitlementGranted: plan.entitlementGranted,
          retryable: plan.retryable,
          events: plan.billingEvents,
        },
      },
      processed: true,
    },
    { onConflict: 'provider,event_id' }
  );

  if (result.error) {
    throw new Error(result.error.message);
  }
}
