'use server';

import { revalidatePath } from 'next/cache';
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

import {
  runAnalyst,
  runCreator,
  runReviewer,
  runScout,
  runStrategist,
} from '@/app/actions/ai';
import {
  type AnalystExamplesOutput,
  type CreatorAssetsOutput,
  type ReviewerInput,
  type ReviewerStoreReadinessOutput,
  type ScoutResearchContext,
  type ScoutIdeasOutput,
  type ScoutOpportunity,
  type StrategistInput,
  type StrategistProductOutlineOutput,
} from '@/lib/ai';
import {
  runMarketAcquisition,
  type MarketAcquisitionResult,
} from '@/lib/acquisitions';
import { createClient } from '@/lib/supabase/server';
import type { Json, Tables } from '@/lib/supabase/types';
import type {
  DesignerAssetType,
  SessionPrimaryDesignerAsset,
} from '@/lib/designer-assets';
import type { BuildSession } from '@/app/context/ActiveBuildSessionContext';

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;
type DbContext = {
  supabase: SupabaseServerClient;
  userId: string;
};

export type WorkflowActionResult<T> = {
  data: T | null;
  error: string | null;
  notice: string | null;
};

export type SavedIdea = {
  id: string;
  title: string;
  description: string;
  buyer: string;
  format: string;
  priceRange: string;
  opportunityScore: number | null;
  difficulty: string;
  verdict: string;
  whyNow: string;
  createdAt: string;
  updatedAt: string;
};

export type SavedExample = {
  id: string;
  title: string;
  ideaTitle: string;
  type: string;
  summary: string;
  createdAt: string;
  analysis: AnalystExamplesOutput | null;
};

export type ProductSourceOption = {
  key: string;
  kind: 'idea' | 'example';
  title: string;
  eyebrow: string;
  description: string;
};

export type SavedProduct = {
  id: string;
  title: string;
  subtitle: string;
  buyer: string;
  price: string;
  category: string;
  createdAt: string;
  product: StrategistProductOutlineOutput | null;
};

export type SavedSalesAsset = {
  id: string;
  productId: string | null;
  title: string;
  headline: string;
  subheadline: string;
  assetType: string;
  createdAt: string;
  assets: CreatorAssetsOutput | null;
};

export type StoreReviewRequest = {
  productId?: string;
  salesAssetId?: string;
  productTitle?: string;
  buyer?: string;
  headline?: string;
  subheadline?: string;
  price?: string;
  includedAssets?: string;
  notes?: string;
};

type SavedExamplePayload = {
  ideaId?: string;
  sourceIdea?: SavedIdea;
  analysis?: AnalystExamplesOutput;
  savedAt?: string;
};

type SavedSalesAssetPayload = {
  productId?: string;
  assets?: CreatorAssetsOutput;
  savedAt?: string;
};

const WORKFLOW_PATHS = [
  '/app/ideas',
  '/app/examples',
  '/app/product',
  '/app/sales-kit',
  '/app/store',
  '/app/saved',
];

import { env } from '@/lib/env';

export async function scoutTopic(
  topic: string
): Promise<WorkflowActionResult<ScoutIdeasOutput>> {
  const trimmedTopic = topic.trim();

  if (!trimmedTopic) {
    return fail('Enter a niche, audience, or problem to scan.');
  }

  const db = await getDbContext();

  if ('error' in db) {
    return fail(db.error);
  }

  const projectId = await getOrCreateProjectId(db);

  if (projectId.error || !projectId.data) {
    return fail(projectId.error ?? 'Could not resolve a workspace project.');
  }

  let acquisition: MarketAcquisitionResult | null = null;
  let acquisitionNotice: string | null = null;

  try {
    acquisition = await runMarketAcquisition({
      supabase: db.supabase,
      projectId: projectId.data,
      query: trimmedTopic,
      limit: 10,
      timeRange: 'year',
    });

    if (acquisition.status === 'failed') {
      acquisitionNotice = acquisition.error
        ? `Research acquisition fallback: ${acquisition.error}`
        : 'Research acquisition fallback used.';
    }
  } catch (error) {
    acquisitionNotice = `Research acquisition fallback: ${messageFrom(
      error,
      'could not persist market research.'
    )}`;
  }

  try {
    const output = await runScout({
      niche: trimmedTopic,
      audience: trimmedTopic,
      problem: trimmedTopic,
      researchNotes: acquisition
        ? researchNotesFromAcquisition(acquisition)
        : undefined,
    });
    const enrichedOutput: ScoutIdeasOutput = {
      ...output,
      ...(acquisition ? { research: researchContext(acquisition) } : {}),
    };

    return ok(
      enrichedOutput,
      combineNotices(aiNotice(output), acquisitionNotice)
    );
  } catch (error) {
    return fail(messageFrom(error, 'Scout could not complete the market scan.'));
  }
}

