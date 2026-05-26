# Guided Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the placeholder guided-flow routes with a real session-driven Find -> Create -> Sell -> Launch workflow.

**Architecture:** Keep the new flow entirely inside `ActiveBuildSessionContext` so each stage reads and writes structured in-memory state with local persistence. Reuse existing saved workflow data where useful, then redirect legacy pages to the new guided routes once the replacements are live.

**Tech Stack:** Next.js App Router, React client components, existing WIZUP UI primitives, TypeScript.

---

### Task 1: Expand active build session state

**Files:**
- Modify: `app/context/ActiveBuildSessionContext.tsx`

- [ ] Add typed `selected_idea`, `product_draft`, `sales_kit`, `launch_readiness`, `next_action`, and `updated_at` fields plus setters/helpers.
- [ ] Add local persistence so the guided flow survives route changes and refreshes.

### Task 2: Implement guided pages

**Files:**
- Modify: `app/app/find/page.tsx`
- Modify: `app/app/create/page.tsx`
- Modify: `app/app/sell/page.tsx`
- Modify: `app/app/launch/page.tsx`
- Modify: `app/app/team/page.tsx`

- [ ] Make `find` load saved ideas, search/filter them, and call `startBuildFromIdea` before routing to `/app/create`.
- [ ] Make `create` consume the selected idea, author a structured product draft, persist it to session state, and continue to `/app/sell`.
- [ ] Make `sell` consume the product draft, author a structured sales kit, persist it, and continue to `/app/launch`.
- [ ] Make `launch` consume the sales kit, compute checklist/readiness/preview, and persist launch readiness.
- [ ] Replace `team` with a static trust-layer page only.

### Task 3: Update saved-item routing and legacy pages

**Files:**
- Modify: `app/app/saved/saved-client.tsx`
- Modify: `app/app/ideas/page.tsx`
- Modify: `app/app/examples/page.tsx`
- Modify: `app/app/product/page.tsx`
- Modify: `app/app/sales-kit/page.tsx`
- Modify: `app/app/store/page.tsx`

- [ ] Remove legacy saved-item labels/links and route saved assets into the new guided stages.
- [ ] Convert the legacy workflow pages into explicit redirects after the new pages are implemented.

### Task 4: Verify

**Files:**
- None

- [ ] Run `npm run build`.
- [ ] Fix every resulting error until the build exits successfully or a concrete blocker remains.
