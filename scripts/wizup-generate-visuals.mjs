#!/usr/bin/env node

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

const assetTypes = ['cover', 'mockup', 'sales_graphic', 'social_preview'];
const fileNamesByAssetType = {
  cover: ['cover.png', 'cover.jpg', 'cover.jpeg', 'cover.webp'],
  mockup: ['mockup.png', 'mockup.jpg', 'mockup.jpeg', 'mockup.webp'],
  sales_graphic: ['sales_graphic.png', 'sales-graphic.png', 'sales.jpg', 'sales.png'],
  social_preview: ['social_preview.png', 'social-preview.png', 'social.jpg', 'social.png'],
};
const legacyTerms = [
  'co-parenting',
  'anxiety relief',
  'kids',
  'blended families',
  'transition planner',
];

loadDotEnv(path.resolve(process.cwd(), '.env.local'));

const args = parseArgs(process.argv.slice(2));
const sessionId = args.session?.trim();

if (!sessionId) {
  fail('Usage: npm run wizup:generate-visuals -- --session <id>');
}

const expectedAssetDir = getExpectedAssetDir(sessionId);
const providedAssetDir = args['asset-dir']?.trim() || args.assets?.trim() || expectedAssetDir;

if (path.resolve(providedAssetDir) !== path.resolve(expectedAssetDir)) {
  fail(
    `Codex-assisted uploads must use the session folder ${expectedAssetDir}. Received ${providedAssetDir}.`
  );
}