export async function saveScoutIdea(
  opportunity: ScoutOpportunity,
  scan: ScoutIdeasOutput | null
): Promise<WorkflowActionResult<SavedIdea>> {
  if (!opportunity?.title?.trim()) {
    return fail('There is no idea title to save.');
  }

  const db = await getDbContext();

  if ('error' in db) {
    return fail(db.error);
  }

  const projectId = await getOrCreateProjectId(db);

  if (projectId.error || !projectId.data) {
    return fail(projectId.error ?? 'Could not resolve a workspace project.');
  }

  const payload = {
    opportunity,
    scout: scan
      ? {
          summary: scan.summary,
          nextSearches: scan.nextSearches,
          role: scan.role,
          source: scan.source,
          model: scan.model,
          generatedAt: scan.generatedAt,
          fallbackReason: scan.fallbackReason,
          research: scan.research,
        }
      : null,
    savedAt: new Date().toISOString(),
  };

  const { data, error } = await db.supabase
    .from('ideas')
    .insert({
      project_id: projectId.data,
      title: opportunity.title,
      description: opportunity.problem,
      ai_metadata: toJson(payload),
    })
    .select('*')
    .single();

  if (error) {
    return fail(error.message);
  }

  revalidateWorkflowPaths();
  return ok(mapIdeaRow(data));
}

export async function listSavedIdeas(): Promise<
  WorkflowActionResult<SavedIdea[]>
> {
  const db = await getDbContext();

  if ('error' in db) {
    return fail(db.error);
  }

  const result = await fetchSavedIdeas(db);

  if (result.error) {
    return fail(result.error);
  }

  return ok(result.data ?? []);
}

export async function generateExamplesFromIdea(
  ideaId: string
): Promise<WorkflowActionResult<AnalystExamplesOutput>> {
  const db = await getDbContext();

  if ('error' in db) {
    return fail(db.error);
  }

  const ideaResult = await getIdeaById(db, ideaId);

  if (ideaResult.error || !ideaResult.data) {
    return fail(ideaResult.error ?? 'The selected idea could not be found.');
  }

  const idea = ideaResult.data;
  const opportunity = getOpportunityFromMetadata(idea.ai_metadata);

  let acquisition: MarketAcquisitionResult | null = null;
  let acquisitionNotice: string | null = null;

  try {
    const projectId = await getOrCreateProjectId(db);
    if (!projectId.error && projectId.data) {
      acquisition = await runMarketAcquisition({
        supabase: db.supabase,
        projectId: projectId.data,
        query: `${idea.title} ${asString(opportunity.buyer)}`,
        limit: 10,
        timeRange: 'year',
      });
      if (acquisition.status === 'failed') {
        acquisitionNotice = acquisition.error
          ? `Research acquisition fallback: ${acquisition.error}`
          : 'Research acquisition fallback used.';
      }
    }
  } catch (error) {
    acquisitionNotice = `Research acquisition fallback: ${messageFrom(
      error,
      'could not persist market research.'
    )}`;
  }

  try {
    const output = await runAnalyst({
      ideaTitle: idea.title,
      buyer: asString(opportunity.buyer),
      format: asString(opportunity.format),
      priceRange: asString(opportunity.priceRange),
      notes: [
        idea.description,
        asString(opportunity.whyNow),
        asString(opportunity.nextStep),
      ]
        .filter(Boolean)
        .join('\n'),
      researchNotes: acquisition
        ? researchNotesFromAcquisition(acquisition)
        : undefined,
    });

    const enrichedOutput: AnalystExamplesOutput = {
      ...output,
      ...(acquisition && acquisition.status !== 'failed'
        ? { research: researchContext(acquisition) }
        : {}),
    };

    return ok(enrichedOutput, acquisitionNotice || aiNotice(output));
  } catch (error) {
    return fail(messageFrom(error, 'Analyst could not generate examples.'));
  }
}

