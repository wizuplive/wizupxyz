import { NextResponse } from 'next/server';

import { runDiscoverScout } from '@/app/actions/discover';
import { acquisitionProviders } from '@/lib/acquisitions/providers';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query')?.trim() || 'parenting';
  const filter = searchParams.get('filter')?.trim() || 'All Ideas';
  const providerStates = acquisitionProviders.map((provider) => ({
    name: provider.name,
    isConfigured: provider.isConfigured(),
  }));

  const result = await runDiscoverScout({
    query,
    filter: filter as
      | 'All Ideas'
      | 'High Momentum'
      | 'Fast Growing'
      | 'Low Competition'
      | 'Evergreen',
  });

  return NextResponse.json({
    providerStates,
    scan: {
      query: result.query,
      filter: result.filter,
      source: result.source,
      trusted: result.trusted,
      status: result.status,
      model: result.model,
      fallbackReason: result.fallbackReason ?? null,
      summary: result.summary,
      ideaCount: result.opportunities.length,
      sourceCount: result.sources.length,
      attempts: result.attempts,
    },
  });
}
