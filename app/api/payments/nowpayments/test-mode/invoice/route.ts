import { NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

import { getNowPaymentsClient } from '@/lib/payments/nowpayments/service';
import {
  NOWPAYMENTS_TEST_MODE_PRICE_AMOUNT,
  NOWPAYMENTS_TEST_MODE_PRICE_CURRENCY,
  createNowPaymentsTestModeInvoiceRequest,
  createNowPaymentsTestModeOrderId,
  validateNowPaymentsTestModeRequest,
} from '@/lib/payments/nowpayments/test-mode';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

function safeInvoiceResponse(response: {
  id?: string | number;
  invoice_id?: string | number;
  token_id?: string | number;
  invoice_url?: string;
  pay_currency?: string;
  price_amount?: number;
  price_currency?: string;
}) {
  return {
    id: response.id,
    invoice_id: response.invoice_id,
    token_id: response.token_id,
    invoice_url: response.invoice_url,
    pay_currency: response.pay_currency,
    price_amount: response.price_amount,
    price_currency: response.price_currency,
  };
}

function toStringId(value: string | number | undefined) {
  return value === undefined ? null : String(value);
}

function logTestModeInvoice(stage: string, details: Record<string, unknown>) {
  console.info(
    'NOWPayments TEST_MODE invoice',
    JSON.stringify({
      stage,
      ...details,
    })
  );
}

async function resolveTestUserId(admin: ReturnType<typeof getServiceSupabase>) {
  const configured = process.env.WIZUP_NOWPAYMENTS_TEST_USER_ID?.trim();

  if (configured) {
    return configured;
  }

  if (!admin) {
    return null;
  }

  const existingPaymentUser = await admin
    .from('payments')
    .select('user_id')
    .not('user_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return existingPaymentUser.data?.user_id ?? null;
}

export async function POST(request: Request) {
  const guard = validateNowPaymentsTestModeRequest(request);

  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }

  const { client, configured } = getNowPaymentsClient();

  if (!configured) {
    return NextResponse.json(
      { ok: false, error: 'NOWPayments credentials are missing' },
      { status: 500 }
    );
  }

  const requestUrl = new URL(request.url);
  const origin = `${requestUrl.protocol}//${requestUrl.host}`;
  const paymentId = randomUUID();
  const idempotencyKey = randomUUID();
  const orderId = createNowPaymentsTestModeOrderId();
  const invoiceRequest = createNowPaymentsTestModeInvoiceRequest({
    orderId,
    notifyUrl: `${origin}/api/payments/nowpayments/test-mode/webhook`,
    successUrl: `${origin}/api/payments/nowpayments/test-mode/invoice?status=success`,
    cancelUrl: `${origin}/api/payments/nowpayments/test-mode/invoice?status=cancel`,
  });

  const providerResponse = await client.createInvoice(invoiceRequest);
  const invoiceId = toStringId(providerResponse.id ?? providerResponse.invoice_id ?? providerResponse.token_id);
  const admin = getServiceSupabase();
  const userId = await resolveTestUserId(admin);

  if (!admin || !userId) {
    logTestModeInvoice('payment_row_create_failed', {
      reason: 'missing_service_role_or_test_user',
      orderId,
      invoiceId,
    });
    return NextResponse.json(
      { ok: false, error: 'TEST_MODE payment persistence requires a service role and test user' },
      { status: 500 }
    );
  }

  const insertResult = await admin.from('payments').insert({
    id: paymentId,
    user_id: userId,
    provider: 'nowpayments',
    provider_payment_id: invoiceId,
    provider_order_id: orderId,
    status: 'pending',
    amount: NOWPAYMENTS_TEST_MODE_PRICE_AMOUNT,
    currency: NOWPAYMENTS_TEST_MODE_PRICE_CURRENCY,
    description: 'WIZUP TEST_MODE ETHBASE payment validation',
    checkout_url: providerResponse.invoice_url ?? null,
    idempotency_key: idempotencyKey,
    raw_event: providerResponse,
    req_id: invoiceId,
    pay_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (insertResult.error) {
    logTestModeInvoice('payment_row_create_failed', {
      reason: insertResult.error.message,
      orderId,
      invoiceId,
    });
    return NextResponse.json({ ok: false, error: insertResult.error.message }, { status: 500 });
  }

  logTestModeInvoice('payment_row_created', {
    paymentId,
    orderId,
    invoiceId,
    provider_payment_id: invoiceId,
    req_id: invoiceId,
    status: 'pending',
  });

  return NextResponse.json({
    ok: true,
    mode: 'TEST_MODE',
    provider: 'nowpayments',
    paymentId,
    orderId,
    invoice: safeInvoiceResponse(providerResponse),
  });
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const status = requestUrl.searchParams.get('status') ?? 'ready';
  const nowPaymentsId = requestUrl.searchParams.get('NP_id')?.trim();
  const redirectUrl = new URL(
    status === 'cancel' ? '/app/billing/cancel' : '/app/billing/success',
    requestUrl.origin
  );

  redirectUrl.searchParams.set('mode', 'test');
  redirectUrl.searchParams.set('provider', 'nowpayments');

  if (nowPaymentsId && /^[A-Za-z0-9_-]{3,80}$/.test(nowPaymentsId)) {
    const admin = getServiceSupabase();
    const payment = admin
      ? await admin
          .from('payments')
          .select('id')
          .eq('provider', 'nowpayments')
          .or(`provider_payment_id.eq.${nowPaymentsId},pay_id.eq.${nowPaymentsId},req_id.eq.${nowPaymentsId}`)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      : null;

    if (payment?.data?.id) {
      redirectUrl.searchParams.set('paymentId', payment.data.id);
    }
  }

  return NextResponse.redirect(redirectUrl);
}
