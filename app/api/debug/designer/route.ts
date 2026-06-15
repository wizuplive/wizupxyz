import { NextResponse } from 'next/server';

import {
  generateDesignerImages,
  getDesignerRuntimeDebugStatus,
} from '@/lib/ai/designer-runtime';
import { buildDesignerPrompt } from '@/lib/ai/designer-prompts';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const execute = searchParams.get('execute') === 'true';
  const assetType = searchParams.get('assetType') === 'mockup' ? 'mockup' : 'cover';
  const mode = searchParams.get('mode') === 'draft' ? 'draft' : 'production';
  const debug = getDesignerRuntimeDebugStatus(mode);

  if (!execute) {
    return NextResponse.json({
      ...debug,
      executed: false,
    });
  }

  try {
    const context = {
      projectId: 'debug-project',
      sessionId: 'debug-session',
      assetType,
      productTitle: 'WIZUP Debug Product',
      productSubtitle: 'Temporary designer diagnostics',
      targetBuyer: 'debug buyer',
      corePromise: 'Validate Designer image generation end to end.',
      problemSummary: 'Confirm the image model returns usable bytes.',
      differentiator: 'Premium, clear, product-led visual system.',
      pricing: '$19',
      brandDirection: 'Premium editorial product visuals with clean contrast.',
      mode,
      variantCount: 1,
      sourceContext: {
        creatorSummary: 'Temporary diagnostic request.',
        salesSummary: 'No customer-facing copy should be generated here.',
      },
      referenceStyleNotes: 'No text in image. Premium digital product presentation.',
    } as const;
    const prompt = buildDesignerPrompt(context);
    const result = await generateDesignerImages({ context, prompt });

    return NextResponse.json({
      ...debug,
      executed: true,
      generationSucceeded: true,
      resultProvider: result.provider,
      resultModel: result.model,
      usedFallback: result.usedFallback,
      generatedImageCount: result.generatedImages.length,
      warnings: result.warnings,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ...debug,
        executed: true,
        generationSucceeded: false,
        imageGenerationErrorType:
          error instanceof Error ? error.name || 'Error' : 'UnknownError',
        error:
          error instanceof Error && error.message.trim()
            ? error.message.replace(/\s+/g, ' ').trim().slice(0, 240)
            : 'Designer generation failed.',
      },
      { status: 500 }
    );
  }
}
