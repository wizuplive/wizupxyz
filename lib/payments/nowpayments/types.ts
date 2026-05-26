export interface NowPaymentsConfig {
  apiBaseUrl: string;
  apiKey?: string;
  ipnSecret?: string;
  defaultCurrency: string;
}

export interface NowPaymentsInvoiceRequest {
  price_amount: number;
  price_currency: string;
  order_id: string;
  order_description: string;
  ipn_callback_url: string;
  success_url: string;
  cancel_url: string;
  pay_currency?: string;
}

export interface NowPaymentsInvoiceResponse {
  id?: string | number;
  invoice_id?: string | number;
  token_id?: string | number;
  order_id?: string;
  order_description?: string;
  price_amount?: number;
  price_currency?: string;
  pay_currency?: string;
  ipn_callback_url?: string;
  invoice_url?: string;
  success_url?: string;
  cancel_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NowPaymentsPaymentWebhookPayload {
  payment_id?: number | string;
  invoice_id?: number | string;
  purchase_id?: string;
  order_id?: string;
  order_description?: string;
  payment_status: string;
  pay_address?: string;
  pay_amount?: number | string;
  pay_currency?: string;
  price_amount?: number | string;
  price_currency?: string;
  actually_paid?: number | string;
  actually_paid_at_fiat?: number | string;
  outcome_amount?: number | string;
  outcome_currency?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}
