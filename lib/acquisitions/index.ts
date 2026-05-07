import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

import type {
  Database,
  Json,
  TablesInsert,
  TablesUpdate,
} from '@/lib/supabase/types';

import {
  acquisitionProviders,
  type AcquisitionProvider,
  type AcquisitionProviderName,
  type AcquisitionTimeRange,
  type ProviderRawSource,
  type ProviderSearchResponse,
} from './providers';

export type AcquisitionStatus = 'completed' | 'failed';
export type ProviderAttemptStatus =
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'no_results';

export interface NormalizedSource {
  provider: AcquisitionProviderName;
  title: string;
  url: string;
  canonicalUrl: string;
  hostname: string;
  content: string;
  snippet: string;
  publishedAt: string | null;
  rawScore: number | null;
  position: number | null;
  sourceType: string | null;
  score: number;
  metadata: Record<string, unknown>;
  raw: unknown;
}

export interface ProviderAttempt {
  provider: AcquisitionProviderName;
  endpoint: string;
  status: ProviderAttemptStatus;
  durationMs: number;
  resultCount: number;
  error: string | null;
}

export interface RunMarketAcquisitionOptions {
  supabase: SupabaseClient<Database>;
  projectId: string;
  query: string;
  limit?: number;
  timeRange?: AcquisitionTimeRange;
  providers?: AcquisitionProvider[];
}

export interface MarketAcquisitionResult {
  scanId: string;
  projectId: string;
  query: string;
  provider: AcquisitionProviderName | 'none';
  status: AcquisitionStatus;
  sources: NormalizedSource[];
  attempts: ProviderAttempt[];
  error: string | null;
}

const DEFAULT_SOURCE_LIMIT = 10;
const MAX_SOURCE_LIMIT = 20;
const TRACKING_PARAMS = new Set([
  'fbclid',
  'gclid',
  'igshid',
  'mc_cid',
  'mc_eid',
  'msclkid',
  'ref',
  'ref_src',
]);
const PROVIDER_SCORE_BOOST: Record<AcquisitionProviderName, number> = {
  tavily: 10,
  firecrawl: 8,
  apify: 5,
  brave: 4,
};

