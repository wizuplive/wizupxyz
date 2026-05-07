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

const ENDPOINT = 'https://api.tavily.com/search';

export const tavilyProvider: AcquisitionProvider = {
  name: 'tavily',
  endpoint: ENDPOINT,
  isConfigured: () => Boolean(envValue('TAVILY_API_KEY')),
  async search(request: ProviderSearchRequest) {
    const apiKey = envValue('TAVILY_API_KEY');
    const payload = {
      query: request.query,
      search_depth: 'advanced',
      chunks_per_source: 3,
      max_results: clampLimit(request.limit, 20),
      include_answer: false,
      include_raw_content: 'markdown',
      include_favicon: true,
      include_usage: true,
      topic: 'general',
      ...(request.timeRange ? { time_range: request.timeRange } : {}),
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
    assertOkResponse('Tavily', response, raw);

    const rawResults = asArray(asRecord(raw)?.results);
    const results = rawResults
      .map((item, index): ProviderRawSource | null => {
        const record = asRecord(item);

        if (!record) {
          return null;
        }

        const url = asString(record.url);

        if (!url) {
          return null;
        }

        const content = textFromParts([
          asString(record.raw_content),
          asString(record.content),
        ]);

        return {
          provider: 'tavily',
          title: asString(record.title, url),
          url,
          content,
          snippet: asString(record.content),
          publishedAt: asString(record.published_date) || null,
          rawScore: asNumber(record.score),
          position: index + 1,
          sourceType: 'web',
          metadata: {
            favicon: asString(record.favicon) || null,
          },
          raw: item,
        };
      })
      .filter((result): result is ProviderRawSource => Boolean(result));

    return {
      provider: 'tavily',
      endpoint: ENDPOINT,
      payload,
      raw,
      results,
    };
  },
};