export async function saveAnalystExample(
  ideaId: string,
  analysis: AnalystExamplesOutput
): Promise<WorkflowActionResult<SavedExample>> {
  if (!analysis?.ideaTitle?.trim()) {
    return fail('There is no analysis to save.');
  }

  const db = await getDbContext();

  if ('error' in db) {
    return fail(db.error);
  }

  const [projectId, ideaResult] = await Promise.all([
    getOrCreateProjectId(db),
    getIdeaById(db, ideaId),
  ]);

  if (projectId.error || !projectId.data) {
    return fail(projectId.error ?? 'Could not resolve a workspace project.');
  }

  if (ideaResult.error || !ideaResult.data) {
    return fail(ideaResult.error ?? 'The selected idea could not be found.');
  }

  const payload: SavedExamplePayload = {
    ideaId,
    sourceIdea: mapIdeaRow(ideaResult.data),
    analysis,
    savedAt: new Date().toISOString(),
  };

  const { data, error } = await db.supabase
    .from('examples')
    .insert({
      project_id: projectId.data,
      type: 'analyst_report',
      content: JSON.stringify(payload),
    })
    .select('*')
    .single();

  if (error) {
    return fail(error.message);
  }

  revalidateWorkflowPaths();
  return ok(mapExampleRow(data));
}

export async function listSavedExamples(): Promise<
  WorkflowActionResult<SavedExample[]>
> {
  const db = await getDbContext();

  if ('error' in db) {
    return fail(db.error);
  }

  const result = await fetchSavedExamples(db);

  if (result.error) {
    return fail(result.error);
  }

  return ok(result.data ?? []);
}

export async function listProductSources(): Promise<
  WorkflowActionResult<ProductSourceOption[]>
> {
  const db = await getDbContext();

  if ('error' in db) {
    return fail(db.error);
  }

  const [ideasResult, examplesResult] = await Promise.all([
    fetchSavedIdeas(db),
    fetchSavedExamples(db),
  ]);

  if (ideasResult.error) {
    return fail(ideasResult.error);
  }

  if (examplesResult.error) {
    return fail(examplesResult.error);
  }

  const ideas = (ideasResult.data ?? []).map((idea) => ({
    key: `idea:${idea.id}`,
    kind: 'idea' as const,
    title: idea.title,
    eyebrow: 'Saved idea',
    description: idea.buyer || idea.description || 'Ready for product strategy.',
  }));

  const examples = (examplesResult.data ?? []).map((example) => ({
    key: `example:${example.id}`,
    kind: 'example' as const,
    title: example.ideaTitle || example.title,
    eyebrow: 'Saved example analysis',
    description: example.summary || 'Market patterns ready for product strategy.',
  }));

  return ok([...ideas, ...examples]);
}

export async function generateProductArchitecture(
  sourceKey: string
): Promise<WorkflowActionResult<StrategistProductOutlineOutput>> {
  const source = parseSourceKey(sourceKey);

  if (!source) {
    return fail('Select a saved idea or example first.');
  }

  const db = await getDbContext();

  if ('error' in db) {
    return fail(db.error);
  }

  try {
    const input =
      source.kind === 'idea'
        ? await strategistInputFromIdea(db, source.id)
        : await strategistInputFromExample(db, source.id);

    if (input.error || !input.data) {
      return fail(input.error ?? 'Could not build a Strategist input.');
    }

    const output = await runStrategist(input.data);
    return ok(output, aiNotice(output));
  } catch (error) {
    return fail(
      messageFrom(error, 'Strategist could not generate the architecture.')
    );
  }
}

export async function saveProductArchitecture(
  sourceKey: string,
  product: StrategistProductOutlineOutput
): Promise<WorkflowActionResult<SavedProduct>> {
  if (!product?.positioning?.title?.trim()) {
    return fail('There is no product architecture to save.');
  }

  const db = await getDbContext();

  if ('error' in db) {
    return fail(db.error);
  }

  const projectId = await getOrCreateProjectId(db);

  if (projectId.error || !projectId.data) {
    return fail(projectId.error ?? 'Could not resolve a workspace project.');
  }

  const { data, error } = await db.supabase
    .from('products')
    .insert({
      project_id: projectId.data,
      content: toJson(product),
      metadata: toJson({
        sourceKey,
        role: product.role,
        source: product.source,
        model: product.model,
        generatedAt: product.generatedAt,
        fallbackReason: product.fallbackReason,
        savedAt: new Date().toISOString(),
      }),
    })
    .select('*')
    .single();

  if (error) {
    return fail(error.message);
  }

  revalidateWorkflowPaths();
  return ok(mapProductRow(data));
}

