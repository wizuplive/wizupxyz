export type { NowPaymentsConfig, NowPaymentsPaymentWebhookPayload } from './nowpayments/types';

export interface CreateCheckoutRequest {
  amount?: number;
  currency?: string;
  description?: string;
}

export interface CreateCheckoutResponse {
  ok: boolean;
  provider?: 'nowpayments';
  paymentId?: string;
  invoiceId?: string;
  reqId?: string;
  authCode?: string;
  payMethod?: string;
  checkoutUrl?: string;
  error?: string;
  mock?: boolean;
}
