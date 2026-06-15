'use server';

import {
  generateScoutIdeas,
  getAIProviderConfigStatus,
  type ScoutIdeasOutput,
} from '@/lib/ai';
import { acquisitionProviders, type AcquisitionProviderName } from '@/lib/acquisitions/providers';
import {
  generateOpportunities,
  type DiscoverOpportunity,
  type OpportunityFilter,
} from '@/app/app/discover-engine';

export type DiscoverScoutStatus = 'completed' | 'fallback';
export type DiscoverScoutModelSource = 'gemini' | 'mock';

export interface DiscoverScoutSource {
  provider: AcquisitionProviderName;
  title: string;
  url: string;
  snippet: string;
}

export interface DiscoverScoutResult {
  status: DiscoverScoutStatus;
  source: DiscoverScoutModelSource;
  trusted: boolean;
  query: string;
  filter: OpportunityFilter;
  opportunities: DiscoverOpportunity[];
  sources: DiscoverScoutSource[];
  summary: string;
  model: string;
  attempts: string[];
  fallbackReason?: string;
}

interface DiscoverScanConfigIssue {
  reason: string;
  attempts: string[];
  provider: string;
  missing: string[];
}

const DISCOVER_PROVIDER_TIMEOUT_MS = 10_000;

function logDiscoverScan(
  stage: string,
  payload: Record<string, unknown>,
  level: 'info' | 'warn' = 'info'
) {
  const logger = level === 'warn' ? console.warn : console.info;
  logger('[DiscoverScan]', JSON.stringify({ stage, ...payload }));
}

function sanitizeDiscoverError(error: unknown) {
  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : 'Unknown error';

  return message.replace(/\s+/g, ' ').trim().slice(0, 240);
}

function timeoutSignal(timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort(new Error(`Timed out after ${timeoutMs}ms`));
  }, timeoutMs);

  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timeout),
  };
}

function shouldRetryScoutFallback(reason?: string) {
  if (!reason) {
    return false;
  }

  const normalized = reason.toLowerCase();
  return normalized.includes('empty response') || normalized.includes('json');
}

function getDiscoverScanConfigIssue(): DiscoverScanConfigIssue | null {
  const aiConfig = getAIProviderConfigStatus();

  if (!aiConfig.configured) {
    return {
      reason:
        aiConfig.reason ??
        'AI provider not configured. Set GOOGLE_GENAI_USE_VERTEXAI=true with GOOGLE_CLOUD_PROJECT, or set GEMINI_API_KEY / GOOGLE_API_KEY.',
      attempts: ['AI provider configuration is incomplete.'],
      provider: 'gemini',
      missing: aiConfig.missing,
    };
  }

  const configuredProviders = acquisitionProviders.filter((provider) => provider.isConfigured());

  if (configuredProviders.length === 0) {
    return {
      reason:
        'Discover scan is missing a live source provider. Set TAVILY_API_KEY or another acquisition provider key.',
      attempts: ['No acquisition providers configured.'],
      provider: 'acquisition',
      missing: ['TAVILY_API_KEY', 'FIRECRAWL_API_KEY', 'APIFY_API_TOKEN', 'BRAVE_API_KEY'],
    };
  }

  return null;
}

function buildSourceBackedFallbackOpportunities(
  query: string,
  filter: OpportunityFilter,
  sources: DiscoverScoutSource[]
) {
  const primarySource = sources[0];
  const decorated = generateOpportunities(query, filter).map((item, index) => {
    const source = sources[index % sources.length] ?? primarySource;
    const supporting = sources[(index + 1) % sources.length] ?? source;
    const evidenceSummary = source?.snippet.trim().slice(0, 145);

    return {
      ...item,
      signal: index === 0 ? 'Source Backed' : item.signal,
      confidence:
        sources.length >= 6 ? 'Source-backed' : sources.length >= 3 ? 'Emerging proof' : 'Early signal',
      velocity:
        sources.length >= 6 ? 'Signals active' : sources.length >= 3 ? 'Signals building' : item.velocity,
      insight: evidenceSummary
        ? `Live evidence: ${evidenceSummary}`
        : item.insight,
      positioning: source
        ? `${item.positioning}. Lead with ${source.provider} evidence around ${query}.`
        : item.positioning,
      monetization: source
        ? `${item.monetization} Supported by ${sources.length} live sources including ${source.title}.`
        : item.monetization,
      copy: supporting
        ? `${item.copy} Supporting source signal: ${supporting.title}.`
        : item.copy,
    };
  });

  return decorated.slice(0, 6);
}

