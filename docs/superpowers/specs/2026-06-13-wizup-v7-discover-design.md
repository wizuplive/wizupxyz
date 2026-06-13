# WIZUP V7 Discover Design

## Objective

Redesign the WIZUP Command Center starting with the Discover page so it feels like a premium demand intelligence headquarters while preserving all existing backend logic, routes, workflows, agent orchestration, authentication, and data behavior.

This is a UI and UX transformation only.

## Approved Direction

- **Design mode:** Balanced hybrid
- **Visual character:** Premium product operating system with executive intelligence cues
- **Information priority:** Verified opportunities first
- **Hero intensity:** Keep close to the approved mock
- **Desktop structure:** Main content canvas with a persistent right intelligence rail

## Product Intent

Discover must communicate one thing immediately:

WIZUP is a demand discovery engine, not an idea generator.

The page should make the user feel that Scout is investigating real market demand, validating signals, and surfacing opportunities worth moving into Strategy.

## Functional Guardrails

The redesign must not modify:

- Authentication
- Supabase usage
- Database schema
- Server actions
- API routes
- Tavily integration
- Gemini integration
- Opportunity scoring logic
- Strategy creation logic
- Build pipeline
- Publish pipeline
- Store pipeline
- Saved items behavior
- AI Team behavior

Only visual structure, layout, spacing, hierarchy, content presentation, responsiveness, and polish may change.

## Source Of Truth

The approved V6 homepage aesthetic becomes the design source of truth for V7 Discover.

Required carryover:

- Confident typography hierarchy
- Spacious layout rhythm
- Restrained atmospheric glow
- Deep charcoal and midnight surfaces
- Premium glass and border treatment
- Controlled purple-magenta accent system
- Executive tone instead of playful SaaS energy

The app should feel like the same product family as V6, not like a separate dashboard theme.

## Shell

The existing shell remains in place:

- Left sidebar
- Top workflow strip
- Search controls
- User controls
- Existing routes and navigation patterns

The redesign modernizes presentation, spacing, active states, and container quality only.

## Page Architecture

The Discover page should follow this desktop hierarchy:

1. Hero
2. Verified Opportunities
3. Market Evidence Stream
4. Scout Operations and comparison support
5. Persistent right intelligence rail

The desktop body should use a two-part structure:

- **Main canvas:** large, spacious, outcome-oriented
- **Right intelligence rail:** narrower, persistent, contextual, research-focused

This prevents the page from collapsing into a dense multi-column widget grid.

## Hero

The hero remains visually similar in emotional intensity to the approved mock, but its job is clearer:

- Frame Discover as mission control for demand discovery
- Lead with search
- Introduce verified intelligence, not abstract ideas

### Hero Content

- **Eyebrow:** Opportunity discovery studio
- **Headline:** Find demand before you build.
- **Subheadline:** Discover verified opportunities backed by real-world signals, buyer intent, market evidence, and commercial viability.

### Search Experience

The search field is the focal point of the hero:

- Large
- Premium
- Confident
- Visually central

Placeholder:

`What market would you like Scout to investigate?`

Examples may include:

- Hair growth
- Boxing
- Dog training
- AI agents
- Parenting
- Meal planning
- Productivity

### Hero Filters

The filter row remains directly tied to search and should appear as a secondary control layer:

- All Ideas
- High Momentum
- Fast Growing
- Low Competition
- Evergreen

### Hero Visualization

The right side of the hero becomes a premium signal intelligence visualization.

It should communicate:

- Source relationships
- Signal clusters
- Confidence pulses
- Live market mapping

It must not look like:

- Web3 art
- Crypto dashboards
- Decorative generative wallpaper

The graphic should feel research-driven and product-specific.

## Metrics Strip

The current metric tiles should no longer behave like generic KPI cards.

They should instead feel like intelligence state readouts with stronger narrative meaning:

- Verified Signals
- Active Sources
- Confidence Average
- Opportunities Found

Each module should feel closer to a research console than a growth dashboard.

## Verified Opportunities

This is the primary section beneath the hero and should dominate the page.

The current narrow card treatment should be replaced with large opportunity canvases that feel like investment memos or business cases.

### Opportunity Canvas Content

Each opportunity should display:

