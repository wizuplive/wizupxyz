import { createHash } from 'node:crypto';

import type { NowPaymentsPaymentWebhookPayload } from './types';

export type InternalPaymentStatus =
  | 'pending'
  | 'confirming'
  | 'completed'
  | 'failed'
  | 'expired'
  | 'rollback_required';

export type PaymentCompletionAction =
  | 'transition'
  | 'replay_ignored'
  | 'duplicate_ignored'
  | 'terminal_preserved'
  | 'rollback_required';

export type PaymentCompletionRecord = {
  provider: 'nowpayments';
  status: string;
  provider_payment_id: string | null;
  req_id: string | null;
  pay_id: string | null;
};

type TransitionInput = {
  payment: PaymentCompletionRecord;
  payload: NowPaymentsPaymentWebhookPayload;
  eventId: string;
  existingEventProcessed: boolean;
  now: string;
};

type TransitionResult = {
  action: PaymentCompletionAction;
  nextPayment: PaymentCompletionRecord & {
    status: InternalPaymentStatus;
    provider_payment_id?: string | null;
    req_id?: string | null;
    pay_id?: string | null;
    raw_event?: NowPaymentsPaymentWebhookPayload;
    updated_at?: string;
  };
  eventLog: {
    provider: 'nowpayments';
    event_id: string;
    event_type: string;
    action: PaymentCompletionAction;
    processed: boolean;
    payload: NowPaymentsPaymentWebhookPayload;
  };
  unlockSubscription: false;
};

const TERMINAL_STATUSES = new Set(['completed', 'failed', 'expired', 'rollback_required']);

function stringifyProviderId(value: string | number | undefined) {
  return value === undefined ? null : String(value);
}

export function normalizeNowPaymentsCompletionStatus(status: string): InternalPaymentStatus {
  switch (status.trim().toLowerCase()) {
    case 'finished':
    case 'confirmed':
      return 'completed';
    case 'confirming':
    case 'sending':
      return 'confirming';
    case 'failed':
      return 'failed';
    case 'expired':
      return 'expired';
    case 'refunded':
      return 'rollback_required';
    case 'partially_paid':
    case 'waiting':
    default:
      return 'pending';
  }
}

export function buildNowPaymentsEventId(
  payload: NowPaymentsPaymentWebhookPayload,
  rawBody: string
) {
  if (payload.payment_id !== undefined) {
    return `payment:${String(payload.payment_id)}`;
  }

  if (payload.invoice_id !== undefined) {
    return `invoice:${String(payload.invoice_id)}`;
  }

  return `body:${createHash('sha256').update(rawBody).digest('hex')}`;
}

export function applyNowPaymentsTransition(input: TransitionInput): TransitionResult {
  const normalizedStatus = normalizeNowPaymentsCompletionStatus(input.payload.payment_status);
  const paymentId = stringifyProviderId(input.payload.payment_id);
  const invoiceId = stringifyProviderId(input.payload.invoice_id);

  if (input.existingEventProcessed) {
    return buildResult('replay_ignored', input, input.payment.status as InternalPaymentStatus);
  }

  if (input.payment.status === 'completed' && normalizedStatus === 'completed') {
    return buildResult('duplicate_ignored', input, 'completed');
  }

  if (
    TERMINAL_STATUSES.has(input.payment.status) &&
    input.payment.status !== 'rollback_required' &&
    input.payment.status !== normalizedStatus
  ) {
    return buildResult('terminal_preserved', input, input.payment.status as InternalPaymentStatus);
  }

  const action: PaymentCompletionAction =
    normalizedStatus === 'rollback_required' ? 'rollback_required' : 'transition';

  return {
    action,
    nextPayment: {
      ...input.payment,
      status: normalizedStatus,
      req_id: invoiceId ?? input.payment.req_id,
      pay_id: paymentId ?? input.payment.pay_id,
      provider_payment_id: paymentId ?? input.payment.provider_payment_id,
      raw_event: input.payload,
      updated_at: input.now,
    },
    eventLog: {
      provider: 'nowpayments',
      event_id: input.eventId,
      event_type: input.payload.payment_status,
      action,
      processed: true,
      payload: input.payload,
    },
    unlockSubscription: false,
  };
}

function buildResult(
  action: PaymentCompletionAction,
  input: TransitionInput,
  status: InternalPaymentStatus
): TransitionResult {
  return {
    action,
    nextPayment: {
      ...input.payment,
      status,
      updated_at: input.now,
    },
    eventLog: {
      provider: 'nowpayments',
      event_id: input.eventId,
      event_type: input.payload.payment_status,
      action,
      processed: true,
      payload: input.payload,
    },
    unlockSubscription: false,
  };
}