export async function runMarketAcquisition(
  options: RunMarketAcquisitionOptions
): Promise<MarketAcquisitionResult> {
  const query = options.query.trim();

  if (!query) {
    throw new Error('A market acquisition query is required.');
  }

  const limit = clampSourceLimit(options.limit);
  const providers = options.providers ?? acquisitionProviders;
  const scanId = await createMarketScan(options.supabase, {
    project_id: options.projectId,
    query,
    provider: 'pending',
    raw_results: [],
    status: 'pending',
  });
  const attempts: ProviderAttempt[] = [];
  let providerResponse: ProviderSearchResponse | null = null;

  for (const provider of providers) {
    if (!provider.isConfigured()) {
      const attempt = {
        provider: provider.name,
        endpoint: provider.endpoint,
        status: 'skipped' as const,
        durationMs: 0,
        resultCount: 0,
        error: `Missing ${envNameForProvider(provider.name)}.`,
      };
      attempts.push(attempt);
      await logIntegrationRun(options.supabase, {
        provider: provider.name,
        endpoint: provider.endpoint,
        payload: { query, limit, timeRange: options.timeRange ?? null },
        error: attempt.error,
        durationMs: 0,
      });
      continue;
    }

    const startedAt = Date.now();

    try {
      const response = await provider.search({
        query,
        limit,
        timeRange: options.timeRange,
      });
      const durationMs = Date.now() - startedAt;
      const status = response.results.length > 0 ? 'completed' : 'no_results';
      const attempt = {
        provider: provider.name,
        endpoint: provider.endpoint,
        status,
        durationMs,
        resultCount: response.results.length,
        error: status === 'no_results' ? 'Provider returned no results.' : null,
      } satisfies ProviderAttempt;

      attempts.push(attempt);
      await logIntegrationRun(options.supabase, {
        provider: provider.name,
        endpoint: response.endpoint,
        payload: response.payload,
        response: response.raw,
        error: attempt.error,
        durationMs,
      });

      if (status === 'completed') {
        providerResponse = response;
        break;
      }
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      const message = messageFrom(error, `${provider.name} request failed.`);
      attempts.push({
        provider: provider.name,
        endpoint: provider.endpoint,
        status: 'failed',
        durationMs,
        resultCount: 0,
        error: message,
      });
      await logIntegrationRun(options.supabase, {
        provider: provider.name,
        endpoint: provider.endpoint,
        payload: { query, limit, timeRange: options.timeRange ?? null },
        response: responseFromError(error),
        error: message,
        durationMs,
      });
    }
  }

  if (!providerResponse) {
    const error = acquisitionFailureMessage(attempts);
    await updateMarketScan(options.supabase, scanId, {
      provider: 'none',
      raw_results: toJson(attempts),
      status: 'failed',
    });

    return {
      scanId,
      projectId: options.projectId,
      query,
      provider: 'none',
      status: 'failed',
      sources: [],
      attempts,
      error,
    };
  }

  const sources = normalizeSources(providerResponse.results, query).slice(
    0,
    limit
  );

  if (sources.length === 0) {
    const error = `${providerResponse.provider} returned results, but none had usable source URLs.`;
    await updateMarketScan(options.supabase, scanId, {
      provider: providerResponse.provider,
      raw_results: toJson([
        {
          provider: providerResponse.provider,
          endpoint: providerResponse.endpoint,
          response: sanitizeForJson(providerResponse.raw),
        },
      ]),
      status: 'failed',
    });

    return {
      scanId,
      projectId: options.projectId,
      query,
      provider: providerResponse.provider,
      status: 'failed',
      sources: [],
      attempts,
      error,
    };
  }

  try {
    await insertSourceDocuments(options.supabase, scanId, query, sources);
    await updateMarketScan(options.supabase, scanId, {
      provider: providerResponse.provider,
      raw_results: toJson([
        {
          provider: providerResponse.provider,
          endpoint: providerResponse.endpoint,
          response: sanitizeForJson(providerResponse.raw),
        },
      ]),
      status: 'completed',
    });
  } catch (error) {
    await updateMarketScan(options.supabase, scanId, {
      provider: providerResponse.provider,
      raw_results: toJson([
        {
          provider: providerResponse.provider,
          endpoint: providerResponse.endpoint,
          response: sanitizeForJson(providerResponse.raw),
          persistenceError: messageFrom(
            error,
            'Could not persist source documents.'
          ),
        },
      ]),
      status: 'failed',
    });
    throw error;
  }

  return {
    scanId,
    projectId: options.projectId,
    query,
    provider: providerResponse.provider,
    status: 'completed',
    sources,
    attempts,
    error: null,
  };
}

export function normalizeSources(
  sources: ProviderRawSource[],
  query: string
): NormalizedSource[] {
  return dedupeSources(
    sources
      .map((source) => normalizeSource(source, query))
      .filter((source): source is NormalizedSource => Boolean(source))
  ).sort((a, b) => b.score - a.score);
}

export function dedupeSources(sources: NormalizedSource[]) {
  const byKey = new Map<string, NormalizedSource>();

  for (const source of sources) {
    const titleKey = normalizeDedupeText(source.title);
    const key = source.canonicalUrl || `${source.hostname}:${titleKey}`;
    const existing = byKey.get(key);

    if (!existing) {
      byKey.set(key, source);
      continue;
    }

    byKey.set(key, mergeDuplicateSource(existing, source));
  }

  return [...byKey.values()];
}

export function scoreSource(
  source: Omit<NormalizedSource, 'score'>,
  query: string
) {
  const queryTerms = tokenize(query);
  const searchableTerms = new Set(
    tokenize([source.title, source.snippet, source.content].join(' '))
  );
  const overlap =
    queryTerms.length === 0
      ? 0
      : queryTerms.filter((term) => searchableTerms.has(term)).length /
        queryTerms.length;
  const rawScore =
    source.rawScore === null
      ? 0
      : source.rawScore <= 1
        ? source.rawScore * 30
        : Math.min(source.rawScore, 100) * 0.3;
  const positionScore =
    source.position && source.position > 0
      ? Math.max(0, 20 - (source.position - 1) * 2)
      : 8;
  const contentScore = Math.min(15, source.content.length / 250);
  const recencyScore = scoreRecency(source.publishedAt);
  const providerBoost = PROVIDER_SCORE_BOOST[source.provider];
  const total =
    10 +
    rawScore +
    positionScore +
    overlap * 25 +
    contentScore +
    recencyScore +
    providerBoost;

  return roundScore(Math.max(0, Math.min(100, total)));
}