- Title
- Opportunity Score
- Demand Score
- Competition Score
- Monetization Score
- Buildability Score
- Launch Speed Score
- Confidence Score
- Audience
- Core Problem
- Why Now
- Evidence Summary
- Top Supporting Sources

### Call To Action

The primary action must be clearly dominant:

`Move To Strategy`

This should feel like a strategic decision, not a casual click target.

### Comparison Behavior

Comparison should be built into this section as a premium decision support pattern.

Users should be able to compare opportunities side by side across:

- Demand
- Competition
- Monetization
- Launch Speed
- Build Complexity
- Audience Size
- Confidence
- Opportunity Score

The experience should feel like evaluating options for investment, not browsing ideas.

## Market Evidence Stream

This section sits under Verified Opportunities and explains why those opportunities exist.

It is a core differentiator for WIZUP and should feel like an intelligence feed rather than a notification stack.

### Evidence Types

- Reddit Signal
- Forum Discussion
- Search Trend
- Question Cluster
- Buyer Complaint
- Competitor Weakness
- Emerging Demand
- Market Shift

### Evidence Card Content

- Source
- Signal Strength
- Confidence
- Summary
- Timestamp

The section should help the user trust the opportunity outputs without upstaging them.

## Scout Operations

Scout should no longer feel hidden.

This section should visualize the active process:

Sources -> Signal Extraction -> Pattern Detection -> Scoring -> Opportunity Ranking

When scanning is active, the UI should show evidence processing and research movement rather than generic loading.

This section should feel operational and intelligent, but not louder than Verified Opportunities.

## Right Intelligence Rail

The right rail stays visible alongside the main canvas on desktop.

Its purpose is context, synthesis, and operational awareness.

### Intelligence Briefing

This panel replaces the weaker quick-preview concept and should read like an analyst-prepared briefing.

Display:

- Opportunity Summary
- Audience
- Pain Points
- Evidence
- Monetization Signals
- Competitive Landscape
- Build Potential
- Supporting Sources
- Confidence
- Provider
- Signal Strength

### Agent Orchestration

This expands AI Team Activity into a more strategic panel.

Display agents such as:

- Scout
- Strategist
- Analyst
- Creator
- Reviewer

Each row should show:

- Current task
- Status
- Confidence
- Last action
- Dependency state

The goal is to make orchestration legible and premium without becoming mechanically dense.

### Strategic Readiness

This visually reframes Build Progress into a more strategic downstream panel.

It should cover:

- Discover
- Strategy
- Build
- Publish
- Store

Each stage should show:

- Status
- Confidence
- Agent owner
- Readiness state

Avoid generic progress-bar language. This should feel like operational readiness, not onboarding progress.

## Mobile Behavior

Mobile is not a scaled-down desktop.

The mobile order should be:

1. Hero
2. Verified Opportunities
3. Market Evidence Stream
4. Scout Operations
5. Comparison
6. Strategic Readiness
7. Agent Orchestration
8. Intelligence Briefing

### Mobile Requirements

- No horizontal scrolling
- No compressed opportunity cards
- No unreadable side-by-side density
- Minimum 44px touch targets
- Responsive type scale
- Responsive spacing
- Rebuilt grid behavior where needed

The right rail content should stack into the mobile flow instead of staying sidebar-like.

## Visual Tone

The page should feel:

- Premium
- Spacious
- Strategic
- Intentional
- Executive
- Intelligence-focused

It should not feel:

- Overcrowded
- Widget-heavy
- Templated
- Over-glowy
- Like a generic admin panel

Reference framing:

Bloomberg Terminal meets Linear meets Stripe Dashboard, interpreted through the V6 WIZUP aesthetic.

## Implementation Notes

This design should be executed primarily through:

- Recomposition of the existing Discover page layout
- Reprioritization of sections
- Refined containers and spacing
- Better visual grouping
- Improved desktop and mobile responsiveness

It should avoid:

- Rewriting Discover logic
- Rewiring data flow
- Introducing new backend dependencies
- Inventing fake product functionality

## Success Criteria

The redesign succeeds if a user landing on Discover immediately understands:

- WIZUP finds real market demand
- Scout is performing evidence-based research
- Verified opportunities are the page’s core output
- Strategy is the next meaningful action
- The rest of the WIZUP workflow is downstream from Discover

The finished page should feel dramatically more premium and more strategic than the current Discover experience while preserving all existing production functionality.