mkdirSync(expectedAssetDir, { recursive: true });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!supabaseUrl || !serviceRoleKey) {
  fail(
    'SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL are required for local asset uploads.'
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const rows = await loadQueuedRows(sessionId);
const byType = new Map();
for (const row of rows) {
  const payload = parsePayload(row.content);
  if (!payload?.asset || payload.asset.sessionId !== sessionId) continue;
  if (!assetTypes.includes(payload.asset.type)) continue;
  if (payload.asset.status !== 'queued_for_codex') continue;
  if (!byType.has(payload.asset.type)) {
    byType.set(payload.asset.type, { row, payload });
  }
}

const missingQueuedRows = assetTypes.filter((assetType) => !byType.has(assetType));
if (missingQueuedRows.length) {
  fail(`No queued Codex asset rows found for: ${missingQueuedRows.join(', ')}`);
}

const primaryEntry = byType.get('cover') ?? byType.values().next().value;
const contextSnapshot = primaryEntry?.payload?.asset?.contextSnapshot;
if (!contextSnapshot?.productTitle?.trim()) {
  fail('Queued asset metadata is missing product context. Requeue visuals from Build.');
}

validateQueuedRowsConsistency(byType, contextSnapshot);

const manifestPath = path.join(expectedAssetDir, 'manifest.json');
if (!existsSync(manifestPath)) {
  writeManifestTemplate(manifestPath, sessionId, contextSnapshot);
  fail(
    [
      `Created ${manifestPath}.`,
      'Place the four visual files into the session folder, review the manifest, then rerun:',
      `npm run wizup:generate-visuals -- --session ${sessionId}`,
    ].join('\n')
  );
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
validateManifest({
  manifest,
  sessionId,
  contextSnapshot,
  expectedAssetDir,
});

const qaClient = createLocalQaClient();
if (!qaClient) {
  fail('Local visual QA is unavailable. Configure Google QA credentials before uploading.');
}

for (const assetType of assetTypes) {
  const entry = byType.get(assetType);
  const filePath = findAssetFile(expectedAssetDir, assetType);
  if (!filePath) {
    fail(`Missing generated file for ${assetType} in ${expectedAssetDir}.`);
  }

  const qa = await runLocalVisualQa({
    client: qaClient,
    filePath,
    assetType,
    contextSnapshot,
  });

  if (!qa.approved) {
    fail(`Visual QA rejected ${assetType}: ${qa.reason}`);
  }

  const bytes = readFileSync(filePath);
  const mimeType = mimeTypeForFile(filePath);
  const asset = entry.payload.asset;
  const variantId = `variant_codex_${Date.now()}_${assetType}`;
  const bucket = bucketForAssetType(assetType);
  const storagePath = buildStoragePath({
    projectId: asset.projectId,
    sessionId: asset.sessionId,
    assetType,
    assetId: asset.id,
    variantId,
    extension: extensionForFile(filePath),
  });

  await ensureBucket(bucket);
  const upload = await supabase.storage.from(bucket).upload(storagePath, bytes, {
    contentType: mimeType,
    upsert: true,
  });

  if (upload.error) {
    fail(`Storage upload failed for ${assetType}: ${upload.error.message}`);
  }

  const publicUrl = supabase.storage.from(bucket).getPublicUrl(storagePath).data.publicUrl;
  const now = new Date().toISOString();
  const variant = {
    id: variantId,
    assetId: asset.id,
    storageBucket: bucket,
    storagePath,
    publicUrl,
    mimeType,
    width: null,
    height: null,
    reviewerScore: null,
    reviewerNotes: qa.reason,
    scoreBreakdown: {
      brandFit: null,
      clarity: null,
      premiumFeel: null,
      textSafety: null,
      composition: null,
      productRelevance: null,
    },
    isPrimary: true,
    createdAt: now,
  };

  const payload = {
    ...entry.payload,
    asset: {
      ...asset,
      status: 'awaiting_approval',
      sourceModel: 'codex-assisted',
      primaryVariantId: variantId,
      variantCount: 1,
      updatedAt: now,
      errorMessage: null,
      contextSnapshot,
    },
    variants: [variant],
    review: entry.payload.review ?? null,
    updatedAt: now,
    savedAt: entry.payload.savedAt ?? now,
  };

  const update = await supabase
    .from('sales_assets')
    .update({
      content: payload,
      updated_at: now,
    })
    .eq('id', entry.row.id)
    .select('id')
    .single();

  if (update.error) {
    fail(`Metadata update failed for ${assetType}: ${update.error.message}`);
  }

  console.log(`[wizup:generate-visuals] ${assetType} uploaded for review: ${bucket}/${storagePath}`);
}

console.log(
  `[wizup:generate-visuals] Completed ${assetTypes.length} assets for session ${sessionId}.`
);

async function loadQueuedRows(targetSessionId) {
  const { data, error } = await supabase
    .from('sales_assets')
    .select('*')
    .in('asset_type', assetTypes.map((assetType) => `designer_${assetType}`))
    .order('updated_at', { ascending: false })
    .limit(80);

  if (error) {
    fail(`Could not load queued asset rows: ${error.message}`);
  }

  return (data ?? []).filter((row) => {
    const payload = parsePayload(row.content);
    return payload?.asset?.sessionId === targetSessionId;
  });
}

function validateQueuedRowsConsistency(byType, contextSnapshot) {
  for (const { payload } of byType.values()) {
    const current = payload.asset?.contextSnapshot;
    if (!current) {
      fail('Queued asset metadata is missing contextSnapshot. Requeue visuals from Build.');
    }

    if (
      current.sessionId !== contextSnapshot.sessionId ||
      normalizeString(current.productTitle) !== normalizeString(contextSnapshot.productTitle)
    ) {
      fail('Queued asset rows do not share the same product context.');
    }
  }
}

function writeManifestTemplate(manifestPath, sessionId, contextSnapshot) {
  const manifest = {
    sessionId,
    productTitle: contextSnapshot.productTitle,
    productSubtitle: contextSnapshot.productSubtitle,
    targetBuyer: contextSnapshot.targetBuyer,
    pricing: contextSnapshot.pricing,
    brandDirection: contextSnapshot.brandDirection,
    deliverables: contextSnapshot.deliverables,
    localAssetDirectory: getExpectedAssetDir(sessionId),
    assets: {
      cover: 'cover.png',
      mockup: 'mockup.png',
      sales_graphic: 'sales_graphic.png',
      social_preview: 'social_preview.png',
    },
    notes: [
      'Do not include readable long text inside the images.',
      'Do not use previous product names.',
      'Use abstract product visuals, device mockups, worksheets, cards, and clean UI panels.',
    ],
  };

  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
}

function validateManifest({ manifest, sessionId, contextSnapshot, expectedAssetDir }) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    fail('manifest.json is invalid.');
  }

  if (manifest.sessionId !== sessionId) {
    fail(`Manifest sessionId mismatch. Expected ${sessionId}.`);
  }

  if (
    normalizeString(manifest.productTitle) !== normalizeString(contextSnapshot.productTitle)
  ) {
    fail(
      `Manifest productTitle mismatch. Expected "${contextSnapshot.productTitle}".`
    );
  }

  if (
    normalizePath(manifest.localAssetDirectory) !== normalizePath(expectedAssetDir)
  ) {
    fail(`Manifest localAssetDirectory must be ${expectedAssetDir}.`);
  }
}

function createLocalQaClient() {
  const useVertex = process.env.GOOGLE_GENAI_USE_VERTEXAI === 'true';
  const apiKey = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_API_KEY?.trim();

  if (useVertex) {
    const serviceAccountRaw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.trim();
    const project = process.env.GOOGLE_CLOUD_PROJECT?.trim();
    const location = process.env.GOOGLE_CLOUD_LOCATION?.trim() || 'global';

    if (!serviceAccountRaw || !project) {
      return null;
    }

    const parsed = JSON.parse(serviceAccountRaw);
    const privateKey =
      typeof parsed.private_key === 'string'
        ? parsed.private_key.replace(/\\n/g, '\n')
        : '';
    const clientEmail =
      typeof parsed.client_email === 'string' ? parsed.client_email.trim() : '';
    if (!privateKey || !clientEmail) {
      return null;
    }

    return new GoogleGenAI({
      vertexai: true,
      project,
      location,
      googleAuthOptions: {
        credentials: {
          ...parsed,
          private_key: privateKey,
          client_email: clientEmail,
        },
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      },
    });
  }

  if (!apiKey) {
    return null;
  }

  return new GoogleGenAI({ apiKey });
}

async function runLocalVisualQa({ client, filePath, assetType, contextSnapshot }) {
  const model =
    process.env.WIZUP_IMAGE_REVIEW_MODEL?.trim() ||
    process.env.GEMINI_MODEL?.trim() ||
    'gemini-2.5-flash';
  const bytes = readFileSync(filePath);
  const prompt = [
    'Review this local WIZUP visual before upload.',
    `Asset type: ${assetType}`,
    `Active product title: ${contextSnapshot.productTitle}`,
    `Active audience: ${contextSnapshot.targetBuyer}`,
    `Active deliverables: ${contextSnapshot.deliverables.join(', ') || 'Unknown deliverables'}`,
    `Active price: ${contextSnapshot.pricing}`,
    `Active style: ${contextSnapshot.brandDirection}`,
    'Reject the image if readable text contains old product naming, misspellings, unreadable fake copy, or if it visually misrepresents the current offer.',
    `Forbidden legacy terms unless truly relevant to "${contextSnapshot.productTitle}": ${legacyTerms.join(', ')}`,
    'Return JSON only in the shape {"approved":true,"reason":"...","detectedText":["..."]}.',
  ].join('\n');

  try {
    const response = await client.models.generateContent({
      model,
      contents: [
        prompt,
        {
          inlineData: {
            mimeType: mimeTypeForFile(filePath),
            data: bytes.toString('base64'),
          },
        },
      ],
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const text = response.text?.trim();
    if (!text) {
      return { approved: false, reason: 'Visual QA returned no result.' };
    }

    const parsed = JSON.parse(text);
    if (!parsed.approved) {
      return {
        approved: false,
        reason: parsed.reason || 'Visual QA rejected the asset.',
      };
    }

    const detectedText = Array.isArray(parsed.detectedText)
      ? parsed.detectedText.map((entry) => String(entry).toLowerCase())
      : [];
    const containsLegacyTerm = legacyTerms.some((term) => {
      if (normalizeString(contextSnapshot.productTitle).includes(normalizeString(term))) {
        return false;
      }
      return detectedText.some((entry) => entry.includes(term));
    });

    if (containsLegacyTerm) {
      return {
        approved: false,
        reason: 'Visual QA detected legacy product wording in the image.',
      };
    }

    return {
      approved: true,
      reason: parsed.reason || 'Visual QA passed.',
    };
  } catch (error) {
    return {
      approved: false,
      reason:
        error instanceof Error && error.message.trim()
          ? error.message
          : 'Visual QA failed.',
    };
  }
}

async function ensureBucket(bucket) {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    fail(`Designer storage bucket check failed for ${bucket}: ${error.message}`);
  }

  if (data.some((candidate) => candidate.name === bucket || candidate.id === bucket)) {
    return;
  }

  const created = await supabase.storage.createBucket(bucket, { public: true });
  if (created.error && !created.error.message.toLowerCase().includes('already exists')) {
    fail(`Designer storage bucket creation failed for ${bucket}: ${created.error.message}`);
  }
}

function parsePayload(content) {
  return content && typeof content === 'object' && !Array.isArray(content) ? content : null;
}

function findAssetFile(directory, assetType) {
  const absoluteDir = path.resolve(directory);
  for (const fileName of fileNamesByAssetType[assetType]) {
    const candidate = path.join(absoluteDir, fileName);
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

function bucketForAssetType(assetType) {
  if (assetType === 'cover' || assetType === 'mockup') return 'product-assets';
  return 'launch-assets';
}

function folderForAssetType(assetType) {
  if (assetType === 'sales_graphic') return 'sales-graphic';
  if (assetType === 'social_preview') return 'social-preview';
  return assetType;
}

function buildStoragePath({ projectId, sessionId, assetType, assetId, variantId, extension }) {
  return `${projectId}/${sessionId}/${folderForAssetType(assetType)}/${assetId}/${variantId}.${extension}`;
}

function extensionForFile(filePath) {
  const extension = path.extname(filePath).replace('.', '').toLowerCase();
  return extension || 'png';
}

function mimeTypeForFile(filePath) {
  const extension = extensionForFile(filePath);
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'webp') return 'image/webp';
  return 'image/png';
}

function parseArgs(rawArgs) {
  const parsed = {};
  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = rawArgs[index + 1];
    parsed[key] = next && !next.startsWith('--') ? next : 'true';
    if (next && !next.startsWith('--')) index += 1;
  }
  return parsed;
}

function loadDotEnv(filePath) {
  if (!existsSync(filePath)) return;
  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const equalsIndex = trimmed.indexOf('=');
    if (equalsIndex === -1) continue;
    const key = trimmed.slice(0, equalsIndex).trim();
    const value = trimmed.slice(equalsIndex + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

function normalizeString(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function normalizePath(value) {
  return path.resolve(String(value || '').replace(/^~(?=$|\/)/, os.homedir()));
}

function getExpectedAssetDir(sessionId) {
  return path.join(os.homedir(), 'Desktop', 'wizup-visuals', sessionId);
}

function fail(message) {
  console.error(`[wizup:generate-visuals] ${message}`);
  process.exit(1);
}
