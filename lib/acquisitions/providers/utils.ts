import 'server-only';

import { ProviderRequestError } from './types';

export function envValue(name: string) {
  return process.env[name]?.trim() || '';
}

export function clampLimit(limit: number, max: number) {
  if (!Number.isFinite(limit)) {
    return Math.min(10, max);
  }

  return Math.max(1, Math.min(Math.floor(limit), max));
}

export async function readJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { text };
  }
}

export function assertOkResponse(
  provider: string,
  response: Response,
  body: unknown
) {
  if (response.ok) {
    return;
  }

  throw new ProviderRequestError(
    `${provider} request failed with ${response.status}.`,
    response.status,
    body
  );
}

export function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

export function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function textFromParts(parts: Array<string | null | undefined>) {
  return parts
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join('\n\n');
}
