import 'server-only';

import {
  classifyImageGenerationError,
  canGenerateImagesInRuntime,
  generateImagesWithProvider,
  getImageProviderDebugStatus,
  getImageGenerationMode,
  recordImageAssetJobStatus,
  recordImageStorageWriteStatus,
  sanitizeProviderError,
  type ImageGenerationErrorType,
  type ImageProviderDebugStatus,
  type ImageProviderName,
} from '@/lib/ai/image-provider';
import type {
  DesignerGenerationContext,
  DesignerPromptPackage,
} from '@/lib/designer-assets';

export interface DesignerGeneratedImage {
  bytes: Uint8Array;
  mimeType: string;
}

export interface DesignerRuntimeResult {
  provider: ImageProviderName;
  model: string;
  generatedImages: DesignerGeneratedImage[];
  warnings: string[];
  usedFallback: boolean;
}

export interface DesignerRuntimeDebugStatus extends ImageProviderDebugStatus {
  selectedImageModel: string;
  imageGenerationProvider: ImageProviderName;
}

export function getDesignerProductionModel() {
  return getImageProviderDebugStatus('production').imageModel;
}

export function getDesignerDraftModel() {
  return getImageProviderDebugStatus('draft').imageModel;
}

export function getDesignerDefaultVariantCount(mode: 'production' | 'draft' = 'production') {
  return mode === 'draft' ? 2 : 3;
}

export function getDesignerModel(mode: 'production' | 'draft' = 'production') {
  return mode === 'draft' ? getDesignerDraftModel() : getDesignerProductionModel();
}

export function getDesignerRuntimeDebugStatus(
  mode: 'production' | 'draft' = 'production'
): DesignerRuntimeDebugStatus {
  const provider = getImageProviderDebugStatus(mode);

  return {
    ...provider,
    selectedImageModel: provider.imageModel,
    imageGenerationProvider: provider.imageProvider,
  };
}

export async function generateDesignerImages(input: {
  context: DesignerGenerationContext;
  prompt: DesignerPromptPackage;
}): Promise<DesignerRuntimeResult> {
  const mode = input.context.mode ?? 'production';
  const debug = getDesignerRuntimeDebugStatus(mode);
  const result = await generateImagesWithProvider(input);

  console.info('[designer-runtime]', {
    stage: 'generation:complete',
    assetType: input.context.assetType,
    imageGenerationProvider: result.provider,
    selectedImageModel: result.model,
    hasOpenAiApiKey: debug.hasOpenAiApiKey,
    imageFallbackProvider: debug.imageFallbackProvider,
    imageFallbackModel: debug.imageFallbackModel,
    hasGoogleServiceAccountKey: debug.hasGoogleServiceAccountKey,
    vertexCredentialSource: debug.vertexCredentialSource,
    generatedImageCount: result.generatedImages.length,
    warningCount: result.warnings.length,
    usedFallback: result.usedFallback,
  });

  return result;
}

export {
  classifyImageGenerationError,
  canGenerateImagesInRuntime,
  getImageGenerationMode,
  recordImageAssetJobStatus,
  recordImageStorageWriteStatus,
  sanitizeProviderError,
};
export type { ImageGenerationErrorType };
