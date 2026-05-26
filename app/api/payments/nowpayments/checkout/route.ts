import { NextResponse } from 'next/server';

import { createCheckoutSession } from '@/lib/payments/nowpayments/service';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

type RouteBody = {
  amount?: number;
  currency?: string;
  description?: string;
  payCurrency?: string;
};

const DEFAULT_AMOUNT = 29;
const DEFAULT_CURRENCY = 'USD';
const DEFAULT_DESCRIPTION = 'WIZUP Pro Creator subscription';
const REUSABLE_PENDING_WINDOW_MS = 30 * 60 * 1000;

type ExistingPendingPayment = {
  id: string;
  checkout_url: string | null;
  req_id: string | null;
  created_at: string;
};

function normalizeCurrency(value: string) {
  return value.trim().toUpperCase();
}

function isRouteBody(value: unknown): value is RouteBody {
  return !value || typeof value === 'object';
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      return NextResponse.json({ ok: false, error: userError.message }, { status: 401 });
    }

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    if (!isRouteBody(body)) {
      return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 });
    }

    const amount = body.amount ?? DEFAULT_AMOUNT;
    const currency = normalizeCurrency(body.currency ?? DEFAULT_CURRENCY);
    const description = (body.description ?? DEFAULT_DESCRIPTION).trim();
    const payCurrency = body.payCurrency ? normalizeCurrency(body.payCurrency) : undefined;

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ ok: false, error: 'Amount must be greater than zero' }, { status: 400 });
    }

    if (!/^[A-Z]{3,10}$/.test(currency)) {
      return NextResponse.json({ ok: false, error: 'Currency code is invalid' }, { status: 400 });
    }

    if (payCurrency && !/^[A-Z0-9]{2,20}$/.test(payCurrency)) {
      return NextResponse.json({ ok: false, error: 'Pay currency code is invalid' }, { status: 400 });
    }

    if (!description) {
      return NextResponse.json({ ok: false, error: 'Description is required' }, { status: 400 });
    }

    const paymentId = crypto.randomUUID();
    const idempotencyKey = crypto.randomUUID();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || new URL(request.url).origin;

    const paymentsTable = (supabase as any).from('payments');
    const reusableCreatedAfter = new Date(Date.now() - REUSABLE_PENDING_WINDOW_MS).toISOString();
    const existingPendingResult = await paymentsTable
      .select('id, checkout_url, req_id, created_at')
      .eq('user_id', user.id)
      .eq('provider', 'nowpayments')
      .eq('status', 'pending')
      .eq('amount', amount)
      .eq('currency', currency)
      .eq('description', description)
      .not('checkout_url', 'is', null)
      .gte('created_at', reusableCreatedAfter)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingPendingResult.error) {
      return NextResponse.json({ ok: false, error: existingPendingResult.error.message }, { status: 500 });
    }

    const existingPending = existingPendingResult.data as ExistingPendingPayment | null;
    if (existingPending?.checkout_url) {
      return NextResponse.json({
        ok: true,
        provider: 'nowpayments',
        paymentId: existingPending.id,
        invoiceId: existingPending.req_id ?? undefined,
        checkoutUrl: existingPending.checkout_url,
        reused: true,
      });
    }

    const insertResult = await paymentsTable
      .insert({
        id: paymentId,
        user_id: user.id,
        provider: 'nowpayments',
        status: 'pending',
        amount,
        currency,
        description,
        idempotency_key: idempotencyKey,
      })
      .select('id')
      .single();

    if (insertResult.error) {
      return NextResponse.json({ ok: false, error: insertResult.error.message }, { status: 500 });
    }

    const successUrl = new URL('/api/payments/nowpayments/return', appUrl);
    successUrl.searchParams.set('paymentId', paymentId);
    successUrl.searchParams.set('status', 'success');

    const cancelUrl = new URL('/api/payments/nowpayments/return', appUrl);
    cancelUrl.searchParams.set('paymentId', paymentId);
    cancelUrl.searchParams.set('status', 'cancel');

    const providerResponse = await createCheckoutSession({
      amount,
      currency,
      description,
      orderId: paymentId,
      payCurrency,
      successUrl: successUrl.toString(),
      cancelUrl: cancelUrl.toString(),
      notifyUrl: `${appUrl}/api/payments/nowpayments/webhook`,
    });

    const updateResult = await paymentsTable
      .update({
        req_id: providerResponse.invoiceId ?? paymentId,
        provider_order_id: paymentId,
        provider_payment_id: providerResponse.invoiceId ?? null,
        checkout_url: providerResponse.checkoutUrl,
        raw_event: providerResponse.raw,
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', paymentId);

    if (updateResult.error) {
      return NextResponse.json({ ok: false, error: updateResult.error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      provider: 'nowpayments',
      paymentId,
      invoiceId: providerResponse.invoiceId,
      checkoutUrl: providerResponse.checkoutUrl,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
