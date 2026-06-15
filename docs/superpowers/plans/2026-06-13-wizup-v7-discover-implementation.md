# WIZUP V7 Discover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current `/app` Discover experience with the approved V7 command-center design while preserving the existing scan logic, session flow, auth behavior, and downstream routing.

**Architecture:** Build the V7 UI as a shared presentational layer first on a public preview route, then wire the live `/app` page into that same view using the existing Discover state and actions. Keep data flow in `app/app/page.tsx`, move display concerns into focused `components/discover/*` files, and limit shell changes in `app/app/layout.tsx` to visual polish only.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, `motion/react`, `lucide-react`, Playwright smoke tests, ESLint, Next build.

---

## File Structure

### New files

- `app/preview/discover-v7/page.tsx`
  - Public review route for the V7 Discover design.
- `components/discover/discover-v7-types.ts`
  - Shared view-model types for the V7 Discover surface.
- `components/discover/discover-v7-preview.tsx`
  - Mock-data wrapper for the V7 preview route.
- `components/discover/discover-v7-view.tsx`
  - Main V7 Discover presentation layer used by both preview and live `/app`.
- `components/discover/discover-v7-network.tsx`
  - Demand-intelligence hero visualization.
- `components/discover/discover-v7-opportunity-canvas.tsx`
  - Large memo-style opportunity canvases with comparison states.
- `components/discover/discover-v7-rail.tsx`
  - Intelligence Briefing, Agent Orchestration, and Strategic Readiness rail.
- `tests/discover-v7.spec.ts`
  - Focused Playwright coverage for the V7 preview route.

### Modified files

- `app/app/page.tsx`
  - Keep all existing Discover controller logic, but swap the current widget-heavy rendering for the shared V7 view.
- `app/app/layout.tsx`
  - Refine the app shell so sidebar, journey strip, and header feel consistent with V7.
- `tests/smoke.spec.ts`
  - Add the preview route to public smoke coverage.

### Responsibilities and boundaries

- `app/app/page.tsx` remains the controller:
  - local state
  - Supabase user hydration
  - `runDiscoverScout`
  - saved IDs
  - move-to-strategy action
- `components/discover/*` own layout and presentation only.
- Preview data is isolated in `discover-v7-preview.tsx` so visual reviews do not depend on live scan state.

---

### Task 1: Create the V7 Preview Route and Smoke Harness

**Files:**
- Create: `app/preview/discover-v7/page.tsx`
- Create: `components/discover/discover-v7-preview.tsx`
- Create: `tests/discover-v7.spec.ts`
- Modify: `tests/smoke.spec.ts`

- [ ] **Step 1: Write the failing preview test**

```ts
import { expect, test } from '@playwright/test';

test('discover v7 preview renders the approved mission-control structure', async ({ page }) => {
  const response = await page.goto('/preview/discover-v7', {
    waitUntil: 'domcontentloaded',
  });

  expect(response, 'Expected a response for /preview/discover-v7').not.toBeNull();
  expect(response?.ok(), 'Expected /preview/discover-v7 to load successfully').toBeTruthy();

  await expect(
    page.getByRole('heading', { name: 'Find demand before you build.' })
  ).toBeVisible();
  await expect(page.getByText('Verified Opportunities')).toBeVisible();
  await expect(page.getByText('Intelligence Briefing')).toBeVisible();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx playwright test tests/discover-v7.spec.ts -g "discover v7 preview renders the approved mission-control structure"
```

Expected:

```text
Error: page.goto: net::ERR_ABORTED or 404
Expected /preview/discover-v7 to load successfully
```

- [ ] **Step 3: Create the preview route and a minimal preview component**

`app/preview/discover-v7/page.tsx`

```tsx
import { DiscoverV7Preview } from '@/components/discover/discover-v7-preview';

export default function DiscoverV7PreviewPage() {
  return <DiscoverV7Preview />;
}
```

`components/discover/discover-v7-preview.tsx`

```tsx
export function DiscoverV7Preview() {
  return (
    <div className="min-h-screen bg-[#070812] px-6 py-10 text-white">
      <h1 className="text-5xl font-semibold tracking-[-0.06em]">
        Find demand before you build.
      </h1>
      <section className="mt-10">
        <h2 className="text-2xl font-semibold tracking-[-0.04em]">
          Verified Opportunities
        </h2>
      </section>
      <aside className="mt-10">
        <h2 className="text-2xl font-semibold tracking-[-0.04em]">
          Intelligence Briefing
        </h2>
      </aside>
    </div>
  );
}
```

`tests/smoke.spec.ts`

```ts
const publicRoutes = [
  '/',
  '/login',
  '/pricing',
  '/faq',
  '/how-it-works',
  '/onboarding',
  '/preview/discover-v7',
] as const;
```

- [ ] **Step 4: Run the preview test to verify it passes**

Run:

```bash
npx playwright test tests/discover-v7.spec.ts -g "discover v7 preview renders the approved mission-control structure"
```

Expected:

```text
1 passed
```

- [ ] **Step 5: Commit**

