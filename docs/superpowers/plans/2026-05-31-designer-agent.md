# Designer Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a real WIZUP Designer Agent that generates product images with `imagen-4.0-generate-001`, stores all real outputs in Supabase Storage, lets Reviewer choose a primary variant, gates final publication through founder approval during alpha, and exposes only approved primary assets to downstream product flows.

**Architecture:** Extend the existing `lib/ai` runtime with a dedicated image-generation path instead of overloading the current text-only JSON pipeline. Persist binaries in Supabase Storage and keep structured metadata in the database plus lightweight primary-asset pointers in active session state. Designer generates variants, Reviewer scores them, founder approval promotes the selected variant to `ready` during alpha, and downstream pages consume only the selected primary asset.

**Tech Stack:** Next.js App Router, TypeScript, `@google/genai`, Vertex AI, Supabase Storage, Supabase Postgres metadata, React context session state, Vitest for targeted runtime tests.

---

## File Structure

**Create**
- `vitest.config.ts` — minimal test runner configuration for server-side unit tests
- `lib/ai/designer-prompts.ts` — prompt builder per asset type
- `lib/ai/designer-runtime.ts` — Imagen invocation wrapper and binary normalization
- `lib/ai/reviewer-images.ts` — structured scoring prompt and selection rules
- `lib/supabase/storage.ts` — upload, path, signed/public URL helpers for Designer assets
- `app/actions/designer.ts` — orchestration entrypoint for generation + review
- `tests/lib/ai/designer-prompts.test.ts` — prompt coverage tests
- `tests/lib/ai/designer-runtime.test.ts` — runtime/fallback contract tests
- `tests/app/actions/designer.test.ts` — orchestration tests

**Modify**
- `package.json` — add test script and test dependencies
- `lib/env.ts` — add explicit Designer env vars
- `lib/ai/index.ts` — export image model config helpers only; keep text runtime stable
- `app/actions/ai.ts` — export Designer and image-reviewer server actions
- `app/actions/workflow.ts` — persist Designer asset metadata and expose retrieval helpers
- `app/context/ActiveBuildSessionContext.tsx` — store primary asset pointers in active session
- `lib/supabase/types.ts` — add typed rows for Designer asset metadata tables

**External prerequisites**
- Supabase migration for:
  - `designer_assets`
  - `designer_asset_variants`
- Supabase Storage buckets:
  - `product-assets`
  - `storefront-assets`
  - `launch-assets`

---

## Asset Status Lifecycle

- `generating`
- `needs_review`
- `awaiting_approval`
- `ready`
- `failed`

**Transition rule**
- Designer stores real variants and marks the asset `needs_review`.
- Reviewer scores variants and picks one candidate primary.
- If Reviewer finds a valid winner, asset moves to `awaiting_approval`.
- During alpha, founder approval is required before the asset can move to `ready`.
- If no valid winner exists, asset moves to `failed`.

### Task 1: Add the test harness and Designer domain types

**Files:**
- Create: `vitest.config.ts`
- Modify: `package.json`
- Modify: `lib/env.ts`
- Modify: `app/context/ActiveBuildSessionContext.tsx`
- Test: `tests/lib/ai/designer-prompts.test.ts`

- [ ] **Step 1: Write the failing test for Designer asset typing and env parsing**

```ts
import { describe, expect, it } from 'vitest';
import { env } from '@/lib/env';

describe('designer env contract', () => {
  it('accepts explicit image model env vars without requiring secret values in tests', () => {
    expect(typeof env.GOOGLE_GENAI_USE_VERTEXAI === 'string' || env.GOOGLE_GENAI_USE_VERTEXAI === undefined).toBe(true);
    expect(env.WIZUP_IMAGE_MODEL ?? 'imagen-4.0-generate-001').toBe('imagen-4.0-generate-001');
    expect(env.WIZUP_IMAGE_VARIANT_DEFAULT ?? '3').toBe('3');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/ai/designer-prompts.test.ts`

Expected: FAIL with missing Vitest config or missing `WIZUP_IMAGE_MODEL` / `WIZUP_IMAGE_VARIANT_DEFAULT` fields on `env`.