export async function listSavedProducts(): Promise<
  WorkflowActionResult<SavedProduct[]>
> {
  const db = await getDbContext();

  if ('error' in db) {
    return fail(db.error);
  }

  const result = await fetchSavedProducts(db);

  if (result.error) {
    return fail(result.error);
  }

  return ok(result.data ?? []);
}

export async function generateSalesKit(
  productId: string,
  tone: string
): Promise<WorkflowActionResult<CreatorAssetsOutput>> {
  const db = await getDbContext();

  if ('error' in db) {
    return fail(db.error);
  }

  const productResult = await getProductById(db, productId);

  if (productResult.error || !productResult.data) {
    return fail(
      productResult.error ?? 'The selected product could not be found.'
    );
  }

  const product = parseProductContent(productResult.data.content);

  if (!product) {
    return fail('The selected product does not have a readable architecture.');
  }

  try {
    const output = await runCreator({
      productTitle: product.positioning.title,
      buyer: product.positioning.targetBuyer,
      format: product.positioning.category,
      modules: product.modules,
      positioning: product.positioning,
      tone: tone.trim() || 'clear, confident, and practical',
      notes: [
        product.positioning.promise,
        ...product.keyFeatures,
        ...product.proofPoints,
      ].join('\n'),
    });

    return ok(output, aiNotice(output));
  } catch (error) {
    return fail(messageFrom(error, 'Creator could not generate the sales kit.'));
  }
}

export async function saveSalesAsset(
  productId: string,
  assets: CreatorAssetsOutput
): Promise<WorkflowActionResult<SavedSalesAsset>> {
  if (!assets?.salesKit?.headline?.trim()) {
    return fail('There is no sales kit to save.');
  }

  const db = await getDbContext();

  if ('error' in db) {
    return fail(db.error);
  }

  const projectId = await getOrCreateProjectId(db);

  if (projectId.error || !projectId.data) {
    return fail(projectId.error ?? 'Could not resolve a workspace project.');
  }

  const payload: SavedSalesAssetPayload = {
    productId,
    assets,
    savedAt: new Date().toISOString(),
  };

  const { data, error } = await db.supabase
    .from('sales_assets')
    .insert({
      project_id: projectId.data,
      asset_type: 'sales_kit',
      content: toJson(payload),
    })
    .select('*')
    .single();

  if (error) {
    return fail(error.message);
  }

  revalidateWorkflowPaths();
  return ok(mapSalesAssetRow(data));
}

export async function listSavedSalesAssets(): Promise<
  WorkflowActionResult<SavedSalesAsset[]>
> {
  const db = await getDbContext();

  if ('error' in db) {
    return fail(db.error);
  }

  const result = await fetchSavedSalesAssets(db);

  if (result.error) {
    return fail(result.error);
  }

  return ok(result.data ?? []);
}

export async function reviewStoreReadiness(
  request: StoreReviewRequest
): Promise<WorkflowActionResult<ReviewerStoreReadinessOutput>> {
  const db = await getDbContext();

  if ('error' in db) {
    return fail(db.error);
  }

  const inputResult = await reviewerInputFromRequest(db, request);

  if (inputResult.error || !inputResult.data) {
    return fail(inputResult.error ?? 'Could not build a Reviewer input.');
  }

  try {
    const output = await runReviewer(inputResult.data);
    return ok(output, aiNotice(output));
  } catch (error) {
    return fail(messageFrom(error, 'Reviewer could not score store readiness.'));
  }
}

export async function saveStoreReview(
  request: StoreReviewRequest,
  review: ReviewerStoreReadinessOutput
): Promise<WorkflowActionResult<{ id: string }>> {
  if (!review?.verdict?.trim()) {
    return fail('There is no store review to save.');
  }

  const db = await getDbContext();

  if ('error' in db) {
    return fail(db.error);
  }

  const projectId = await getOrCreateProjectId(db);

  if (projectId.error || !projectId.data) {
    return fail(projectId.error ?? 'Could not resolve a workspace project.');
  }

  const { data, error } = await db.supabase
    .from('stores')
    .insert({
      project_id: projectId.data,
      content: toJson({ request, review }),
      metadata: toJson({
        role: review.role,
        source: review.source,
        model: review.model,
        generatedAt: review.generatedAt,
        fallbackReason: review.fallbackReason,
        savedAt: new Date().toISOString(),
      }),
    })
    .select('id')
    .single();

  if (error) {
    return fail(error.message);
  }

  revalidateWorkflowPaths();
  return ok({ id: data.id });
}

