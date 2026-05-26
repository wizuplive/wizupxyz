import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

import {
  verifyWebhookSignature,
} from '@/lib/payments/nowpayments/service';
import {
  applyNowPaymentsTransition,
  buildNowPaymentsEventId,
  type PaymentCompletionRecord,
} from '@/lib/payments/nowpayments/completion';
import {
  NOWPAYMENTS_TEST_MODE_ORDER_PREFIX,
  appendNowPaymentsTestModeWebhookLog,
  validateNowPaymentsTestModeRequest,
} from '@/lib/payments/nowpayments/test-mode';
import type { NowPaymentsPaymentWebhookPayload } from '@/lib/payments/nowpayments/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type PaymentRow = PaymentCompletionRecord & {
  id: string;
};

function logTestModeWebhook(stage: string, details: Record<string, unknown>) {
  console.info(
    'NOWPayments TEST_MODE webhook',
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

function safeWebhookLogPayload(payload: NowPaymentsPaymentWebhookPayload) {
  return {
    payment_id: payload.payment_id,
    invoice_id: payload.invoice_id,
    order_id: payload.order_id,
    payment_status: payload.payment_status,
    pay_currency: payload.pay_currency,
    price_amount: payload.price_amount,
    price_currency: payload.price_currency,
    actually_paid: payload.actually_paid,
    outcome_amount: payload.outcome_amount,
    outcome_currency: payload.outcome_currency,
  };
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
  const guard = validateNowPaymentsTestModeRequest(request, { requireToken: false });

  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }

  const rawBody = await request.text();
  const payload = safeParsePayload(rawBody);
  const signature = request.headers.get('x-nowpayments-sig') ?? '';

  if (!payload || !verifyWebhookSignature(payload, signature)) {
    logTestModeWebhook('signature_failed', {
      hasPayload: Boolean(payload),
      payment_id: payload?.payment_id ?? null,
      invoice_id: payload?.invoice_id ?? null,
    });
    return NextResponse.json({ ok: false, error: 'Invalid NOWPayments signature' }, { status: 403 });
  }

  if (!payload.order_id?.startsWith(NOWPAYMENTS_TEST_MODE_ORDER_PREFIX)) {
    logTestModeWebhook('unexpected_order', {
      order_id: payload.order_id ?? null,
    });
    return NextResponse.json({ ok: false, error: 'Unexpected TEST_MODE order' }, { status: 400 });
  }

  logTestModeWebhook('received', {
    order_id: payload.order_id,
    payment_id: payload.payment_id ?? null,
    invoice_id: payload.invoice_id ?? null,
    payment_status: payload.payment_status,
  });

  const loggedPayload = safeWebhookLogPayload(payload);
  const admin = getServiceSupabase();
  const rawEventId = buildNowPaymentsEventId(payload, rawBody);
  const eventId = `test:${rawEventId}`;
  let persistence = {
    persisted: false,
    matchedBy: null as string | null,
    paymentId: null as string | null,
    status: null as string | null,
    failureReason: null as string | null,
  };

  if (admin) {
    const existingEvent = await admin
      .from('webhook_events')
      .select('id, processed')
      .eq('provider', 'nowpayments')
      .eq('event_id', eventId)
      .maybeSingle();

    const paymentResult = await findPaymentForPayload(admin, payload);

    if (paymentResult.error) {
      persistence = { ...persistence, failureReason: paymentResult.error.message };
    } else if (paymentResult.data) {
      logTestModeWebhook('payment_matched', {
        matchedBy: paymentResult.matchedBy,
        paymentId: paymentResult.data.id,
        currentStatus: paymentResult.data.status,
        provider_payment_id: paymentResult.data.provider_payment_id,
        req_id: paymentResult.data.req_id,
        pay_id: paymentResult.data.pay_id,
      });

      const transition = applyNowPaymentsTransition({
        payment: paymentResult.data as PaymentRow,
        payload,
        eventId,
        existingEventProcessed: Boolean(existingEvent.data?.processed),
        now: new Date().toISOString(),
      });

      logTestModeWebhook('status_transition', {
        paymentId: paymentResult.data.id,
        action: transition.action,
        fromStatus: paymentResult.data.status,
        toStatus: transition.nextPayment.status,
      });

      await admin.from('webhook_events').upsert(
        {
          provider: 'nowpayments',
          event_id: eventId,
          event_type: payload.payment_status,
          payload: {
            ...payload,
            wizup_event: {
              action: transition.action,
              mode: 'TEST_MODE',
              matchedBy: paymentResult.matchedBy,
            },
          },
          processed: true,
        },
        { onConflict: 'provider,event_id' }
      );

      if (transition.action === 'transition' || transition.action === 'rollback_required') {
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
          persistence = { ...persistence, failureReason: updateResult.error.message };
        } else {
          persistence = {
            persisted: true,
            matchedBy: paymentResult.matchedBy,
            paymentId: paymentResult.data.id,
            status: transition.nextPayment.status,
            failureReason: null,
          };
        }
      } else {
        persistence = {
          persisted: true,
          matchedBy: paymentResult.matchedBy,
          paymentId: paymentResult.data.id,
          status: transition.nextPayment.status,
          failureReason: null,
        };
      }
    } else {
      persistence = { ...persistence, failureReason: 'payment_not_found' };
    }
  }

  await appendNowPaymentsTestModeWebhookLog({ ...loggedPayload, persistence });

  return NextResponse.json({
    ok: true,
    mode: 'TEST_MODE',
    persisted: persistence.persisted,
    paymentId: persistence.paymentId,
    status: persistence.status,
    matchedBy: persistence.matchedBy,
    failureReason: persistence.failureReason,
    subscriptionMutated: false,
    entitlementUnlocked: false,
    webhook: loggedPayload,
  });
}
