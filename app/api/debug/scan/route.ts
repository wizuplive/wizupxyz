import { NextResponse } from 'next/server';

import { generateScoutIdeas } from '@/lib/ai';
import { acquisitionProviders } from '@/lib/acquisitions/providers';

export const runtime = 'nodejs';

export async function GET() {
  const providerStates = acquisitionProviders.map((provider) => ({
    name: provider.name,
    isConfigured: provider.isConfigured(),
  }));

  const ai = await generateScoutIdeas({
    niche: 'parenting',
    audience: 'parents',
    problem: 'parents need better routines',
    researchNotes: 'Debug route test. Return real structured ideas if provider is available.',
  });

  return NextResponse.json({
    providerStates,
    ai: {
      role: ai.role,
      source: ai.source,
      model: ai.model,
      fallbackReason: ai.fallbackReason ?? null,
      summary: ai.summary,
      ideaCount: ai.ideas?.length ?? 0,
    },
  });
}