async function getDbContext(): Promise<DbContext | { error: string }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return { error: error.message };
    }

    if (!data.user) {
      return { error: 'Sign in to load or save workflow records.' };
    }

    return { supabase, userId: data.user.id };
  } catch (error) {
    return {
      error: messageFrom(
        error,
        'Supabase is not configured for workflow storage yet.'
      ),
    };
  }
}

async function getOrCreateProjectId(
  db: DbContext
): Promise<WorkflowActionResult<string>> {
  const { data: existing, error: selectError } = await db.supabase
    .from('projects')
    .select('id')
    .eq('user_id', db.userId)
    .in('status', ['active', 'draft'])
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (selectError) {
    return fail(selectError.message);
  }

  if (existing?.id) {
    return ok(existing.id);
  }

  const { data: created, error: insertError } = await db.supabase
    .from('projects')
    .insert({
      user_id: db.userId,
      name: 'WIZUP Workspace',
      status: 'active',
    })
    .select('id')
    .single();

  if (insertError) {
    return fail(insertError.message);
  }

  return ok(created.id);
}

async function fetchOwnedProjectIds(
  db: DbContext
): Promise<WorkflowActionResult<string[]>> {
  const { data, error } = await db.supabase
    .from('projects')
    .select('id')
    .eq('user_id', db.userId);

  if (error) {
    return fail(error.message);
  }

  return ok((data ?? []).map((project) => project.id));
}

async function fetchSavedIdeas(
  db: DbContext
): Promise<WorkflowActionResult<SavedIdea[]>> {
  const projectIds = await fetchOwnedProjectIds(db);
  if (projectIds.error) {
    return fail(projectIds.error);
  }

  if (!projectIds.data?.length) {
    return ok([]);
  }

  const { data, error } = await db.supabase
    .from('ideas')
    .select('*')
    .in('project_id', projectIds.data)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) {
    return fail(error.message);
  }

  return ok((data ?? []).map(mapIdeaRow));
}

async function fetchSavedExamples(
  db: DbContext
): Promise<WorkflowActionResult<SavedExample[]>> {
  const projectIds = await fetchOwnedProjectIds(db);
  if (projectIds.error) {
    return fail(projectIds.error);
  }

  if (!projectIds.data?.length) {
    return ok([]);
  }

  const { data, error } = await db.supabase
    .from('examples')
    .select('*')
    .in('project_id', projectIds.data)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) {
    return fail(error.message);
  }

  return ok((data ?? []).map(mapExampleRow));
}

async function fetchSavedProducts(
  db: DbContext
): Promise<WorkflowActionResult<SavedProduct[]>> {
  const projectIds = await fetchOwnedProjectIds(db);
  if (projectIds.error) {
    return fail(projectIds.error);
  }

  if (!projectIds.data?.length) {
    return ok([]);
  }

  const { data, error } = await db.supabase
    .from('products')
    .select('*')
    .in('project_id', projectIds.data)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) {
    return fail(error.message);
  }

  return ok((data ?? []).map(mapProductRow));
}

async function fetchSavedSalesAssets(
  db: DbContext
): Promise<WorkflowActionResult<SavedSalesAsset[]>> {
  const projectIds = await fetchOwnedProjectIds(db);
  if (projectIds.error) {
    return fail(projectIds.error);
  }

  if (!projectIds.data?.length) {
    return ok([]);
  }

  const { data, error } = await db.supabase
    .from('sales_assets')
    .select('*')
    .in('project_id', projectIds.data)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) {
    return fail(error.message);
  }

  return ok((data ?? []).map(mapSalesAssetRow));
}

async function getIdeaById(
  db: DbContext,
  ideaId: string
): Promise<WorkflowActionResult<Tables<'ideas'>>> {
  const projectIds = await fetchOwnedProjectIds(db);
  if (projectIds.error) {
    return fail(projectIds.error);
  }

  if (!projectIds.data?.length) {
    return fail('The selected idea could not be found.');
  }

  const { data, error } = await db.supabase
    .from('ideas')
    .select('*')
    .eq('id', ideaId)
    .in('project_id', projectIds.data)
    .maybeSingle();

  if (error) {
    return fail(error.message);
  }

  if (!data) {
    return fail('The selected idea could not be found.');
  }

  return ok(data);
}

