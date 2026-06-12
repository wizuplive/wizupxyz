import type { DesignerAssetType } from '@/lib/designer-assets';
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

export const DESIGNER_STORAGE_BUCKETS = {
  product: 'product-assets',
  storefront: 'storefront-assets',
  launch: 'launch-assets',
} as const;

const verifiedDesignerBuckets = new Set<DesignerStorageBucket>();

export type DesignerStorageBucket =
  (typeof DESIGNER_STORAGE_BUCKETS)[keyof typeof DESIGNER_STORAGE_BUCKETS];

type DesignerStorageFolder =
  | 'cover'
  | 'mockup'
  | 'thumbnail'
  | 'sales-graphic'
  | 'social-preview';

export interface DesignerStorageLocationInput {
  projectId: string;
  sessionId: string;
  assetType: DesignerAssetType;
  assetId: string;
  variantId: string;
  extension?: string;
}

export interface DesignerStorageLocation {
  bucket: DesignerStorageBucket;
  storagePath: string;
}

export interface PendingDesignerUpload {
  bucket: DesignerStorageBucket;
  storagePath: string;
  contentType: string;
  bytes: Uint8Array;
}

export interface UploadedDesignerAsset {
  bucket: DesignerStorageBucket;
  storagePath: string;
  publicUrl: string;
}

export interface ResolveDesignerAssetUrlInput {
  bucket: DesignerStorageBucket;
  storagePath: string;
  publicUrl?: string | null;
  expiresIn?: number;
}

export function bucketForDesignerAssetType(
  assetType: DesignerAssetType
): DesignerStorageBucket {
  switch (assetType) {
    case 'cover':
    case 'mockup':
      return DESIGNER_STORAGE_BUCKETS.product;
    case 'thumbnail':
      return DESIGNER_STORAGE_BUCKETS.storefront;
    case 'sales_graphic':
    case 'social_preview':
      return DESIGNER_STORAGE_BUCKETS.launch;
  }
}

export function folderForDesignerAssetType(
  assetType: DesignerAssetType
): DesignerStorageFolder {
  switch (assetType) {
    case 'cover':
      return 'cover';
    case 'mockup':
      return 'mockup';
    case 'thumbnail':
      return 'thumbnail';
    case 'sales_graphic':
      return 'sales-graphic';
    case 'social_preview':
      return 'social-preview';
  }
}

export function buildDesignerStoragePath({
  projectId,
  sessionId,
  assetType,
  assetId,
  variantId,
  extension = 'png',
}: DesignerStorageLocationInput): string {
  const folder = folderForDesignerAssetType(assetType);
  return `${projectId}/${sessionId}/${folder}/${assetId}/${variantId}.${normalizeExtension(extension)}`;
}

export function getDesignerStorageLocation(
  input: DesignerStorageLocationInput
): DesignerStorageLocation {
  return {
    bucket: bucketForDesignerAssetType(input.assetType),
    storagePath: buildDesignerStoragePath(input),
  };
}

export async function uploadPendingDesignerUpload(
  supabase: SupabaseClient<Database>,
  upload: PendingDesignerUpload
): Promise<UploadedDesignerAsset> {
  await ensureDesignerBucketExists(upload.bucket, supabase);

  const uploadOptions = {
    contentType: upload.contentType,
    upsert: true,
  };
  let error: { message: string } | null = null;

  const primaryUpload = await supabase.storage
    .from(upload.bucket)
    .upload(upload.storagePath, upload.bytes, uploadOptions);
  error = primaryUpload.error;

  if (error) {
    const adminClient = createDesignerStorageAdminClient();
    if (!adminClient) {
      throw new Error(error.message);
    }

    const adminUpload = await adminClient.storage
      .from(upload.bucket)
      .upload(upload.storagePath, upload.bytes, uploadOptions);

    if (adminUpload.error) {
      throw new Error(adminUpload.error.message);
    }
  }

  const { data } = supabase.storage
    .from(upload.bucket)
    .getPublicUrl(upload.storagePath);

  return {
    bucket: upload.bucket,
    storagePath: upload.storagePath,
    publicUrl: data.publicUrl,
  };
}

export async function resolveDesignerAssetUrl(
  supabase: SupabaseClient<Database>,
  input: ResolveDesignerAssetUrlInput
): Promise<string> {
  const expiresIn = input.expiresIn ?? 60 * 60;
  const { data: signedData, error: signedError } = await supabase.storage
    .from(input.bucket)
    .createSignedUrl(input.storagePath, expiresIn);

  if (!signedError && signedData?.signedUrl) {
    return signedData.signedUrl;
  }

  const adminClient = createDesignerStorageAdminClient();
  if (adminClient) {
    const { data: adminSignedData, error: adminSignedError } = await adminClient.storage
      .from(input.bucket)
      .createSignedUrl(input.storagePath, expiresIn);

    if (!adminSignedError && adminSignedData?.signedUrl) {
      return adminSignedData.signedUrl;
    }
  }

  if (input.publicUrl?.trim()) {
    return input.publicUrl;
  }

  const { data } = supabase.storage
    .from(input.bucket)
    .getPublicUrl(input.storagePath);

  if (data.publicUrl?.trim()) {
    return data.publicUrl;
  }

  throw new Error('Designer asset URL could not be resolved.');
}

function normalizeExtension(extension: string) {
  return extension.replace(/^\./, '').trim() || 'png';
}

function createDesignerStorageAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function ensureDesignerBucketExists(
  bucket: DesignerStorageBucket,
  supabase: SupabaseClient<Database>
) {
  if (verifiedDesignerBuckets.has(bucket)) {
    return;
  }

  const adminClient = createDesignerStorageAdminClient();

  if (adminClient) {
    const { data: existingBuckets, error: listError } =
      await adminClient.storage.listBuckets();

    if (listError) {
      throw new Error(`Designer storage bucket check failed for ${bucket}: ${listError.message}`);
    }

    const existingBucket = existingBuckets.find(
      (candidate) => candidate.name === bucket || candidate.id === bucket
    );

    if (!existingBucket) {
      const { error: createError } = await adminClient.storage.createBucket(bucket, {
        public: true,
      });

      if (createError && !createError.message.toLowerCase().includes('already exists')) {
        throw new Error(
          `Designer storage bucket creation failed for ${bucket}: ${createError.message}`
        );
      }
    }

    verifiedDesignerBuckets.add(bucket);
    return;
  }

  const { data, error } = await supabase.storage.from(bucket).list('', { limit: 1 });
  if (!error || data) {
    verifiedDesignerBuckets.add(bucket);
    return;
  }

  throw new Error(
    `Designer storage bucket ${bucket} is unavailable and no service-role client is configured.`
  );
}
