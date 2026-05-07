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

const ACTOR_ID = 'apify~google-search-scraper';
const ENDPOINT = `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items`;

export const apifyProvider: AcquisitionProvider = {
  name: 'apify',
  endpoint: ENDPOINT,
  isConfigured: () => Boolean(envValue('APIFY_API_TOKEN')),
  async search(request: ProviderSearchRequest) {
    const apiToken = envValue('APIFY_API_TOKEN');
    const limit = clampLimit(request.limit, 20);
    const payload = {
      queries: request.query,
      resultsPerPage: limit,
      maxPagesPerQuery: 1,
      includeUnfilteredResults: false,
      saveHtml: false,
      saveHtmlToKeyValueStore: false,
    };
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: request.signal,
    });
    const raw = await readJsonResponse(response);
    assertOkResponse('Apify', response, raw);

    const results = apifyResultRecords(raw)
      .slice(0, limit)
      .map((item, index): ProviderRawSource | null => {
        const record = asRecord(item);

        if (!record) {
          return null;
        }

        const url =
          asString(record.url) ||
          asString(record.link) ||
          asString(record.displayedUrl);

        if (!url) {
          return null;
        }

        const description =
          asString(record.description) ||
          asString(record.snippet) ||
          asString(record.text);

        return {
          provider: 'apify',
          title: asString(record.title, url),
          url,
          content: textFromParts([description]),
          snippet: description,
          publishedAt:
            asString(record.date) ||
            asString(record.publishedAt) ||
            null,
          rawScore: asNumber(record.score),
          position:
            asNumber(record.position) ||
            asNumber(record.rank) ||
            index + 1,
          sourceType: asString(record.type, 'web'),
          metadata: {
            displayedUrl: asString(record.displayedUrl) || null,
          },
          raw: item,
        };
      })
      .filter((result): result is ProviderRawSource => Boolean(result));

    return {
      provider: 'apify',
      endpoint: ENDPOINT,
      payload,
      raw,
      results,
    };
  },
};

function apifyResultRecords(raw: unknown) {
  const items = Array.isArray(raw) ? raw : asArray(asRecord(raw)?.items);
  const records: unknown[] = [];

  for (const item of items) {
    const record = asRecord(item);

    if (!record) {
      continue;
    }

    const nestedResults = [
      ...asArray(record.nonPromotedSearchResults),
      ...asArray(record.organicResults),
      ...asArray(record.searchResults),
      ...asArray(record.results),
    ];

    if (nestedResults.length > 0) {
      records.push(...nestedResults);
    } else if (record.url || record.link) {
      records.push(record);
    }
  }

  return records;
}