async function getExampleById(
  db: DbContext,
  exampleId: string
): Promise<WorkflowActionResult<Tables<'examples'>>> {
  const projectIds = await fetchOwnedProjectIds(db);
  if (projectIds.error) {
    return fail(projectIds.error);
  }

  if (!projectIds.data?.length) {
    return fail('The selected example could not be found.');
  }

  const { data, error } = await db.supabase
    .from('examples')
    .select('*')
    .eq('id', exampleId)
    .in('project_id', projectIds.data)
    .maybeSingle();

  if (error) {
    return fail(error.message);
  }

  if (!data) {
    return fail('The selected example could not be found.');
  }

  return ok(data);
}

async function getProductById(
  db: DbContext,
  productId: string
): Promise<WorkflowActionResult<Tables<'products'>>> {
  const projectIds = await fetchOwnedProjectIds(db);
  if (projectIds.error) {
    return fail(projectIds.error);
  }

  if (!projectIds.data?.length) {
    return fail('The selected product could not be found.');
  }

  const { data, error } = await db.supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .in('project_id', projectIds.data)
    .maybeSingle();

  if (error) {
    return fail(error.message);
  }

  if (!data) {
    return fail('The selected product could not be found.');
  }

  return ok(data);
}

async function getSalesAssetById(
  db: DbContext,
  assetId: string
): Promise<WorkflowActionResult<Tables<'sales_assets'>>> {
  const projectIds = await fetchOwnedProjectIds(db);
  if (projectIds.error) {
    return fail(projectIds.error);
  }

  if (!projectIds.data?.length) {
    return fail('The selected sales asset could not be found.');
  }

  const { data, error } = await db.supabase
    .from('sales_assets')
    .select('*')
    .eq('id', assetId)
    .in('project_id', projectIds.data)
    .maybeSingle();

  if (error) {
    return fail(error.message);
  }

  if (!data) {
    return fail('The selected sales asset could not be found.');
  }

  return ok(data);
}

async function strategistInputFromIdea(
  db: DbContext,
  ideaId: string
): Promise<WorkflowActionResult<StrategistInput>> {
  const ideaResult = await getIdeaById(db, ideaId);

  if (ideaResult.error || !ideaResult.data) {
    return fail(ideaResult.error ?? 'The selected idea could not be found.');
  }

  const idea = ideaResult.data;
  const opportunity = getOpportunityFromMetadata(idea.ai_metadata);

  return ok({
    ideaTitle: idea.title,
    buyer: asString(opportunity.buyer, 'Digital product buyer'),
    problem: idea.description || asString(opportunity.problem),
    format: asString(opportunity.format),
    priceRange: asString(opportunity.priceRange),
    differentiator: asString(opportunity.whyNow),
    notes: [
      asString(opportunity.nextStep),
      ...asStringArray(opportunity.evidence),
      ...asStringArray(opportunity.risks).map((risk) => `Risk: ${risk}`),
    ]
      .filter(Boolean)
      .join('\n'),
  });
}

async function strategistInputFromExample(
  db: DbContext,
  exampleId: string
): Promise<WorkflowActionResult<StrategistInput>> {
  const exampleResult = await getExampleById(db, exampleId);

  if (exampleResult.error || !exampleResult.data) {
    return fail(
      exampleResult.error ?? 'The selected example could not be found.'
    );
  }

  const exampleRow = exampleResult.data;
  const example = mapExampleRow(exampleRow);
  const analysis = example.analysis;

  if (!analysis) {
    return fail('The selected example does not have readable analysis.');
  }

  const sourceIdea = parseSavedExampleContent(exampleRow.content)?.sourceIdea;
  const firstCompetitor = analysis.competitorExamples[0];
  const firstPricing = analysis.formatPricing[0];

  return ok({
    ideaTitle: analysis.ideaTitle || sourceIdea?.title || example.title,
    buyer:
      sourceIdea?.buyer ||
      firstCompetitor?.audience ||
      'Digital product buyer',
    problem:
      sourceIdea?.description ||
      analysis.buyerComplaints[0] ||
      analysis.recommendation,
    format: sourceIdea?.format || firstCompetitor?.format,
    priceRange: sourceIdea?.priceRange || firstPricing?.typicalPriceRange,
    differentiator: analysis.improvementAngles.join('\n'),
    notes: [
      analysis.recommendation,
      ...analysis.titlePatterns.map((pattern) => `Title pattern: ${pattern}`),
      ...analysis.buyerComplaints.map(
        (complaint) => `Buyer complaint: ${complaint}`
      ),
    ].join('\n'),
  });
}

