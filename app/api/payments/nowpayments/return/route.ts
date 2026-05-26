import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getSafePaymentId(request: Request) {
  const value = new URL(request.url).searchParams.get('paymentId');
  return value && /^[0-9a-f-]{36}$/i.test(value) ? value : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get('status');
  const paymentId = getSafePaymentId(request);
  const target = new URL(
    status === 'cancel' ? '/app/billing/cancel' : '/app/billing/success',
    url.origin
  );

  if (paymentId) {
    target.searchParams.set('paymentId', paymentId);
  }

  target.searchParams.set('provider', 'nowpayments');
  return NextResponse.redirect(target);
}
