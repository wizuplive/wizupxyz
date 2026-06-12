import 'server-only';

import { GoogleGenAI } from '@google/genai';

import {
  buildVertexGoogleGenAIOptions,
  logVertexAuthFailure,
} from '@/lib/ai/google-auth';
import type {
  DesignerAsset,
  DesignerAssetVariant,
  DesignerAssetScoreBreakdown,
  DesignerVariantReview,
} from '@/lib/designer-assets';
import { env } from '@/lib/env';

const DEFAULT_IMAGE_REVIEW_MODEL = 'gemini-2.5-flash';

export interface ReviewerSelectionResult {
  status: 'awaiting_approval' | 'failed';
  primaryVariantId: string | null;
  reviews: DesignerVariantReview[];
}

export async function reviewDesignerVariants(input: {
  asset: DesignerAsset;
  variants: DesignerAssetVariant[];
  contextSummary: string;
}): Promise<ReviewerSelectionResult> {
  if (input.variants.length === 0) {
    return { status: 'failed', primaryVariantId: null, reviews: [] };
  }

  const reviews = await tryGeminiImageReview(input);
  const finalReviews = reviews.length > 0 ? reviews : createInternalFallbackReviews(input.variants);
  const primary = [...finalReviews].sort((left, right) => right.score - left.score)[0] ?? null;

  return {
    status: primary ? 'awaiting_approval' : 'failed',
    primaryVariantId: primary?.variantId ?? null,
    reviews: finalReviews,
  };
}

async function tryGeminiImageReview(input: {
  asset: DesignerAsset;
  variants: DesignerAssetVariant[];
  contextSummary: string;
}): Promise<DesignerVariantReview[]> {
  const useVertex = env.GOOGLE_GENAI_USE_VERTEXAI === 'true';
  const apiKey = env.GEMINI_API_KEY?.trim() || env.GOOGLE_API_KEY?.trim();

  if (!useVertex && !apiKey) {
    return [];
  }

  try {
    const client = useVertex
      ? new GoogleGenAI(
          buildVertexGoogleGenAIOptions({
            project: env.GOOGLE_CLOUD_PROJECT,
            location: env.GOOGLE_CLOUD_LOCATION,
          })
        )
      : new GoogleGenAI({ apiKey });

    const model = env.WIZUP_IMAGE_REVIEW_MODEL?.trim() || env.GEMINI_MODEL?.trim() || DEFAULT_IMAGE_REVIEW_MODEL;
    const inlineParts = await Promise.all(
      input.variants.map(async (variant) => ({
        inlineData: {
          mimeType: variant.mimeType,
          data: await extractBase64Payload(variant.publicUrl),
        },
      }))
    );

    const response = await client.models.generateContent({
      model,
      contents: [
        buildReviewPrompt(input),
        ...inlineParts,
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const text = response.text?.trim();
    if (!text) return [];

    const parsed = JSON.parse(text) as {
      reviews?: Array<{
        variantIndex: number;
        brandFit: number;
        clarity: number;
        premiumFeel: number;
        textSafety: number;
        composition: number;
        productRelevance: number;
        notes: string;
      }>;
    };

    const mapped = (parsed.reviews ?? []).reduce<DesignerVariantReview[]>(
      (acc, review) => {
        const variant = input.variants[review.variantIndex];
        if (!variant) return acc;
        const scoreBreakdown: DesignerAssetScoreBreakdown = {
          brandFit: review.brandFit,
          clarity: review.clarity,
          premiumFeel: review.premiumFeel,
          textSafety: review.textSafety,
          composition: review.composition,
          productRelevance: review.productRelevance,
        };
        acc.push({
          variantId: variant.id,
          score: totalFromBreakdown(scoreBreakdown),
          scoreBreakdown,
          notes: review.notes,
          source: 'gemini' as const,
          internalOnly: false,
        });
        return acc;
      },
      []
    );

    return mapped;
  } catch (error) {
    if (useVertex) {
      logVertexAuthFailure(`designer-review:${input.asset.type}`, error);
    }
    console.warn('[designer]', {
      assetType: input.asset.type,
      stage: 'reviewer_scoring:gemini_fallback',
      status: input.asset.status,
      rowId: null,
      error:
        error instanceof Error && error.message.trim()
          ? error.message
          : 'Gemini reviewer failed.',
    });
    return [];
  }
}

function createInternalFallbackReviews(
  variants: DesignerAssetVariant[]
): DesignerVariantReview[] {
  return variants.map((variant, index) => {
    const widthSignal = variant.width && variant.width >= 1024 ? 86 : 74;
    const heightSignal = variant.height && variant.height >= 1024 ? 84 : 73;
    const primaryBias = Math.max(0, 3 - index);
    const scoreBreakdown: DesignerAssetScoreBreakdown = {
      brandFit: widthSignal + primaryBias,
      clarity: 78 + primaryBias,
      premiumFeel: heightSignal + primaryBias,
      textSafety: 82,
      composition: 79 + primaryBias,
      productRelevance: 80 + primaryBias,
    };

    return {
      variantId: variant.id,
      score: totalFromBreakdown(scoreBreakdown),
      scoreBreakdown,
      notes: 'Internal fallback review used because LLM image review was unavailable.',
      source: 'internal',
      internalOnly: true,
    };
  });
}

function buildReviewPrompt(input: {
  asset: DesignerAsset;
  variants: DesignerAssetVariant[];
  contextSummary: string;
}) {
  return [
    'Review these WIZUP product image variants.',
    `Asset type: ${input.asset.type}`,
    `Context: ${input.contextSummary}`,
    'Score each variant from 0 to 100 for brandFit, clarity, premiumFeel, textSafety, composition, and productRelevance.',
    'Return JSON only in the shape {"reviews":[{"variantIndex":0,"brandFit":0,"clarity":0,"premiumFeel":0,"textSafety":0,"composition":0,"productRelevance":0,"notes":"..."}]}.',
  ].join('\n');
}

function totalFromBreakdown(breakdown: DesignerAssetScoreBreakdown) {
  const values = Object.values(breakdown).filter(
    (value): value is number => typeof value === 'number'
  );

  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

async function extractBase64Payload(publicUrl: string | null) {
  if (!publicUrl) {
    throw new Error('LLM image review requires an image URL.');
  }

  if (publicUrl.startsWith('data:')) {
    const [, data = ''] = publicUrl.split(',', 2);
    return data;
  }

  const response = await fetch(publicUrl);
  if (!response.ok) {
    throw new Error(`LLM image review could not load image bytes (${response.status}).`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer.toString('base64');
}