async function reviewerInputFromRequest(
  db: DbContext,
  request: StoreReviewRequest
): Promise<WorkflowActionResult<ReviewerInput>> {
  let product: StrategistProductOutlineOutput | null = null;
  let assets: CreatorAssetsOutput | null = null;

  if (request.productId) {
    const productResult = await getProductById(db, request.productId);

    if (productResult.error || !productResult.data) {
      return fail(
        productResult.error ?? 'The selected product could not be found.'
      );
    }

    product = parseProductContent(productResult.data.content);
  }

  if (request.salesAssetId) {
    const assetResult = await getSalesAssetById(db, request.salesAssetId);

    if (assetResult.error || !assetResult.data) {
      return fail(
        assetResult.error ?? 'The selected sales asset could not be found.'
      );
    }

    assets = extractCreatorAssets(assetResult.data.content);
  }

  const productTitle =
    request.productTitle?.trim() || product?.positioning.title || '';
  const buyer =
    request.buyer?.trim() || product?.positioning.targetBuyer || '';
  const headline =
    request.headline?.trim() || assets?.salesKit.headline || undefined;
  const subheadline =
    request.subheadline?.trim() ||
    assets?.salesKit.subheadline ||
    product?.positioning.subtitle ||
    undefined;
  const price =
    request.price?.trim() || product?.positioning.recommendedPrice || undefined;
  const includedAssets = parseLines(request.includedAssets).concat(
    product?.modules.flatMap((module) => module.includedAssets) ?? []
  );

  if (!productTitle || !buyer) {
    return fail('Add a product title and target buyer before reviewing.');
  }

  return ok({
    productTitle,
    buyer,
    headline,
    subheadline,
    price,
    includedAssets,
    notes: request.notes?.trim(),
  });
}

