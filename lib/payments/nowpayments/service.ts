import { createClient } from '@/lib/supabase/server';

import { NowPaymentsClient } from './client';
import type {
  NowPaymentsInvoiceRequest,
  NowPaymentsInvoiceResponse,
  NowPaymentsPaymentWebhookPayload,
} from './types';

type SessionParams = {
  amount: number;
  currency: string;
  description: string;
  orderId: string;
  successUrl: string;
  cancelUrl: string;
  notifyUrl: string;
  payCurrency?: string;
};

type SessionResult = {
  ok: true;
  provider: 'nowpayments';
  paymentId: string;
  checkoutUrl: string;
  invoiceId?: string;
  raw: NowPaymentsInvoiceResponse;
};

function toStringId(value: string | number | undefined) {
  return value === undefined ? undefined : String(value);
}

export function getNowPaymentsClient() {
  const client = new NowPaymentsClient();
  return {
    client,
    configured: client.isConfigured(),
  };
}

export function isNowPaymentsConfigured() {
  const { configured } = getNowPaymentsClient();
  return configured;
}

export async function createCheckoutSession(
  params: SessionParams
): Promise<SessionResult> {
  if (!isNowPaymentsConfigured()) {
    throw new Error('NOWPayments credentials are missing');
  }

  const requestBody: NowPaymentsInvoiceRequest = {
    price_amount: params.amount,
    price_currency: params.currency,
    order_id: params.orderId,
    order_description: params.description,
    ipn_callback_url: params.notifyUrl,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    pay_currency: params.payCurrency,
  };

  const { client } = getNowPaymentsClient();
  const response = await client.createInvoice(requestBody);
  const checkoutUrl = response.invoice_url?.trim();

  if (!checkoutUrl) {
    throw new Error('NOWPayments invoice response is missing invoice_url');
  }

  return {
    ok: true,
    provider: 'nowpayments',
    paymentId: params.orderId,
    checkoutUrl,
    invoiceId: toStringId(response.id ?? response.invoice_id ?? response.token_id),
    raw: response,
  };
}

export function verifyWebhookSignature(
  payload: NowPaymentsPaymentWebhookPayload,
  signature: string
) {
  const { client } = getNowPaymentsClient();
  return client.verifyIpnSignature(payload, signature);
}

export function normalizePaymentStatus(nowPaymentsStatus: string) {
  switch (nowPaymentsStatus.trim().toLowerCase()) {
    case 'finished':
    case 'confirmed':
      return 'succeeded' as const;
    case 'sending':
    case 'confirming':
      return 'processing' as const;
    case 'failed':
      return 'failed' as const;
    case 'refunded':
      return 'canceled' as const;
    case 'expired':
      return 'expired' as const;
    case 'partially_paid':
    case 'waiting':
    default:
      return 'pending' as const;
  }
}

export async function resolveAuthenticatedUserId() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error('Authentication is required to create a NOWPayments checkout session');
  }

  return user.id;
}
