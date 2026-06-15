import 'server-only';

import OpenAI from 'openai';
import { GoogleGenAI } from '@google/genai';

import {
  buildVertexGoogleGenAIOptions,
  getVertexCredentialDebugStatus,
  logVertexAuthFailure,
} from '@/lib/ai/google-auth';
import type {
  DesignerAssetType,
  DesignerGenerationContext,
  DesignerPromptPackage,
} from '@/lib/designer-assets';
import { env } from '@/lib/env';

export const DEFAULT_GOOGLE_IMAGE_MODEL = 'gemini-3-pro-image';
export const DEFAULT_GOOGLE_FALLBACK_IMAGE_MODEL = 'gemini-3.1-flash-image';

export type ImageProviderName = 'openai' | 'google';
export type ImageGenerationMode = 'codex-assisted' | 'runtime-provider';
export type ImageGenerationErrorType =
  | 'auth'
  | 'model'
  | 'provider'
  | 'rate_limit'
  | 'safety'
  | 'unknown';

export interface ProvidedGeneratedImage {
  bytes: Uint8Array;
  mimeType: string;
}

export interface ImageProviderDebugStatus {
  imageGenerationMode: ImageGenerationMode;
  canGenerateInRuntime: boolean;
  hasRuntimeProviderCredential: boolean;
  codexAssistedQueueEnabled: boolean;
  imageProvider: ImageProviderName;
  imageModel: string;
  hasOpenAiApiKey: boolean;
  imageFallbackProvider: ImageProviderName | null;
  imageFallbackModel: string | null;
  imageGenerationLastErrorSanitized: string | null;
  lastImageStorageWriteStatus: 'not_attempted' | 'succeeded' | 'failed';
  lastAssetJobStatus:
    | 'not_started'
    | 'queued_for_codex'
    | 'generating'
    | 'ready'
    | 'failed';
  hasGoogleServiceAccountKey: boolean;
  vertexCredentialSource: ReturnType<typeof getVertexCredentialDebugStatus>['credentialSource'];
  isNanoBananaPro: boolean;
  isImagen: boolean;
}

export interface ImageProviderResult {
  provider: ImageProviderName;
  model: string;
  generatedImages: ProvidedGeneratedImage[];
  warnings: string[];
  usedFallback: boolean;
}

let imageGenerationLastErrorSanitized: string | null = null;
let lastImageStorageWriteStatus: 'not_attempted' | 'succeeded' | 'failed' = 'not_attempted';
let lastAssetJobStatus:
  | 'not_started'
  | 'queued_for_codex'
  | 'generating'
  | 'ready'
  | 'failed' = 'not_started';

export function getImageProviderDebugStatus(
  mode: DesignerGenerationContext['mode'] = 'production'
): ImageProviderDebugStatus {
  const vertex = getVertexCredentialDebugStatus();
  const imageProvider = getConfiguredImageProvider();
  const imageFallbackProvider = getConfiguredFallbackProvider();
  const imageGenerationMode = getImageGenerationMode();
  const hasRuntimeProviderCredential =
    hasCredentialForProvider(imageProvider) ||
    Boolean(imageFallbackProvider && hasCredentialForProvider(imageFallbackProvider));

  return {
    imageGenerationMode,
    canGenerateInRuntime:
      imageGenerationMode === 'runtime-provider' && hasRuntimeProviderCredential,
    hasRuntimeProviderCredential,
    codexAssistedQueueEnabled: imageGenerationMode === 'codex-assisted',
    imageProvider,
    imageModel: getConfiguredPrimaryImageModel(mode),
    hasOpenAiApiKey: Boolean(env.OPENAI_API_KEY?.trim()),
    imageFallbackProvider,
    imageFallbackModel:
      imageFallbackProvider === 'google' ? getConfiguredFallbackImageModel() : null,
    imageGenerationLastErrorSanitized,
    lastImageStorageWriteStatus,
    lastAssetJobStatus,
    hasGoogleServiceAccountKey: vertex.hasGoogleServiceAccountKey,
    vertexCredentialSource: vertex.credentialSource,
    isNanoBananaPro: getConfiguredPrimaryImageModel(mode) === 'gemini-3-pro-image',
    isImagen: false,
  };
}