export async function runDiscoverScout({
  query,
  filter,
}: {
  query: string;
  filter: OpportunityFilter;
}): Promise<DiscoverScoutResult> {
  const { normalizedQuery, forceMock } = parseDiscoverQuery(query);
  const attempts: string[] = [];
  logDiscoverScan('start', { query: normalizedQuery, filter, forceMock });

  const configIssue = forceMock ? null : getDiscoverScanConfigIssue();
  if (configIssue) {
    logDiscoverScan(
      'config_missing',
      {
        query: normalizedQuery,
        provider: configIssue.provider,
        resultCount: 0,
        error: sanitizeDiscoverError(configIssue.reason),
        missing: configIssue.missing,
      },
      'warn'
    );

    return {
      status: 'fallback',
      source: 'mock',
      trusted: false,
      query: normalizedQuery,
      filter,
      opportunities: [],
      sources: [],
      summary: 'We couldn’t complete a verified market scan. Try again after configuration is restored.',
      model: 'unconfigured',
      attempts: [...attempts, ...configIssue.attempts],
      fallbackReason: configIssue.reason,
    };
  }

  const sources = await collectMarketSources(normalizedQuery, attempts);
  logDiscoverScan('sources_complete', {
    query: normalizedQuery,
    resultCount: sources.length,
    provider: sources[0]?.provider ?? 'none',
  });
  const researchNotes = buildResearchNotes(normalizedQuery, sources);
  let scout = forceMock
    ? {
        summary: 'Forced mock scan for local validation.',
        ideas: [],
        nextSearches: [],
        role: 'Scout' as const,
        source: 'mock' as const,
        model: 'forced-mock',
        generatedAt: new Date().toISOString(),
        fallbackReason: 'Forced mock path enabled for local validation.',
      }
    : await generateScoutIdeas({
        niche: normalizedQuery,
        problem: `Find complaints, buyer questions, demand signals, trend indicators, and small digital product opportunities for ${normalizedQuery}.`,
        productType: 'digital product',
        researchNotes,
      });
  let scoutRetryCount = 0;
  while (
    !forceMock &&
    scout.source !== 'gemini' &&
    shouldRetryScoutFallback(scout.fallbackReason) &&
    scoutRetryCount < 2
  ) {
    scoutRetryCount += 1;
    logDiscoverScan(
      'scout_retry',
      {
        query: normalizedQuery,
        provider: scout.source,
        sourceCount: sources.length,
        retryCount: scoutRetryCount,
        error: sanitizeDiscoverError(scout.fallbackReason),
      },
      'warn'
    );
    attempts.push(
      `Scout retry ${scoutRetryCount}: ${
        scout.fallbackReason ? sanitizeDiscoverError(scout.fallbackReason) : 'empty Scout response'
      }`
    );
    scout = await generateScoutIdeas({
      niche: normalizedQuery,
      problem:
        scoutRetryCount === 1
          ? `Find practical digital product opportunities for ${normalizedQuery} using the strongest verified market signals.`
          : `Return only the clearest, source-backed digital product opportunities for ${normalizedQuery}.`,
      productType: 'digital product',
      researchNotes:
        scoutRetryCount === 1
          ? buildCondensedResearchNotes(normalizedQuery, sources)
          : researchNotes,
    });
  }
  logDiscoverScan('scout_complete', {
    query: normalizedQuery,
    provider: scout.source,
    resultCount: scout.ideas.length,
    status: scout.source === 'gemini' ? 'completed' : 'fallback',
    error: scout.fallbackReason ? sanitizeDiscoverError(scout.fallbackReason) : null,
  });
  const localFallback = generateOpportunities(normalizedQuery, filter);
  attempts.push(`Local fallback prepared ${localFallback.length} internal opportunities.`);
  const aiOpportunities = normalizeScoutIdeas(scout, normalizedQuery, filter, sources);
  const sourceBackedFallback = sources.length
    ? buildSourceBackedFallbackOpportunities(normalizedQuery, filter, sources)
    : [];
  const shouldUseAi = scout.source === 'gemini' && aiOpportunities.length > 0;
  const opportunities = shouldUseAi
    ? aiOpportunities.slice(0, 6)
    : sourceBackedFallback.length
      ? sourceBackedFallback
      : [];
  const fallbackReason =
    shouldUseAi
      ? undefined
      : scout.fallbackReason ||
        (sources.length === 0
          ? 'No live sources were collected before the scan timed out.'
          : 'Verified response did not return usable opportunities.');

  logDiscoverScan(shouldUseAi ? 'complete' : 'fallback', {
    query: normalizedQuery,
    provider: scout.source,
    resultCount: opportunities.length,
    trusted: shouldUseAi,
    error: fallbackReason ? sanitizeDiscoverError(fallbackReason) : null,
  }, shouldUseAi ? 'info' : 'warn');

  return {
    status: shouldUseAi ? 'completed' : 'fallback',
    source: scout.source,
    trusted: shouldUseAi,
    query: normalizedQuery,
    filter,
    opportunities,
    sources,
    summary: shouldUseAi
      ? scout.summary
      : sourceBackedFallback.length
        ? 'Live sources were collected. Showing source-backed opportunities while verified ranking retries are still needed.'
        : 'We couldn’t complete a verified market scan. Try again.',
    model: scout.model,
    attempts,
    fallbackReason,
  };
}

