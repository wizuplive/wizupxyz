'use server';

import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/lib/supabase/types';

type IdeaDetail = {
  id: string;
  title: string;
  description: string;
  ai_metadata: Json;
  created_at: string;
  updated_at: string;
};

type Opportunity = {
  id: string;
  title: string;
  buyer: string;
  problem: string;
  format: string;
  priceRange: string;
  opportunityScore: number | string;
  difficulty: string;
  verdict: string;
  whyNow: string;
};

type GetIdeaByIdResult = {
  error: string | null;
  idea: IdeaDetail | null;
};

function isRecord(value: Json | null | undefined): value is Record<string, Json | undefined> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getString(value: Json | undefined): string {
  return typeof value === 'string' ? value : '';
}

export async function getIdeaById(id: string): Promise<GetIdeaByIdResult> {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { error: userError.message, idea: null };
  }

  if (!user) {
    return { error: 'You must be signed in to view this idea.', idea: null };
  }

  const { data, error } = await supabase
    .from('ideas')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return { error: error.message, idea: null };
  }

  if (!data) {
    return { error: null, idea: null };
  }

  return {
    error: null,
    idea: {
      id: data.id,
      title: data.title,
      description: data.description,
      ai_metadata: data.ai_metadata,
      created_at: data.created_at,
      updated_at: data.updated_at,
    },
  };
}

export async function getOpportunityFromMetadata(
  aiMetadata: Json | null
): Promise<Opportunity> {
  const metadata = isRecord(aiMetadata) ? aiMetadata : null;
  const rawOpportunity = isRecord(metadata?.opportunity) ? metadata.opportunity : null;

  return {
    id: getString(rawOpportunity?.id),
    title: getString(rawOpportunity?.title),
    buyer: getString(rawOpportunity?.buyer),
    problem: getString(rawOpportunity?.problem),
    format: getString(rawOpportunity?.format),
    priceRange: getString(rawOpportunity?.priceRange),
    opportunityScore:
      typeof rawOpportunity?.opportunityScore === 'number'
        ? rawOpportunity.opportunityScore
        : getString(rawOpportunity?.opportunityScore),
    difficulty: getString(rawOpportunity?.difficulty),
    verdict: getString(rawOpportunity?.verdict),
    whyNow: getString(rawOpportunity?.whyNow),
  };
}