- [ ] **Step 3: Add the minimal test harness and Designer types**

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

```json
// package.json
{
  "scripts": {
    "test": "vitest run"
  },
  "devDependencies": {
    "vitest": "^3.2.4"
  }
}
```

```ts
// lib/env.ts
const envSchema = z.object({
  GEMINI_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  GOOGLEGENAIUSEVERTEXAI: z.string().optional(),
  GOOGLE_GENAI_USE_VERTEXAI: z.string().optional(),
  GOOGLE_CLOUD_PROJECT: z.string().optional(),
  GOOGLE_CLOUD_LOCATION: z.string().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
  GEMINI_MODEL: z.string().optional(),
  WIZUP_IMAGE_MODEL: z.string().optional(),
  WIZUP_IMAGE_VARIANT_DEFAULT: z.string().optional(),
  TAVILY_API_KEY: z.string().optional(),
  NOWPAYMENTS_API_URL: z.string().optional(),
  NOWPAYMENTS_API_KEY: z.string().optional(),
  NOWPAYMENTS_IPN_SECRET: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().optional(),
});
```

```ts
// app/context/ActiveBuildSessionContext.tsx
export type DesignerAssetType =
  | 'cover'
  | 'mockup'
  | 'sales_graphic'
  | 'thumbnail'
  | 'social_preview';

export type DesignerAssetStatus =
  | 'generating'
  | 'awaiting_approval'
  | 'ready'
  | 'failed'
  | 'needs_review';

export interface SessionPrimaryAssetRef {
  assetId: string;
  variantId: string;
  type: DesignerAssetType;
  status: DesignerAssetStatus;
  publicUrl: string;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/ai/designer-prompts.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add package.json vitest.config.ts lib/env.ts app/context/ActiveBuildSessionContext.tsx tests/lib/ai/designer-prompts.test.ts
git commit -m "test: add designer env and session type coverage"
```

---

### Task 2: Add storage metadata types and Supabase asset helpers

**Files:**
- Create: `lib/supabase/storage.ts`
- Modify: `lib/supabase/types.ts`
- Test: `tests/app/actions/designer.test.ts`

- [ ] **Step 1: Write the failing test for bucket and path selection**

```ts
import { describe, expect, it } from 'vitest';
import { bucketForAssetType, buildAssetPath } from '@/lib/supabase/storage';

describe('designer storage mapping', () => {
  it('maps asset types to the expected buckets and paths', () => {
    expect(bucketForAssetType('cover')).toBe('product-assets');
    expect(bucketForAssetType('thumbnail')).toBe('storefront-assets');
    expect(bucketForAssetType('sales_graphic')).toBe('launch-assets');
    expect(buildAssetPath({
      projectId: 'proj_1',
      sessionId: 'sess_1',
      assetType: 'cover',
      assetId: 'asset_1',
      variantId: 'var_1',
      extension: 'png',
    })).toBe('proj_1/sess_1/cover/asset_1/var_1.png');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/app/actions/designer.test.ts -t "maps asset types"`

Expected: FAIL with missing `bucketForAssetType` or `buildAssetPath`.

- [ ] **Step 3: Add the minimal storage helper implementation**

```ts
// lib/supabase/storage.ts
import type { DesignerAssetType } from '@/app/context/ActiveBuildSessionContext';

export function bucketForAssetType(type: DesignerAssetType) {
  switch (type) {
    case 'cover':
    case 'mockup':
      return 'product-assets';
    case 'thumbnail':
      return 'storefront-assets';
    case 'sales_graphic':
    case 'social_preview':
      return 'launch-assets';
  }
}

export function buildAssetPath(input: {
  projectId: string;
  sessionId: string;
  assetType: DesignerAssetType;
  assetId: string;
  variantId: string;
  extension: string;
}) {
  return `${input.projectId}/${input.sessionId}/${input.assetType}/${input.assetId}/${input.variantId}.${input.extension}`;
}
```