async function collectMarketSources(query: string, attempts: string[]) {
  const configured = acquisitionProviders.filter((provider) => provider.isConfigured());

  if (configured.length === 0) {
    attempts.push('No acquisition providers configured.');
    return [];
  }

  const searchQueries = [
    `${query} complaints questions problems`,
    `${query} trends demand digital product`,
    `${query} templates toolkit guide buyers`,
  ];
  const sources: DiscoverScoutSource[] = [];

  for (const provider of configured) {
    const providerResults = await Promise.all(
      searchQueries.map(async (searchQuery) => {
      const { signal, cleanup } = timeoutSignal(DISCOVER_PROVIDER_TIMEOUT_MS);

      try {
        const response = await provider.search({
          query: searchQuery,
          limit: 5,
          timeRange: 'month',
          signal,
        });
        attempts.push(`${provider.name}: ${response.results.length} results for "${searchQuery}"`);
        logDiscoverScan('provider_result', {
          provider: provider.name,
          query: searchQuery,
          resultCount: response.results.length,
          status: 'completed',
        });
        return response.results.map((result) => ({
          provider: provider.name,
          title: result.title,
          url: result.url,
          snippet: result.snippet || result.content.slice(0, 240),
        }));
      } catch (error) {
        const sanitizedError = sanitizeDiscoverError(error);
        attempts.push(`${provider.name}: ${sanitizedError}`);
        logDiscoverScan(
          'provider_result',
          {
            provider: provider.name,
            query: searchQuery,
            resultCount: 0,
            status: 'failed',
            error: sanitizedError,
          },
          'warn'
        );
        return [];
      } finally {
        cleanup();
      }
      })
    );

    sources.push(...providerResults.flat());

    if (sources.length >= 6) break;
  }

  return dedupeSources(sources).slice(0, 10);
}