export function canonicalizeUrl(value: string) {
  const parsed = parseUrl(value);

  if (!parsed) {
    return null;
  }

  parsed.hash = '';
  parsed.hostname = parsed.hostname.replace(/^www\./i, '').toLowerCase();

  for (const key of [...parsed.searchParams.keys()]) {
    if (key.startsWith('utm_') || TRACKING_PARAMS.has(key.toLowerCase())) {
      parsed.searchParams.delete(key);
    }
  }

  const sortedParams = [...parsed.searchParams.entries()].sort(([a], [b]) =>
    a.localeCompare(b)
  );
  parsed.search = '';
  for (const [key, value] of sortedParams) {
    parsed.searchParams.append(key, value);
  }

  if (parsed.pathname !== '/') {
    parsed.pathname = parsed.pathname.replace(/\/+$/g, '');
  }

  return parsed.toString();
}

function normalizeSource(
  source: ProviderRawSource,
  query: string
): NormalizedSource | null {
  const canonicalUrl = canonicalizeUrl(source.url);

  if (!canonicalUrl) {
    return null;
  }

  const parsed = parseUrl(canonicalUrl);

  if (!parsed) {
    return null;
  }

  const content = normalizeWhitespace(
    source.content || source.snippet || source.title
  );
  const normalized: Omit<NormalizedSource, 'score'> = {
    provider: source.provider,
    title: normalizeWhitespace(source.title) || parsed.hostname,
    url: source.url,
    canonicalUrl,
    hostname: parsed.hostname,
    content,
    snippet: normalizeWhitespace(source.snippet || content.slice(0, 500)),
    publishedAt: source.publishedAt,
    rawScore: source.rawScore,
    position: source.position,
    sourceType: source.sourceType,
    metadata: {
      ...source.metadata,
      canonicalUrl,
      hostname: parsed.hostname,
    },
    raw: source.raw,
  };

  return {
    ...normalized,
    score: scoreSource(normalized, query),
  };
}

async function createMarketScan(
  supabase: SupabaseClient<Database>,
  payload: TablesInsert<'market_scans'>
) {
  const { data, error } = await supabase
    .from('market_scans')
    .insert(payload)
    .select('id')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data.id;
}

async function updateMarketScan(
  supabase: SupabaseClient<Database>,
  scanId: string,
  payload: TablesUpdate<'market_scans'>
) {
  const { error } = await supabase
    .from('market_scans')
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', scanId);

  if (error) {
    throw new Error(error.message);
  }
}

async function insertSourceDocuments(
  supabase: SupabaseClient<Database>,
  scanId: string,
  query: string,
  sources: NormalizedSource[]
) {
  const rows: TablesInsert<'source_documents'>[] = sources.map((source) => ({
    scan_id: scanId,
    url: source.canonicalUrl,
    content: source.content,
    metadata: toJson({
      query,
      provider: source.provider,
      title: source.title,
      originalUrl: source.url,
      canonicalUrl: source.canonicalUrl,
      hostname: source.hostname,
      snippet: source.snippet,
      publishedAt: source.publishedAt,
      rawScore: source.rawScore,
      position: source.position,
      sourceType: source.sourceType,
      acquiredAt: new Date().toISOString(),
      providerMetadata: source.metadata,
    }),
    score: source.score,
  }));

  const { error } = await supabase.from('source_documents').insert(rows);

  if (error) {
    throw new Error(error.message);
  }
}

async function logIntegrationRun(
  supabase: SupabaseClient<Database>,
  options: {
    provider: AcquisitionProviderName;
    endpoint: string;
    payload: unknown;
    response?: unknown;
    error?: string | null;
    durationMs: number;
  }
) {
  const payload: TablesInsert<'integration_runs'> = {
    provider: options.provider,
    endpoint: options.endpoint,
    payload: toJson(sanitizeForJson(options.payload)),
    response:
      options.response === undefined
        ? null
        : toJson(sanitizeForJson(options.response)),
    error: options.error ?? null,
    duration_ms: options.durationMs,
  };

  await supabase.from('integration_runs').insert(payload);
}

