import type {
  DesignerAssetType,
  DesignerGenerationContext,
  DesignerPromptPackage,
} from '@/lib/designer-assets';

const ASSET_RULES: Record<
  DesignerAssetType,
  { aspectRatio: string; goal: string; framing: string }
> = {
  cover: {
    aspectRatio: '3:4',
    goal: 'Create a premium digital product cover that feels clean, modern, and instantly credible.',
    framing: 'Single focal composition, strong typography-safe negative space, product-first presentation.',
  },
  mockup: {
    aspectRatio: '4:3',
    goal: 'Create a realistic product mockup that shows the asset in use without looking like a template.',
    framing: 'Desktop or tablet product scene, cinematic lighting, believable depth, no clutter.',
  },
  thumbnail: {
    aspectRatio: '1:1',
    goal: 'Create a clear storefront thumbnail that reads fast and feels premium at small sizes.',
    framing: 'Centered composition, strong silhouette, minimal distractions, product-led.',
  },
  sales_graphic: {
    aspectRatio: '4:3',
    goal: 'Create a conversion-supporting sales graphic for a premium digital product.',
    framing: 'Benefit-focused composition, product context visible, clean hierarchy, no noisy marketing gimmicks.',
  },
  social_preview: {
    aspectRatio: '16:9',
    goal: 'Create a social preview image that feels premium and shareable without looking like an ad template.',
    framing: 'Wide cinematic layout, product-led composition, clear focal point, strong contrast.',
  },
};

const DEFAULT_NEGATIVE_PROMPT = [
  'no watermark',
  'no stock-photo look',
  'no cartoon characters',
  'no robot imagery',
  'no generic AI dashboard',
  'no clutter',
  'no fake UI chrome',
  'no unreadable text',
  'no gibberish typography',
  'no low quality render',
].join(', ');

export function buildDesignerPrompt(
  input: DesignerGenerationContext
): DesignerPromptPackage {
  const rules = ASSET_RULES[input.assetType];
  const sourceContext = [
    input.sourceContext?.strategySummary,
    input.sourceContext?.creatorSummary,
    input.sourceContext?.salesSummary,
  ]
    .filter(Boolean)
    .join('\n');

  const prompt = [
    'You are creating a premium WIZUP product asset.',
    rules.goal,
    `Asset type: ${input.assetType.replace('_', ' ')}`,
    `Product title: ${input.productTitle}`,
    `Product subtitle: ${input.productSubtitle}`,
    `Buyer: ${input.targetBuyer}`,
    `Core promise: ${input.corePromise}`,
    `Problem summary: ${input.problemSummary}`,
    `Differentiator: ${input.differentiator}`,
    `Price point: ${input.pricing}`,
    `Brand direction: ${input.brandDirection}`,
    `Composition guidance: ${rules.framing}`,
    sourceContext ? `Supporting context:\n${sourceContext}` : '',
    input.referenceStyleNotes ? `Style notes: ${input.referenceStyleNotes}` : '',
    input.formatConstraints ? `Format constraints: ${input.formatConstraints}` : '',
    'Use premium dark-mode product aesthetics. Keep the result believable, calm, modern, and product-relevant.',
  ]
    .filter(Boolean)
    .join('\n');

  return {
    assetType: input.assetType,
    prompt,
    negativePrompt: DEFAULT_NEGATIVE_PROMPT,
    aspectRatio: rules.aspectRatio,
    outputMimeType: 'image/png',
  };
}
