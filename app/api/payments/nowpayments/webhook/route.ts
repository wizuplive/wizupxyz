import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

import { reconcileBillingEntitlement } from '@/lib/payments/billing/reconciliation';
import {
  applyNowPaymentsTransition,
  buildNowPaymentsEventId,
  type PaymentCompletionRecord,
} from '@/lib/payments/nowpayments/completion';
import {
  NOWPAYMENTS_TEST_MODE_ORDER_PREFIX,
} from '@/lib/payments/nowpayments/test-mode';
import type { NowPaymentsPaymentWebhookPayload } from '@/lib/payments/nowpayments/types';
import { verifyNowPaymentsProviderOrigin } from '@/lib/payments/nowpayments/webhook-security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PaymentRow = PaymentCompletionRecord & {
  id: string;
};

function logWebhook(stage: string, details: Record<string, unknown>) {
  console.info(
    'NOWPayments webhook',
    JSON.stringify({
      stage,
      ...details,
    })
  );
}

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createAdminClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function safeParsePayload(rawBody: string): NowPaymentsPaymentWebhookPayload | null {
  try {
    const parsed = JSON.parse(rawBody) as NowPaymentsPaymentWebhookPayload;
    if (!parsed || typeof parsed !== 'object' || typeof parsed.payment_status !== 'string') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function isTestModeOrder(payload: NowPaymentsPaymentWebhookPayload) {
  return payload.order_id?.startsWith(NOWPAYMENTS_TEST_MODE_ORDER_PREFIX) ?? false;
}

function isWebhookKillSwitchEnabled() {
  return ['1', 'true', 'yes', 'on'].includes(
    (process.env.WIZUP_BILLING_WEBHOOK_KILL_SWITCH ?? '').trim().toLowerCase()
  );
}

function providerReferenceValues(payload: NowPaymentsPaymentWebhookPayload) {
  return [
    payload.order_id,
    payload.payment_id !== undefined ? String(payload.payment_id) : undefined,
    payload.invoice_id !== undefined ? String(payload.invoice_id) : undefined,
  ].filter((value): value is string => Boolean(value));
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

async function findPaymentForPayload(
  admin: ReturnType<typeof getServiceSupabase>,
  payload: NowPaymentsPaymentWebhookPayload
) {
  if (!admin) {
    return { data: null, error: null, matchedBy: null };
  }

  if (payload.order_id && isUuid(payload.order_id)) {
    const byOrder = await admin
      .from('payments')
      .select('id, provider, status, provider_payment_id, req_id, pay_id')
      .eq('provider', 'nowpayments')
      .eq('id', payload.order_id)
      .maybeSingle();

    if (byOrder.error || byOrder.data) {
      return { ...byOrder, matchedBy: 'order_id' };
    }
  }

  for (const reference of providerReferenceValues(payload)) {
    const byProviderReference = await admin
      .from('payments')
      .select('id, provider, status, provider_payment_id, req_id, pay_id')
      .eq('provider', 'nowpayments')
      .or(`provider_payment_id.eq.${reference},pay_id.eq.${reference},req_id.eq.${reference}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (byProviderReference.error || byProviderReference.data) {
      return { ...byProviderReference, matchedBy: 'provider_reference' };
    }
  }

  return { data: null, error: null, matchedBy: null };
}

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const payload = safeParsePayload(rawBody);
    const signature = request.headers.get('x-nowpayments-sig') ?? '';

    if (!payload) {
      return NextResponse.json({ ok: false, error: 'Invalid NOWPayments payload' }, { status: 400 });
    }

    logWebhook('received', {
      payment_status: payload.payment_status,
      order_id: payload.order_id ?? null,
      payment_id: payload.payment_id ?? null,
      invoice_id: payload.invoice_id ?? null,
    });

    if (isWebhookKillSwitchEnabled()) {
      return NextResponse.json(
        { ok: false, error: 'Billing webhook kill-switch is enabled' },
        { status: 503 }
      );
    }

    if (isTestModeOrder(payload)) {
      return NextResponse.json(
        { ok: false, error: 'TEST_MODE webhooks must use the TEST_MODE endpoint' },
        { status: 400 }
      );
    }

    const origin = verifyNowPaymentsProviderOrigin(request, payload, signature);
    if (!origin.ok) {
      return NextResponse.json({ ok: false, error: origin.error }, { status: origin.status });
    }

    const admin = getServiceSupabase();
    if (!admin) {
      return NextResponse.json(
        { ok: false, error: 'Supabase service role is required for webhook processing' },
        { status: 500 }
      );
    }

    const eventId = buildNowPaymentsEventId(payload, rawBody);
    const existingEvent = await admin
      .from('webhook_events')
      .select('id, processed')
      .eq('provider', 'nowpayments')
      .eq('event_id', eventId)
      .maybeSingle();

    if (existingEvent.error) {
      throw new Error(existingEvent.error.message);
    }

    const paymentResult = await findPaymentForPayload(admin, payload);

    if (paymentResult.error) {
      logWebhook('payment_lookup_failed', { reason: paymentResult.error.message });
      throw new Error(paymentResult.error.message);
    }

    if (!paymentResult.data) {
      logWebhook('payment_not_found', {
        order_id: payload.order_id ?? null,
        payment_id: payload.payment_id ?? null,
        invoice_id: payload.invoice_id ?? null,
      });
      return NextResponse.json({ ok: false, error: 'Payment order not found' }, { status: 404 });
    }

    logWebhook('payment_matched', {
      matchedBy: paymentResult.matchedBy,
      paymentId: paymentResult.data.id,
      currentStatus: paymentResult.data.status,
      provider_payment_id: paymentResult.data.provider_payment_id,
      req_id: paymentResult.data.req_id,
      pay_id: paymentResult.data.pay_id,
    });

    const providerPaymentId =
      payload.payment_id !== undefined ? String(payload.payment_id) : null;

    if (providerPaymentId) {
      const duplicatePayment = await admin
        .from('payments')
        .select('id')
        .eq('provider', 'nowpayments')
        .eq('provider_payment_id', providerPaymentId)
        .neq('id', paymentResult.data.id)
        .limit(1)
        .maybeSingle();

      if (duplicatePayment.error) {
        throw new Error(duplicatePayment.error.message);
      }

      if (duplicatePayment.data) {
        await admin.from('webhook_events').upsert(
          {
            provider: 'nowpayments',
            event_id: eventId,
            event_type: payload.payment_status,
            payload: {
              ...payload,
              wizup_event: {
                action: 'duplicate_payment_ignored',
                duplicatePaymentId: duplicatePayment.data.id,
                sourceIp: origin.sourceIp,
                originVerification: origin.verification,
              },
            },
            processed: true,
          },
          { onConflict: 'provider,event_id' }
        );

        return NextResponse.json({
          ok: true,
          action: 'duplicate_payment_ignored',
          subscriptionMutated: false,
          entitlementUnlocked: false,
        });
      }
    }

    const transition = applyNowPaymentsTransition({
      payment: paymentResult.data as PaymentRow,
      payload,
      eventId,
      existingEventProcessed: Boolean(existingEvent.data?.processed),
      now: new Date().toISOString(),
    });

    logWebhook('transition_planned', {
      action: transition.action,
      fromStatus: paymentResult.data.status,
      toStatus: transition.nextPayment.status,
      eventId,
    });

    await admin.from('webhook_events').upsert(
      {
        provider: transition.eventLog.provider,
        event_id: transition.eventLog.event_id,
        event_type: transition.eventLog.event_type,
        payload: {
          ...transition.eventLog.payload,
          wizup_event: {
            action: transition.action,
            sourceIp: origin.sourceIp,
            originVerification: origin.verification,
          },
        },
        processed: transition.eventLog.processed,
      },
      { onConflict: 'provider,event_id' }
    );

    if (
      transition.action === 'transition' ||
      transition.action === 'rollback_required'
    ) {
      const updateResult = await admin
        .from('payments')
        .update({
          status: transition.nextPayment.status,
          req_id: transition.nextPayment.req_id,
          pay_id: transition.nextPayment.pay_id,
          provider_payment_id: transition.nextPayment.provider_payment_id,
          raw_event: transition.nextPayment.raw_event,
          updated_at: transition.nextPayment.updated_at,
        })
        .eq('provider', 'nowpayments')
        .eq('id', paymentResult.data.id);

      if (updateResult.error) {
        logWebhook('payment_update_failed', { reason: updateResult.error.message });
        throw new Error(updateResult.error.message);
      }

      logWebhook('payment_updated', {
        paymentId: paymentResult.data.id,
        status: transition.nextPayment.status,
      });
    }

    let billingPlan:
      | Awaited<ReturnType<typeof reconcileBillingEntitlement>>
      | null = null;

    if (
      transition.action === 'transition' ||
      transition.action === 'rollback_required' ||
      transition.action === 'duplicate_ignored'
    ) {
      billingPlan = await reconcileBillingEntitlement({
        admin,
        paymentId: paymentResult.data.id,
        mode: 'production',
        sourceEventId: eventId,
      });

      logWebhook('reconciliation_complete', {
        paymentId: paymentResult.data.id,
        billingAction: billingPlan.kind,
        entitlementGranted: billingPlan.entitlementGranted,
        retryable: billingPlan.retryable,
      });
    }

    return NextResponse.json({
      ok: true,
      action: transition.action,
      status: transition.nextPayment.status,
      billingAction: billingPlan?.kind ?? null,
      subscriptionMutated: billingPlan?.kind === 'activate_subscription',
      entitlementUnlocked: Boolean(billingPlan?.entitlementGranted),
    });
  } catch (error) {
    console.error('NOWPayments webhook processing error', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
