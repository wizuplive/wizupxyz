'use server';

import {
  founderApproveDesignerAsset,
  generateDesignerWorkflowAsset,
  getPersistedDesignerAsset,
  generateDesignerAssetSet,
  loadReadyDesignerAssetPointers,
  loadDesignerSessionAssetStates,
  persistDesignerAssetResult,
  reviewDesignerAssetSet,
  saveReviewedDesignerAssetResult,
  type DesignerActionResult,
  type DesignerWorkflowActionResult,
  type DesignerSessionAssetStatesResult,
  type PersistedDesignerAssetResult,
  type ReadyDesignerAssetPointersResult,
  type ReviewedDesignerActionResult,
} from '@/app/actions/designer';
import {
  generateAnalystExamples,
  generateCreatorAssets,
  generateReviewerStoreReadiness,
  generateScoutIdeas,
  generateStrategistProductOutline,
  type AnalystExamplesOutput,
  type AnalystInput,
  type CreatorAssetsOutput,
  type CreatorInput,
  type ReviewerInput,
  type ReviewerStoreReadinessOutput,
  type ScoutIdeasOutput,
  type ScoutInput,
  type StrategistInput,
  type StrategistProductOutlineOutput,
} from '@/lib/ai';
import type {
  DesignerAsset,
  DesignerAssetVariant,
  DesignerGenerationContext,
} from '@/lib/designer-assets';

export async function runScout(
  input: ScoutInput = {}
): Promise<ScoutIdeasOutput> {
  return generateScoutIdeas(input);
}

export async function runAnalyst(
  input: AnalystInput
): Promise<AnalystExamplesOutput> {
  return generateAnalystExamples(input);
}

export async function runStrategist(
  input: StrategistInput
): Promise<StrategistProductOutlineOutput> {
  return generateStrategistProductOutline(input);
}

export async function runCreator(
  input: CreatorInput
): Promise<CreatorAssetsOutput> {
  return generateCreatorAssets(input);
}

export async function runReviewer(
  input: ReviewerInput
): Promise<ReviewerStoreReadinessOutput> {
  return generateReviewerStoreReadiness(input);
}

export async function runDesigner(
  input: DesignerGenerationContext
): Promise<DesignerActionResult> {
  return generateDesignerAssetSet(input);
}

export async function runDesignerWorkflow(input: {
  context: DesignerGenerationContext;
  contextSummary: string;
}): Promise<DesignerWorkflowActionResult> {
  return generateDesignerWorkflowAsset(input);
}

export async function runDesignerReviewer(input: {
  asset: DesignerAsset;
  variants: DesignerAssetVariant[];
  contextSummary: string;
}): Promise<ReviewedDesignerActionResult> {
  return reviewDesignerAssetSet(input);
}

export async function persistDesignerResult(input: {
  asset: DesignerAsset;
  variants: DesignerAssetVariant[];
  pendingUploads: import('@/lib/supabase/storage').PendingDesignerUpload[];
  review?: import('@/lib/ai/reviewer-images').ReviewerSelectionResult | null;
}): Promise<PersistedDesignerAssetResult> {
  return persistDesignerAssetResult(input);
}

export async function persistReviewedDesignerResult(input: {
  rowId: string;
  asset: DesignerAsset;
  variants: DesignerAssetVariant[];
  review: import('@/lib/ai/reviewer-images').ReviewerSelectionResult;
}): Promise<PersistedDesignerAssetResult> {
  return saveReviewedDesignerAssetResult(input);
}

export async function founderReviewDesignerResult(input: {
  rowId: string;
  action: 'approve' | 'reject';
  reason?: string;
}): Promise<PersistedDesignerAssetResult> {
  return founderApproveDesignerAsset(input);
}

export async function loadPersistedDesignerResult(
  rowId: string
): Promise<PersistedDesignerAssetResult> {
  return getPersistedDesignerAsset(rowId);
}

export async function loadReadyDesignerSessionAssets(input: {
  sessionId: string;
  projectId?: string | null;
  assetTypes?: DesignerGenerationContext['assetType'][];
  fallbackToProjectLatest?: boolean;
}): Promise<ReadyDesignerAssetPointersResult> {
  return loadReadyDesignerAssetPointers(input);
}

export async function loadDesignerSessionStates(input: {
  sessionId: string;
  projectId?: string | null;
  assetTypes?: DesignerGenerationContext['assetType'][];
}): Promise<DesignerSessionAssetStatesResult> {
  return loadDesignerSessionAssetStates(input);
}

export async function loadStorePaymentState(): Promise<{
  paymentTestModeEnabled: boolean;
}> {
  const raw = process.env.WIZUP_NOWPAYMENTS_TEST_MODE?.trim().toLowerCase() ?? '';
  return {
    paymentTestModeEnabled: ['1', 'true', 'yes', 'on'].includes(raw),
  };
}
