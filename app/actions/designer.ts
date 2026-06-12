'use server';

import { revalidatePath } from 'next/cache';
import type {
  DesignerAsset,
  DesignerAssetStatus,
  DesignerAssetVariant,
  DesignerGenerationContext,
  SessionDesignerAssetState,
  SessionPrimaryDesignerAsset,
} from '@/lib/designer-assets';
import { createClient } from '@/lib/supabase/server';
import type { Json, Tables } from '@/lib/supabase/types';
import { buildDesignerPrompt } from '@/lib/ai/designer-prompts';
import {
  classifyImageGenerationError,
  canGenerateImagesInRuntime,
  generateDesignerImages,
  getDesignerRuntimeDebugStatus,
  getDesignerModel,
  recordImageAssetJobStatus,
  recordImageStorageWriteStatus,
  sanitizeProviderError,
} from '@/lib/ai/designer-runtime';
import {
  reviewDesignerVariants,
  type ReviewerSelectionResult,
} from '@/lib/ai/reviewer-images';
import {
  buildDesignerStoragePath,
  bucketForDesignerAssetType,
  type PendingDesignerUpload,
  resolveDesignerAssetUrl,
  uploadPendingDesignerUpload,
} from '@/lib/supabase/storage';

export interface DesignerActionResult {
  asset: DesignerAsset;
  variants: DesignerAssetVariant[];
  pendingUploads: PendingDesignerUpload[];
  warnings: string[];
  error: string | null;
}

export interface ReviewedDesignerActionResult extends DesignerActionResult {
  review: ReviewerSelectionResult;
}

interface PersistedDesignerAssetPayload {
  asset: DesignerAsset;
  variants: DesignerAssetVariant[];
  review?: ReviewerSelectionResult | null;
  savedAt: string;
  updatedAt: string;
}

export interface PersistedDesignerAssetResult {
  rowId: string;
  asset: DesignerAsset;
  variants: DesignerAssetVariant[];
  review: ReviewerSelectionResult | null;
  primarySessionPointer: SessionPrimaryDesignerAsset | null;
}

export interface ReadyDesignerAssetPointersResult {
  sessionId: string;
  assets: Partial<Record<DesignerGenerationContext['assetType'], SessionPrimaryDesignerAsset>>;
}

export interface DesignerSessionAssetStatesResult {
  sessionId: string;
  assetStates: Partial<Record<DesignerGenerationContext['assetType'], SessionDesignerAssetState>>;
  readyAssets: Partial<
    Record<DesignerGenerationContext['assetType'], SessionPrimaryDesignerAsset>
  >;
  queuedAssetCount: number;
  failedAssetCount: number;
  completedAssetCount: number;
  imageGenerationMode: 'codex-assisted' | 'runtime-provider';
  canGenerateInRuntime: boolean;
  codexAssistedQueueEnabled: boolean;
}

export interface DesignerWorkflowActionResult {
  rowId: string | null;
  asset: DesignerAsset;
  variants: DesignerAssetVariant[];
  review: ReviewerSelectionResult | null;
  primarySessionPointer: SessionPrimaryDesignerAsset | null;
  error: string | null;
  userMessage: string | null;
  stage:
    | 'generation'
    | 'queued_for_codex'
    | 'upload'
    | 'metadata_persistence'
    | 'reviewer_scoring'
    | 'reviewer_persistence'
    | 'complete';
}

export async function generateDesignerAssetSet(
  input: DesignerGenerationContext
): Promise<DesignerActionResult> {
  const context = normalizeDesignerContext(input);
  const validationError = validateDesignerContext(context);
  if (validationError) {
    return failedAssetResult(context, validationError);
  }

  const projectIdResult = await resolveDesignerProjectId(context.projectId);
  if (!projectIdResult.ok) {
    return failedAssetResult(context, projectIdResult.error);
  }

  const resolvedProjectId = projectIdResult.projectId;
  const variantCount =
    context.variantCount ??
    designerVariantCountForAssetType();
  const now = new Date().toISOString();
  const assetId = createDesignerId('asset');
  const asset: DesignerAsset = {
    id: assetId,
    projectId: resolvedProjectId,
    sessionId: context.sessionId,
    type: context.assetType,
    status: 'generating',
    promptVersion: 'v1',
    sourceModel: getDesignerModel(context.mode ?? 'production'),
    primaryVariantId: null,
    variantCount,
    createdAt: now,
    updatedAt: now,
  };

  try {
    const prompt = buildDesignerPrompt({ ...context, variantCount });
    const generated = await generateDesignerImages({
      context: { ...context, variantCount },
      prompt,
    });

    const variants = generated.generatedImages.map((image, index) => {
      const variantId = createDesignerId(`variant_${index + 1}`);
      return {
        id: variantId,
        assetId,
        storageBucket: bucketForDesignerAssetType(context.assetType),
        storagePath: buildDesignerStoragePath({
          projectId: resolvedProjectId,
          sessionId: context.sessionId,
          assetType: context.assetType,
          assetId,
          variantId,
        }),
        publicUrl: null,
        mimeType: image.mimeType,
        width: null,
        height: null,
        reviewerScore: null,
        reviewerNotes: null,
        scoreBreakdown: {
          brandFit: null,
          clarity: null,
          premiumFeel: null,
          textSafety: null,
          composition: null,
          productRelevance: null,
        },
        isPrimary: false,
        createdAt: now,
      } satisfies DesignerAssetVariant;
    });

    const pendingUploads = generated.generatedImages.map((image, index) => ({
      bucket: variants[index].storageBucket,
      storagePath: variants[index].storagePath,
      contentType: image.mimeType,
      bytes: image.bytes,
    }));

    const status: DesignerAssetStatus = variants.length > 0 ? 'needs_review' : 'failed';

    return {
      asset: {
        ...asset,
        status,
        updatedAt: new Date().toISOString(),
        ...(status === 'failed'
          ? { errorMessage: 'Designer did not return any usable image variants.' }
          : {}),
        sourceModel: generated.model,
      },
      variants,
      pendingUploads,
      warnings: generated.warnings,
      error:
        status === 'failed'
          ? 'Designer did not return any usable image variants.'
          : null,
    };
  } catch (error) {
    return {
      asset: {
        ...asset,
        status: 'failed',
        updatedAt: new Date().toISOString(),
        errorMessage:
          sanitizeProviderError(error),
      },
      variants: [],
      pendingUploads: [],
      warnings: [],
      error:
        sanitizeProviderError(error),
    };
  }
}