export function recordImageStorageWriteStatus(
  status: 'not_attempted' | 'succeeded' | 'failed'
) {
  lastImageStorageWriteStatus = status;
}

export function recordImageAssetJobStatus(
  status: 'queued_for_codex' | 'generating' | 'ready' | 'failed'
) {
  lastAssetJobStatus = status;
}

export async function generateImagesWithProvider(input: {
  context: DesignerGenerationContext;
  prompt: DesignerPromptPackage;
}): Promise<ImageProviderResult> {
  const mode = input.context.mode ?? 'production';
  if (getImageGenerationMode() !== 'runtime-provider') {
    throw new Error('Runtime image provider not configured.');
  }

  const primaryProvider = getConfiguredImageProvider();
  const fallbackProvider = getConfiguredFallbackProvider();
  imageGenerationLastErrorSanitized = null;

  console.info('[image-provider]', {
    stage: 'generation_started',
    assetType: input.context.assetType,
    imageProvider: primaryProvider,
    imageModel: getConfiguredPrimaryImageModel(mode),
    imageFallbackProvider: fallbackProvider,
    imageFallbackModel:
      fallbackProvider === 'google' ? getConfiguredFallbackImageModel() : null,
  });

  try {
    const result = await generateWithSingleProvider(primaryProvider, mode, input);
    console.info('[image-provider]', {
      stage: 'generation_succeeded',
      assetType: input.context.assetType,
      imageProvider: result.provider,
      imageModel: result.model,
      generatedImageCount: result.generatedImages.length,
      usedFallback: result.usedFallback,
    });
    return result;
  } catch (primaryError) {
    imageGenerationLastErrorSanitized = sanitizeProviderError(primaryError);
    if (!fallbackProvider || fallbackProvider === primaryProvider) {
      throw primaryError;
    }

    console.warn('[image-provider]', {
      stage: 'primary_failed_fallback_starting',
      imageProvider: primaryProvider,
      imageModel: getConfiguredPrimaryImageModel(mode),
      imageFallbackProvider: fallbackProvider,
      imageFallbackModel: getConfiguredFallbackImageModel(),
      imageGenerationErrorType: classifyImageGenerationError(primaryError),
      error: sanitizeProviderError(primaryError),
    });

    try {
      const fallback = await generateWithSingleProvider(fallbackProvider, mode, input);
      console.info('[image-provider]', {
        stage: 'generation_succeeded',
        assetType: input.context.assetType,
        imageProvider: fallback.provider,
        imageModel: fallback.model,
        generatedImageCount: fallback.generatedImages.length,
        usedFallback: true,
      });
      return {
        ...fallback,
        usedFallback: true,
        warnings: [
          ...fallback.warnings,
          `Primary provider ${primaryProvider} failed; fallback ${fallbackProvider} was used.`,
        ],
      };
    } catch (fallbackError) {
      imageGenerationLastErrorSanitized = sanitizeProviderError(fallbackError);
      console.error('[image-provider]', {
        stage: 'fallback_failed',
        imageProvider: primaryProvider,
        imageModel: getConfiguredPrimaryImageModel(mode),
        imageFallbackProvider: fallbackProvider,
        imageFallbackModel: getConfiguredFallbackImageModel(),
        imageGenerationErrorType: classifyImageGenerationError(fallbackError),
        error: sanitizeProviderError(fallbackError),
      });
      throw fallbackError;
    }
  }
}

function getConfiguredImageProvider(): ImageProviderName {
  const configured = env.WIZUP_IMAGE_PROVIDER?.trim().toLowerCase();
  return configured === 'openai' ? 'openai' : 'google';
}

export function getImageGenerationMode(): ImageGenerationMode {
  return env.IMAGE_GENERATION_MODE ?? 'codex-assisted';
}

export function canGenerateImagesInRuntime() {
  const fallbackProvider = getConfiguredFallbackProvider();
  return (
    getImageGenerationMode() === 'runtime-provider' &&
    (hasCredentialForProvider(getConfiguredImageProvider()) ||
      Boolean(fallbackProvider && hasCredentialForProvider(fallbackProvider)))
  );
}

