import 'server-only';

import type {
  AcquisitionProvider,
  AcquisitionTimeRange,
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

const ENDPOINT = 'https://api.search.brave.com/res/v1/web/search';

export const braveProvider: AcquisitionProvider = {
  name: 'brave',
  endpoint: ENDPOINT,
  isConfigured: () => Boolean(envValue('BRAVE_API_KEY')),
  async search(request: ProviderSearchRequest) {
    const apiKey = envValue('BRAVE_API_KEY');
    const params = new URLSearchParams({
      q: request.query,
      count: String(clampLimit(request.limit, 20)),
      safesearch: 'moderate',
      extra_snippets: 'true',
    });

    if (request.timeRange) {
      params.set('freshness', braveFreshness(request.timeRange));
    }

    const payload = Object.fromEntries(params.entries());
    const response = await fetch(`${ENDPOINT}?${params.toString()}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Subscription-Token': apiKey,
      },
      signal: request.signal,
    });
    const raw = await readJsonResponse(response);
    assertOkResponse('Brave', response, raw);

    const results = asArray(asRecord(asRecord(raw)?.web)?.results)
      .map((item, index): ProviderRawSource | null => {
        const record = asRecord(item);

        if (!record) {
          return null;
        }

        const url = asString(record.url);

        if (!url) {
          return null;
        }

        const extraSnippets = asArray(record.extra_snippets).filter(
          (snippet): snippet is string => typeof snippet === 'string'
        );
        const description = asString(record.description);

        return {
          provider: 'brave',
          title: asString(record.title, url),
          url,
          content: textFromParts([description, ...extraSnippets]),
          snippet: description,
          publishedAt:
            asString(record.page_age) ||
            asString(record.age) ||
            null,
          rawScore: asNumber(record.score),
          position: index + 1,
          sourceType: asString(record.type, 'web'),
          metadata: {
            profile: asRecord(record.profile),
            language: asString(record.language) || null,
            familyFriendly: record.family_friendly ?? null,
          },
          raw: item,
        };
      })
      .filter((result): result is ProviderRawSource => Boolean(result));

    return {
      provider: 'brave',
      endpoint: ENDPOINT,
      payload,
      raw,
      results,
    };
  },
};

function braveFreshness(timeRange: AcquisitionTimeRange) {
  switch (timeRange) {
    case 'day':
      return 'pd';
    case 'week':
      return 'pw';
    case 'month':
      return 'pm';
    case 'year':
      return 'py';
  }
}