export async function reviewDesignerAssetSet(input: {
  asset: DesignerAsset;
  variants: DesignerAssetVariant[];
  contextSummary: string;
}): Promise<ReviewedDesignerActionResult> {
  const review = await reviewDesignerVariants(input);
  const variants = applyReviewerSelectionToVariants(input.variants, review);

  return {
    asset: {
      ...input.asset,
      primaryVariantId: review.primaryVariantId,
      status: review.status,
      updatedAt: new Date().toISOString(),
      ...(review.status === 'failed'
        ? { errorMessage: 'Reviewer could not approve any image variant.' }
        : {}),
    },
    variants,
    pendingUploads: [],
    warnings: [],
    error:
      review.status === 'failed'
        ? 'Reviewer could not approve any image variant.'
        : null,
    review,
  };
}

export async function persistDesignerAssetResult(input: {
  asset: DesignerAsset;
  variants: DesignerAssetVariant[];
  pendingUploads: PendingDesignerUpload[];
  review?: ReviewerSelectionResult | null;
}): Promise<PersistedDesignerAssetResult> {
  const supabase = await createClient();
  const variants = await uploadDesignerVariants(supabase, {
    asset: input.asset,
    variants: input.variants,
    pendingUploads: input.pendingUploads,
  });

  const saved = await persistDesignerAssetMetadata(supabase, {
    asset: input.asset,
    variants,
    review: input.review ?? null,
  });

  return {
    rowId: saved.rowId,
    asset: saved.asset,
    variants: saved.variants,
    review: saved.review,
    primarySessionPointer: saved.primarySessionPointer,
  };
}

