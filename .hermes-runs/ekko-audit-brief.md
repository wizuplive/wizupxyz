# WIZUP Premium UI Audit Brief
## Prepared by JAZZPRO for EKKO/Gemini Design Review
### Canonical repo: /Users/Ira/Desktop/wizup-3.0
### Target: /app command center + guided-flow shell (Home -> Find -> Create -> Sell -> Launch -> Saved -> Team)

---

## Current State Summary

### Architecture
- Next.js 15 + React 19 + TypeScript + Tailwind v4 + shadcn/ui
- Dark theme: bg-[#0A0A0B], white text, primary accent (fuchsia/magenta), cards with border-white/5
- Layout: sidebar nav (desktop, w-64), mobile bottom nav, desktop header with search + user avatar dropdown
- Active build session context persists per-user in localStorage + state

### Pages & Current Visual Quality

| Route | Current State | Visual Quality |
|-------|--------------|----------------|
| /app (Home) | Centered title + single CTA button when empty; single card when active | 2/10 - Underwhelming for command center |
| /app/find | Search input + topic pills + idea cards grid (badges, scores, metadata) | 5/10 - Functional but generic SaaS |
| /app/create | Stacked form inputs (title, subtitle, promise, buyer, price, features, proof points, modules as pipe-delimited textarea) | 3/10 - Raw form, no visual hierarchy |
| /app/sell | Stacked form inputs (headline, subheadline, benefits, emails, FAQ, social posts as pipe-delimited textarea) | 3/10 - Raw form, no visual hierarchy |
| /app/launch | Readiness score, checklist, preview cards, priority fixes | 6/10 - Most developed but still flat |
| /app/saved | Card grid with filters (All/Ideas/Products/Sales kits), search, date formatting | 5/10 - Functional archive |
| /app/team | Static 2x2 trust-layer cards with icons | 4/10 - Clean but minimal |

### Layout Shell (/app/layout.tsx)
- Desktop: sidebar with nav items (icon + label), "Ready to build?" CTA card at bottom, header with search placeholder + user dropdown
- Mobile: top header with WIZUP logo + avatar, bottom tab nav (5 items)
- Active nav indicator: small dot in circle for active, regular icon for inactive

---

## Design Direction (from Product Vision)

The WIZUP product should feel like:
- **Cinematic dark command center** — not a generic SaaS dashboard
- **Beginner-friendly guided flow** — obvious next action at every stage
- **Premium product-building cockpit** — the user is the operator, WIZUP is the co-pilot
- **Clear progression** — Home -> Find -> Create -> Sell -> Launch should feel like a journey with visible momentum

Reference aesthetic: Linear-style precision + Notion-style clarity + cinematic dark mode (black/charcoal with magenta/purple accents, serif headlines, rounded premium panels)

---

## Identified Visual Gaps & Hierarchy Issues

### 1. /app (Home) — CRITICAL: Needs Complete Redesign
**Current:** Empty state shows only "What do you want to make today?" + one button. Active state shows one card with title + stage + continue button.
**Gap:** No command center feel. No progress visualization. No recent activity. No quick actions. No stage pipeline visualization.
**Expected:** 
- Pipeline/progress bar showing 5 stages (Find -> Create -> Sell -> Launch) with current stage highlighted
- Active build card with rich preview (idea title, current stage badge, completion %, next action CTA)
- Quick action grid when empty ("Find an idea", "Browse saved", "View team")
- Recent activity/history if available
- Welcome greeting with user name

### 2. Guided Flow Progress — MISSING
**Gap:** There is NO visual indication across any page that the user is in a guided flow. No stepper, no progress bar, no breadcrumb trail, no "Step 2 of 5" indicator.
**Expected:** Persistent mini-stepper or breadcrumb at top of /app/find, /app/create, /app/sell, /app/launch showing: Find Idea -> Design Product -> Build Sales Kit -> Prepare Launch. Current step highlighted, completed steps checkmarked, future steps muted.

### 3. /app/create & /app/sell — CRITICAL: Form Layout Disaster
**Current:** Both pages are just stacked `<Textarea>` inputs with labels. The module/email/FAQ inputs use pipe-delimited textareas (`title | goal | assets | outcome`) which is developer-friendly but user-hostile.
**Gap:** No section grouping. No visual hierarchy. No inline help. No preview-as-you-type. No save indicators. Pipe-delimited input is abstraction leakage.
**Expected:**
- Grouped sections with clear headers (Positioning, Content, Structure)
- Rich inputs: title as single-line input, description as textarea, features as tag-input (add/remove chips), modules as repeatable card rows (not pipe-delimited)
- Live preview panel showing how the product/sales page will look
- Auto-save indicator
- "Continue to [Next Stage]" prominent CTA at bottom

### 4. /app/find — MODERATE: Card Polish Needed
**Current:** Idea cards have: verdict badge + difficulty badge + title + score pill + problem description + 4-column metadata grid + Create/Save buttons.
**Gap:** Cards feel flat. Score pill is just text in a rounded box. No hover lift. No visual priority ranking. Search input is generic.
**Expected:**
- Cards with subtle gradient or depth on hover
- Opportunity score as a visual gauge (circular or bar) not just text
- Better typography hierarchy: title larger, problem description more readable
- "Why now" indicator or trend signal
- Staggered/animated entry for cards

### 5. /app/launch — MODERATE: Score Visualization
**Current:** Readiness score as number + checklist + preview cards.
**Gap:** Score is just a number. No visual gauge. Checklist is plain text. Preview cards are simple.
**Expected:**
- Circular or arc progress gauge for readiness score
- Color-coded checklist (green checkmarks, amber warnings, red blockers)
- Launch preview as realistic mockup (hero section, pricing card, trust badge)
- "You're X% ready" with celebratory threshold moments

### 6. /app/saved — LOW: Archive Feel
**Current:** Card grid with type filters, search, delete/load actions.
**Gap:** Just an archive. No visual distinction between item types.
**Expected:**
- Type-specific icons/colors for Ideas vs Products vs Sales Kits
- Grid/list view toggle
- Better empty state

### 7. /app/team — LOW: Needs Personality
**Current:** Static 2x2 cards explaining trust boundaries.
**Gap:** Text-heavy. No visual personality.
**Expected:**
- Illustrated or animated icons
- More engaging copy ("Your AI co-pilot", "You're the captain")
- Team/agent visualization concept

### 8. Layout Shell — MODERATE
**Current:** Sidebar with simple icon+label nav. Active state is a small dot.
**Gap:** Sidebar is basic. Bottom nav on mobile is just icons + labels. No stage awareness in nav.
**Expected:**
- Sidebar nav items could show stage completion status (checkmark on completed stages)
- Mobile bottom nav could use a "current stage" highlight treatment
- Sidebar CTA card "Ready to build?" is good but could be more visually premium

---

## Copy / Framing Issues

1. **"What do you want to make today?"** — Too open-ended for beginners. Should be: "Start your next product" or "Find a winning idea" with clearer framing.
2. **"Stage: create"** — Lowercase stage names look unprofessional. Should be: "Stage: Design Product" or "Step 2: Design Your Product".
3. **Pipe-delimited placeholders** — "title | goal | assets | outcome" is developer jargon. Should be structured form with individual fields.
4. **"Start Scan"** — Good CTA but could be more action-oriented: "Find Winning Ideas".

---

## First Page to Redesign (Priority Order)

### Phase 1: /app (Home) — Command Center
**Why first:** This is the landing experience. Every user sees it. It sets the tone. Currently it's the weakest page.
**Scope:** 
- Pipeline/progress visualization component
- Active build status card (rich)
- Empty state with guided options
- Welcome header with user name

### Phase 2: /app/create & /app/sell — Form Experience
**Why second:** These are where users spend the most time. Current pipe-delimited textarea is a UX disaster.
**Scope:**
- Structured form with individual fields (not pipe-delimited)
- Tag inputs for lists (features, proof points, benefits)
- Repeatable rows for modules/emails/FAQ
- Live preview panel
- Section grouping with headers

### Phase 3: /app/find — Card Polish + Search
**Why third:** Discovery page needs to feel exciting, not like a spreadsheet.
**Scope:**
- Richer card design with depth
- Visual opportunity score gauge
- Better search/filter experience
- Staggered animations

### Phase 4: Guided Flow Shell
**Why fourth:** Once pages are redesigned, add the persistent progress indicator.
**Scope:**
- Mini stepper component for top of flow pages
- Nav sidebar completion indicators
- Stage transition animations

---

## Implementation-Ready Spec for Codex (Phase 1: /app Home)

### Component: HomeDashboard
**Location:** `app/app/page.tsx` (replace current)
**Design tokens:**
- Container: `max-w-5xl mx-auto p-8`
- Section header: `text-3xl font-bold text-white mb-2` (serif font if available)
- Subheader: `text-white/50 text-sm`
- Card: `bg-card border border-white/5 rounded-2xl p-6`
- Primary CTA: `bg-primary hover:bg-primary/90 text-white h-12 px-8 rounded-lg`
- Secondary CTA: `bg-white/5 hover:bg-white/10 text-white border border-white/10`
- Progress step: `w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold`
  - Completed: `bg-emerald-500/20 text-emerald-400 border border-emerald-500/30`
  - Current: `bg-primary/20 text-primary border border-primary/40`
  - Future: `bg-white/5 text-white/30 border border-white/10`
- Connector line: `h-[2px] flex-1 bg-white/10` (future), `bg-emerald-500/30` (completed)

### Layout when NO active session:
1. Welcome header: "Welcome back, [displayName]" or "Let's build something" (centered or left-aligned)
2. Quick action grid (3 cards):
   - "Find an idea" (Lightbulb icon) -> /app/find
   - "Browse saved" (Archive icon) -> /app/saved
   - "Meet your team" (Bot icon) -> /app/team
3. Bottom: "New to WIZUP? Start with Find" with arrow

### Layout when active session EXISTS:
1. Welcome header: "Your current build"
2. Pipeline stepper (horizontal):
   [Find]---[Create]---[Sell]---[Launch]
   Shows completed steps with checkmarks, current step highlighted, future steps muted
3. Active build card:
   - Title (large)
   - Stage badge ("Step 2: Design Product")
   - Completion estimate (e.g., "3 of 7 sections complete")
   - Mini preview of what's filled in
   - Big "Continue building" CTA -> current stage route
4. Quick actions below: "Start new build" (secondary, resets), "View sales kit" (if past sell stage)

### Responsive:
- Desktop: left-aligned content, full stepper visible
- Mobile: stacked, stepper becomes 4 dots with current label

### Implementation notes for Codex:
- Use existing `useActiveBuild()` hook to read `activeSession`
- Use existing `navItems` stage mapping: find->create->sell->launch
- No new dependencies needed (uses existing Button, Card, Badge from shadcn)
- Keep all existing auth/user logic intact

---

## Files to Inspect for Full Audit

EKKO should also review these for deeper analysis:
- `app/app/layout.tsx` — shell, sidebar, mobile nav
- `app/app/find/page.tsx` — idea discovery, card component
- `app/app/create/page.tsx` — product draft form
- `app/app/sell/page.tsx` — sales kit form
- `app/app/launch/page.tsx` — readiness dashboard
- `app/app/saved/saved-client.tsx` — archive grid
- `app/app/team/page.tsx` — trust layer
- `components/workflow/workflow-panels.tsx` — shared workflow components
- `components/ui/*` — shadcn component library baseline

---

## Next Steps

1. EKKO reviews this brief and current file contents
2. EKKO produces refined visual specs (spacing, colors, typography scale, animation specs)
3. JAZZPRO compiles EKKO specs into Codex dispatch prompts
4. Codex implements per-phase (Home first, then Create/Sell, then Find, then shell)
5. JAZZPRO validates each phase with browser runtime check + build pass

Awaiting EKKO design review and refined spec.