function mergeDuplicateSource(
  first: NormalizedSource,
  second: NormalizedSource
) {
  const keeper =
    second.score > first.score ||
    (second.score === first.score && second.content.length > first.content.length)
      ? second
      : first;
  const duplicate = keeper === first ? second : first;
  const duplicateProviders = new Set([
    ...asStringArray(keeper.metadata.duplicateProviders),
    duplicate.provider,
  ]);

  return {
    ...keeper,
    content:
      keeper.content.length >= duplicate.content.length
        ? keeper.content
        : duplicate.content,
    metadata: {
      ...keeper.metadata,
      duplicateProviders: [...duplicateProviders],
      duplicateCount:
        Number(keeper.metadata.duplicateCount ?? 1) +
        Number(duplicate.metadata.duplicateCount ?? 1),
    },
  };
}

function parseUrl(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  try {
    return new URL(trimmed);
  } catch {
    try {
      return new URL(`https://${trimmed}`);
    } catch {
      return null;
    }
  }
}

function scoreRecency(value: string | null) {
  if (!value) {
    return 3;
  }

  const timestamp = Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    return 4;
  }

  const ageDays = (Date.now() - timestamp) / 86400000;

  if (ageDays <= 30) {
    return 10;
  }

  if (ageDays <= 180) {
    return 7;
  }

  if (ageDays <= 365) {
    return 5;
  }

  return 2;
}

function tokenize(value: string) {
  return normalizeWhitespace(value)
    .toLowerCase()
    .split(/[^a-z0-9]+/g)
    .filter((term) => term.length > 2);
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeDedupeText(value: string) {
  return normalizeWhitespace(value).toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function roundScore(value: number) {
  return Math.round(value * 100) / 100;
}

function clampSourceLimit(limit = DEFAULT_SOURCE_LIMIT) {
  if (!Number.isFinite(limit)) {
    return DEFAULT_SOURCE_LIMIT;
  }

  return Math.max(1, Math.min(Math.floor(limit), MAX_SOURCE_LIMIT));
}

function acquisitionFailureMessage(attempts: ProviderAttempt[]) {
  const configuredAttempts = attempts.filter(
    (attempt) => attempt.status !== 'skipped'
  );

  if (configuredAttempts.length === 0) {
    return 'No acquisition provider API keys are configured.';
  }

  const lastError =
    [...configuredAttempts].reverse().find((attempt) => attempt.error)?.error ??
    'No provider returned usable results.';

  return lastError;
}

function envNameForProvider(provider: AcquisitionProviderName) {
  switch (provider) {
    case 'tavily':
      return 'TAVILY_API_KEY';
    case 'firecrawl':
      return 'FIRECRAWL_API_KEY';
    case 'apify':
      return 'APIFY_API_TOKEN';
    case 'brave':
      return 'BRAVE_API_KEY';
  }
}

function responseFromError(error: unknown) {
  return error && typeof error === 'object' && 'response' in error
    ? (error as { response: unknown }).response
    : null;
}

function messageFrom(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function sanitizeForJson(
  value: unknown,
  depth = 0,
  options = { maxDepth: 6, maxArrayLength: 30, maxStringLength: 8000 }
): unknown {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string') {
    return value.length > options.maxStringLength
      ? `${value.slice(0, options.maxStringLength)}...`
      : value;
  }

  if (
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  if (depth >= options.maxDepth) {
    return '[Truncated]';
  }

  if (Array.isArray(value)) {
    return value
      .slice(0, options.maxArrayLength)
      .map((item) => sanitizeForJson(item, depth + 1, options));
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        sanitizeForJson(item, depth + 1, options),
      ])
    );
  }

  return String(value);
}

function toJson(value: unknown): Json {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'string' || typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (Array.isArray(value)) {
    return value.map((item) => toJson(item));
  }

  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        toJson(item),
      ])
    ) as Json;
  }

  return String(value);
}