export async function generateDesignerWorkflowAsset(input: {
  context: DesignerGenerationContext;
  contextSummary: string;
}): Promise<DesignerWorkflowActionResult> {
  const userMessage = 'Designer could not generate visuals. Try again.';
  const runtimeDebug = getDesignerRuntimeDebugStatus(input.context.mode ?? 'production');
  logDesignerStage('info', input.context.assetType, 'workflow:received', {
    sessionId: input.context.sessionId,
    imageGenerationMode: runtimeDebug.imageGenerationMode,
    canGenerateInRuntime: runtimeDebug.canGenerateInRuntime,
    codexAssistedQueueEnabled: runtimeDebug.codexAssistedQueueEnabled,
  });
  if (runtimeDebug.imageGenerationMode === 'codex-assisted') {
    return queueDesignerWorkflowAsset(input.context);
  }

  if (!canGenerateImagesInRuntime()) {
    const context = normalizeDesignerContext(input.context);
    const now = new Date().toISOString();
    const runtimeConnectionMessage = getRuntimeProviderConnectionMessage(runtimeDebug);
    recordImageAssetJobStatus('failed');
    logDesignerStage('warn', input.context.assetType, 'runtime_provider:not_connected', {
      sessionId: context.sessionId,
      imageProvider: runtimeDebug.imageGenerationProvider,
      imageModel: runtimeDebug.selectedImageModel,
      hasOpenAiApiKey: runtimeDebug.hasOpenAiApiKey,
      canGenerateInRuntime: runtimeDebug.canGenerateInRuntime,
    });
    return {
      rowId: null,
      asset: {
        id: createDesignerId('asset'),
        projectId: context.projectId,
        sessionId: context.sessionId,
        type: context.assetType,
        status: 'failed',
        promptVersion: 'v1',
        sourceModel: getDesignerModel(context.mode ?? 'production'),
        primaryVariantId: null,
        variantCount: 0,
        createdAt: now,
        updatedAt: now,
        errorMessage: runtimeConnectionMessage,
      },
      variants: [],
      review: null,
      primarySessionPointer: null,
      error: runtimeConnectionMessage,
      userMessage: runtimeConnectionMessage,
      stage: 'generation',
    };
  }

  logDesignerStage('info', input.context.assetType, 'generation:start', {
    sessionId: input.context.sessionId,
    hasGoogleServiceAccountKey: runtimeDebug.hasGoogleServiceAccountKey,
    vertexCredentialSource: runtimeDebug.vertexCredentialSource,
    selectedImageModel: runtimeDebug.selectedImageModel,
    imageGenerationProvider: runtimeDebug.imageGenerationProvider,
  });

  recordImageAssetJobStatus('generating');
  const generated = await generateDesignerAssetSet(input.context);
  if (generated.error || generated.asset.status === 'failed' || generated.variants.length === 0) {
    logDesignerStage('warn', input.context.assetType, 'generation:failed', {
      message: generated.error ?? generated.asset.errorMessage ?? 'Unknown generation failure',
      hasGoogleServiceAccountKey: runtimeDebug.hasGoogleServiceAccountKey,
      vertexCredentialSource: runtimeDebug.vertexCredentialSource,
      selectedImageModel: runtimeDebug.selectedImageModel,
      imageGenerationProvider: runtimeDebug.imageGenerationProvider,
      imageGenerationErrorType: classifyImageGenerationError(
        generated.error ?? generated.asset.errorMessage ?? userMessage
      ),
    });
    return {
      rowId: null,
      asset: generated.asset,
      variants: generated.variants,
      review: null,
      primarySessionPointer: null,
      error: generated.error ?? generated.asset.errorMessage ?? userMessage,
      userMessage,
      stage: 'generation',
    };
  }

  const supabase = await createClient();
  let uploadedVariants: DesignerAssetVariant[];
  try {
    logDesignerStage('info', input.context.assetType, 'upload:start');
    recordImageStorageWriteStatus('not_attempted');
    uploadedVariants = await uploadDesignerVariants(supabase, {
      asset: generated.asset,
      variants: generated.variants,
      pendingUploads: generated.pendingUploads,
    });
  } catch (error) {
    recordImageStorageWriteStatus('failed');
    const message = sanitizeDesignerError(
      error,
      'Designer asset upload failed.'
    );
    logDesignerStage('error', input.context.assetType, 'upload:failed', {
      message,
      status: 'failed',
      storageUploadAttempted: true,
      storageUploadSucceeded: false,
    });
    return {
      rowId: null,
      asset: {
        ...generated.asset,
        status: 'failed',
        updatedAt: new Date().toISOString(),
        errorMessage: message,
      },
      variants: generated.variants,
      review: null,
      primarySessionPointer: null,
      error: message,
      userMessage,
      stage: 'upload',
    };
  }

  let persisted: PersistedDesignerAssetResult;
  try {
    logDesignerStage('info', input.context.assetType, 'metadata_persistence:start', {
      status: generated.asset.status,
    });
    persisted = await persistDesignerAssetMetadata(supabase, {
      asset: generated.asset,
      variants: uploadedVariants,
      review: null,
    });
  } catch (error) {
    const message = sanitizeDesignerError(
      error,
      'Designer asset metadata persistence failed.'
    );
    logDesignerStage('error', input.context.assetType, 'metadata_persistence:failed', {
      message,
      status: 'failed',
    });
    return {
      rowId: null,
      asset: {
        ...generated.asset,
        status: 'failed',
        updatedAt: new Date().toISOString(),
        errorMessage: message,
      },
      variants: uploadedVariants,
      review: null,
      primarySessionPointer: null,
      error: message,
      userMessage,
      stage: 'metadata_persistence',
    };
  }

  let reviewed: ReviewedDesignerActionResult;
  try {
    logDesignerStage('info', input.context.assetType, 'reviewer:queued', {
      rowId: persisted.rowId,
      status: persisted.asset.status,
    });
    logDesignerStage('info', input.context.assetType, 'reviewer_scoring:start', {
      rowId: persisted.rowId,
      status: persisted.asset.status,
    });
    reviewed = await reviewDesignerAssetSet({
      asset: persisted.asset,
      variants: persisted.variants,
      contextSummary: input.contextSummary,
    });
  } catch (error) {
    const message = sanitizeDesignerError(error, 'Designer reviewer failed.');
    logDesignerStage('error', input.context.assetType, 'reviewer_scoring:failed', {
      rowId: persisted.rowId,
      message,
      status: persisted.asset.status,
    });
    return persistDesignerWorkflowReviewFallback({
      supabase,
      rowId: persisted.rowId,
      asset: persisted.asset,
      variants: persisted.variants,
      userMessage,
      message,
    });
  }

  const readyReviewed = markReviewedDesignerAssetReady(reviewed);
  try {
    logDesignerStage('info', input.context.assetType, 'reviewer_persistence:start', {
      rowId: persisted.rowId,
      status: readyReviewed.asset.status,
    });
    const saved = await saveReviewedDesignerAssetResultWithClient(supabase, {
      rowId: persisted.rowId,
      asset: readyReviewed.asset,
      variants: readyReviewed.variants,
      review: readyReviewed.review,
    });

    if (saved.asset.status === 'failed') {
      logDesignerStage('warn', input.context.assetType, 'reviewer_persistence:rejected', {
        rowId: saved.rowId,
        message:
          saved.asset.errorMessage ?? 'Reviewer could not approve any image variant.',
        status: saved.asset.status,
      });
      return {
        rowId: saved.rowId,
        asset: saved.asset,
        variants: saved.variants,
        review: saved.review,
        primarySessionPointer: saved.primarySessionPointer,
        error:
          saved.asset.errorMessage ??
          readyReviewed.error ??
          'Reviewer could not approve any image variant.',
        userMessage,
        stage: 'reviewer_persistence',
      };
    }

    logDesignerStage('info', input.context.assetType, 'complete', {
      rowId: saved.rowId,
      status: saved.asset.status,
    });
    recordImageAssetJobStatus('ready');
    return {
      rowId: saved.rowId,
      asset: saved.asset,
      variants: saved.variants,
      review: saved.review,
      primarySessionPointer: saved.primarySessionPointer,
      error: null,
      userMessage: null,
      stage: 'complete',
    };
  } catch (error) {
    const message = sanitizeDesignerError(
      error,
      'Designer reviewer persistence failed.'
    );
    logDesignerStage('error', input.context.assetType, 'reviewer_persistence:failed', {
      rowId: persisted.rowId,
      message,
      status: readyReviewed.asset.status,
    });
    return persistDesignerWorkflowFailure({
      supabase,
      rowId: persisted.rowId,
      asset: readyReviewed.asset,
      variants: readyReviewed.variants,
      message,
      stage: 'reviewer_persistence',
      review: readyReviewed.review,
      userMessage,
    });
  }
}