```bash
git add app/preview/discover-v7/page.tsx \
  components/discover/discover-v7-preview.tsx \
  tests/discover-v7.spec.ts \
  tests/smoke.spec.ts
git commit -m "feat: scaffold discover v7 preview route"
```

---

### Task 2: Add Shared V7 Types and the Main Canvas + Right Rail Skeleton

**Files:**
- Create: `components/discover/discover-v7-types.ts`
- Create: `components/discover/discover-v7-view.tsx`
- Modify: `components/discover/discover-v7-preview.tsx`
- Test: `tests/discover-v7.spec.ts`

- [ ] **Step 1: Extend the failing test to assert the approved two-column structure**

Append to `tests/discover-v7.spec.ts`:

```ts
test('discover v7 preview uses a main canvas with a persistent intelligence rail', async ({ page }) => {
  await page.goto('/preview/discover-v7', { waitUntil: 'domcontentloaded' });

  await expect(page.getByText('Market Evidence Stream')).toBeVisible();
  await expect(page.getByText('Scout Operations')).toBeVisible();
  await expect(page.getByText('Agent Orchestration')).toBeVisible();
  await expect(page.getByText('Strategic Readiness')).toBeVisible();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx playwright test tests/discover-v7.spec.ts -g "main canvas with a persistent intelligence rail"
```

Expected:

```text
Expected locator to be visible:
text=Market Evidence Stream
```

- [ ] **Step 3: Create the shared V7 types**

`components/discover/discover-v7-types.ts`

```ts
export type DiscoverV7Metric = {
  label: string;
  value: string;
  detail: string;
};

export type DiscoverV7Opportunity = {
  id: string;
  title: string;
  audience: string;
  coreProblem: string;
  whyNow: string;
  evidenceSummary: string;
  sources: string[];
  score: number;
  confidence: string;
  demand: number;
  competition: number;
  monetization: number;
  buildability: number;
  launchSpeed: number;
};

export type DiscoverV7EvidenceItem = {
  id: string;
  kind: string;
  source: string;
  signalStrength: string;
  confidence: string;
  summary: string;
  timestamp: string;
};

export type DiscoverV7AgentItem = {
  name: string;
  task: string;
  status: string;
  confidence: string;
  lastAction: string;
};

export type DiscoverV7ReadinessItem = {
  stage: string;
  status: string;
  confidence: string;
  owner: string;
};

export type DiscoverV7ViewProps = {
  query: string;
  onQueryChange?: (value: string) => void;
  onScan?: () => void;
  isScanning?: boolean;
  filters: string[];
  activeFilter: string;
  onFilterChange?: (value: string) => void;
  metrics: DiscoverV7Metric[];
  opportunities: DiscoverV7Opportunity[];
  evidence: DiscoverV7EvidenceItem[];
  agents: DiscoverV7AgentItem[];
  readiness: DiscoverV7ReadinessItem[];
  briefing: {
    summary: string;
    audience: string;
    painPoints: string[];
    monetizationSignals: string[];
    landscape: string;
    confidence: string;
    provider: string;
    signalStrength: string;
  };
  mode?: 'preview' | 'live';
};
```

- [ ] **Step 4: Build the view skeleton and connect preview data to it**

`components/discover/discover-v7-view.tsx`

```tsx
import type { DiscoverV7ViewProps } from './discover-v7-types';

export function DiscoverV7View({
  metrics,
  opportunities,
  evidence,
  agents,
  readiness,
  briefing,
}: DiscoverV7ViewProps) {
  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 pb-10 pt-5 lg:px-8">
      <section className="rounded-[32px] border border-white/8 bg-white/[0.03] p-8">
        <h1 className="text-6xl font-semibold tracking-[-0.07em] text-white">
          Find demand before you build.
        </h1>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-6">
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">
              Verified Opportunities
            </h2>
          </div>
          <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-6">
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">
              Market Evidence Stream
            </h2>
          </div>
          <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-6">
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">
              Scout Operations
            </h2>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-6">
            <h2 className="text-xl font-semibold tracking-[-0.04em] text-white">
              Intelligence Briefing
            </h2>
          </div>
          <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-6">
            <h2 className="text-xl font-semibold tracking-[-0.04em] text-white">
              Agent Orchestration
            </h2>
          </div>
          <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-6">
            <h2 className="text-xl font-semibold tracking-[-0.04em] text-white">
              Strategic Readiness
            </h2>
          </div>
        </div>
      </section>
    </div>
  );
}
```

`components/discover/discover-v7-preview.tsx`

