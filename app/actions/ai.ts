'use server';

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