async function queueDesignerWorkflowAsset(
  input: DesignerGenerationContext
): Promise<DesignerWorkflowActionResult> {
  const context = normalizeDesignerContext(input);
  const validationError = validateDesignerContext(context);
  if (validationError) {
    const failed = failedAssetResult(context, validationError);
    recordImageAssetJobStatus('failed');
    return {
      rowId: null,
      asset: failed.asset,
      variants: [],
      review: null,
      primarySessionPointer: null,
      error: validationError,
      userMessage: validationError,
      stage: 'generation',
    };
  }

  const projectIdResult = await resolveDesignerProjectId(context.projectId);
  if (!projectIdResult.ok) {
    const failed = failedAssetResult(context, projectIdResult.error);
    recordImageAssetJobStatus('failed');
    return {
      rowId: null,
      asset: failed.asset,
      variants: [],
      review: null,
      primarySessionPointer: null,
      error: projectIdResult.error,
      userMessage: projectIdResult.error,
      stage: 'generation',
    };
  }

  const now = new Date().toISOString();
  const asset: DesignerAsset = {
    id: createDesignerId('asset'),
    projectId: projectIdResult.projectId,
    sessionId: context.sessionId,
    type: context.assetType,
    status: 'queued_for_codex',
    promptVersion: 'v1',
    sourceModel: 'codex-assisted',
    primaryVariantId: null,
    variantCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  const supabase = await createClient();
  let saved: PersistedDesignerAssetResult;
  try {
    saved = await persistDesignerAssetMetadata(supabase, {
      asset,
      variants: [],
      review: null,
    });
  } catch (error) {
    const message = sanitizeDesignerError(
      error,
      'Designer could not queue this Codex visual request.'
    );
    recordImageAssetJobStatus('failed');
    logDesignerStage('error', context.assetType, 'codex_queue:failed', {
      sessionId: context.sessionId,
      message,
    });
    return {
      rowId: null,
      asset: {
        ...asset,
        status: 'failed',
        updatedAt: new Date().toISOString(),
        errorMessage: message,
      },
      variants: [],
      review: null,
      primarySessionPointer: null,
      error: message,
      userMessage: message,
      stage: 'generation',
    };
  }

  recordImageAssetJobStatus('queued_for_codex');
  logDesignerStage('info', context.assetType, 'codex_queue:created', {
    rowId: saved.rowId,
    sessionId: context.sessionId,
    imageGenerationMode: 'codex-assisted',
  });

  return {
    rowId: saved.rowId,
    asset: saved.asset,
    variants: [],
    review: null,
    primarySessionPointer: null,
    error: null,
    userMessage: 'Visual request queued. Generate with Codex, then approve assets.',
    stage: 'queued_for_codex',
  };
}

export async function saveReviewedDesignerAssetResult(input: {
  rowId: string;
  asset: DesignerAsset;
  variants: DesignerAssetVariant[];
  review: ReviewerSelectionResult;
}): Promise<PersistedDesignerAssetResult> {
  const supabase = await createClient();
  return saveReviewedDesignerAssetResultWithClient(supabase, input);
}

async function saveReviewedDesignerAssetResultWithClient(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: {
    rowId: string;
    asset: DesignerAsset;
    variants: DesignerAssetVariant[];
    review: ReviewerSelectionResult;
  }
): Promise<PersistedDesignerAssetResult> {
  const row = await updateDesignerAssetRecord(supabase, input.rowId, {
    asset: input.asset,
    variants: input.variants,
    review: input.review,
  });

  revalidateDesignerPaths();

  return {
    rowId: row.id,
    asset: input.asset,
    variants: input.variants,
    review: input.review,
    primarySessionPointer: await buildApprovedSessionPointer(
      supabase,
      input.asset,
      input.variants
    ),
  };
}

export async function founderApproveDesignerAsset(input: {
  rowId: string;
  action: 'approve' | 'reject';
  reason?: string;
}): Promise<PersistedDesignerAssetResult> {
  const supabase = await createClient();
  const row = await getDesignerAssetRecord(supabase, input.rowId);
  const payload = parseDesignerAssetPayload(row.content);

  if (!payload) {
    throw new Error('Designer asset payload is missing or unreadable.');
  }

  if (payload.asset.status !== 'awaiting_approval') {
    throw new Error('Only awaiting_approval assets can be approved or rejected.');
  }

  const nextAsset: DesignerAsset =
    input.action === 'approve'
      ? {
          ...payload.asset,
          status: 'ready',
          updatedAt: new Date().toISOString(),
          errorMessage: null,
        }
      : {
          ...payload.asset,
          status: 'failed',
          updatedAt: new Date().toISOString(),
          errorMessage: input.reason?.trim() || 'Founder rejected the asset.',
        };

  const nextVariants = payload.variants.map((variant) => ({
    ...variant,
    isPrimary:
      input.action === 'approve' && payload.asset.primaryVariantId === variant.id,
  }));

  const updated = await updateDesignerAssetRecord(supabase, input.rowId, {
    asset: nextAsset,
    variants: nextVariants,
    review: payload.review ?? null,
  });

  revalidateDesignerPaths();

  return {
    rowId: updated.id,
    asset: nextAsset,
    variants: nextVariants,
    review: payload.review ?? null,
    primarySessionPointer: await buildApprovedSessionPointer(
      supabase,
      nextAsset,
      nextVariants
    ),
  };
}

export async function getPersistedDesignerAsset(
  rowId: string
): Promise<PersistedDesignerAssetResult> {
  const supabase = await createClient();
  const row = await getDesignerAssetRecord(supabase, rowId);
  const payload = parseDesignerAssetPayload(row.content);

  if (!payload) {
    throw new Error('Designer asset payload is missing or unreadable.');
  }

  return {
    rowId: row.id,
    asset: payload.asset,
    variants: payload.variants,
    review: payload.review ?? null,
    primarySessionPointer: await buildApprovedSessionPointer(
      supabase,
      payload.asset,
      payload.variants
    ),
  };
}

export async function loadReadyDesignerAssetPointers(input: {
  sessionId: string;
  projectId?: string | null;
  assetTypes?: DesignerGenerationContext['assetType'][];
  fallbackToProjectLatest?: boolean;
}): Promise<ReadyDesignerAssetPointersResult> {
  if (!input.sessionId.trim()) {
    return { sessionId: input.sessionId, assets: {} };
  }

  const projectIdResult = await resolveDesignerProjectId(input.projectId);
  if (!projectIdResult.ok) {
    throw new Error(projectIdResult.error);
  }

  const supabase = await createClient();
  const assetTypes = input.assetTypes?.length
    ? input.assetTypes
    : (['cover', 'mockup'] as const);
  const { data, error } = await supabase
    .from('sales_assets')
    .select('*')
    .eq('project_id', projectIdResult.projectId)
    .in(
      'asset_type',
      assetTypes.map((type) => designerAssetTypeValue(type))
    )
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) {
    throw new Error(error.message);
  }

  const assets: Partial<Record<DesignerGenerationContext['assetType'], SessionPrimaryDesignerAsset>> = {};

  const readyRows =
    (data ?? [])
      .map((row) => ({
        row,
        payload: parseDesignerAssetPayload(row.content),
      }))
      .filter(
        (
          item
        ): item is {
          row: Tables<'sales_assets'>;
          payload: PersistedDesignerAssetPayload;
        } => Boolean(item.payload?.asset && item.payload.asset.status === 'ready')
      ) ?? [];

  for (const item of readyRows) {
    if (item.payload.asset.sessionId !== input.sessionId) continue;
    if (assets[item.payload.asset.type]) continue;

    const pointer = await buildApprovedSessionPointer(
      supabase,
      item.payload.asset,
      item.payload.variants
    );

    if (pointer) {
      assets[item.payload.asset.type] = pointer;
    }
  }

  if (input.fallbackToProjectLatest !== false) {
    for (const item of readyRows) {
      if (assets[item.payload.asset.type]) continue;

      const pointer = await buildApprovedSessionPointer(
        supabase,
        item.payload.asset,
        item.payload.variants
      );

      if (pointer) {
        assets[item.payload.asset.type] = pointer;
      }
    }
  }

  return {
    sessionId: input.sessionId,
    assets,
  };
}

