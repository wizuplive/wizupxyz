'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Archive,
  BookOpen,
  Boxes,
  Check,
  Clock3,
  Copy,
  Eye,
  FileText,
  Heart,
  LayoutTemplate,
  Lightbulb,
  PenLine,
  Rocket,
  Search,
  Sparkles,
  Star,
  Target,
  Trash2,
  TrendingUp,
  WandSparkles,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import type {
  SavedExample,
  SavedIdea,
  SavedProduct,
  SavedSalesAsset,
} from '@/app/actions/workflow';
import { useActiveBuild, type BuildSession, type BuildStage } from '@/app/context/ActiveBuildSessionContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Filter = 'All' | 'Ideas' | 'Strategies' | 'Products' | 'Drafts' | 'Published' | 'Favorites';

type WorkspaceItem = {
  id: string;
  filterType: Exclude<Filter, 'All'>;
  title: string;
  description: string;
  date: string;
  label: string;
  progress: string;
  state: string;
  link: string;
  detailsLink: string;
  icon: React.ElementType;
  accent: string;
  favorite?: boolean;
  currentStage: WorkflowStep;
  lastAiActivity: string;
  workflow: Record<WorkflowStep, boolean>;
  nextAction: string;
};

type WorkflowStep = 'Discover' | 'Strategy' | 'Build' | 'Publish' | 'Store';

const workflowSteps: WorkflowStep[] = ['Discover', 'Strategy', 'Build', 'Publish', 'Store'];

const filters: Filter[] = ['All', 'Ideas', 'Strategies', 'Products', 'Drafts', 'Published', 'Favorites'];

const fallbackItems: WorkspaceItem[] = [
  {
    id: 'starter-idea',
    filterType: 'Ideas',
    title: 'ADHD Planner System',
    description: 'A simple planning system for people who want calmer days.',
    date: new Date().toISOString(),
    label: 'Saved opportunity',
    progress: 'Ready for strategy',
    state: 'High Momentum',
    link: '/app/strategy',
    detailsLink: '/app/strategy',
    icon: Lightbulb,
    accent: 'from-fuchsia-400/28 to-purple-500/10',
    favorite: true,
    currentStage: 'Discover',
    lastAiActivity: 'Scout found buyer demand',
    workflow: workflowForStage('Discover'),
    nextAction: 'Continue Strategy',
  },
  {
    id: 'starter-product',
    filterType: 'Products',
    title: 'Freelance Proposal Kit',
    description: 'Templates for new freelancers who want better client replies.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(),
    label: 'Active build',
    progress: '72% complete',
    state: 'In progress',
    link: '/app/build',
    detailsLink: '/app/build',
    icon: LayoutTemplate,
    accent: 'from-violet-400/24 to-fuchsia-500/10',
    currentStage: 'Build',
    lastAiActivity: 'Creator drafted product sections',
    workflow: workflowForStage('Build'),
    nextAction: 'Continue Build',
  },
  {
    id: 'starter-published',
    filterType: 'Published',
    title: 'Calm Launch Checklist',
    description: 'A clean launch guide for first-time digital product creators.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
    label: 'Store product',
    progress: '$7.8K revenue',
    state: 'Published',
    link: '/app/store',
    detailsLink: '/app/store',
    icon: Rocket,
    accent: 'from-emerald-300/16 to-fuchsia-500/10',
    currentStage: 'Store',
    lastAiActivity: 'Analyst checked store growth',
    workflow: workflowForStage('Store'),
    nextAction: 'Continue Store',
  },
  {
    id: 'starter-draft',
    filterType: 'Drafts',
    title: 'Creator Pricing Workbook',
    description: 'A workbook that helps creators choose a simple first price.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 44).toISOString(),
    label: 'AI draft',
    progress: 'Needs review',
    state: 'Draft',
    link: '/app/publish',
    detailsLink: '/app/publish',
    icon: FileText,
    accent: 'from-white/12 to-fuchsia-500/8',
    currentStage: 'Publish',
    lastAiActivity: 'Reviewer prepared sales assets',
    workflow: workflowForStage('Publish'),
    nextAction: 'Continue Publish',
  },
  {
    id: 'starter-strategy',
    filterType: 'Strategies',
    title: 'Study Planner Market Angle',
    description: 'Positioning notes, buyer angle, and first MVP path.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 76).toISOString(),
    label: 'Saved strategy',
    progress: 'Angle defined',
    state: 'Ready',
    link: '/app/strategy',
    detailsLink: '/app/strategy',
    icon: Target,
    accent: 'from-fuchsia-400/20 to-violet-500/10',
    favorite: true,
    currentStage: 'Strategy',
    lastAiActivity: 'Strategist defined positioning',
    workflow: workflowForStage('Strategy'),
    nextAction: 'Continue Strategy',
  },
  {
    id: 'starter-template',
    filterType: 'Favorites',
    title: 'Launch Kit Template',
    description: 'A favorite starter kit for product pages and launch emails.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 118).toISOString(),
    label: 'Favorite template',
    progress: 'Saved',
    state: 'Favorite',
    link: '/app/saved',
    detailsLink: '/app/saved',
    icon: Star,
    accent: 'from-amber-300/16 to-fuchsia-500/10',
    favorite: true,
    currentStage: 'Discover',
    lastAiActivity: 'Template saved to workspace',
    workflow: workflowForStage('Discover'),
    nextAction: 'Continue Strategy',
  },
];

