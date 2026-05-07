import 'server-only';

export type AcquisitionProviderName =
  | 'tavily'
  | 'firecrawl'
  | 'apify'
  | 'brave';

export type AcquisitionTimeRange = 'day' | 'week' | 'month' | 'year';

export interface ProviderSearchRequest {
  query: string;
  limit: number;
  timeRange?: AcquisitionTimeRange;
  signal?: AbortSignal;
}

export interface ProviderRawSource {
  provider: AcquisitionProviderName;
  title: string;
  url: string;
  content: string;
  snippet: string;
  publishedAt: string | null;
  rawScore: number | null;
  position: number | null;
  sourceType: string | null;
  metadata: Record<string, unknown>;
  raw: unknown;
}

export interface ProviderSearchResponse {
  provider: AcquisitionProviderName;
  endpoint: string;
  payload: Record<string, unknown>;
  raw: unknown;
  results: ProviderRawSource[];
}

export interface AcquisitionProvider {
  name: AcquisitionProviderName;
  endpoint: string;
  isConfigured: () => boolean;
  search: (request: ProviderSearchRequest) => Promise<ProviderSearchResponse>;
}

export class ProviderRequestError extends Error {
  status: number | null;
  response: unknown;

  constructor(message: string, status: number | null = null, response?: unknown) {
    super(message);
    this.name = 'ProviderRequestError';
    this.status = status;
    this.response = response;
  }
}
