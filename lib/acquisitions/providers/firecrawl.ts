import 'server-only';

import type {
  AcquisitionProvider,
  ProviderRawSource,
  ProviderSearchRequest,
} from './types';
import {
  asArray,
  asNumber,
  asRecord,
  asString,
  assertOkResponse,
  clampLimit,
  envValue,
  readJsonResponse,
  textFromParts,
} from './utils';

const ENDPOINT = 'https://api.firecrawl.dev/v2/search';

export const firecrawlProvider: AcquisitionProvider = {
  name: 'firecrawl',
  endpoint: ENDPOINT,
  isConfigured: () => Boolean(envValue('FIRECRAWL_API_KEY')),
  async search(request: ProviderSearchRequest) {
    const apiKey = envValue('FIRECRAWL_API_KEY');
    const payload = {
      query: request.query,
      limit: clampLimit(request.limit, 20),
      sources: ['web'],
      scrapeOptions: {
        formats: ['markdown'],
        onlyMainContent: true,
        parsers: [],
      },
      timeout: 30000,
      ...(request.timeRange ? { tbs: firecrawlTimeRange(request.timeRange) } : {}),
    };

    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: request.signal,
    });
    const raw = await readJsonResponse(response);
    assertOkResponse('Firecrawl', response, raw);

    const results = firecrawlResultRecords(raw)
      .map((item, index): ProviderRawSource | null => {
        const record = asRecord(item);

        if (!record) {
          return null;
        }

        const metadata = asRecord(record.metadata) ?? {};
        const url =
          asString(record.url) ||
          asString(metadata.sourceURL) ||
          asString(metadata.url);

        if (!url) {
          return null;
        }

        const description =
          asString(record.description) || asString(record.snippet);
        const content = textFromParts([
          asString(record.markdown),
          description,
        ]);

        return {
          provider: 'firecrawl',
          title:
            asString(record.title) || asString(metadata.title) || url,
          url,
          content,
          snippet: description,
          publishedAt:
            asString(record.date) ||
            asString(record.publishedDate) ||
            null,
          rawScore: asNumber(record.score),
          position: asNumber(record.position) ?? index + 1,
          sourceType: asString(record.category, 'web'),
          metadata: {
            metadata,
            links: asArray(record.links).filter(
              (link): link is string => typeof link === 'string'
            ),
            statusCode: asNumber(metadata.statusCode),
          },
          raw: item,
        };
      })
      .filter((result): result is ProviderRawSource => Boolean(result));

    return {
      provider: 'firecrawl',
      endpoint: ENDPOINT,
      payload,
      raw,
      results,
    };
  },
};

function firecrawlResultRecords(raw: unknown) {
  const root = asRecord(raw);
  const data = root?.data;

  if (Array.isArray(data)) {
    return data;
  }

  const dataRecord = asRecord(data);
  return asArray(dataRecord?.web);
}

function firecrawlTimeRange(timeRange: NonNullable<ProviderSearchRequest['timeRange']>) {
  switch (timeRange) {
    case 'day':
      return 'qdr:d';
    case 'week':
      return 'qdr:w';
    case 'month':
      return 'qdr:m';
    case 'year':
      return 'qdr:y';
  }
}