function hasCredentialForProvider(provider: ImageProviderName) {
  if (provider === 'openai') {
    return Boolean(env.OPENAI_API_KEY?.trim());
  }

  return (
    env.GOOGLE_GENAI_USE_VERTEXAI === 'true' &&
    Boolean(env.GOOGLE_CLOUD_PROJECT?.trim()) &&
    Boolean(env.GOOGLE_CLOUD_LOCATION?.trim()) &&
    getVertexCredentialDebugStatus().hasGoogleServiceAccountKey
  );
}

function getConfiguredFallbackProvider(): ImageProviderName | null {
  const configured = env.WIZUP_IMAGE_FALLBACK_PROVIDER?.trim().toLowerCase();
  if (configured === 'google') return 'google';
  if (configured === 'openai') return 'openai';
  if (env.GOOGLE_GENAI_USE_VERTEXAI === 'true') return 'google';
  return null;
}

function getConfiguredPrimaryImageModel(
  mode: DesignerGenerationContext['mode'] = 'production'
) {
  if (mode === 'draft' && env.WIZUP_IMAGE_DRAFT_MODEL?.trim()) {
    return env.WIZUP_IMAGE_DRAFT_MODEL.trim();
  }

  return env.WIZUP_IMAGE_MODEL?.trim() || DEFAULT_GOOGLE_IMAGE_MODEL;
}

function getConfiguredFallbackImageModel() {
  return env.WIZUP_IMAGE_FALLBACK_MODEL?.trim() || DEFAULT_GOOGLE_FALLBACK_IMAGE_MODEL;
}

async function generateWithSingleProvider(
  provider: ImageProviderName,
  mode: DesignerGenerationContext['mode'],
  input: {
    context: DesignerGenerationContext;
    prompt: DesignerPromptPackage;
  }
): Promise<ImageProviderResult> {
  if (provider === 'openai') {
    return generateWithOpenAI(mode, input);
  }

  const googleModel =
    getConfiguredImageProvider() === 'google'
      ? getConfiguredPrimaryImageModel(mode)
      : getConfiguredFallbackImageModel();
  return generateWithGoogle(mode, input, googleModel);
}

async function generateWithOpenAI(
  mode: DesignerGenerationContext['mode'],
  input: {
    context: DesignerGenerationContext;
    prompt: DesignerPromptPackage;
  }
): Promise<ImageProviderResult> {
  const apiKey = env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('Runtime image provider not configured.');
  }

  const model = getConfiguredPrimaryImageModel(mode);
  const openai = new OpenAI({ apiKey });
  const size = sizeForDesignerAssetType(input.context.assetType);
  const quality = mode === 'draft' ? 'low' : 'high';

  const response = await openai.images.generate({
    model,
    prompt: buildOpenAIImagePrompt(input.prompt),
    n: input.context.variantCount ?? designerVariantCount(),
    size,
    quality,
    output_format: 'png',
    background: 'auto',
    moderation: 'auto',
  });

  const generatedImages: ProvidedGeneratedImage[] = [];
  for (const entry of response.data ?? []) {
    if (!entry.b64_json) {
      continue;
    }

    generatedImages.push({
      bytes: new Uint8Array(Buffer.from(entry.b64_json, 'base64')),
      mimeType: 'image/png',
    });
  }

  if (generatedImages.length === 0) {
    throw new Error('OpenAI image generation returned no image bytes.');
  }

  return {
    provider: 'openai',
    model,
    generatedImages,
    warnings: [],
    usedFallback: false,
  };
}