export async function loadDesignerSessionAssetStates(input: {
  sessionId: string;
  projectId?: string | null;
  assetTypes?: DesignerGenerationContext['assetType'][];
}): Promise<DesignerSessionAssetStatesResult> {
  if (!input.sessionId.trim()) {
    return {
      sessionId: input.sessionId,
      assetStates: {},
      readyAssets: {},
      queuedAssetCount: 0,
      failedAssetCount: 0,
      completedAssetCount: 0,
      imageGenerationMode: getDesignerRuntimeDebugStatus('production').imageGenerationMode,
      canGenerateInRuntime: getDesignerRuntimeDebugStatus('production').canGenerateInRuntime,
      codexAssistedQueueEnabled:
        getDesignerRuntimeDebugStatus('production').codexAssistedQueueEnabled,
    };
  }

  const projectIdResult = await resolveDesignerProjectId(input.projectId);
  if (!projectIdResult.ok) {
    throw new Error(projectIdResult.error);
  }

  const supabase = await createClient();
  const assetTypes: DesignerGenerationContext['assetType'][] = input.assetTypes?.length
    ? [...input.assetTypes]
    : ['cover', 'mockup', 'sales_graphic', 'social_preview'];
  const { data, error } = await supabase
    .from('sales_assets')
    .select('*')
    .eq('project_id', projectIdResult.projectId)
    .in(
      'asset_type',
      assetTypes.map((type) => designerAssetTypeValue(type))
    )
    .order('updated_at', { ascending: false })
    .limit(100);

  if (error) {
    throw new Error(error.message);
  }

  const rows =
    (data ?? [])
      .map((row) => ({
        row,
        payload: parseDesignerAssetPayload(row.content),
      }))
      .filter(
        (
          item
        ): item is {
          row: Tables<'sales_assets'>;
          payload: PersistedDesignerAssetPayload;
        } => {
          if (!item.payload?.asset) {
            return false;
          }

          return (
            item.payload.asset.sessionId === input.sessionId &&
            assetTypes.includes(item.payload.asset.type)
          );
        }
      ) ?? [];

  const latestByAssetType = new Map<
    DesignerGenerationContext['assetType'],
    {
      row: Tables<'sales_assets'>;
      payload: PersistedDesignerAssetPayload;
    }
  >();

  for (const item of rows) {
    if (!latestByAssetType.has(item.payload.asset.type)) {
      latestByAssetType.set(item.payload.asset.type, item);
    }
  }

  const assetStates: Partial<
    Record<DesignerGenerationContext['assetType'], SessionDesignerAssetState>
  > = {};
  const readyAssets: Partial<
    Record<DesignerGenerationContext['assetType'], SessionPrimaryDesignerAsset>
  > = {};
  const runtimeDebug = getDesignerRuntimeDebugStatus('production');

  let queuedAssetCount = 0;
  let failedAssetCount = 0;
  let completedAssetCount = 0;

  for (const assetType of assetTypes) {
    const item = latestByAssetType.get(assetType);
    if (!item) continue;

    const state = buildSessionDesignerAssetStateFromPersisted(
      item.row.id,
      item.payload.asset,
      item.payload.variants
    );
    assetStates[assetType] = state;

    if (state.status === 'queued_for_codex') queuedAssetCount += 1;
    if (state.status === 'failed') failedAssetCount += 1;
    if (state.status === 'ready') completedAssetCount += 1;

    const pointer = await buildApprovedSessionPointer(
      supabase,
      item.payload.asset,
      item.payload.variants
    );
    if (pointer) {
      readyAssets[assetType] = pointer;
    }
  }

  return {
    sessionId: input.sessionId,
    assetStates,
    readyAssets,
    queuedAssetCount,
    failedAssetCount,
    completedAssetCount,
    imageGenerationMode: runtimeDebug.imageGenerationMode,
    canGenerateInRuntime: runtimeDebug.canGenerateInRuntime,
    codexAssistedQueueEnabled: runtimeDebug.codexAssistedQueueEnabled,
  };
}

function validateDesignerContext(input: DesignerGenerationContext) {
  const required = [
    input.sessionId,
    input.productTitle,
    input.targetBuyer,
    input.problemSummary,
    input.brandDirection,
  ];

  if (required.some((value) => !value?.trim())) {
    return 'Designer requires full product, buyer, and brand context before generation.';
  }

  return null;
}