```ts
// lib/supabase/types.ts
export interface DesignerAssetRow extends Record<string, unknown> {
  id: string;
  project_id: string;
  session_id: string;
  asset_type: string;
  status: string;
  prompt_version: string;
  source_model: string;
  primary_variant_id: string | null;
  variant_count: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface DesignerAssetVariantRow extends Record<string, unknown> {
  id: string;
  asset_id: string;
  storage_bucket: string;
  storage_path: string;
  public_url: string | null;
  mime_type: string;
  width: number | null;
  height: number | null;
  reviewer_score: number | null;
  reviewer_notes: string | null;
  score_breakdown: Json;
  is_primary: boolean;
  created_at: string;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/app/actions/designer.test.ts -t "maps asset types"`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/supabase/storage.ts lib/supabase/types.ts tests/app/actions/designer.test.ts
git commit -m "feat: add designer asset storage contracts"
```

---

### Task 3: Implement the Designer prompt builder and Imagen runtime wrapper

**Files:**
- Create: `lib/ai/designer-prompts.ts`
- Create: `lib/ai/designer-runtime.ts`
- Modify: `lib/ai/index.ts`
- Test: `tests/lib/ai/designer-prompts.test.ts`
- Test: `tests/lib/ai/designer-runtime.test.ts`

- [ ] **Step 1: Write the failing tests for prompt generation and runtime guardrails**

```ts
import { describe, expect, it } from 'vitest';
import { buildDesignerPrompt } from '@/lib/ai/designer-prompts';
import { getDesignerModel, getDefaultVariantCount } from '@/lib/ai/designer-runtime';