async function generateWithGoogle(
  mode: DesignerGenerationContext['mode'],
  input: {
    context: DesignerGenerationContext;
    prompt: DesignerPromptPackage;
  },
  model: string
): Promise<ImageProviderResult> {
  if (env.GOOGLE_GENAI_USE_VERTEXAI !== 'true') {
    throw new Error('GOOGLE_GENAI_USE_VERTEXAI=true is required for Google Gemini image generation.');
  }

  let client: GoogleGenAI;

  try {
    client = new GoogleGenAI(
      buildVertexGoogleGenAIOptions({
        project: env.GOOGLE_CLOUD_PROJECT,
        location: env.GOOGLE_CLOUD_LOCATION,
      })
    );
  } catch (error) {
    logVertexAuthFailure('image-provider:google:create-client', error);
    throw error;
  }

  const images: ProvidedGeneratedImage[] = [];
  const warnings: string[] = [];
  const count =
    input.context.variantCount ?? designerVariantCount();
  const googleImageConfig = {
    responseModalities: ['TEXT', 'IMAGE'],
    responseFormat: {
      image: {
        aspectRatio: aspectRatioForDesignerAssetType(input.context.assetType),
        imageSize: imageSizeForDesignerAssetType(input.context.assetType),
      },
    },
  } as unknown as NonNullable<Parameters<GoogleGenAI['models']['generateContent']>[0]['config']>;

  for (let index = 0; index < count; index += 1) {
    const response = await client.models.generateContent({
      model,
      contents: buildGoogleImagePrompt(input.prompt),
      config: googleImageConfig,
    });

    let inlineImageFound = false;

    for (const candidate of response.candidates ?? []) {
      for (const part of candidate.content?.parts ?? []) {
        if (part.text?.trim()) {
          warnings.push(part.text.trim().slice(0, 200));
        }

        if (part.inlineData?.data) {
          inlineImageFound = true;
          images.push({
            bytes: new Uint8Array(Buffer.from(part.inlineData.data, 'base64')),
            mimeType: part.inlineData.mimeType?.trim() || 'image/png',
          });
        }
      }
    }

    if (!inlineImageFound) {
      throw new Error('Google Gemini image generation returned no image bytes.');
    }
  }

  return {
    provider: 'google',
    model,
    generatedImages: images,
    warnings,
    usedFallback: false,
  };
}

function designerVariantCount() {
  return 1;
}

function sizeForDesignerAssetType(assetType: DesignerAssetType) {
  switch (assetType) {
    case 'cover':
    case 'mockup':
      return '1536x1152';
    case 'sales_graphic':
    case 'social_preview':
      return '1536x864';
    case 'thumbnail':
      return '1024x1024';
  }
}

function aspectRatioForDesignerAssetType(assetType: DesignerAssetType) {
  switch (assetType) {
    case 'cover':
    case 'mockup':
      return '4:3';
    case 'sales_graphic':
    case 'social_preview':
      return '16:9';
    case 'thumbnail':
      return '1:1';
  }
}

function imageSizeForDesignerAssetType(assetType: DesignerAssetType) {
  switch (assetType) {
    case 'cover':
    case 'mockup':
    case 'sales_graphic':
    case 'social_preview':
      return '2K';
    case 'thumbnail':
      return '1K';
  }
}

function buildOpenAIImagePrompt(prompt: DesignerPromptPackage) {
  if (!prompt.negativePrompt.trim()) {
    return prompt.prompt;
  }

  return `${prompt.prompt}\n\nAvoid: ${prompt.negativePrompt}`;
}

function buildGoogleImagePrompt(prompt: DesignerPromptPackage) {
  return buildOpenAIImagePrompt(prompt);
}

export function classifyImageGenerationError(error: unknown): ImageGenerationErrorType {
  const message = sanitizeProviderError(error).toLowerCase();

  if (
    message.includes('api key') ||
    message.includes('credential') ||
    message.includes('service account') ||
    message.includes('authentication') ||
    message.includes('unauthorized')
  ) {
    return 'auth';
  }

  if (message.includes('model') || message.includes('unsupported')) {
    return 'model';
  }

  if (message.includes('rate limit') || message.includes('quota') || message.includes('429')) {
    return 'rate_limit';
  }

  if (message.includes('safety') || message.includes('policy') || message.includes('filtered')) {
    return 'safety';
  }

  if (message.includes('provider') || message.includes('endpoint')) {
    return 'provider';
  }

  return 'unknown';
}

export function sanitizeProviderError(error: unknown) {
  return error instanceof Error && error.message.trim()
    ? error.message.replace(/\s+/g, ' ').trim().slice(0, 240)
    : 'Image generation failed.';
}
