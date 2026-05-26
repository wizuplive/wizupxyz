import { createHmac, timingSafeEqual } from 'node:crypto';

import type {
  NowPaymentsConfig,
  NowPaymentsInvoiceRequest,
  NowPaymentsInvoiceResponse,
  NowPaymentsPaymentWebhookPayload,
} from './types';

function getApiBaseUrl() {
  const raw = process.env.NOWPAYMENTS_API_URL?.trim();
  return (raw || 'https://api.nowpayments.io/v1').replace(/\/+$/, '');
}

function toSortedValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(toSortedValue);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((accumulator, key) => {
        accumulator[key] = toSortedValue((value as Record<string, unknown>)[key]);
        return accumulator;
      }, {});
  }

  return value;
}

export class NowPaymentsClient {
  private readonly config: NowPaymentsConfig;

  constructor(config?: Partial<NowPaymentsConfig>) {
    this.config = {
      apiBaseUrl: config?.apiBaseUrl ?? getApiBaseUrl(),
      apiKey: config?.apiKey ?? process.env.NOWPAYMENTS_API_KEY?.trim(),
      ipnSecret: config?.ipnSecret ?? process.env.NOWPAYMENTS_IPN_SECRET?.trim(),
      defaultCurrency: (config?.defaultCurrency ?? 'USD').trim().toUpperCase(),
    };
  }

  getConfig() {
    return this.config;
  }

  isConfigured() {
    return Boolean(this.config.apiBaseUrl && this.config.apiKey && this.config.ipnSecret);
  }

  private getHeaders() {
    if (!this.config.apiKey) {
      throw new Error('NOWPayments API key is missing');
    }

    return {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'x-api-key': this.config.apiKey,
    };
  }

  async request<T>(method: string, path: string, data?: object) {
    const response = await fetch(`${this.config.apiBaseUrl}${path}`, {
      method,
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
      cache: 'no-store',
    });

    const text = await response.text();
    const payload = text ? (JSON.parse(text) as T & { message?: string }) : null;

    if (!response.ok) {
      const message =
        (payload && typeof payload === 'object' && 'message' in payload
          ? payload.message
          : undefined) ?? `NOWPayments request failed with status ${response.status}`;
      throw new Error(message);
    }

    return payload as T;
  }

  async createInvoice(params: NowPaymentsInvoiceRequest) {
    return this.request<NowPaymentsInvoiceResponse>('POST', '/invoice', params);
  }

  verifyIpnSignature(
    payload: NowPaymentsPaymentWebhookPayload,
    signature: string
  ) {
    if (!this.config.ipnSecret || !signature) {
      return false;
    }

    const normalized = JSON.stringify(toSortedValue(payload));
    const digest = createHmac('sha512', this.config.ipnSecret)
      .update(normalized)
      .digest('hex');

    try {
      return timingSafeEqual(
        Buffer.from(digest.toLowerCase(), 'utf8'),
        Buffer.from(signature.trim().toLowerCase(), 'utf8')
      );
    } catch {
      return false;
    }
  }
}