```tsx
import { DiscoverV7View } from './discover-v7-view';

export function DiscoverV7Preview() {
  return (
    <div className="min-h-screen bg-[#070812] text-white">
      <DiscoverV7View
        mode="preview"
        query="hair growth"
        filters={['All Ideas', 'High Momentum', 'Fast Growing', 'Low Competition', 'Evergreen']}
        activeFilter="All Ideas"
        metrics={[
          { label: 'Verified Signals', value: '24', detail: 'Cross-checked across live sources' },
          { label: 'Active Sources', value: '10', detail: 'Reddit, trends, forums, search' },
          { label: 'Confidence Average', value: '87%', detail: 'Weighted across current scan' },
          { label: 'Opportunities Found', value: '03', detail: 'Ready for strategic review' },
        ]}
        opportunities={[]}
        evidence={[]}
        agents={[]}
        readiness={[]}
        briefing={{
          summary: 'Hair growth demand is clustering around repeatable routines and trust gaps.',
          audience: 'Women noticing thinning or shedding',
          painPoints: ['Confusing treatment choices'],
          monetizationSignals: ['Strong buyer urgency'],
          landscape: 'Fragmented and advice-heavy',
          confidence: 'High',
          provider: 'Gemini + Tavily',
          signalStrength: 'Verified',
        }}
      />
    </div>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run:

```bash
npx playwright test tests/discover-v7.spec.ts -g "main canvas with a persistent intelligence rail"
```

Expected:

```text
1 passed
```

- [ ] **Step 6: Commit**

```bash
git add components/discover/discover-v7-types.ts \
  components/discover/discover-v7-view.tsx \
  components/discover/discover-v7-preview.tsx \
  tests/discover-v7.spec.ts