function normalizeDesignerContext(
  input: DesignerGenerationContext
): DesignerGenerationContext {
  const productTitle = input.productTitle.trim();
  const targetBuyer = input.targetBuyer.trim() || 'digital product buyers';
  const problemSummary =
    input.problemSummary.trim() ||
    input.corePromise.trim() ||
    `A clear result for ${targetBuyer}.`;
  const corePromise =
    input.corePromise.trim() ||
    problemSummary ||
    `Help ${targetBuyer} get a clear result.`;

  return {
    ...input,
    projectId: input.projectId.trim(),
    sessionId: input.sessionId.trim(),
    productTitle,
    productSubtitle:
      input.productSubtitle.trim() ||
      `${productTitle} for ${targetBuyer}`,
    targetBuyer,
    corePromise,
    problemSummary,
    differentiator:
      input.differentiator.trim() ||
      'Practical, premium, and easy to trust.',
    pricing: input.pricing.trim() || 'Premium digital product',
    brandDirection:
      input.brandDirection.trim() ||
      'Clean, premium, product-led visual direction.',
    referenceStyleNotes: input.referenceStyleNotes?.trim() || undefined,
    formatConstraints: input.formatConstraints?.trim() || undefined,
    sourceContext: input.sourceContext
      ? {
          strategySummary: input.sourceContext.strategySummary?.trim() || undefined,
          creatorSummary: input.sourceContext.creatorSummary?.trim() || undefined,
          salesSummary: input.sourceContext.salesSummary?.trim() || undefined,
        }
      : undefined,
  };
}

async function resolveDesignerProjectId(projectId?: string | null) {
  try {
    const supabase = await createClient();
    const auth = await getDesignerAuthContext(supabase);

    if (!auth.ok) {
      return { ok: false as const, error: auth.error };
    }

    const trimmedProjectId = projectId?.trim();
    if (trimmedProjectId) {
      const ownsProject = await ensureOwnedDesignerProjectId(
        supabase,
        auth.userId,
        trimmedProjectId
      );

      if (!ownsProject.ok) {
        return { ok: false as const, error: ownsProject.error };
      }

      return { ok: true as const, projectId: trimmedProjectId };
    }

    const { data: existing, error: selectError } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', auth.userId)
      .in('status', ['active', 'draft'])
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (selectError) {
      return { ok: false as const, error: selectError.message };
    }

    if (existing?.id) {
      return { ok: true as const, projectId: existing.id };
    }

    const { data: created, error: insertError } = await supabase
      .from('projects')
      .insert({
        user_id: auth.userId,
        name: 'WIZUP Workspace',
        status: 'active',
      })
      .select('id')
      .single();

    if (insertError) {
      return { ok: false as const, error: insertError.message };
    }

    return { ok: true as const, projectId: created.id };
  } catch (error) {
    return {
      ok: false as const,
      error:
        error instanceof Error
          ? error.message
          : 'Designer could not resolve a workspace project.',
    };
  }
}

function failedAssetResult(
  input: DesignerGenerationContext,
  errorMessage: string
): DesignerActionResult {
  const now = new Date().toISOString();
  return {
    asset: {
      id: createDesignerId('asset'),
      projectId: input.projectId,
      sessionId: input.sessionId,
      type: input.assetType,
      status: 'failed',
      promptVersion: 'v1',
      sourceModel:
        getDesignerModel(input.mode ?? 'production'),
      primaryVariantId: null,
      variantCount:
        input.variantCount ??
        designerVariantCountForAssetType(),
      createdAt: now,
      updatedAt: now,
      errorMessage,
    },
    variants: [],
    pendingUploads: [],
    warnings: [],
    error: errorMessage,
  };
}

function designerVariantCountForAssetType() {
  return 1;
}

function createDesignerId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function designerAssetTypeValue(type: DesignerAsset['type']) {
  return `designer_${type}`;
}

