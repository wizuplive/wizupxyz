import 'server-only';

import { apifyProvider } from './apify';
import { braveProvider } from './brave';
import { firecrawlProvider } from './firecrawl';
import { tavilyProvider } from './tavily';
import type { AcquisitionProvider } from './types';

export type {
  AcquisitionProvider,
  AcquisitionProviderName,
  AcquisitionTimeRange,
  ProviderRawSource,
  ProviderSearchRequest,
  ProviderSearchResponse,
} from './types';

export const acquisitionProviders: AcquisitionProvider[] = [
  tavilyProvider,
  firecrawlProvider,
  apifyProvider,
  braveProvider,
];

export { apifyProvider, braveProvider, firecrawlProvider, tavilyProvider };
