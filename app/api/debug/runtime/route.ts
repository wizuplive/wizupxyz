import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import { getImageProviderDebugStatus } from '@/lib/ai/image-provider';
import { getVertexCredentialDebugStatus, runtimeEnv } from '@/lib/ai/google-auth';
import type { Json, SalesAssetRow } from '@/lib/supabase/types';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const cwd = process.cwd();
  const envPath = path.join(cwd, '.env.local');
  const vertexCredentials = getVertexCredentialDebugStatus();
  const imageProvider = getImageProviderDebugStatus('production');
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId')?.trim() || null;
  const assetCounts = await loadDesignerAssetCounts(sessionId);

  return NextResponse.json({
    cwd,
    envLocalExists: fs.existsSync(envPath),
    googleGenaiUseVertexai: runtimeEnv('GOOGLE_GENAI_USE_VERTEXAI'),
    hasGoogleCloudProject: Boolean(runtimeEnv('GOOGLE_CLOUD_PROJECT')),
    googleCloudLocation: runtimeEnv('GOOGLE_CLOUD_LOCATION'),
    geminiModel: runtimeEnv('GEMINI_MODEL'),
    hasTavilyApiKey: Boolean(runtimeEnv('TAVILY_API_KEY')),
    hasGeminiApiKey: Boolean(runtimeEnv('GEMINI_API_KEY')),
    hasGoogleApiKey: Boolean(runtimeEnv('GOOGLE_API_KEY')),
    hasOpenAiApiKey: imageProvider.hasOpenAiApiKey,
    imageGenerationMode: imageProvider.imageGenerationMode,
    canGenerateInRuntime: imageProvider.canGenerateInRuntime,
    hasRuntimeProviderCredential: imageProvider.hasRuntimeProviderCredential,
    codexAssistedQueueEnabled: imageProvider.codexAssistedQueueEnabled,
    imageProvider: imageProvider.imageProvider,
    imageModel: imageProvider.imageModel,
    imageFallbackProvider: imageProvider.imageFallbackProvider,
    imageFallbackModel: imageProvider.imageFallbackModel,
    imageGenerationLastErrorSanitized:
      imageProvider.imageGenerationLastErrorSanitized,
    supabaseStorageConfigured: Boolean(
      runtimeEnv('NEXT_PUBLIC_SUPABASE_URL') &&
        runtimeEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    ),
    debugSessionId: assetCounts.sessionId,
    queuedAssetCount: assetCounts.queuedAssetCount,
    failedAssetCount: assetCounts.failedAssetCount,
    completedAssetCount: assetCounts.completedAssetCount,
    lastImageStorageWriteStatus: imageProvider.lastImageStorageWriteStatus,
    lastAssetJobStatus: imageProvider.lastAssetJobStatus,
    hasGoogleServiceAccountKey: vertexCredentials.hasGoogleServiceAccountKey,
    serviceAccountJsonParsed: vertexCredentials.serviceAccountJsonParsed,
    serviceAccountClientEmailPresent:
      vertexCredentials.serviceAccountClientEmailPresent,
    serviceAccountPrivateKeyPresent:
      vertexCredentials.serviceAccountPrivateKeyPresent,
    vertexCredentialSource: vertexCredentials.credentialSource,
  });
}

async function loadDesignerAssetCounts(sessionId: string | null) {
  const supabaseUrl = runtimeEnv('NEXT_PUBLIC_SUPABASE_URL');
  const serviceRoleKey = runtimeEnv('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    return {
      sessionId,
      queuedAssetCount: null,
      failedAssetCount: null,
      completedAssetCount: null,
    };
  }

  const supabase = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from('sales_assets')
    .select('id, content, updated_at')
    .like('asset_type', 'designer_%')
    .order('updated_at', { ascending: false })
    .limit(200);

  if (error) {
    return {
      sessionId,
      queuedAssetCount: null,
      failedAssetCount: null,
      completedAssetCount: null,
    };
  }

  const latestBySessionAsset = new Map<string, string>();
  let queuedAssetCount = 0;
  let failedAssetCount = 0;
  let completedAssetCount = 0;

  for (const row of (data ?? []) as Pick<SalesAssetRow, 'id' | 'content' | 'updated_at'>[]) {
    const parsed = parseDesignerPayload(row.content);
    const asset = parsed?.asset;
    if (!asset?.sessionId || !asset.type || !asset.status) continue;
    if (sessionId && asset.sessionId !== sessionId) continue;

    const key = `${asset.sessionId}:${asset.type}`;
    if (latestBySessionAsset.has(key)) continue;
    latestBySessionAsset.set(key, row.id);

    if (asset.status === 'queued_for_codex') queuedAssetCount += 1;
    if (asset.status === 'failed') failedAssetCount += 1;
    if (asset.status === 'ready') completedAssetCount += 1;
  }

  return {
    sessionId,
    queuedAssetCount,
    failedAssetCount,
    completedAssetCount,
  };
}

function parseDesignerPayload(content: Json) {
  if (!content || typeof content !== 'object' || Array.isArray(content)) {
    return null;
  }

  const candidate = content as {
    asset?: {
      sessionId?: string;
      type?: string;
      status?: string;
    };
  };

  return candidate.asset ? candidate : null;
}