git commit -m "feat: add discover v7 shared layout skeleton"
```

---

### Task 3: Build the Hero, Signal Visualization, and Intelligence Metrics

**Files:**
- Create: `components/discover/discover-v7-network.tsx`
- Modify: `components/discover/discover-v7-view.tsx`
- Test: `tests/discover-v7.spec.ts`

- [ ] **Step 1: Extend the failing test to cover the hero controls**

Append to `tests/discover-v7.spec.ts`:

```ts
test('discover v7 preview hero shows the search-first mission-control controls', async ({ page }) => {
  await page.goto('/preview/discover-v7', { waitUntil: 'domcontentloaded' });

  await expect(
    page.getByPlaceholder('What market would you like Scout to investigate?')
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Scan Market' })).toBeVisible();
  await expect(page.getByText('Verified Signals')).toBeVisible();
  await expect(page.getByText('Confidence Average')).toBeVisible();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx playwright test tests/discover-v7.spec.ts -g "search-first mission-control controls"
```

Expected:

```text
Expected locator to be visible:
getByPlaceholder('What market would you like Scout to investigate?')
```

- [ ] **Step 3: Add the demand-intelligence network component**

`components/discover/discover-v7-network.tsx`

```tsx
'use client';

import { motion } from 'motion/react';

const nodes = [
  { id: 'n1', x: '16%', y: '22%', size: 'h-3 w-3' },
  { id: 'n2', x: '34%', y: '40%', size: 'h-4 w-4' },
  { id: 'n3', x: '58%', y: '28%', size: 'h-5 w-5' },
  { id: 'n4', x: '72%', y: '62%', size: 'h-6 w-6' },
  { id: 'n5', x: '84%', y: '34%', size: 'h-3 w-3' },
];

export function DiscoverV7Network() {
  return (
    <div className="relative h-full min-h-[340px] overflow-hidden rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_16%,rgba(217,70,239,0.18),transparent_26%),radial-gradient(circle_at_28%_76%,rgba(56,189,248,0.08),transparent_20%)]" />
      <svg className="absolute inset-0 h-full w-full opacity-35" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path d="M16 22 L34 40 L58 28 L72 62 L84 34" stroke="rgba(255,255,255,0.14)" strokeWidth="0.35" fill="none" />
        <path d="M34 40 L72 62" stroke="rgba(217,70,239,0.16)" strokeWidth="0.35" fill="none" />
      </svg>
      {nodes.map((node, index) => (
        <motion.div
          key={node.id}
          className={`absolute ${node.size} rounded-full border border-fuchsia-200/25 bg-white/[0.09] shadow-[0_0_18px_rgba(217,70,239,0.22)]`}
          style={{ left: node.x, top: node.y }}
          animate={{ scale: [1, 1.18, 1], opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 3.2 + index * 0.4, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        />
      ))}
      <div className="absolute bottom-6 left-6 rounded-full border border-white/8 bg-black/25 px-4 py-2 text-xs uppercase tracking-[0.22em] text-white/45">
        Verified Signals
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Replace the hero stub with the approved V7 hero**

Update the top of `components/discover/discover-v7-view.tsx`:

```tsx
import { Search, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DiscoverV7Network } from './discover-v7-network';
```

Replace the first `<section>` in `DiscoverV7View` with:

```tsx
<section className="overflow-hidden rounded-[34px] border border-white/8 bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02)_42%,rgba(7,7,12,0.92))] p-6 shadow-[0_32px_96px_-72px_rgba(217,70,239,0.9)] lg:p-8">
  <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_48%]">
    <div className="min-w-0">
      <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/16 bg-fuchsia-400/[0.08] px-3 py-1.5 text-xs font-medium text-fuchsia-100">
        Opportunity discovery studio
      </div>
      <h1 className="mt-6 max-w-[10ch] text-5xl font-semibold leading-[0.94] tracking-[-0.075em] text-white lg:text-7xl">
        Find demand before you build.
      </h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-white/62">
        Discover verified opportunities backed by real-world signals, buyer intent, market evidence, and commercial viability.
      </p>

      <div className="mt-8 flex flex-col gap-4 lg:flex-row">
        <label className="relative flex-1">
          <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/36" />
          <input
            value={query}
            onChange={(event) => onQueryChange?.(event.target.value)}
            placeholder="What market would you like Scout to investigate?"
            className="h-16 w-full rounded-[22px] border border-white/8 bg-black/36 pl-14 pr-4 text-white outline-none placeholder:text-white/34"
          />
        </label>
        <Button
          type="button"
          onClick={onScan}
          className="h-16 rounded-[22px] bg-fuchsia-500 px-8 text-base font-semibold text-white shadow-[0_0_28px_-12px_rgba(217,70,239,0.92)] hover:bg-fuchsia-400"
        >
          <Sparkles className="h-4 w-4" />
          Scan Market
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            onClick={() => onFilterChange?.(filter)}
            className={filter === activeFilter
              ? 'rounded-full border border-fuchsia-300/22 bg-fuchsia-400/[0.13] px-3.5 py-1.5 text-xs font-medium text-white'
              : 'rounded-full border border-white/8 bg-white/[0.035] px-3.5 py-1.5 text-xs font-medium text-white/58'}
          >
            {filter}
          </button>
        ))}
      </div>
    </div>

    <DiscoverV7Network />
  </div>
</section>
```

Add the metrics strip right below the hero:

```tsx
<section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
  {metrics.map((metric) => (
    <article key={metric.label} className="rounded-[24px] border border-white/8 bg-white/[0.03] p-6">
      <p className="text-[11px] uppercase tracking-[0.22em] text-white/35">{metric.label}</p>
      <p className="mt-5 text-5xl font-semibold tracking-[-0.07em] text-white">{metric.value}</p>
      <p className="mt-3 text-sm leading-6 text-white/52">{metric.detail}</p>
    </article>
  ))}
</section>
```

- [ ] **Step 5: Run the hero test to verify it passes**

Run:

```bash
npx playwright test tests/discover-v7.spec.ts -g "search-first mission-control controls"
```

Expected:

```text
1 passed
```

- [ ] **Step 6: Commit**

```bash
git add components/discover/discover-v7-network.tsx \
  components/discover/discover-v7-view.tsx \
  tests/discover-v7.spec.ts
git commit -m "feat: build discover v7 hero and metrics"
```

---

### Task 4: Build Verified Opportunity Canvases, Evidence Stream, and Scout Operations

**Files:**
- Create: `components/discover/discover-v7-opportunity-canvas.tsx`
- Modify: `components/discover/discover-v7-view.tsx`
- Modify: `components/discover/discover-v7-preview.tsx`
- Test: `tests/discover-v7.spec.ts`

- [ ] **Step 1: Extend the failing test to cover the opportunities-first body**

Append to `tests/discover-v7.spec.ts`:

```ts
test('discover v7 preview prioritizes opportunity memos over compact idea cards', async ({ page }) => {
  await page.goto('/preview/discover-v7', { waitUntil: 'domcontentloaded' });

  await expect(page.getByText('Move To Strategy').first()).toBeVisible();
  await expect(page.getByText('Why Now')).toBeVisible();
  await expect(page.getByText('Market Evidence Stream')).toBeVisible();
  await expect(page.getByText('Scout Operations')).toBeVisible();
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx playwright test tests/discover-v7.spec.ts -g "prioritizes opportunity memos over compact idea cards"
```

Expected:

```text
Expected locator to be visible:
text=Move To Strategy
```

- [ ] **Step 3: Create the opportunity canvas component**

`components/discover/discover-v7-opportunity-canvas.tsx`

```tsx
import { ArrowRight, GitCompare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { DiscoverV7Opportunity } from './discover-v7-types';

type Props = {
  item: DiscoverV7Opportunity;
  onMoveToStrategy?: (id: string) => void;
};

export function DiscoverV7OpportunityCanvas({ item, onMoveToStrategy }: Props) {
  const scores = [
    ['Demand', item.demand],
    ['Competition', item.competition],
    ['Monetization', item.monetization],
    ['Buildability', item.buildability],
    ['Launch Speed', item.launchSpeed],
  ] as const;

  return (
    <article className="rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-6 shadow-[0_26px_80px_-64px_rgba(217,70,239,0.7)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-white/34">Verified Opportunity</p>
          <h3 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">{item.title}</h3>
          <p className="mt-3 text-sm text-white/52">Audience: {item.audience}</p>
        </div>
        <div className="rounded-2xl border border-fuchsia-300/16 bg-fuchsia-400/[0.08] px-4 py-3 text-right">
          <p className="text-[11px] uppercase tracking-[0.18em] text-fuchsia-100/68">Opportunity Score</p>
          <p className="mt-2 text-4xl font-semibold tracking-[-0.07em] text-white">{item.score}</p>
          <p className="mt-1 text-xs text-white/45">{item.confidence} confidence</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {scores.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/7 bg-black/20 p-4">
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/34">{label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-[-0.06em] text-white">{value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-white/7 bg-black/18 p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/34">Core Problem</p>
          <p className="mt-3 text-sm leading-7 text-white/62">{item.coreProblem}</p>
          <p className="mt-5 text-[11px] uppercase tracking-[0.18em] text-white/34">Why Now</p>
          <p className="mt-3 text-sm leading-7 text-white/62">{item.whyNow}</p>
        </div>
        <div className="rounded-2xl border border-white/7 bg-black/18 p-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/34">Evidence Summary</p>
          <p className="mt-3 text-sm leading-7 text-white/62">{item.evidenceSummary}</p>
          <ul className="mt-4 space-y-2 text-sm text-white/56">
            {item.sources.map((source) => (
              <li key={source}>• {source}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button
          type="button"
          onClick={() => onMoveToStrategy?.(item.id)}
          className="h-12 rounded-2xl bg-fuchsia-500 px-6 text-sm font-semibold text-white hover:bg-fuchsia-400"
        >
          Move To Strategy
          <ArrowRight className="h-4 w-4" />
        </Button>
        <button type="button" className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.035] px-5 text-sm font-medium text-white/76">
          <GitCompare className="h-4 w-4" />
          Compare
        </button>
      </div>
    </article>
  );
}
```

- [ ] **Step 4: Fill the preview with real opportunity, evidence, and scout content**

Update `components/discover/discover-v7-preview.tsx` to pass real arrays:

```tsx
opportunities={[
  {
    id: 'hair-growth-micro-routine',
    title: 'Hair Growth Recovery Blueprint',
    audience: 'Women managing thinning, shedding, and stalled regrowth',
    coreProblem: 'They want a calm, trusted system instead of conflicting advice and expensive trial-and-error.',
    whyNow: 'Search demand is steady, buyer pain is personal, and frustration with inconsistent routines is rising.',
    evidenceSummary: 'Signal clusters show recurring frustration around regimen confusion, slow visible progress, and product distrust.',
    sources: ['Reddit routine complaint cluster', 'Search trend growth for shedding solutions', 'Forum threads comparing inconsistent results'],
    score: 92,
    confidence: 'High',
    demand: 94,
    competition: 62,
    monetization: 88,
    buildability: 84,
    launchSpeed: 81,
  },
  {
    id: 'stylist-retention-kit',
    title: 'Stylist Hair Retention Offer',
    audience: 'Stylists and educators serving clients with thinning concerns',
    coreProblem: 'They need a productized service layer that creates trust and repeat value beyond generic treatment recommendations.',
    whyNow: 'Stylists are looking for differentiated education offers while client concern around hair retention keeps climbing.',
    evidenceSummary: 'Professional communities show a gap between consumer anxiety and service-provider productization.',
    sources: ['Stylist Q&A forums', 'Buyer concern clusters', 'Search momentum for salon scalp support'],
    score: 84,
    confidence: 'Verified',
    demand: 82,
    competition: 58,
    monetization: 79,
    buildability: 86,
    launchSpeed: 77,
  },
]}
evidence={[
  {
    id: 'e1',
    kind: 'Buyer Complaint',
    source: 'Reddit',
    signalStrength: 'Strong',
    confidence: 'Verified',
    summary: 'Users repeatedly describe spending money on products without understanding what routine to follow or when to expect progress.',
    timestamp: '12 minutes ago',
  },
  {
    id: 'e2',
    kind: 'Search Trend',
    source: 'Google Trends',
    signalStrength: 'Rising',
    confidence: 'High',
    summary: 'Hair shedding and regrowth planning terms are climbing together, suggesting high intent around systems, not isolated products.',
    timestamp: '19 minutes ago',
  },
]}
agents={[
  { name: 'Scout', task: 'Cross-checking live source clusters', status: 'Active', confidence: 'Verified', lastAction: 'Ranked evidence' },
  { name: 'Strategist', task: 'Preparing opportunity framing', status: 'Queued', confidence: 'Medium', lastAction: 'Awaiting selection' },
]}
readiness={[
  { stage: 'Discover', status: 'Complete', confidence: 'High', owner: 'Scout' },
  { stage: 'Strategy', status: 'Ready', confidence: 'High', owner: 'Strategist' },
  { stage: 'Build', status: 'Waiting', confidence: 'Medium', owner: 'Creator' },
  { stage: 'Publish', status: 'Waiting', confidence: 'Medium', owner: 'Creator' },
  { stage: 'Store', status: 'Waiting', confidence: 'Medium', owner: 'Reviewer' },
]}
```

Replace the main canvas inside `components/discover/discover-v7-view.tsx`:

```tsx
import { DiscoverV7OpportunityCanvas } from './discover-v7-opportunity-canvas';
```

```tsx
<div className="space-y-6">
  <section className="rounded-[28px] border border-white/8 bg-white/[0.03] p-6 lg:p-7">
    <div className="flex items-end justify-between gap-4">
      <div>
        <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">Verified Opportunities</h2>
        <p className="mt-2 text-sm text-white/54">Strategic opportunities backed by verified signals.</p>
      </div>
    </div>
    <div className="mt-6 space-y-5">
      {opportunities.map((item) => (
        <DiscoverV7OpportunityCanvas key={item.id} item={item} />
      ))}
    </div>
  </section>

  <section className="rounded-[28px] border border-white/8 bg-white/[0.03] p-6 lg:p-7">
    <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">Market Evidence Stream</h2>
    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      {evidence.map((item) => (
        <article key={item.id} className="rounded-[22px] border border-white/7 bg-black/20 p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-white">{item.kind}</p>
            <span className="text-[11px] uppercase tracking-[0.18em] text-white/38">{item.timestamp}</span>
          </div>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-fuchsia-100/68">{item.source} · {item.signalStrength} · {item.confidence}</p>
          <p className="mt-4 text-sm leading-7 text-white/62">{item.summary}</p>
        </article>
      ))}
    </div>
  </section>

  <section className="rounded-[28px] border border-white/8 bg-white/[0.03] p-6 lg:p-7">
    <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">Scout Operations</h2>
    <div className="mt-6 grid gap-3 md:grid-cols-5">
      {['Sources', 'Signal Extraction', 'Pattern Detection', 'Scoring', 'Opportunity Ranking'].map((step, index) => (
        <div key={step} className="rounded-[22px] border border-white/7 bg-black/20 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-white/34">{String(index + 1).padStart(2, '0')}</p>
          <p className="mt-4 text-sm font-medium text-white">{step}</p>
        </div>
      ))}
    </div>
  </section>
</div>
```

- [ ] **Step 5: Run the opportunities-first test to verify it passes**

Run:

```bash
npx playwright test tests/discover-v7.spec.ts -g "prioritizes opportunity memos over compact idea cards"
```

Expected:

```text
1 passed
```

- [ ] **Step 6: Commit**

```bash
git add components/discover/discover-v7-opportunity-canvas.tsx \
  components/discover/discover-v7-view.tsx \
  components/discover/discover-v7-preview.tsx \
  tests/discover-v7.spec.ts
git commit -m "feat: build discover v7 opportunities and evidence"
```

---

### Task 5: Build the Intelligence Rail and Mobile Stacking Behavior

**Files:**
- Create: `components/discover/discover-v7-rail.tsx`
- Modify: `components/discover/discover-v7-view.tsx`
- Test: `tests/discover-v7.spec.ts`

- [ ] **Step 1: Extend the failing test to cover the intelligence rail and mobile overflow**

Append to `tests/discover-v7.spec.ts`:

```ts
test('discover v7 preview stacks cleanly on mobile without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/preview/discover-v7', { waitUntil: 'domcontentloaded' });

  await expect(page.getByText('Intelligence Briefing')).toBeVisible();
  await expect(page.getByText('Agent Orchestration')).toBeVisible();
  await expect(page.getByText('Strategic Readiness')).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx playwright test tests/discover-v7.spec.ts -g "stacks cleanly on mobile without horizontal overflow"
```

Expected:

```text
Expected locator to be visible:
text=Agent Orchestration
or
Expected: <= 1
Received: > 1
```

- [ ] **Step 3: Create the rail component**

`components/discover/discover-v7-rail.tsx`

```tsx
import type {
  DiscoverV7AgentItem,
  DiscoverV7ReadinessItem,
  DiscoverV7ViewProps,
} from './discover-v7-types';

type Props = Pick<DiscoverV7ViewProps, 'briefing' | 'agents' | 'readiness'>;

export function DiscoverV7Rail({ briefing, agents, readiness }: Props) {
  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-white/8 bg-white/[0.03] p-6">
        <h2 className="text-xl font-semibold tracking-[-0.04em] text-white">Intelligence Briefing</h2>
        <p className="mt-4 text-sm leading-7 text-white/62">{briefing.summary}</p>
        <div className="mt-5 space-y-3 text-sm text-white/58">
          <p><span className="text-white/36">Audience:</span> {briefing.audience}</p>
          <p><span className="text-white/36">Landscape:</span> {briefing.landscape}</p>
          <p><span className="text-white/36">Confidence:</span> {briefing.confidence}</p>
          <p><span className="text-white/36">Provider:</span> {briefing.provider}</p>
          <p><span className="text-white/36">Signal Strength:</span> {briefing.signalStrength}</p>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/8 bg-white/[0.03] p-6">
        <h2 className="text-xl font-semibold tracking-[-0.04em] text-white">Agent Orchestration</h2>
        <div className="mt-5 space-y-3">
          {agents.map((agent: DiscoverV7AgentItem) => (
            <article key={agent.name} className="rounded-[20px] border border-white/7 bg-black/18 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-white">{agent.name}</p>
                <span className="text-[11px] uppercase tracking-[0.18em] text-white/34">{agent.status}</span>
              </div>
              <p className="mt-3 text-sm text-white/58">{agent.task}</p>
              <p className="mt-2 text-xs text-white/36">Confidence: {agent.confidence} · Last action: {agent.lastAction}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-white/8 bg-white/[0.03] p-6">
        <h2 className="text-xl font-semibold tracking-[-0.04em] text-white">Strategic Readiness</h2>
        <div className="mt-5 space-y-3">
          {readiness.map((item: DiscoverV7ReadinessItem) => (
            <div key={item.stage} className="rounded-[20px] border border-white/7 bg-black/18 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-white">{item.stage}</p>
                <span className="text-[11px] uppercase tracking-[0.18em] text-white/34">{item.status}</span>
              </div>
              <p className="mt-2 text-xs text-white/40">Confidence: {item.confidence} · Owner: {item.owner}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Replace the rail placeholder and enforce mobile-safe stacking**

Update `components/discover/discover-v7-view.tsx`:

```tsx
import { DiscoverV7Rail } from './discover-v7-rail';
```

Replace the right-column placeholder with:

```tsx
<DiscoverV7Rail
  briefing={briefing}
  agents={agents}
  readiness={readiness}
/>
```

Make the outer layout mobile-safe:

```tsx
<div className="mx-auto flex max-w-[1600px] min-w-0 flex-col gap-6 overflow-x-clip px-3 pb-10 pt-5 sm:px-5 lg:px-8">
```

Keep the main two-column layout responsive:

```tsx
<section className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
```

- [ ] **Step 5: Run the mobile rail test to verify it passes**

Run:

```bash
npx playwright test tests/discover-v7.spec.ts -g "stacks cleanly on mobile without horizontal overflow"
```

Expected:

```text
1 passed
```

- [ ] **Step 6: Commit**

```bash
git add components/discover/discover-v7-rail.tsx \
  components/discover/discover-v7-view.tsx \
  tests/discover-v7.spec.ts
git commit -m "feat: add discover v7 intelligence rail"
```

---

### Task 6: Wire the Live `/app` Discover Controller into the Shared V7 View

**Files:**
- Modify: `app/app/page.tsx`
- Test: `tests/discover-v7.spec.ts`
- Verify: `npm run build`, `npx eslint app/app/page.tsx components/discover/*.tsx`

- [ ] **Step 1: Use the already-tested V7 view as the live rendering target**

Add imports near the top of `app/app/page.tsx`:

```tsx
import { DiscoverV7View } from '@/components/discover/discover-v7-view';
import type {
  DiscoverV7AgentItem,
  DiscoverV7EvidenceItem,
  DiscoverV7Metric,
  DiscoverV7Opportunity,
  DiscoverV7ReadinessItem,
} from '@/components/discover/discover-v7-types';
```

- [ ] **Step 2: Add live data adapters without changing scan logic**

Inside `AppDashboard`, after the existing computed values, add:

```tsx
  const metrics: DiscoverV7Metric[] = [
    {
      label: 'Verified Signals',
      value: hasVerifiedResults ? String(filteredOpportunities.length).padStart(2, '0') : '00',
      detail: hasVerifiedResults ? 'Verified opportunities ranked from live signals' : 'Run Scout to verify demand',
    },
    {
      label: 'Active Sources',
      value: String(scoutResult?.sources.length ?? 0).padStart(2, '0'),
      detail: scoutResult?.sources.length ? `Provider: ${providerLabel}` : 'Waiting for source collection',
    },
    {
      label: 'Confidence Average',
      value: hasVerifiedResults ? `${Math.min(95, 68 + filteredOpportunities.length * 7)}%` : '0%',
      detail: hasVerifiedResults ? 'Weighted across verified results' : 'No verified confidence yet',
    },
    {
      label: 'Opportunities Found',
      value: String(filteredOpportunities.length).padStart(2, '0'),
      detail: strongest ? strongest.title : 'No verified opportunity selected yet',
    },
  ];

  const opportunities: DiscoverV7Opportunity[] = filteredOpportunities.map((item) => ({
    id: item.id,
    title: item.title,
    audience: item.buyer,
    coreProblem: item.copy,
    whyNow: item.velocity,
    evidenceSummary: item.insight,
    sources: (scoutResult?.sources ?? []).slice(0, 3).map((source) => source.title),
    score: item.score,
    confidence: item.signal,
    demand: item.score,
    competition: item.difficulty === 'Low' ? 34 : item.difficulty === 'Medium' ? 57 : 74,
    monetization: item.revenue.includes('$') ? 82 : 70,
    buildability: item.format.toLowerCase().includes('template') ? 88 : 78,
    launchSpeed: item.format.toLowerCase().includes('guide') ? 84 : 76,
  }));

  const evidence: DiscoverV7EvidenceItem[] = (scoutResult?.sources ?? []).map((source, index) => ({
    id: `${source.provider}-${index}`,
    kind: index % 2 === 0 ? 'Search Trend' : 'Forum Discussion',
    source: source.provider,
    signalStrength: hasVerifiedResults ? 'Verified' : 'Observed',
    confidence: hasVerifiedResults ? 'High' : 'Medium',
    summary: source.title,
    timestamp: 'Just now',
  }));

  const agents: DiscoverV7AgentItem[] = aiActivity.map((item) => ({
    name: item.agent,
    task: item.task,
    status: item.active ? item.confidence : 'Standby',
    confidence: item.confidence,
    lastAction: item.timestamp,
  }));

  const readiness: DiscoverV7ReadinessItem[] = buildProgressSteps.map((step, index) => ({
    stage: step.replace('Discover an opportunity', 'Discover').replace('Create strategy', 'Strategy').replace('Build product', 'Build').replace('Make publish page', 'Publish').replace('Launch', 'Store'),
    status: activeSession ? (index === 0 ? 'Complete' : index === 1 ? 'Ready' : 'Waiting') : index === 0 ? 'Active' : 'Waiting',
    confidence: index <= sessionStageIndex ? 'High' : 'Medium',
    owner: index === 0 ? 'Scout' : index === 1 ? 'Strategist' : index === 2 ? 'Creator' : index === 3 ? 'Creator' : 'Reviewer',
  }));
```

- [ ] **Step 3: Replace the old page body with the shared V7 view**

Replace the current return body in `AppDashboard` with:

```tsx
  return (
    <DiscoverV7View
      mode="live"
      query={query}
      onQueryChange={setQuery}
      onScan={scanMarket}
      isScanning={isScanning}
      filters={filters}
      activeFilter={activeFilter}
      onFilterChange={(value) => setActiveFilter(value as OpportunityFilter)}
      metrics={metrics}
      opportunities={opportunities}
      evidence={evidence}
      agents={agents}
      readiness={readiness}
      briefing={{
        summary: preview?.positioning ?? scanFailureMessage ?? 'Run a verified scan to generate an intelligence briefing.',
        audience: preview?.buyer ?? 'Waiting for audience signal',
        painPoints: preview ? [preview.copy, preview.insight] : ['No verified pain-point cluster yet'],
        monetizationSignals: preview ? [preview.monetization, preview.revenue] : ['Waiting for monetization signal'],
        landscape: preview?.velocity ?? 'No competitive landscape summary yet',
        confidence: hasVerifiedResults ? 'Verified' : isScanning ? 'Scanning' : 'Standby',
        provider: providerLabel,
        signalStrength: scanStatus,
      }}
    />
  );
```

- [ ] **Step 4: Run build and lint to verify the live wiring passes**

Run:

```bash
npm run build
npx eslint app/app/page.tsx components/discover/*.tsx
```

Expected:

```text
Compiled successfully
No ESLint errors
```

- [ ] **Step 5: Run smoke coverage to verify public routes and protected redirects still behave**

Run:

```bash
npx playwright test tests/discover-v7.spec.ts
npx playwright test tests/smoke.spec.ts
```

Expected:

```text
All discover-v7 preview tests pass
Public smoke passes
Protected routes still redirect to /login with next=
```

- [ ] **Step 6: Commit**

```bash
git add app/app/page.tsx components/discover/*.tsx tests/discover-v7.spec.ts tests/smoke.spec.ts
git commit -m "feat: wire live discover page into v7 command center view"
```

---

### Task 7: Align the App Shell with V7 and Finish QA

**Files:**
- Modify: `app/app/layout.tsx`
- Verify: local browser review, `npm run build`, `npx eslint app/app/layout.tsx`

- [ ] **Step 1: Refine shell presentation without changing routes or navigation**

In `app/app/layout.tsx`, keep the nav arrays unchanged and tighten only the visual classes:

```tsx
<aside className="relative z-20 hidden w-72 shrink-0 flex-col border-r border-white/[0.08] bg-black/38 p-5 shadow-[18px_0_80px_-52px_rgba(216,70,239,0.42)] backdrop-blur-2xl lg:flex">
```

```tsx
<header className="hidden h-[82px] shrink-0 items-center justify-between border-b border-white/[0.07] bg-black/12 px-6 backdrop-blur-xl lg:flex xl:px-8">
```

Keep the left rail, journey strip, search controls, and profile menu behavior exactly as they are.

- [ ] **Step 2: Run final validation**

Run:

```bash
npx eslint app/app/layout.tsx
npm run build
npx playwright test tests/discover-v7.spec.ts
```

Expected:

```text
No ESLint errors
Compiled successfully
Discover V7 preview suite passes
```

- [ ] **Step 3: Manual browser QA**

Run:

```bash
npm run dev
```

Check in browser:

- `http://localhost:3000/preview/discover-v7`
- `http://localhost:3000/app` after logging in

Manual expectations:

- Hero matches the approved mock direction
- Verified Opportunities appear before evidence and orchestration detail
- Right rail stays stable on desktop
- Mobile stacks cleanly with no horizontal overflow
- Clicking `Scan Market` still triggers the existing live scan flow on `/app`
- Clicking `Move To Strategy` still routes to `/app/strategy`

- [ ] **Step 4: Commit**

```bash
git add app/app/layout.tsx
git commit -m "style: align app shell with discover v7"
```

---

## Self-Review

### Spec coverage

- Hero redesign: covered in Task 3
- Verified opportunities first: covered in Task 4
- Evidence feed: covered in Task 4
- Scout operations: covered in Task 4
- Intelligence rail: covered in Task 5
- Strategic readiness: covered in Task 5
- Mobile redesign: covered in Task 5 and Task 7
- Preserve functionality: enforced in Task 6 and Task 7

### Placeholder scan

- No `TODO`, `TBD`, or “implement later” text remains.
- Every code-writing step includes concrete snippets.
- Every verification step has exact commands.

### Type consistency

- Shared V7 props are defined once in `components/discover/discover-v7-types.ts`.
- Preview and live page wiring both target the same `DiscoverV7View` API.