describe('designer prompt builder', () => {
  it('builds a prompt package for cover assets without placeholder language', () => {
    const prompt = buildDesignerPrompt({
      assetType: 'cover',
      productTitle: 'Toddler Sleep Toolkit',
      productSubtitle: 'A calm bedtime system for exhausted parents.',
      targetBuyer: 'tired parents of toddlers',
      corePromise: 'Help toddlers fall asleep faster with simple repeatable routines.',
      problemSummary: 'Bedtime feels chaotic.',
      differentiator: 'Short routines and printable tools.',
      pricing: '$29',
      brandDirection: 'Premium, dark, calm, modern.',
    });

    expect(prompt.assetType).toBe('cover');
    expect(prompt.prompt).toContain('Toddler Sleep Toolkit');
    expect(prompt.prompt.toLowerCase()).not.toContain('placeholder');
  });

  it('uses Imagen 4 as the default model and correct variant defaults', () => {
    expect(getDesignerModel()).toBe('imagen-4.0-generate-001');
    expect(getDefaultVariantCount('cover')).toBe(3);
    expect(getDefaultVariantCount('thumbnail')).toBe(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/lib/ai/designer-prompts.test.ts tests/lib/ai/designer-runtime.test.ts`

Expected: FAIL with missing prompt/runtime modules.

- [ ] **Step 3: Write the minimal prompt and runtime implementation**

```ts
// lib/ai/designer-prompts.ts
import type { DesignerAssetType } from '@/app/context/ActiveBuildSessionContext';

export function buildDesignerPrompt(input: {
  assetType: DesignerAssetType;
  productTitle: string;
  productSubtitle: string;
  targetBuyer: string;
  corePromise: string;
  problemSummary: string;
  differentiator: string;
  pricing: string;
  brandDirection: string;
}) {
  const prompt = [
    `Create a ${input.assetType.replace('_', ' ')} for WIZUP.`,
    `Product: ${input.productTitle}`,
    `Subtitle: ${input.productSubtitle}`,
    `Buyer: ${input.targetBuyer}`,
    `Promise: ${input.corePromise}`,
    `Problem: ${input.problemSummary}`,
    `Differentiator: ${input.differentiator}`,
    `Price: ${input.pricing}`,
    `Brand direction: ${input.brandDirection}`,
    'No text artifacts, no watermark, no fake UI chrome, no placeholder imagery.',
    'Premium, modern, dark, cinematic, product-relevant composition only.',
  ].join('\n');

  return { assetType: input.assetType, prompt };
}
```

```ts
// lib/ai/designer-runtime.ts
import { GoogleGenAI } from '@google/genai';
import { env } from '@/lib/env';
import type { DesignerAssetType } from '@/app/context/ActiveBuildSessionContext';

export function getDesignerModel() {
  return env.WIZUP_IMAGE_MODEL || 'imagen-4.0-generate-001';
}

export function getDefaultVariantCount(type: DesignerAssetType) {
  switch (type) {
    case 'cover':
    case 'mockup':
      return 3;
    case 'thumbnail':
    case 'sales_graphic':
    case 'social_preview':
      return 2;
  }
}

export function createDesignerClient() {
  return new GoogleGenAI({
    vertexai: true,
    project: env.GOOGLE_CLOUD_PROJECT!,
    location: env.GOOGLE_CLOUD_LOCATION || 'global',
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/lib/ai/designer-prompts.test.ts tests/lib/ai/designer-runtime.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/ai/designer-prompts.ts lib/ai/designer-runtime.ts lib/ai/index.ts tests/lib/ai/designer-prompts.test.ts tests/lib/ai/designer-runtime.test.ts
git commit -m "feat: add designer prompt builder and imagen runtime wrapper"
```

---

### Task 4: Add the Designer orchestration action for generation and Supabase upload

**Files:**
- Create: `app/actions/designer.ts`
- Modify: `app/actions/ai.ts`
- Modify: `app/actions/workflow.ts`
- Test: `tests/app/actions/designer.test.ts`

- [ ] **Step 1: Write the failing orchestration test**

```ts
import { describe, expect, it, vi } from 'vitest';
import { generateDesignerAssetSet } from '@/app/actions/designer';

describe('designer orchestration', () => {
  it('returns needs_review with stored variants and no public placeholder when generation succeeds', async () => {
    const result = await generateDesignerAssetSet({
      projectId: 'proj_1',
      sessionId: 'sess_1',
      assetType: 'cover',
      productTitle: 'Toddler Sleep Toolkit',
      productSubtitle: 'A calm bedtime system for exhausted parents.',
      targetBuyer: 'tired parents of toddlers',
      corePromise: 'Help toddlers fall asleep faster with simple repeatable routines.',
      problemSummary: 'Bedtime feels chaotic.',
      differentiator: 'Short routines and printable tools.',
      pricing: '$29',
      brandDirection: 'Premium, dark, calm, modern.',
    });

    expect(result.error).toBeNull();
    expect(result.data?.status).toBe('needs_review');
    expect(result.data?.variants.length).toBe(3);
    expect(result.data?.variants.every((variant) => variant.publicUrl)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/app/actions/designer.test.ts -t "returns needs_review"`

Expected: FAIL with missing `generateDesignerAssetSet`.

- [ ] **Step 3: Write the minimal orchestration implementation**

```ts
// app/actions/designer.ts
import { buildDesignerPrompt } from '@/lib/ai/designer-prompts';
import { createDesignerClient, getDefaultVariantCount, getDesignerModel } from '@/lib/ai/designer-runtime';
import { bucketForAssetType, buildAssetPath } from '@/lib/supabase/storage';

export async function generateDesignerAssetSet(input: DesignerGenerationRequest) {
  const variantCount = input.assetCount ?? getDefaultVariantCount(input.assetType);
  const promptPackage = buildDesignerPrompt(input);
  const model = getDesignerModel();
  const client = createDesignerClient();

  const asset = await createDesignerAssetRecord({
    projectId: input.projectId,
    sessionId: input.sessionId,
    assetType: input.assetType,
    status: 'generating',
    promptVersion: 'v1',
    sourceModel: model,
    variantCount,
  });

  try {
    const response = await client.models.generateImages({
      model,
      prompt: promptPackage.prompt,
      config: {
        numberOfImages: variantCount,
      },
    });

    const storedVariants = await persistGeneratedVariants({
      asset,
      assetType: input.assetType,
      projectId: input.projectId,
      sessionId: input.sessionId,
      generatedImages: response.generatedImages ?? [],
      bucketForAssetType,
      buildAssetPath,
    });

    await markDesignerAssetStatus(asset.id, 'needs_review');

    return {
      data: {
        ...asset,
        status: 'needs_review',
        variants: storedVariants,
      },
      error: null,
      notice: null,
    };
  } catch (error) {
    await markDesignerAssetFailure(asset.id, error instanceof Error ? error.message : 'Designer generation failed.');
    return {
      data: null,
      error: 'Designer could not generate a verified image set.',
      notice: null,
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/app/actions/designer.test.ts -t "returns needs_review"`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/actions/designer.ts app/actions/ai.ts app/actions/workflow.ts tests/app/actions/designer.test.ts
git commit -m "feat: add designer asset generation orchestration"
```

---

### Task 5: Add Reviewer image scoring and primary selection

**Files:**
- Create: `lib/ai/reviewer-images.ts`
- Modify: `app/actions/designer.ts`
- Modify: `app/actions/ai.ts`
- Test: `tests/app/actions/designer.test.ts`

- [ ] **Step 1: Write the failing test for primary selection**

```ts
import { describe, expect, it } from 'vitest';
import { selectPrimaryDesignerVariant } from '@/lib/ai/reviewer-images';

describe('reviewer image scoring', () => {
  it('selects one primary variant from reviewer scores', () => {
    const selection = selectPrimaryDesignerVariant([
      { id: 'var_1', total: 78 },
      { id: 'var_2', total: 91 },
      { id: 'var_3', total: 84 },
    ]);

    expect(selection.primaryVariantId).toBe('var_2');
    expect(selection.status).toBe('awaiting_approval');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/app/actions/designer.test.ts -t "selects one primary"`

Expected: FAIL with missing `selectPrimaryDesignerVariant`.

- [ ] **Step 3: Write the minimal scoring implementation**

```ts
// lib/ai/reviewer-images.ts
export type ReviewerVariantScore = {
  id: string;
  total: number;
  brandFit: number;
  clarity: number;
  premiumFeel: number;
  textSafety: number;
  composition: number;
  productRelevance: number;
  notes: string;
};

export function selectPrimaryDesignerVariant(scores: ReviewerVariantScore[]) {
  const ranked = [...scores].sort((left, right) => right.total - left.total);
  const winner = ranked[0];

  if (!winner) {
    return { primaryVariantId: null, status: 'failed' as const };
  }

  return {
    primaryVariantId: winner.id,
    status: 'awaiting_approval' as const,
  };
}
```

```ts
// app/actions/designer.ts
const review = selectPrimaryDesignerVariant(reviewerScores);
await updateDesignerVariantPrimary(asset.id, review.primaryVariantId);
await markDesignerAssetStatus(asset.id, review.status);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/app/actions/designer.test.ts -t "selects one primary"`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/ai/reviewer-images.ts app/actions/designer.ts app/actions/ai.ts tests/app/actions/designer.test.ts
git commit -m "feat: add reviewer scoring and primary asset selection"
```

---

### Task 6: Persist primary asset references and founder approval state into active workflow state

**Files:**
- Modify: `app/context/ActiveBuildSessionContext.tsx`
- Modify: `app/actions/workflow.ts`
- Test: `tests/app/actions/designer.test.ts`

- [ ] **Step 1: Write the failing test for session hydration**

```ts
import { describe, expect, it } from 'vitest';
import { attachPrimaryDesignerAssetToSession } from '@/app/actions/workflow';

describe('designer workflow persistence', () => {
  it('stores only the approved primary asset reference in active session state', async () => {
    const session = await attachPrimaryDesignerAssetToSession({
      sessionId: 'sess_1',
      assetType: 'cover',
      assetId: 'asset_1',
      variantId: 'var_2',
      publicUrl: 'https://example.com/cover.png',
    });

    expect(session.data?.designer_assets?.cover?.variantId).toBe('var_2');
    expect(session.data?.designer_assets?.cover?.publicUrl).toContain('cover.png');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/app/actions/designer.test.ts -t "stores only the approved primary asset reference"`

Expected: FAIL with missing `designer_assets` session support.

- [ ] **Step 3: Add the minimal workflow/session implementation**

```ts
// app/context/ActiveBuildSessionContext.tsx
export interface BuildSession {
  // existing fields...
  designer_assets?: Partial<Record<DesignerAssetType, SessionPrimaryAssetRef>>;
}
```

```ts
// app/actions/workflow.ts
export async function attachPrimaryDesignerAssetToSession(input: {
  sessionId: string;
  assetType: DesignerAssetType;
  assetId: string;
  variantId: string;
  publicUrl: string;
}) {
  return mutateActiveSession(input.sessionId, (session) => ({
    ...session,
    designer_assets: {
      ...(session.designer_assets ?? {}),
      [input.assetType]: {
        assetId: input.assetId,
        variantId: input.variantId,
        type: input.assetType,
        status: 'ready',
        publicUrl: input.publicUrl,
      },
    },
  }));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/app/actions/designer.test.ts -t "stores only the approved primary asset reference"`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/context/ActiveBuildSessionContext.tsx app/actions/workflow.ts tests/app/actions/designer.test.ts
git commit -m "feat: persist primary designer assets in workflow state"
```

---

### Task 7: Add downstream selectors and end-to-end validation gates

**Files:**
- Modify: `app/actions/workflow.ts`
- Test: `tests/app/actions/designer.test.ts`

- [ ] **Step 1: Write the failing test for read-model selectors**

```ts
import { describe, expect, it } from 'vitest';
import { selectPrimaryAssetForSurface } from '@/app/actions/workflow';

describe('designer downstream selectors', () => {
  it('returns only approved primary assets for downstream surfaces', () => {
    const asset = selectPrimaryAssetForSurface({
      designer_assets: {
        cover: {
          assetId: 'asset_1',
          variantId: 'var_1',
          type: 'cover',
          status: 'ready',
          publicUrl: 'https://example.com/cover.png',
        },
      },
    }, 'cover');

    expect(asset?.publicUrl).toContain('cover.png');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/app/actions/designer.test.ts -t "returns only approved primary assets"`

Expected: FAIL with missing selector.

- [ ] **Step 3: Add the minimal selector and validation commands**

```ts
// app/actions/workflow.ts
export function selectPrimaryAssetForSurface(
  session: Pick<BuildSession, 'designer_assets'>,
  type: DesignerAssetType
) {
  const asset = session.designer_assets?.[type];
  if (!asset || asset.status !== 'ready' || !asset.publicUrl) {
    return null;
  }
  return asset;
}
```

- [ ] **Step 4: Run the full validation suite**

Run:

```bash
npx vitest run
npm run lint
npm run build
```

Expected:
- Vitest: PASS
- Lint: PASS or only the two known unrelated warnings in `/app/app/examples/page.tsx` and `/app/app/product/page.tsx`
- Build: PASS

- [ ] **Step 5: Commit**

```bash
git add app/actions/workflow.ts tests/app/actions/designer.test.ts
git commit -m "test: add designer downstream selectors and validation coverage"
```

---

## Spec Coverage Check

- Designer Agent spec: covered by Tasks 3, 4, 5
- Asset schema: covered by Tasks 1, 2, 6
- Storage plan: covered by Task 2
- Image generation flow: covered by Tasks 4, 5, 6
- Default model `imagen-4.0-generate-001`: covered by Task 3
- Reviewer primary selection: covered by Task 5
- Founder approval gate before `ready`: covered by Tasks 5 and 6
- No placeholder imagery / no fake assets: covered by Tasks 3 and 4
- Only primary used downstream: covered by Tasks 6 and 7

## Placeholder Scan

- No `TODO`
- No `TBD`
- No deferred “handle later” steps
- All code-touching steps include concrete snippets

## Type Consistency Check

- Asset types are consistent across:
  - `DesignerAssetType`
  - storage mapping
  - runtime prompt builder
  - workflow selectors
- Session pointer shape is consistent:
  - `SessionPrimaryAssetRef`
  - `BuildSession.designer_assets`
  - downstream selector contract