const stats = [
  { label: 'Saved Projects', value: '24', change: '+6', icon: Boxes, featured: true },
  { label: 'Active Builds', value: '04', change: '+1', icon: WandSparkles },
  { label: 'Published Products', value: '03', change: 'Live', icon: Rocket },
  { label: 'Revenue Generated', value: '$42.8K', change: '+18%', icon: TrendingUp },
  { label: 'AI Assets Created', value: '128', change: '+32', icon: Sparkles },
];

const activity = [
  { title: 'ADHD Planner updated', detail: 'Build progress saved', time: '12 min ago' },
  { title: 'Sales page ready', detail: 'Publish assets finished', time: '1 hr ago' },
  { title: 'New idea saved', detail: 'Study Planner App Kit', time: 'Yesterday' },
];

const assistantSuggestions = [
  'Continue your ADHD Planner',
  'Your sales page is ready',
  'Review your launch assets',
  'Complete your storefront setup',
];

const templates = ['Launch kit', 'Notion system', 'Coaching offer', 'Creator bundle'];

export function SavedClient({
  ideas,
  examples,
  products,
  salesAssets,
}: {
  ideas: SavedIdea[];
  examples: SavedExample[];
  products: SavedProduct[];
  salesAssets: SavedSalesAsset[];
}) {
  const { activeSession, updateStage } = useActiveBuild();
  const [filter, setFilter] = useState<Filter>('All');
  const [search, setSearch] = useState('');
  const [archivedIds, setArchivedIds] = useState<string[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [duplicatedItems, setDuplicatedItems] = useState<WorkspaceItem[]>([]);

  const savedItems = useMemo(() => buildWorkspaceItems({ ideas, examples, products, salesAssets }), [ideas, examples, products, salesAssets]);
  const workspaceItems = useMemo(() => {
    const baseItems = savedItems.length ? savedItems : fallbackItems;
    const activeItem = activeSession
      ? workspaceItemFromSession(activeSession)
      : null;

    const mergedItems = activeItem
      ? [activeItem, ...baseItems.filter((item) => item.id !== activeItem.id)]
      : baseItems;

    return [...duplicatedItems, ...mergedItems];
  }, [activeSession, duplicatedItems, savedItems]);

  const filteredItems = workspaceItems.filter((item) => {
    if (archivedIds.includes(item.id) || deletedIds.includes(item.id)) return false;
    const matchesFilter =
      filter === 'All' ||
      item.filterType === filter ||
      (filter === 'Favorites' && item.favorite);
    const matchesSearch =
      !search ||
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.label.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  function duplicateItem(id: string) {
    const item = workspaceItems.find((entry) => entry.id === id);
    if (!item) return;
    const copyId = `${id}-copy-${Date.now()}`;
    setDuplicatedItems((current) => [
      {
        ...item,
        id: copyId,
        title: `${item.title} Copy`,
        date: new Date().toISOString(),
        state: 'Duplicated',
        lastAiActivity: 'Workspace copy created',
      },
      ...current,
    ]);
  }

  function archiveItem(id: string) {
    setArchivedIds((current) => (current.includes(id) ? current : [...current, id]));
  }

  function deleteItem(id: string) {
    setDeletedIds((current) => (current.includes(id) ? current : [...current, id]));
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-7">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.075] bg-[linear-gradient(145deg,rgba(255,255,255,0.068),rgba(255,255,255,0.023)_39%,rgba(6,6,12,0.93))] p-5 shadow-[0_32px_108px_-74px_rgba(217,70,239,0.86)] backdrop-blur-2xl sm:p-8 lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(217,70,239,0.15),transparent_31%),radial-gradient(circle_at_42%_0%,rgba(124,58,237,0.12),transparent_34%)]" />
        <div className="relative grid gap-8 lg:grid-cols-[0.96fr_1.04fr] lg:items-center">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-fuchsia-300/16 bg-fuchsia-400/[0.07] px-3 py-1.5 text-xs font-medium text-fuchsia-100">
              <BookOpen className="h-3.5 w-3.5" />
              Creator workspace
            </div>
            <h1 className="mb-4 max-w-3xl text-4xl font-semibold leading-[0.98] tracking-[-0.055em] text-white sm:text-5xl lg:text-6xl">
              Everything You&apos;re Building. In One Place.
            </h1>
            <p className="mb-7 max-w-xl text-base leading-7 text-white/64 sm:text-lg">
              Save ideas, revisit strategies, manage products, and continue building without losing momentum.
            </p>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <Link href="/app/build">
                <Button className="h-12 w-full rounded-2xl bg-fuchsia-500 px-6 font-semibold text-white shadow-[0_0_28px_-12px_rgba(217,70,239,0.88)] transition-all hover:bg-fuchsia-400 hover:shadow-[0_0_34px_-12px_rgba(217,70,239,0.95)] sm:w-auto">
                  <WandSparkles className="h-4 w-4" />
                  Resume Build
                </Button>
              </Link>
              <Link href="/app">
                <Button
                  variant="outline"
                  className="h-12 w-full rounded-2xl border-white/[0.085] bg-white/[0.035] px-6 text-white/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all hover:border-fuchsia-300/20 hover:bg-white/[0.06] hover:text-white sm:w-auto"
                >
                  <Sparkles className="h-4 w-4" />
                  Create New Product
                </Button>
              </Link>
            </div>
            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/38" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search saved work..."
                className="h-12 rounded-2xl border-white/[0.085] bg-black/34 pl-11 text-sm text-white placeholder:text-white/34 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus-visible:ring-fuchsia-300/20"
              />
            </div>
          </div>
          <WorkspaceVaultVisual />
        </div>
      </section>

      <section className="flex gap-2 overflow-x-auto rounded-2xl border border-white/[0.075] bg-white/[0.035] p-2 shadow-[0_24px_72px_-60px_rgba(217,70,239,0.52)] backdrop-blur-xl">
        {filters.map((item) => {
          const isActive = filter === item;
          return (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                isActive
                  ? 'bg-fuchsia-400/[0.14] text-white shadow-[0_0_24px_-14px_rgba(217,70,239,0.92)]'
                  : 'text-white/48 hover:bg-white/[0.04] hover:text-white/82'
              }`}
            >
              {item}
            </button>
          );
        })}
      </section>

      <section className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-5">
        {stats.map((item) => (
          <StatCard key={item.label} item={item} />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_350px]">
        <div className="space-y-5">
          <ActiveBuildPanel activeSession={activeSession} updateStage={updateStage} />

          <div>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold tracking-[-0.03em] text-white">Creator library</h2>
                <p className="mt-1 text-sm text-white/52">
                  Saved opportunities, strategies, product drafts, sales assets, and store projects.
                </p>
              </div>
              <span className="w-fit rounded-full border border-white/[0.07] bg-white/[0.035] px-3 py-1.5 text-xs text-white/48">
                {filteredItems.length} items
              </span>
            </div>

            {filteredItems.length === 0 ? (
              <div className="rounded-[1.75rem] border border-white/[0.075] bg-white/[0.038] p-8 text-center shadow-[0_28px_84px_-64px_rgba(217,70,239,0.72)] backdrop-blur-xl">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-fuchsia-300/16 bg-fuchsia-400/[0.08] text-fuchsia-100">
                  <LayoutTemplate className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-white">No matching saved work</h3>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/52">Try another filter or search term to keep moving.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 2xl:grid-cols-3">
                {filteredItems.map((item) => (
                  <WorkspaceCard
                    key={item.id}
                    item={item}
                    onDuplicate={duplicateItem}
                    onArchive={archiveItem}
                    onDelete={deleteItem}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-5">
          <SidePanel title="Recent Activity">
            <div className="space-y-3">
              {activity.map((item) => (
                <div key={item.title} className="flex gap-3 rounded-2xl border border-white/[0.06] bg-black/18 p-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-fuchsia-300/12 bg-fuchsia-400/[0.075] text-fuchsia-100">
                    <Clock3 className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <p className="mt-1 text-xs text-white/42">{item.detail}</p>
                    <p className="mt-2 text-[11px] text-white/30">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </SidePanel>

          <SidePanel title="AI Workspace Assistant">
            <div className="space-y-2.5">
              {assistantSuggestions.map((suggestion, index) => (
                <div key={suggestion} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-3 text-sm text-white/70">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-fuchsia-300/12 bg-fuchsia-400/[0.07] text-fuchsia-100">
                    {index === 0 ? <WandSparkles className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                  </div>
                  {suggestion}
                </div>
              ))}
            </div>
          </SidePanel>

          <SidePanel title="Favorite Templates">
            <div className="grid grid-cols-2 gap-2.5">
              {templates.map((template) => (
                <div key={template} className="rounded-xl border border-white/[0.06] bg-black/18 p-3">
                  <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg border border-fuchsia-300/12 bg-fuchsia-400/[0.075] text-fuchsia-100">
                    <Star className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-sm font-medium leading-tight text-white/78">{template}</p>
                </div>
              ))}
            </div>
          </SidePanel>
        </aside>
      </section>

      <section className="relative overflow-hidden rounded-[1.75rem] border border-fuchsia-300/14 bg-[linear-gradient(145deg,rgba(217,70,239,0.12),rgba(255,255,255,0.036)_44%,rgba(5,5,9,0.93))] p-6 shadow-[0_34px_104px_-70px_rgba(217,70,239,0.86)] backdrop-blur-2xl sm:p-8">
        <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-fuchsia-400/16 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.045em] text-white sm:text-3xl">Keep Building Momentum.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/58 sm:text-base">
              Your best ideas deserve follow-through. Continue creating, launching, and growing.
            </p>
          </div>
          <Link href="/app/build">
            <Button className="h-12 w-full rounded-2xl bg-fuchsia-500 px-7 font-semibold text-white shadow-[0_0_28px_-12px_rgba(217,70,239,0.88)] hover:bg-fuchsia-400 sm:w-fit">
              Open Creator Workspace
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

function buildWorkspaceItems({
  ideas,
  examples,
  products,
  salesAssets,
}: {
  ideas: SavedIdea[];
  examples: SavedExample[];
  products: SavedProduct[];
  salesAssets: SavedSalesAsset[];
}): WorkspaceItem[] {
  return [
    ...ideas.map((idea) => ({
      id: idea.id,
      filterType: 'Ideas' as const,
      title: idea.title,
      description: `Buyer: ${idea.buyer || 'Saved audience'}${idea.opportunityScore ? ` · Score ${idea.opportunityScore}/100` : ''}`,
      date: idea.updatedAt,
      label: 'Saved opportunity',
      progress: 'Ready for strategy',
      state: idea.opportunityScore && idea.opportunityScore > 80 ? 'High Momentum' : 'Saved',
      link: '/app/strategy',
      detailsLink: '/app/ideas',
      icon: Lightbulb,
      accent: 'from-fuchsia-400/28 to-purple-500/10',
      favorite: Boolean(idea.opportunityScore && idea.opportunityScore > 85),
      currentStage: 'Discover' as const,
      lastAiActivity: 'Scout saved the opportunity signal',
      workflow: workflowForStage('Discover'),
      nextAction: 'Continue Strategy',
    })),
    ...examples.map((example) => ({
      id: example.id,
      filterType: 'Strategies' as const,
      title: example.title,
      description: example.summary || 'Market pattern and strategy notes.',
      date: example.createdAt,
      label: 'Strategy note',
      progress: 'Saved insight',
      state: 'Ready',
      link: '/app/examples',
      detailsLink: '/app/examples',
      icon: PenLine,
      accent: 'from-violet-400/24 to-fuchsia-500/10',
      currentStage: 'Strategy' as const,
      lastAiActivity: 'Strategist saved the market angle',
      workflow: workflowForStage('Strategy'),
      nextAction: 'Continue Strategy',
    })),
    ...products.map((product) => ({
      id: product.id,
      filterType: 'Products' as const,
      title: product.title || 'Product Draft',
      description: product.buyer ? `Built for ${product.buyer}` : 'Product structure saved.',
      date: product.createdAt,
      label: 'Product build',
      progress: product.product?.modules?.length ? `${product.product.modules.length} modules` : 'In progress',
      state: 'Active',
      link: '/app/build',
      detailsLink: '/app/product',
      icon: LayoutTemplate,
      accent: 'from-fuchsia-400/22 to-violet-500/10',
      currentStage: 'Build' as const,
      lastAiActivity: 'Creator saved product draft',
      workflow: workflowForStage('Build'),
      nextAction: 'Continue Build',
    })),
    ...salesAssets.map((asset) => ({
      id: asset.id,
      filterType: 'Published' as const,
      title: asset.title || 'Launch Asset',
      description: asset.headline || 'Sales page and launch assets saved.',
      date: asset.createdAt,
      label: 'Launch asset',
      progress: 'Ready to publish',
      state: 'Published',
      link: '/app/store',
      detailsLink: '/app/publish',
      icon: Rocket,
      accent: 'from-emerald-300/16 to-fuchsia-500/10',
      favorite: true,
      currentStage: 'Publish' as const,
      lastAiActivity: 'Copywriter saved sales assets',
      workflow: workflowForStage('Publish'),
      nextAction: 'Continue Publish',
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function workflowForStage(stage: WorkflowStep): Record<WorkflowStep, boolean> {
  const activeIndex = workflowSteps.indexOf(stage);
  return workflowSteps.reduce(
    (workflow, step, index) => ({
      ...workflow,
      [step]: index <= activeIndex,
    }),
    {} as Record<WorkflowStep, boolean>
  );
}

function stageFromBuildStage(stage: BuildStage): WorkflowStep {
  if (stage === 'strategy') return 'Strategy';
  if (stage === 'build' || stage === 'create') return 'Build';
  if (stage === 'publish' || stage === 'sell') return 'Publish';
  if (stage === 'launch') return 'Store';
  return 'Discover';
}

function nextActionForWorkflow(stage: WorkflowStep) {
  if (stage === 'Discover' || stage === 'Strategy') return 'Continue Strategy';
  if (stage === 'Build') return 'Continue Build';
  if (stage === 'Publish') return 'Continue Publish';
  return 'Continue Store';
}

function linkForWorkflow(stage: WorkflowStep) {
  if (stage === 'Discover' || stage === 'Strategy') return '/app/strategy';
  if (stage === 'Build') return '/app/build';
  if (stage === 'Publish') return '/app/publish';
  return '/app/store';
}

function stageForHref(href: string): BuildStage {
  if (href.includes('/strategy')) return 'strategy';
  if (href.includes('/build')) return 'build';
  if (href.includes('/publish')) return 'publish';
  if (href.includes('/store')) return 'launch';
  return 'saved';
}

function workspaceItemFromSession(session: BuildSession): WorkspaceItem {
  const currentStage = stageFromBuildStage(session.current_stage);
  const draftTitle = session.product_draft?.title || session.selected_idea?.title || session.title;

  return {
    id: session.id,
    filterType:
      currentStage === 'Store'
        ? 'Published'
        : currentStage === 'Build'
          ? 'Products'
          : currentStage === 'Publish'
            ? 'Drafts'
            : currentStage === 'Strategy'
              ? 'Strategies'
              : 'Ideas',
    title: draftTitle,
    description: session.product_draft?.promise || session.selected_idea?.description || 'Active WIZUP workflow saved locally.',
    date: session.updated_at,
    label: 'Active project',
    progress: session.next_action,
    state: session.status.replaceAll('_', ' '),
    link: linkForWorkflow(currentStage),
    detailsLink: linkForWorkflow(currentStage),
    icon: currentStage === 'Store' ? Rocket : currentStage === 'Build' ? LayoutTemplate : currentStage === 'Publish' ? FileText : Target,
    accent: 'from-fuchsia-400/28 to-purple-500/10',
    favorite: true,
    currentStage,
    lastAiActivity: session.next_action,
    workflow: workflowForStage(currentStage),
    nextAction: nextActionForWorkflow(currentStage),
  };
}

function WorkspaceVaultVisual() {
  return (
    <div className="relative min-h-[320px]">
      <div className="absolute inset-x-8 bottom-4 h-14 rounded-[100%] bg-fuchsia-400/18 blur-3xl" />
      <div className="absolute right-2 top-4 h-44 w-44 rounded-full bg-fuchsia-400/14 blur-3xl" />
      <div className="absolute left-4 top-16 h-28 w-28 rounded-full bg-purple-500/10 blur-3xl" />

      <div className="relative mx-auto mt-6 h-[290px] max-w-[26rem]">
        <div className="absolute left-2 top-8 w-56 -rotate-6 rounded-[1.4rem] border border-white/[0.075] bg-[linear-gradient(145deg,rgba(255,255,255,0.082),rgba(255,255,255,0.025)_48%,rgba(7,7,12,0.88))] p-4 shadow-[0_26px_92px_-64px_rgba(217,70,239,0.76)] backdrop-blur-xl">
          <div className="mb-6 flex items-center justify-between">
            <div className="h-9 w-9 rounded-xl border border-fuchsia-300/14 bg-fuchsia-400/[0.08]" />
            <Heart className="h-4 w-4 text-fuchsia-100/70" />
          </div>
          <div className="mb-3 h-3 w-28 rounded-full bg-white/14" />
          <div className="h-2 w-36 rounded-full bg-white/7" />
        </div>

        <div className="absolute right-2 top-0 w-60 rotate-5 rounded-[1.4rem] border border-white/[0.075] bg-[linear-gradient(145deg,rgba(255,255,255,0.09),rgba(255,255,255,0.027)_44%,rgba(7,7,12,0.9))] p-4 shadow-[0_30px_100px_-64px_rgba(217,70,239,0.82)] backdrop-blur-xl">
          <div className="mb-4 h-24 rounded-2xl border border-white/[0.06] bg-[radial-gradient(circle_at_70%_24%,rgba(217,70,239,0.24),transparent_40%),rgba(255,255,255,0.035)]" />
          <div className="mb-3 h-3 w-32 rounded-full bg-white/16" />
          <div className="h-2 w-40 rounded-full bg-white/7" />
        </div>

        <div className="absolute bottom-0 left-1/2 w-72 -translate-x-1/2 rounded-[1.6rem] border border-fuchsia-300/14 bg-[linear-gradient(145deg,rgba(217,70,239,0.12),rgba(255,255,255,0.04)_42%,rgba(7,7,12,0.94))] p-5 shadow-[0_34px_118px_-62px_rgba(217,70,239,0.9)] backdrop-blur-2xl">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-fuchsia-100/72">Workspace vault</p>
              <p className="mt-1 text-lg font-semibold tracking-[-0.04em] text-white">24 saved projects</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-fuchsia-300/18 bg-fuchsia-400/[0.09] text-fuchsia-100">
              <Boxes className="h-5 w-5" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {['Ideas', 'Builds', 'Assets'].map((item, index) => (
              <div key={item} className="rounded-xl border border-white/[0.06] bg-black/22 p-3">
                <p className="text-[10px] text-white/38">{item}</p>
                <p className="mt-2 text-sm font-semibold text-white">{[9, 4, 11][index]}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ item }: { item: (typeof stats)[number] }) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl transition-all duration-500 hover:-translate-y-0.5 hover:border-fuchsia-300/18 ${
        item.featured
          ? 'border-fuchsia-300/18 bg-[linear-gradient(145deg,rgba(217,70,239,0.11),rgba(255,255,255,0.042)_48%,rgba(0,0,0,0.18))] shadow-[0_30px_90px_-64px_rgba(217,70,239,0.82)]'
          : 'border-white/[0.075] bg-white/[0.036] shadow-[0_24px_74px_-60px_rgba(217,70,239,0.55)]'
      }`}
    >
      <div className="absolute -right-12 -top-12 h-24 w-24 rounded-full bg-fuchsia-400/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative mb-4 flex items-center justify-between gap-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.08] bg-black/28 text-fuchsia-100 shadow-[inset_0_0_18px_rgba(217,70,239,0.08)]">
          <item.icon className="h-4 w-4" />
        </div>
        <span className="rounded-full border border-emerald-300/14 bg-emerald-400/[0.07] px-2.5 py-1 text-[10px] font-medium text-emerald-100/90">
          {item.change}
        </span>
      </div>
      <p className="relative mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-white/38">{item.label}</p>
      <p className="relative text-2xl font-semibold tracking-[-0.04em] text-white">{item.value}</p>
    </div>
  );
}

function ActiveBuildPanel({
  activeSession,
  updateStage,
}: {
  activeSession: BuildSession | null;
  updateStage: ReturnType<typeof useActiveBuild>['updateStage'];
}) {
  const currentStage = activeSession ? stageFromBuildStage(activeSession.current_stage) : 'Build';
  const title = activeSession?.product_draft?.title || activeSession?.selected_idea?.title || 'ADHD Planner System';
  const nextAction = activeSession?.next_action || 'Review the product sections and prepare the publish page.';
  const progress =
    currentStage === 'Store'
      ? 100
      : currentStage === 'Publish'
        ? 82
        : currentStage === 'Build'
          ? 72
          : currentStage === 'Strategy'
            ? 44
            : 20;
  const href = linkForWorkflow(currentStage);
  const buttonLabel = nextActionForWorkflow(currentStage);

  return (
    <section className="relative overflow-hidden rounded-[1.75rem] border border-fuchsia-300/14 bg-[linear-gradient(145deg,rgba(217,70,239,0.105),rgba(255,255,255,0.036)_44%,rgba(6,6,12,0.92))] p-5 shadow-[0_30px_96px_-68px_rgba(217,70,239,0.82)] backdrop-blur-xl sm:p-6">
      <div className="absolute -right-14 -top-16 h-36 w-36 rounded-full bg-fuchsia-400/14 blur-3xl" />
      <div className="relative grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-fuchsia-300/16 bg-fuchsia-400/[0.075] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.13em] text-fuchsia-100">
              Continue Building
            </span>
            <span className="rounded-full border border-emerald-300/14 bg-emerald-400/[0.07] px-3 py-1 text-xs text-emerald-100/90">
              AI team active
            </span>
          </div>
          <h2 className="text-2xl font-semibold tracking-[-0.045em] text-white">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/58">
            Next step: {nextAction}
          </p>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SmallMetric label="Progress" value={`${progress}%`} />
            <SmallMetric label="Current stage" value={currentStage} />
            <SmallMetric label="Estimate" value="18 min" />
          </div>
        </div>
        <div className="min-w-[13rem]">
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-white/[0.065]">
            <div className="h-full rounded-full bg-fuchsia-400 shadow-[0_0_16px_rgba(217,70,239,0.62)]" style={{ width: `${progress}%` }} />
          </div>
          <Link href={href} onClick={() => updateStage(stageForHref(href))}>
            <Button className="h-12 w-full rounded-2xl bg-fuchsia-500 font-semibold text-white shadow-[0_0_28px_-12px_rgba(217,70,239,0.88)] hover:bg-fuchsia-400">
              {buttonLabel}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function WorkspaceCard({
  item,
  onDuplicate,
  onArchive,
  onDelete,
}: {
  item: WorkspaceItem;
  onDuplicate: (id: string) => void;
  onArchive: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/[0.075] bg-[linear-gradient(145deg,rgba(255,255,255,0.052),rgba(255,255,255,0.022)_45%,rgba(7,7,12,0.9))] p-4 shadow-[0_26px_78px_-62px_rgba(217,70,239,0.64)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-fuchsia-300/18 hover:shadow-[0_32px_92px_-64px_rgba(217,70,239,0.86)]">
      <div className="absolute -right-14 -top-14 h-28 w-28 rounded-full bg-fuchsia-400/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
      <div className={`relative mb-4 flex h-28 items-end overflow-hidden rounded-2xl border border-white/[0.065] bg-gradient-to-br ${item.accent} p-3`}>
        <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-black/24 text-white/78">
          <item.icon className="h-5 w-5" />
        </div>
        <div>
          <span className="rounded-full border border-white/[0.08] bg-black/28 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white/58">
            {item.label}
          </span>
        </div>
      </div>
      <div className="relative mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-1 text-lg font-semibold tracking-[-0.035em] text-white">{item.title}</h3>
          <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-white/55">{item.description}</p>
        </div>
        {item.favorite ? <Heart className="mt-1 h-4 w-4 shrink-0 fill-fuchsia-300/30 text-fuchsia-100/70" /> : null}
      </div>
      <div className="relative mb-4 grid grid-cols-2 gap-2.5">
        <SmallMetric label="Current stage" value={item.currentStage} />
        <SmallMetric label="Next action" value={item.nextAction} />
        <SmallMetric label="Last modified" value={`${relativeDate(item.date)} ago`} />
        <SmallMetric label="Last AI activity" value={item.lastAiActivity} />
      </div>
      <div className="relative mb-4 rounded-xl border border-white/[0.06] bg-black/18 p-3">
        <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.1em] text-white/32">Workflow status</p>
        <div className="flex flex-wrap gap-2">
          {workflowSteps.map((step) => (
            <span
              key={step}
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${
                item.workflow[step]
                  ? 'border-fuchsia-300/16 bg-fuchsia-400/[0.075] text-fuchsia-100'
                  : 'border-white/[0.07] bg-white/[0.028] text-white/36'
              }`}
            >
              {item.workflow[step] ? <Check className="h-3 w-3" /> : null}
              {step}
            </span>
          ))}
        </div>
      </div>
      <div className="relative grid grid-cols-2 gap-2 border-t border-white/[0.06] pt-4">
        <Link href={item.link} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-fuchsia-300/16 bg-fuchsia-400/[0.075] px-3 text-xs font-medium text-fuchsia-100 transition-all hover:bg-fuchsia-400/[0.12]">
          <ArrowRight className="h-3.5 w-3.5" />
          Resume
        </Link>
        <Link href={item.detailsLink} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 text-xs font-medium text-white/58 transition-all hover:border-fuchsia-300/20 hover:bg-fuchsia-400/[0.1] hover:text-white">
          <Eye className="h-3.5 w-3.5" />
          View Details
        </Link>
        <button type="button" onClick={() => onDuplicate(item.id)} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 text-xs font-medium text-white/58 transition-all hover:border-fuchsia-300/20 hover:bg-fuchsia-400/[0.1] hover:text-white">
          <Copy className="h-3.5 w-3.5" />
          Duplicate
        </button>
        <button type="button" onClick={() => onArchive(item.id)} className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.035] px-3 text-xs font-medium text-white/58 transition-all hover:border-fuchsia-300/20 hover:bg-fuchsia-400/[0.1] hover:text-white">
          <Archive className="h-3.5 w-3.5" />
          Archive
        </button>
        <button type="button" onClick={() => onDelete(item.id)} className="col-span-2 inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3 text-xs font-medium text-white/42 transition-all hover:border-fuchsia-300/20 hover:bg-fuchsia-400/[0.06] hover:text-white/72">
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>
    </article>
  );
}

function SidePanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/[0.075] bg-white/[0.038] p-5 shadow-[0_28px_84px_-64px_rgba(217,70,239,0.72)] backdrop-blur-xl">
      <h2 className="mb-4 text-lg font-semibold tracking-[-0.03em] text-white">{title}</h2>
      {children}
    </section>
  );
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-black/18 p-3">
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-white/32">{label}</p>
      <p className="truncate text-sm font-semibold text-white/82">{value}</p>
    </div>
  );
}

function relativeDate(date: string) {
  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return 'recently';
  }

  return formatDistanceToNow(parsed);
}