function normalizeScoutIdeas(
  scout: ScoutIdeasOutput,
  query: string,
  filter: OpportunityFilter,
  sources: DiscoverScoutSource[]
): DiscoverOpportunity[] {
  const sourceSignal = sources[0]?.snippet;

  return scout.ideas
    .map((idea, index): DiscoverOpportunity => {
      const score = clamp(idea.opportunityScore, 68, 95);
      const competition = inferCompetition(idea.risks.join(' '), idea.difficulty);
      const growth = clamp(score + 72 + index * 19, 100, 340);
      const tags = tagsFor(score, growth, competition);

      return {
        id: slugify(`${query}-${idea.id || idea.title}`),
        title: idea.title,
        signal: score >= 88 ? 'High Momentum' : growth >= 150 ? 'Fast Growing' : 'Emerging Demand',
        copy: idea.problem,
        category: titleCase(query),
        score,
        growth,
        competition,
        revenue: idea.priceRange,
        buyer: idea.buyer,
        format: idea.format,
        difficulty: idea.difficulty,
        tags,
        confidence: score >= 88 ? 'Very strong' : score >= 80 ? 'Strong' : 'Good',
        velocity: growth >= 220 ? 'Rising fast' : growth >= 150 ? 'Steady rise' : 'Climbing',
        insight: sourceSignal
          ? `Live source signal: ${sourceSignal.slice(0, 145)}`
          : idea.evidence[0] || idea.whyNow,
        positioning: idea.nextStep,
        monetization: `${idea.format} priced around ${idea.priceRange}.`,
      };
    })
    .filter((item) => filter === 'All Ideas' || item.tags.includes(filter));
}

function buildResearchNotes(query: string, sources: DiscoverScoutSource[]) {
  if (sources.length === 0) {
    return `No external acquisition sources were available. Generate credible opportunities for ${query} using WIZUP fallback market reasoning.`;
  }

  return sources
    .slice(0, 5)
    .map((source, index) => {
      const snippet = source.snippet.trim().slice(0, 180);
      return `${index + 1}. [${source.provider}] ${source.title}\n${snippet}\n${source.url}`;
    })
    .join('\n\n');
}

function buildCondensedResearchNotes(query: string, sources: DiscoverScoutSource[]) {
  if (sources.length === 0) {
    return `No external acquisition sources were available. Use concise market reasoning for ${query}.`;
  }

  return sources
    .slice(0, 3)
    .map((source, index) => {
      const snippet = source.snippet.trim().slice(0, 110);
      return `${index + 1}. ${source.title} (${source.provider}) — ${snippet}`;
    })
    .join('\n');
}

function dedupeSources(sources: DiscoverScoutSource[]) {
  return Array.from(new Map(sources.map((source) => [source.url, source])).values());
}

function inferCompetition(text: string, difficulty: string): DiscoverOpportunity['competition'] {
  const normalized = text.toLowerCase();
  if (normalized.includes('competitive') || difficulty === 'Hard') return 'High';
  if (normalized.includes('many') || difficulty === 'Medium') return 'Medium';
  return 'Low';
}

function tagsFor(score: number, growth: number, competition: DiscoverOpportunity['competition']): OpportunityFilter[] {
  const tags: OpportunityFilter[] = ['All Ideas'];
  if (score >= 86) tags.push('High Momentum');
  if (growth >= 135) tags.push('Fast Growing');
  if (competition === 'Low') tags.push('Low Competition');
  tags.push('Evergreen');
  return tags;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function parseDiscoverQuery(query: string) {
  const raw = query.trim();
  const forceMock =
    process.env.NODE_ENV !== 'production' &&
    (raw.startsWith('mock:') || raw.startsWith('[mock]'));
  const normalizedQuery = (forceMock ? raw.replace(/^(mock:|\[mock\])\s*/i, '') : raw).trim() || 'digital product ideas';

  return { normalizedQuery, forceMock };
}
