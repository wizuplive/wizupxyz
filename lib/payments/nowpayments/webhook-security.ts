import type { NowPaymentsPaymentWebhookPayload } from './types';
import { verifyWebhookSignature } from './service';

type ProviderOriginResult =
  | { ok: true; sourceIp: string | null; verification: 'signature' | 'signature_and_ip' }
  | { ok: false; status: number; error: string; sourceIp: string | null };

function getSourceIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  return forwardedFor?.split(',')[0]?.trim() || realIp?.trim() || null;
}

function getAllowedIps() {
  return (process.env.NOWPAYMENTS_WEBHOOK_ALLOWED_IPS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

export function verifyNowPaymentsProviderOrigin(
  request: Request,
  payload: NowPaymentsPaymentWebhookPayload,
  signature: string
): ProviderOriginResult {
  const sourceIp = getSourceIp(request);

  if (!verifyWebhookSignature(payload, signature)) {
    return { ok: false, status: 403, error: 'Invalid NOWPayments signature', sourceIp };
  }

  const allowedIps = getAllowedIps();
  if (allowedIps.length === 0) {
    return { ok: true, sourceIp, verification: 'signature' };
  }

  if (!sourceIp || !allowedIps.includes(sourceIp)) {
    return { ok: false, status: 403, error: 'Unexpected NOWPayments webhook origin', sourceIp };
  }

  return { ok: true, sourceIp, verification: 'signature_and_ip' };
}