function mapIdeaRow(row: Tables<'ideas'>): SavedIdea {
  const opportunity = getOpportunityFromMetadata(row.ai_metadata);

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    buyer: asString(opportunity.buyer),
    format: asString(opportunity.format),
    priceRange: asString(opportunity.priceRange),
    opportunityScore: asNumber(opportunity.opportunityScore),
    difficulty: asString(opportunity.difficulty),
    verdict: asString(opportunity.verdict),
    whyNow: asString(opportunity.whyNow),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapExampleRow(row: Tables<'examples'>): SavedExample {
  const payload = parseSavedExampleContent(row.content);
  const analysis = payload?.analysis ?? null;
  const title = analysis?.ideaTitle
    ? `${analysis.ideaTitle} analysis`
    : payload?.sourceIdea?.title
      ? `${payload.sourceIdea.title} analysis`
      : 'Saved market analysis';

  return {
    id: row.id,
    title,
    ideaTitle: analysis?.ideaTitle || payload?.sourceIdea?.title || title,
    type: row.type,
    summary: analysis?.recommendation || row.content.slice(0, 160),
    createdAt: row.created_at,
    analysis,
  };
}

function mapProductRow(row: Tables<'products'>): SavedProduct {
  const product = parseProductContent(row.content);
  const positioning = product?.positioning;

  return {
    id: row.id,
    title: positioning?.title || 'Saved product architecture',
    subtitle: positioning?.subtitle || '',
    buyer: positioning?.targetBuyer || '',
    price: positioning?.recommendedPrice || '',
    category: positioning?.category || '',
    createdAt: row.created_at,
    product,
  };
}

function mapSalesAssetRow(row: Tables<'sales_assets'>): SavedSalesAsset {
  const payload = parseSalesAssetPayload(row.content);
  const assets = extractCreatorAssets(row.content);

  return {
    id: row.id,
    productId: payload?.productId ?? null,
    title: assets?.productContent.title || 'Saved sales kit',
    headline: assets?.salesKit.headline || '',
    subheadline: assets?.salesKit.subheadline || '',
    assetType: row.asset_type,
    createdAt: row.created_at,
    assets,
  };
}

function parseSavedExampleContent(content: string): SavedExamplePayload | null {
  try {
    const parsed = JSON.parse(content) as unknown;
    return isRecord(parsed) ? (parsed as SavedExamplePayload) : null;
  } catch {
    return null;
  }
}

function parseSalesAssetPayload(content: Json): SavedSalesAssetPayload | null {
  return isRecord(content) ? (content as SavedSalesAssetPayload) : null;
}

function parseProductContent(
  content: Json
): StrategistProductOutlineOutput | null {
  return isRecord(content) && isRecord(content.positioning)
    ? (content as unknown as StrategistProductOutlineOutput)
    : null;
}

function extractCreatorAssets(content: Json): CreatorAssetsOutput | null {
  if (!isRecord(content)) {
    return null;
  }

  if (isRecord(content.assets)) {
    return content.assets as unknown as CreatorAssetsOutput;
  }

  if (isRecord(content.salesKit)) {
    return content as unknown as CreatorAssetsOutput;
  }

  return null;
}

function getOpportunityFromMetadata(
  metadata: Json
): Partial<ScoutOpportunity> {
  if (!isRecord(metadata)) {
    return {};
  }

  const candidate = isRecord(metadata.opportunity)
    ? metadata.opportunity
    : metadata;

  return candidate as Partial<ScoutOpportunity>;
}

function parseSourceKey(
  sourceKey: string
): { kind: 'idea' | 'example'; id: string } | null {
  const [kind, id] = sourceKey.split(':');

  if ((kind === 'idea' || kind === 'example') && id) {
    return { kind, id };
  }

  return null;
}

function parseLines(value: string | undefined) {
  return (value ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function revalidateWorkflowPaths() {
  WORKFLOW_PATHS.forEach((path) => revalidatePath(path));
}

export async function attachApprovedDesignerAssetToSession(
  session: BuildSession,
  assetType: DesignerAssetType,
  pointer: SessionPrimaryDesignerAsset
): Promise<BuildSession> {
  return {
    ...session,
    designer_assets: {
      ...(session.designer_assets ?? {}),
      [assetType]: pointer,
    },
    updated_at: new Date().toISOString(),
  };
}

function researchNotesFromAcquisition(acquisition: MarketAcquisitionResult) {
  if (acquisition.sources.length === 0) {
    return acquisition.error
      ? `No live research sources were acquired. Acquisition error: ${acquisition.error}`
      : 'No live research sources were acquired.';
  }

  const sourceNotes = acquisition.sources.slice(0, 8).map((source, index) =>
    [
      `${index + 1}. ${source.title}`,
      `URL: ${source.canonicalUrl}`,
      `Provider: ${source.provider}`,
      `Score: ${source.score}`,
      `Excerpt: ${source.snippet || source.content.slice(0, 500)}`,
    ].join('\n')
  );

  return [
    `Live market research scan: ${acquisition.query}`,
    `Provider used: ${acquisition.provider}`,
    ...sourceNotes,
  ].join('\n\n');
}

function researchContext(
  acquisition: MarketAcquisitionResult
): ScoutResearchContext {
  return {
    scanId: acquisition.scanId,
    provider: acquisition.provider,
    status: acquisition.status,
    sources: acquisition.sources.slice(0, 8).map((source) => ({
      title: source.title,
      url: source.canonicalUrl,
      provider: source.provider,
      score: source.score,
      snippet: source.snippet || source.content.slice(0, 240),
    })),
    ...(acquisition.error ? { error: acquisition.error } : {}),
  };
}

function aiNotice(output: { source: string; fallbackReason?: string }) {
  if (output.source !== 'mock') {
    return null;
  }

  return output.fallbackReason
    ? `AI mock fallback used: ${output.fallbackReason}`
    : 'AI mock fallback used.';
}

function combineNotices(...notices: Array<string | null>) {
  const activeNotices = notices.filter(
    (notice): notice is string => Boolean(notice)
  );

  return activeNotices.length > 0 ? activeNotices.join(' ') : null;
}

function ok<T>(data: T, notice: string | null = null): WorkflowActionResult<T> {
  return { data, error: null, notice };
}

function fail<T>(error: string): WorkflowActionResult<T> {
  return { data: null, error, notice: null };
}

function messageFrom(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function toJson(value: unknown): Json {
  return value as Json;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}