async function upsertDesignerAssetRecord(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: {
    asset: DesignerAsset;
    variants: DesignerAssetVariant[];
    review: ReviewerSelectionResult | null;
  }
) {
  const auth = await getDesignerAuthContext(supabase);
  if (!auth.ok) {
    throw new Error(auth.error);
  }

  const ownership = await ensureOwnedDesignerProjectId(
    supabase,
    auth.userId,
    input.asset.projectId
  );
  if (!ownership.ok) {
    throw new Error(ownership.error);
  }

  const payload: PersistedDesignerAssetPayload = {
    asset: input.asset,
    variants: input.variants,
    review: input.review,
    savedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('sales_assets')
    .insert({
      project_id: input.asset.projectId,
      asset_type: designerAssetTypeValue(input.asset.type),
      content: payload as unknown as Json,
    })
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function updateDesignerAssetRecord(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rowId: string,
  input: {
    asset: DesignerAsset;
    variants: DesignerAssetVariant[];
  review: ReviewerSelectionResult | null;
  }
) {
  const existing = await getDesignerAssetRecord(supabase, rowId);
  if (existing.project_id !== input.asset.projectId) {
    throw new Error('Designer asset project mismatch.');
  }

  const payload: PersistedDesignerAssetPayload = {
    asset: input.asset,
    variants: input.variants,
    review: input.review,
    savedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('sales_assets')
    .update({
      asset_type: designerAssetTypeValue(input.asset.type),
      content: payload as unknown as Json,
      updated_at: new Date().toISOString(),
    })
    .eq('id', rowId)
    .eq('project_id', existing.project_id)
    .select('*')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function getDesignerAssetRecord(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rowId: string
): Promise<Tables<'sales_assets'>> {
  const auth = await getDesignerAuthContext(supabase);
  if (!auth.ok) {
    throw new Error(auth.error);
  }

  const { data, error } = await supabase
    .from('sales_assets')
    .select('*')
    .eq('id', rowId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error('Designer asset record could not be found.');
  }

  const ownership = await ensureOwnedDesignerProjectId(
    supabase,
    auth.userId,
    data.project_id
  );
  if (!ownership.ok) {
    throw new Error(ownership.error);
  }

  return data;
}

function parseDesignerAssetPayload(content: Json): PersistedDesignerAssetPayload | null {
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return null;
  }

  const candidate = content as Partial<PersistedDesignerAssetPayload>;
  if (!candidate.asset || !candidate.variants) {
    return null;
  }

  return candidate as PersistedDesignerAssetPayload;
}

async function buildApprovedSessionPointer(
  supabase: Awaited<ReturnType<typeof createClient>>,
  asset: DesignerAsset,
  variants: DesignerAssetVariant[]
): Promise<SessionPrimaryDesignerAsset | null> {
  if (asset.status !== 'ready' || !asset.primaryVariantId) {
    return null;
  }

  const variant = variants.find((item) => item.id === asset.primaryVariantId);
  if (!variant?.storageBucket || !variant.storagePath) {
    return null;
  }

  const resolvedUrl = await resolveDesignerAssetUrl(supabase, {
    bucket: variant.storageBucket as ReturnType<typeof bucketForDesignerAssetType>,
    storagePath: variant.storagePath,
    publicUrl: variant.publicUrl,
  });

  return {
    assetId: asset.id,
    variantId: variant.id,
    type: asset.type,
    status: 'ready',
    publicUrl: resolvedUrl,
    storageBucket: variant.storageBucket,
    storagePath: variant.storagePath,
  };
}

async function persistDesignerWorkflowFailure(input: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  rowId: string;
  asset: DesignerAsset;
  variants: DesignerAssetVariant[];
  message: string;
  stage: DesignerWorkflowActionResult['stage'];
  review?: ReviewerSelectionResult | null;
  userMessage: string;
}): Promise<DesignerWorkflowActionResult> {
  const failedAsset: DesignerAsset = {
    ...input.asset,
    status: 'failed',
    updatedAt: new Date().toISOString(),
    errorMessage: input.message,
  };

  try {
    const row = await updateDesignerAssetRecord(input.supabase, input.rowId, {
      asset: failedAsset,
      variants: input.variants,
      review: input.review ?? null,
    });

    return {
      rowId: row.id,
      asset: failedAsset,
      variants: input.variants,
      review: input.review ?? null,
      primarySessionPointer: null,
      error: input.message,
      userMessage: input.userMessage,
      stage: input.stage,
    };
  } catch {
    return {
      rowId: input.rowId,
      asset: failedAsset,
      variants: input.variants,
      review: input.review ?? null,
      primarySessionPointer: null,
      error: input.message,
      userMessage: input.userMessage,
      stage: input.stage,
    };
  }
}

async function persistDesignerWorkflowReviewFallback(input: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  rowId: string;
  asset: DesignerAsset;
  variants: DesignerAssetVariant[];
  message: string;
  userMessage: string;
}): Promise<DesignerWorkflowActionResult> {
  const fallbackReview = createFallbackReviewerSelection(input.variants);
  const safeReview = fallbackReview;
  const safeVariants = applyReviewerSelectionToVariants(input.variants, safeReview);
  const safeAsset: DesignerAsset = {
    ...input.asset,
    status: safeReview.primaryVariantId ? 'awaiting_approval' : 'needs_review',
    primaryVariantId: safeReview.primaryVariantId,
    updatedAt: new Date().toISOString(),
    errorMessage: null,
  };

  logDesignerStage('warn', input.asset.type, 'reviewer_scoring:fallback_applied', {
    rowId: input.rowId,
    status: safeAsset.status,
    message: input.message,
  });

  try {
    const saved = await saveReviewedDesignerAssetResultWithClient(input.supabase, {
      rowId: input.rowId,
      asset: safeAsset,
      variants: safeVariants,
      review: safeReview,
    });

    return {
      rowId: saved.rowId,
      asset: saved.asset,
      variants: saved.variants,
      review: saved.review,
      primarySessionPointer: saved.primarySessionPointer,
      error: input.message,
      userMessage: input.userMessage,
      stage: 'reviewer_scoring',
    };
  } catch (error) {
    logDesignerStage('error', input.asset.type, 'reviewer_scoring:fallback_persistence_failed', {
      rowId: input.rowId,
      status: safeAsset.status,
      message: sanitizeDesignerError(
        error,
        'Designer fallback reviewer persistence failed.'
      ),
    });
    return {
      rowId: input.rowId,
      asset: safeAsset,
      variants: safeVariants,
      review: safeReview,
      primarySessionPointer: null,
      error: input.message,
      userMessage: input.userMessage,
      stage: 'reviewer_scoring',
    };
  }
}

function revalidateDesignerPaths() {
  ['/app/build', '/app/publish', '/app/store', '/app/saved', '/storefront'].forEach((path) =>
    revalidatePath(path)
  );
}

function logDesignerStage(
  level: 'info' | 'warn' | 'error',
  assetType: DesignerGenerationContext['assetType'],
  stage: string,
  metadata: Record<string, string | number | boolean | null | undefined> = {}
) {
  const payload = Object.fromEntries(
    Object.entries(metadata).filter(([, value]) => value !== undefined)
  );
  const logger =
    level === 'error' ? console.error : level === 'warn' ? console.warn : console.info;
  logger('[designer]', {
    assetType,
    stage,
    ...payload,
  });
}

function applyReviewerSelectionToVariants(
  variants: DesignerAssetVariant[],
  review: ReviewerSelectionResult
) {
  return variants.map((variant) => {
    const result = review.reviews.find((item) => item.variantId === variant.id);
    return {
      ...variant,
      reviewerScore: result?.score ?? variant.reviewerScore,
      reviewerNotes: result?.notes ?? variant.reviewerNotes,
      scoreBreakdown: result?.scoreBreakdown ?? variant.scoreBreakdown,
      isPrimary: review.primaryVariantId === variant.id,
    };
  });
}

function markReviewedDesignerAssetReady(
  reviewed: ReviewedDesignerActionResult
): ReviewedDesignerActionResult {
  if (reviewed.asset.status === 'failed' || !reviewed.asset.primaryVariantId) {
    return reviewed;
  }

  return {
    ...reviewed,
    asset: {
      ...reviewed.asset,
      status: 'ready',
      errorMessage: null,
      updatedAt: new Date().toISOString(),
    },
    error: null,
  };
}

function buildSessionDesignerAssetStateFromPersisted(
  rowId: string,
  asset: DesignerAsset,
  variants: DesignerAssetVariant[]
): SessionDesignerAssetState {
  const primaryVariant =
    variants.find((variant) => variant.id === asset.primaryVariantId) ??
    variants.find((variant) => variant.isPrimary) ??
    variants[0] ??
    null;

  return {
    assetType: asset.type,
    status: mapDesignerAssetStatusToSessionState(asset.status),
    rowId,
    message: buildDesignerSessionAssetMessage(asset),
    reviewerScore: primaryVariant?.reviewerScore ?? null,
    storagePath: primaryVariant?.storagePath ?? null,
    publicUrl: primaryVariant?.publicUrl ?? null,
    updatedAt: asset.updatedAt,
  };
}

function mapDesignerAssetStatusToSessionState(
  status: DesignerAssetStatus
): SessionDesignerAssetState['status'] {
  switch (status) {
    case 'queued_for_codex':
      return 'queued_for_codex';
    case 'generating':
    case 'needs_review':
      return 'generating';
    case 'awaiting_approval':
      return 'awaiting_approval';
    case 'ready':
      return 'ready';
    case 'failed':
      return 'failed';
  }
}

function buildDesignerSessionAssetMessage(asset: DesignerAsset) {
  switch (asset.status) {
    case 'queued_for_codex':
      return 'Visual request queued. Generate with Codex, then approve assets.';
    case 'generating':
    case 'needs_review':
      return 'Designer is creating visuals...';
    case 'awaiting_approval':
      return 'Visuals waiting for approval.';
    case 'ready':
      return 'Founder approved this visual.';
    case 'failed':
      return asset.errorMessage?.trim() || 'Designer could not generate visuals. Try again.';
  }
}

async function uploadDesignerVariants(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: {
    asset: DesignerAsset;
    variants: DesignerAssetVariant[];
    pendingUploads: PendingDesignerUpload[];
  }
) {
  logDesignerStage('info', input.asset.type, 'upload:attempt', {
    storageUploadAttempted: true,
    storageUploadSucceeded: false,
    uploadCount: input.pendingUploads.length,
  });
  const uploaded = await Promise.all(
    input.pendingUploads.map((upload) => uploadPendingDesignerUpload(supabase, upload))
  );

  logDesignerStage('info', input.asset.type, 'upload:success', {
    storageUploadAttempted: true,
    storageUploadSucceeded: true,
    uploadCount: uploaded.length,
  });
  recordImageStorageWriteStatus('succeeded');

  return input.variants.map((variant) => {
    const match = uploaded.find(
      (upload) =>
        upload.bucket === variant.storageBucket &&
        upload.storagePath === variant.storagePath
    );

    return match
      ? {
          ...variant,
          publicUrl: match.publicUrl,
        }
      : variant;
  });
}

async function persistDesignerAssetMetadata(
  supabase: Awaited<ReturnType<typeof createClient>>,
  input: {
    asset: DesignerAsset;
    variants: DesignerAssetVariant[];
    review: ReviewerSelectionResult | null;
  }
): Promise<PersistedDesignerAssetResult> {
  const row = await upsertDesignerAssetRecord(supabase, input);

  revalidateDesignerPaths();

  return {
    rowId: row.id,
    asset: input.asset,
    variants: input.variants,
    review: input.review ?? null,
    primarySessionPointer: await buildApprovedSessionPointer(
      supabase,
      input.asset,
      input.variants
    ),
  };
}

function createFallbackReviewerSelection(
  variants: DesignerAssetVariant[]
): ReviewerSelectionResult {
  const reviews = variants.map((variant, index) => ({
    variantId: variant.id,
    score: 82 - index,
    scoreBreakdown: {
      brandFit: 82 - index,
      clarity: 80 - index,
      premiumFeel: 81 - index,
      textSafety: 84,
      composition: 79 - index,
      productRelevance: 80 - index,
    },
    notes: 'Internal fallback review used because reviewer scoring failed.',
    source: 'internal' as const,
    internalOnly: true,
  }));
  const primary = reviews[0] ?? null;

  return {
    status: primary ? 'awaiting_approval' : 'failed',
    primaryVariantId: primary?.variantId ?? null,
    reviews,
  };
}

function sanitizeDesignerError(error: unknown, fallback: string) {
  return sanitizeProviderError(error) || fallback;
}

function getRuntimeProviderConnectionMessage(
  runtimeDebug: ReturnType<typeof getDesignerRuntimeDebugStatus>
) {
  if (
    runtimeDebug.imageGenerationProvider === 'openai' &&
    runtimeDebug.selectedImageModel === 'gpt-image-2' &&
    !runtimeDebug.hasOpenAiApiKey
  ) {
    return 'Runtime image provider not connected.';
  }

  return 'Runtime image provider not configured.';
}

async function getDesignerAuthContext(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return { ok: false as const, error: error.message };
  }

  if (!data.user?.id) {
    return {
      ok: false as const,
      error: 'Sign in to generate and store Designer assets.',
    };
  }

  return { ok: true as const, userId: data.user.id };
}

async function ensureOwnedDesignerProjectId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  projectId: string
) {
  const { data, error } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    return { ok: false as const, error: error.message };
  }

  if (!data?.id) {
    return {
      ok: false as const,
      error: 'You do not have access to this Designer project.',
    };
  }

  return { ok: true as const };
}
