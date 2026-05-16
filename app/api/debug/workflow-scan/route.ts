import { NextResponse } from 'next/server';

import { runScout } from '@/app/actions/ai';
import { runMarketAcquisition } from '@/lib/acquisitions';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export async function GET() {
  const topic = 'parenting';

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  let acquisitionResult: unknown = null;
  let acquisitionError: string | null = null;

  if (userError || !user) {
    acquisitionError = userError?.message ?? 'No authenticated user in debug workflow route.';
  } else {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (projectError || !project?.id) {
      acquisitionError = projectError?.message ?? 'No project found for authenticated user.';
    } else {
      try {
        const acquisition = await runMarketAcquisition({
          supabase,
          projectId: project.id,
          query: topic,
          limit: 3,
          timeRange: 'year',
        });

        acquisitionResult = {
          status: acquisition.status,
          provider: acquisition.provider,
          sourceCount: acquisition.sources.length,
          error: acquisition.error,
          attempts: acquisition.attempts,
        };
      } catch (error) {
        acquisitionError =
          error instanceof Error ? error.message : 'Unknown acquisition error.';
      }
    }
  }

  const ai = await runScout({
    niche: topic,
    audience: topic,
    problem: topic,
    researchNotes:
      typeof acquisitionResult === 'object' && acquisitionResult
        ? JSON.stringify(acquisitionResult)
        : undefined,
  });

  return NextResponse.json({
    auth: {
      hasUser: Boolean(user),
      userError: userError?.message ?? null,
    },
    acquisitionResult,
    acquisitionError,
    ai: {
      source: ai.source,
      model: ai.model,
      fallbackReason: ai.fallbackReason ?? null,
      summary: ai.summary,
      ideaCount: ai.ideas?.length ?? 0,
    },
  });
}
