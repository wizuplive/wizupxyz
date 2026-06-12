'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Circle,
  Copy,
  ExternalLink,
  FileText,
  Hammer,
  ImageIcon,
  Layers3,
  MessageSquare,
  PenLine,
  Sparkles,
} from 'lucide-react';

import {
  founderReviewDesignerResult,
  loadDesignerSessionStates,
  runCreator,
  runDesignerWorkflow,
} from '@/app/actions/ai';
import { attachApprovedDesignerAssetToSession } from '@/app/actions/workflow';
import {
  type ProductDraft,
  type ProductDraftModule,
  type SalesKit,
  type BuildSession,
  useActiveBuild,
} from '@/app/context/ActiveBuildSessionContext';
import { Button } from '@/components/ui/button';
import type { CreatorAssetsOutput, ProductContentSection } from '@/lib/ai';
import type {
  DesignerAssetType,
  SessionDesignerAssetState,
  SessionPrimaryDesignerAsset,
} from '@/lib/designer-assets';

type RuntimeState = 'loading' | 'ai' | 'fallback';

type BuildDeliverable = {
  title: string;
  purpose: string;
  value: string;
  status: 'completed' | 'working' | 'pending';
};

type BrandDirection = {
  name: string;
  subtitle: string;
  tagline: string;
  cover: string;
  visual: string;
};

type BuildRecommendation = {
  version: string;
  reasons: string[];
};

type BuildFramework = {
  source: RuntimeState;
  productName: string;
  productType: string;
  audience: string;
  positioning: string;
  price: string;
  summary: string;
  modules: ProductDraftModule[];
  deliverables: BuildDeliverable[];
  contentOutline: ProductContentSection[];
  brand: BrandDirection;
  recommendation: BuildRecommendation;
  generatedSalesKit?: SalesKit;
};

type DesignerRuntimePanelState = {
  sessionId: string;
  queuedAssetCount: number;
  failedAssetCount: number;
  completedAssetCount: number;
  imageGenerationMode: 'codex-assisted' | 'runtime-provider';
  canGenerateInRuntime: boolean;
  codexAssistedQueueEnabled: boolean;
};

const assistantActions = [
  'Make title catchier',
  'Add checklist',
  'Shorten intro',
  'Create beginner version',
];

function createFallbackDraft(title: string, buyer: string, format: string, price: string): ProductDraft {
  const cleanTitle = title === 'this product' ? 'Product Starter Kit' : title;

  return {
    title: cleanTitle,
    subtitle: `A simple ${format.toLowerCase()} for ${buyer.toLowerCase()}.`,
    promise: `Help ${buyer.toLowerCase()} get a clear result without feeling overwhelmed.`,
    targetBuyer: buyer,
    category: format || 'Toolkit',
    recommendedPrice: price || '$19 - $39',
    problemSummary: `${buyer} need a simple way to solve this problem and take action quickly.`,
    differentiator: 'Simple steps, practical examples, and fast setup.',
    keyFeatures: ['Quick-start guide', 'Step-by-step lessons', 'Ready-to-use templates'],
    proofPoints: ['Clear buyer need', 'Simple first version', 'Easy to explain'],
    buildPlan: ['Create the product structure', 'Draft the core lessons', 'Prepare assets for launch'],
    modules: [
      {
        title: `Module 1: Understand the problem`,
        goal: 'Help buyers see what is getting in the way.',
        includedAssets: ['Quick-start guide', 'Self-check page'],
        buyerOutcome: 'They know what to fix first.',
      },
      {
        title: `Module 2: Build the simple system`,
        goal: 'Give buyers a clear process they can follow.',
        includedAssets: ['Checklist', 'Planner page'],
        buyerOutcome: 'They can use the product right away.',
      },
      {
        title: `Module 3: Make it work in real life`,
        goal: 'Help buyers apply the system without overthinking.',
        includedAssets: ['Examples', 'Troubleshooting sheet'],
        buyerOutcome: 'They can keep going when things get messy.',
      },
      {
        title: `Module 4: Keep the result going`,
        goal: 'Turn the first win into a repeatable habit.',
        includedAssets: ['Review page', 'Next-step checklist'],
        buyerOutcome: 'They have a path after the first use.',
      },
    ],
  };
}

function salesKitFromCreator(output: CreatorAssetsOutput): SalesKit {
  return {
    headline: output.salesKit.headline,
    subheadline: output.salesKit.subheadline,
    problemSection: output.salesKit.problemSection,
    benefitBullets: output.salesKit.benefitBullets,
    launchEmails: output.salesKit.launchEmails,
    socialPosts: output.salesKit.socialPosts,
    faq: output.salesKit.faq,
    pricingRationale: output.salesKit.pricingRationale,
    callToAction: output.salesKit.callToAction,
  };
}

function createFrameworkFromOutput(
  output: CreatorAssetsOutput,
  draft: ProductDraft,
  source: RuntimeState
): BuildFramework {
  const sections = output.productContent.sections.length
    ? output.productContent.sections
    : draft.modules.map((module) => ({
        title: module.title,
        body: module.goal,
        actionPrompt: module.buyerOutcome,
      }));

  return {
    source,
    productName: output.productContent.title || draft.title,
    productType: draft.category,
    audience: draft.targetBuyer,
    positioning: draft.promise,
    price: draft.recommendedPrice,
    summary: output.productContent.introduction || draft.problemSummary,
    modules: draft.modules,
    deliverables: [
      {
        title: draft.category.includes('Notion') ? 'Notion System' : 'PDF Guide',
        purpose: 'Give buyers the main step-by-step product.',
        value: draft.recommendedPrice,
        status: 'completed',
      },
      {
        title: 'Quick Checklist',
        purpose: 'Help buyers start without overthinking.',
        value: '$9 add-on value',
        status: 'completed',
      },
      {
        title: 'Workbook',
        purpose: 'Turn each lesson into action.',
        value: '$19 add-on value',
        status: 'working',
      },
      {
        title: 'Template Pack',
        purpose: 'Give buyers reusable pages and examples.',
        value: '$29 add-on value',
        status: 'pending',
      },
      {
        title: 'Launch Assets',
        purpose: 'Prepare the product for the publish page.',
        value: 'Included',
        status: 'pending',
      },
    ],
    contentOutline: sections,
    brand: {
      name: output.productContent.title || draft.title,
      subtitle: output.salesKit.subheadline || draft.subtitle,
      tagline: output.salesKit.callToAction || `Start with ${draft.title}.`,
      cover: `A calm premium cover with the title "${draft.title}" and simple product pages layered behind it.`,
      visual: 'Dark editorial layout, clean pages, soft purple detail, and practical screenshots.',
    },
    recommendation: {
      version: `${draft.category} + quick-start PDF`,
      reasons: [
        'fastest to launch',
        'highest perceived value',
        'lowest production complexity',
        'strongest buyer fit',
      ],
    },
    generatedSalesKit: salesKitFromCreator(output),
  };
}

function createFallbackFramework(draft: ProductDraft): BuildFramework {
  return {
    source: 'fallback',
    productName: draft.title,
    productType: draft.category,
    audience: draft.targetBuyer,
    positioning: draft.promise,
    price: draft.recommendedPrice,
    summary: `We are building ${draft.title}: ${draft.subtitle}`,
    modules: draft.modules,
    deliverables: [
      {
        title: 'PDF Guide',
        purpose: 'Teach the core system in a simple format.',
        value: draft.recommendedPrice,
        status: 'completed',
      },
      {
        title: 'Checklist',
        purpose: 'Help buyers take the first step.',
        value: '$9 add-on value',
        status: 'completed',
      },
      {
        title: 'Workbook',
        purpose: 'Turn the lessons into action.',
        value: '$19 add-on value',
        status: 'working',
      },
      {
        title: 'Template',
        purpose: 'Give buyers a ready-to-use starting point.',
        value: '$29 add-on value',
        status: 'pending',
      },
    ],
    contentOutline: draft.modules.map((module) => ({
      title: module.title,
      body: module.goal,
      actionPrompt: module.buyerOutcome,
    })),
    brand: {
      name: draft.title,
      subtitle: draft.subtitle,
      tagline: draft.promise,
      cover: `A clean premium cover for ${draft.title} with layered worksheet previews.`,
      visual: 'Simple, calm, useful, and easy to trust.',
    },
    recommendation: {
      version: `${draft.category} + quick-start PDF`,
      reasons: ['fastest to launch', 'easy to validate', 'clear buyer outcome'],
    },
  };
}

type ApprovedAssetCardConfig = {
  key: DesignerAssetType;
  label: string;
  emptyLabel: string;
  description: string;
  emptyDescription: string;
  aspectClassName: string;
};

const buildAssetCards: ApprovedAssetCardConfig[] = [
  {
    key: 'mockup',
    label: 'Product mockup',
    emptyLabel: 'Mockup pending',
    description: 'Approved product presentation for the build workspace.',
    emptyDescription: 'The approved mockup will appear here after Designer marks it ready.',
    aspectClassName: 'aspect-[4/3]',
  },
  {
    key: 'cover',
    label: 'Cover',
    emptyLabel: 'Cover pending',
    description: 'Approved cover art attached to this build session.',
    emptyDescription: 'The approved cover will appear here after Designer marks it ready.',
    aspectClassName: 'aspect-[4/3]',
  },
];

const buildVisualAssetTypes: DesignerAssetType[] = ['cover', 'mockup'];
const publishVisualAssetTypes: DesignerAssetType[] = ['sales_graphic', 'social_preview'];
const workflowVisualAssetTypes: DesignerAssetType[] = [
  ...buildVisualAssetTypes,
  ...publishVisualAssetTypes,
];

const visualStatusCopy = {
  pending: 'Visuals not generated yet.',
  idle: 'Visuals not generated yet.',
  queued_for_codex: 'Visual request queued. Generate with Codex, then approve assets.',
  generating: 'Designer is creating visuals...',
  running: 'Designer is creating visuals...',
  awaiting_approval: 'Visuals waiting for approval.',
  failed: 'Designer could not generate visuals. Try again.',
  approved: 'Founder approved this visual.',
  rejected: 'Founder rejected this visual.',
} as const;

const designerAssetLabels: Record<DesignerAssetType, string> = {
  cover: 'Cover',
  mockup: 'Mockup',
  sales_graphic: 'Sales graphic',
  social_preview: 'Social preview',
  thumbnail: 'Thumbnail',
};

function createSessionDesignerState(
  assetType: DesignerAssetType,
  status: SessionDesignerAssetState['status'],
  overrides: Partial<SessionDesignerAssetState> = {}
): SessionDesignerAssetState {
  return {
    assetType,
    status,
    message:
      overrides.message ??
      (status === 'ready'
        ? 'Founder approved this visual.'
        : visualStatusCopy[status] ?? null),
    rowId: overrides.rowId ?? null,
    reviewerScore: overrides.reviewerScore ?? null,
    storagePath: overrides.storagePath ?? null,
    publicUrl: overrides.publicUrl ?? null,
    updatedAt: overrides.updatedAt ?? new Date().toISOString(),
  };
}

function getReadySessionAsset(
  session: BuildSession | null,
  assetType: DesignerAssetType
): SessionPrimaryDesignerAsset | null {
  const candidate = session?.designer_assets?.[assetType];
  return candidate?.status === 'ready' && candidate.publicUrl ? candidate : null;
}

function getSessionDesignerState(
  session: BuildSession | null,
  assetType: DesignerAssetType
): SessionDesignerAssetState | null {
  return session?.designer_asset_states?.[assetType] ?? null;
}

function getDesignerPreviewUrl(
  session: BuildSession | null,
  assetType: DesignerAssetType
) {
  return (
    getReadySessionAsset(session, assetType)?.publicUrl ??
    getSessionDesignerState(session, assetType)?.publicUrl ??
    null
  );
}

function getVisualGroupMessage(
  session: BuildSession | null,
  assetTypes: DesignerAssetType[]
) {
  const states = assetTypes
    .map((assetType) => getSessionDesignerState(session, assetType))
    .filter((state): state is SessionDesignerAssetState => Boolean(state));

  if (states.some((state) => state.status === 'failed')) {
    return visualStatusCopy.failed;
  }

  if (states.some((state) => state.status === 'queued_for_codex')) {
    return visualStatusCopy.queued_for_codex;
  }

  if (states.some((state) => state.status === 'running' || state.status === 'generating')) {
    return visualStatusCopy.running;
  }

  if (
    states.some(
      (state) => state.status === 'awaiting_approval' || state.status === 'ready'
    )
  ) {
    return visualStatusCopy.awaiting_approval;
  }

  return visualStatusCopy.idle;
}

function applyDesignerStateToSession(
  session: BuildSession,
  assetType: DesignerAssetType,
  state: SessionDesignerAssetState
): BuildSession {
  return {
    ...session,
    designer_asset_states: {
      ...(session.designer_asset_states ?? {}),
      [assetType]: state,
    },
    updated_at: new Date().toISOString(),
  };
}

function applyDesignerAssetPointerToSession(
  session: BuildSession,
  assetType: DesignerAssetType,
  pointer: SessionPrimaryDesignerAsset
): BuildSession {
  return {
    ...session,
    designer_assets: {
      ...(session.designer_assets ?? {}),
      [assetType]: pointer,
    },
    updated_at: new Date().toISOString(),
  };
}

function getDesignerStatusBadge(status: SessionDesignerAssetState['status']) {
  switch (status) {
    case 'ready':
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'awaiting_approval':
      return 'Awaiting approval';
    case 'queued_for_codex':
      return 'Queued for Codex';
    case 'running':
    case 'generating':
      return 'Running';
    case 'failed':
      return 'Failed';
    case 'pending':
    case 'idle':
      return 'Pending';
  }
}

function getDesignerPreviewFallback(status: SessionDesignerAssetState['status']) {
  switch (status) {
    case 'awaiting_approval':
      return 'Review required';
    case 'queued_for_codex':
      return 'Queued for Codex';
    case 'running':
    case 'generating':
      return 'Generating visual';
    case 'failed':
    case 'rejected':
      return 'Generation failed';
    default:
      return 'No preview yet';
  }
}

function getDesignerApprovalLabel(status: SessionDesignerAssetState['status']) {
  switch (status) {
    case 'ready':
    case 'approved':
      return 'Approved';
    case 'awaiting_approval':
      return 'Founder review required';
    case 'queued_for_codex':
      return 'Queued for Codex';
    case 'running':
    case 'generating':
      return 'Designer working';
    case 'failed':
    case 'rejected':
      return 'Retry generation';
    case 'pending':
    case 'idle':
      return 'Waiting to start';
  }
}

function ApprovedAssetShowcase({ session, title }: { session: BuildSession | null; title: string }) {
  const readyAssets = buildAssetCards
    .map((config) => ({ config, asset: getReadySessionAsset(session, config.key) }))
    .filter((item) => item.asset !== null);
  const emptyStateMessage = getVisualGroupMessage(session, buildVisualAssetTypes);

  return (
    <div className="rounded-2xl border border-white/[0.075] bg-[radial-gradient(circle_at_50%_5%,rgba(217,70,239,0.12),transparent_42%),linear-gradient(145deg,rgba(255,255,255,0.055),rgba(255,255,255,0.018)_48%,rgba(0,0,0,0.26))] p-5 shadow-[0_28px_90px_-70px_rgba(217,70,239,0.78)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-white/40">Approved designer assets</p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white">{title}</h2>
        </div>
        <div className="rounded-full border border-fuchsia-300/16 bg-fuchsia-400/[0.08] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.13em] text-fuchsia-100/74">
          {readyAssets.length}/2 ready
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {buildAssetCards.map(({ key, label, emptyLabel, description, emptyDescription, aspectClassName }) => {
          const asset = getReadySessionAsset(session, key);

          if (!asset) {
            return (
              <div key={key} className="rounded-2xl border border-dashed border-white/10 bg-black/18 p-4">
                <div className={`flex ${aspectClassName} items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.025]`}>
                  <div className="max-w-[14rem] text-center">
                    <ImageIcon className="mx-auto h-8 w-8 text-white/30" />
                    <p className="mt-3 text-sm font-medium text-white/68">{emptyLabel}</p>
                    <p className="mt-2 text-xs leading-5 text-white/42">{emptyStateMessage}</p>
                    {emptyStateMessage === visualStatusCopy.idle ? (
                      <p className="mt-1 text-xs leading-5 text-white/32">{emptyDescription}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          }

          return (
            <a
              key={key}
              href={asset.publicUrl}
              target="_blank"
              rel="noreferrer"
              className="group rounded-2xl border border-white/[0.075] bg-black/18 p-4 transition-colors hover:border-fuchsia-300/18 hover:bg-white/[0.04]"
            >
              <div
                className={`${aspectClassName} rounded-xl border border-white/[0.07] bg-cover bg-center bg-no-repeat shadow-[inset_0_0_0_1px_rgba(255,255,255,0.03)]`}
                style={{ backgroundImage: `url(${asset.publicUrl})` }}
                aria-label={label}
                role="img"
              />
              <div className="mt-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="mt-1 text-xs leading-5 text-white/46">{description}</p>
                </div>
                <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-white/38 transition-colors group-hover:text-fuchsia-100/76" />
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

function ProductMockup({ session, title }: { session: BuildSession | null; title: string }) {
  return (
    <ApprovedAssetShowcase session={session} title={title} />
  );
}

function DesignerVisualControl({
  activeSession,
  visualStates,
  isPending,
  readyCount,
  queuedCount,
  completedCount,
  failedCount,
  imageGenerationMode,
  canGenerateInRuntime,
  onRefreshAssets,
  onGenerate,
  onFounderAction,
}: {
  activeSession: BuildSession | null;
  visualStates: Array<{
    assetType: DesignerAssetType;
    label: string;
    state: SessionDesignerAssetState;
  }>;
  isPending: boolean;
  readyCount: number;
  queuedCount: number;
  completedCount: number;
  failedCount: number;
  imageGenerationMode: 'codex-assisted' | 'runtime-provider';
  canGenerateInRuntime: boolean;
  onRefreshAssets: () => void;
  onGenerate: () => void;
  onFounderAction: (
    assetType: DesignerAssetType,
    action: 'approve' | 'reject'
  ) => void;
}) {
  const [copiedCommand, setCopiedCommand] = useState(false);
  const hasAwaitingApproval = visualStates.some(
    ({ state }) => state.status === 'awaiting_approval'
  );
  const hasRunningAssets = visualStates.some(
    ({ state }) => state.status === 'running' || state.status === 'generating'
  );
  const hasQueuedAssets = visualStates.some(
    ({ state }) => state.status === 'queued_for_codex'
  );
  const codexCommand = activeSession?.id
    ? `npm run wizup:generate-visuals -- --session ${activeSession.id} --asset-dir <local_asset_folder>`
    : null;

  const handleCopyCommand = async () => {
    if (!codexCommand || typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      return;
    }

    await navigator.clipboard.writeText(codexCommand);
    setCopiedCommand(true);
    window.setTimeout(() => setCopiedCommand(false), 1800);
  };

  return (
    <div className="rounded-[1.6rem] border border-white/[0.075] bg-[linear-gradient(180deg,rgba(255,255,255,0.055),rgba(255,255,255,0.022)_52%,rgba(0,0,0,0.22))] p-5 shadow-[0_30px_90px_-68px_rgba(217,70,239,0.82)] backdrop-blur-xl sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-white/36">Designer review system</p>
          <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white">Designer Visuals</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-white/52">
            Generate real Build and Publish visuals for this session, then approve only the visuals that are ready to go live.
          </p>
        </div>
        <span className="rounded-full border border-fuchsia-300/16 bg-fuchsia-400/[0.08] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.13em] text-fuchsia-100/78">
          {readyCount}/4 ready
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {visualStates.map(({ assetType, label, state }) => (
          <div
            key={assetType}
            className="group rounded-[1.35rem] border border-white/[0.065] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.016)_55%,rgba(0,0,0,0.2))] p-4 transition-all duration-200 hover:border-fuchsia-300/16 hover:bg-white/[0.045]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="mt-1 text-xs leading-5 text-white/48">
                  {state.message ?? visualStatusCopy.idle}
                </p>
              </div>
              <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white/58">
                {getDesignerStatusBadge(state.status)}
              </span>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-white/[0.06] bg-black/22">
              {getDesignerPreviewUrl(activeSession, assetType) ? (
                <div
                  className="aspect-[4/3] bg-cover bg-center bg-no-repeat"
                  style={{
                    backgroundImage: `url(${getDesignerPreviewUrl(activeSession, assetType)})`,
                  }}
                  aria-label={label}
                  role="img"
                />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center bg-[radial-gradient(circle_at_50%_24%,rgba(217,70,239,0.12),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(0,0,0,0.16))]">
                  <div className="text-center">
                    <ImageIcon className="mx-auto h-8 w-8 text-white/26" />
                    <p className="mt-3 text-sm font-medium text-white/62">
                      {getDesignerPreviewFallback(state.status)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <DetailCard
                label="Reviewer score"
                value={
                  state.reviewerScore !== null && state.reviewerScore !== undefined
                    ? `${state.reviewerScore}`
                    : 'Not scored yet'
                }
              />
              <DetailCard
                label="Storage path"
                value={state.storagePath ?? 'Not stored yet'}
              />
              <DetailCard
                label="Updated"
                value={new Date(state.updatedAt).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              />
              <DetailCard
                label="Approval"
                value={getDesignerApprovalLabel(state.status)}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onFounderAction(assetType, 'approve')}
                disabled={
                  isPending ||
                  state.status !== 'awaiting_approval' ||
                  !state.rowId
                }
                className="h-9 rounded-xl border-white/[0.08] bg-white/[0.03] px-3 text-sm text-white hover:bg-white/[0.06]"
              >
                Approve
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onFounderAction(assetType, 'reject')}
                disabled={
                  isPending ||
                  state.status !== 'awaiting_approval' ||
                  !state.rowId
                }
                className="h-9 rounded-xl border-white/[0.08] bg-white/[0.03] px-3 text-sm text-white hover:bg-white/[0.06]"
              >
                Reject
              </Button>
              {getDesignerPreviewUrl(activeSession, assetType) ? (
                <a
                  href={getDesignerPreviewUrl(activeSession, assetType) ?? '#'}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-white transition-colors hover:bg-white/[0.06]"
                >
                  Preview
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
        <DetailCard label="Session id" value={activeSession?.id ?? 'No active session'} />
        <DetailCard label="Generation mode" value={imageGenerationMode} />
        <DetailCard
          label="Runtime generation"
          value={canGenerateInRuntime ? 'Available' : 'Not available'}
        />
        <DetailCard label="Queued assets" value={`${queuedCount}`} />
        <DetailCard label="Completed assets" value={`${completedCount}`} />
        <DetailCard label="Failed assets" value={`${failedCount}`} />
      </div>

      {imageGenerationMode === 'codex-assisted' ? (
        <div className="mt-5 rounded-2xl border border-white/[0.065] bg-black/18 p-4">
          <p className="text-sm font-medium text-white">
            {hasQueuedAssets
              ? 'Queued for Codex — run local visual generator.'
              : 'Codex-assisted generation is enabled for this session.'}
          </p>
          <p className="mt-1 text-xs leading-5 text-white/48">
            Run the local generator on this machine, then refresh assets to load uploaded image URLs into Build.
          </p>
          <div className="mt-3 rounded-xl border border-white/[0.08] bg-black/22 px-3 py-3">
            <code className="block overflow-x-auto text-xs text-fuchsia-100/82">
              {codexCommand ??
                'npm run wizup:generate-visuals -- --session <session_id> --asset-dir <local_asset_folder>'}
            </code>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopyCommand}
              disabled={!codexCommand}
              className="h-9 rounded-xl border-white/[0.08] bg-white/[0.03] px-3 text-sm text-white hover:bg-white/[0.06]"
            >
              {copiedCommand ? (
                <>
                  Copied
                  <Check className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  Copy command
                  <Copy className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onRefreshAssets}
              disabled={!activeSession?.id || isPending}
              className="h-9 rounded-xl border-white/[0.08] bg-white/[0.03] px-3 text-sm text-white hover:bg-white/[0.06]"
            >
              Refresh assets
            </Button>
          </div>
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-white/[0.065] bg-black/18 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-white">Visual creation status</p>
          <p className="mt-1 text-xs leading-5 text-white/48">
            {hasRunningAssets
              ? visualStatusCopy.running
              : hasQueuedAssets
                ? visualStatusCopy.queued_for_codex
              : hasAwaitingApproval
                ? visualStatusCopy.awaiting_approval
                : visualStatusCopy.idle}
          </p>
        </div>
        <Button
          type="button"
          onClick={onGenerate}
          disabled={isPending || hasRunningAssets || hasQueuedAssets || !activeSession?.id}
          className="h-11 rounded-xl bg-fuchsia-500 px-4 text-sm font-semibold text-white hover:bg-fuchsia-400"
        >
          Generate visuals
        </Button>
      </div>
    </div>
  );
}

function BuildOrb({
  completionPercent,
  currentStage,
  readyCount,
  pendingCount,
}: {
  completionPercent: number;
  currentStage: string;
  readyCount: number;
  pendingCount: number;
}) {
  return (
    <div className="relative flex min-h-[360px] flex-col justify-between overflow-hidden rounded-[1.6rem] border border-white/[0.075] bg-[radial-gradient(circle_at_50%_22%,rgba(217,70,239,0.14),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(0,0,0,0.2))] p-5 shadow-[0_30px_90px_-68px_rgba(217,70,239,0.82)]">
      <div className="absolute left-1/2 top-8 h-48 w-48 -translate-x-1/2 rounded-full border border-fuchsia-300/12" />
      <div className="absolute left-1/2 top-14 h-64 w-64 -translate-x-1/2 rounded-full border border-fuchsia-300/[0.055]" />
      <div className="absolute inset-x-10 top-1/2 h-px bg-[linear-gradient(90deg,transparent,rgba(217,70,239,0.22),transparent)]" />
      <div className="relative">
        <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-white/36">Build studio visual</p>
        <p className="mt-2 max-w-[16rem] text-sm leading-6 text-white/54">
          The product path is mapped. Content, assets, and publish readiness update here as the build advances.
        </p>
      </div>
      <div className="relative mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-fuchsia-300/18 bg-black/34 shadow-[inset_0_0_30px_rgba(217,70,239,0.13),0_0_34px_-22px_rgba(217,70,239,0.9)] backdrop-blur-md">
        <Sparkles className="h-7 w-7 text-fuchsia-100/80" />
      </div>
      <div className="relative space-y-3">
        <DetailCard label="Current stage" value={currentStage} />
        <div className="grid grid-cols-2 gap-2.5">
          <DetailCard label="Completion" value={`${completionPercent}%`} />
          <DetailCard label="Ready assets" value={`${readyCount}/4`} />
        </div>
        <DetailCard label="Review queue" value={pendingCount ? `${pendingCount} waiting for approval` : 'No pending approvals'} />
      </div>
    </div>
  );
}

function BuildProgressPath({
  stages,
}: {
  stages: Array<{
    label: string;
    status: 'done' | 'active' | 'next';
  }>;
}) {
  return (
    <div className="rounded-[1.4rem] border border-white/[0.065] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015)_54%,rgba(0,0,0,0.18))] p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-white/34">Build path</p>
          <h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">From idea to publish</h3>
        </div>
        <span className="rounded-full border border-white/[0.07] bg-black/20 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white/54">
          Live
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {stages.map((step, index) => (
          <div key={step.label} className="relative min-w-0 rounded-2xl border border-white/[0.06] bg-black/18 p-3">
            {index < stages.length - 1 ? (
              <div className="pointer-events-none absolute -right-2 top-1/2 hidden h-px w-4 -translate-y-1/2 bg-[linear-gradient(90deg,rgba(217,70,239,0.35),rgba(255,255,255,0.08))] xl:block" />
            ) : null}
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-full border ${
                step.status === 'done'
                  ? 'border-fuchsia-300/24 bg-fuchsia-400/[0.12] text-fuchsia-100'
                  : step.status === 'active'
                    ? 'border-fuchsia-300/34 bg-fuchsia-400/[0.16] text-white shadow-[0_0_18px_-12px_rgba(217,70,239,0.9)]'
                    : 'border-white/10 bg-white/[0.03] text-white/35'
              }`}
            >
              {step.status === 'done' ? (
                <Check className="h-4 w-4" />
              ) : (
                <Circle
                  className={`h-3.5 w-3.5 ${
                    step.status === 'active'
                      ? 'fill-fuchsia-300/70 text-fuchsia-100'
                      : 'text-white/28'
                  }`}
                />
              )}
            </div>
            <p
              className={`mt-3 text-sm font-medium ${
                step.status === 'active'
                  ? 'text-white'
                  : step.status === 'done'
                    ? 'text-white/74'
                    : 'text-white/46'
              }`}
            >
              {step.label}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.11em] text-white/30">
              {step.status === 'done' ? 'Complete' : step.status === 'active' ? 'Current' : 'Next'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommandCenterCard({
  eyebrow,
  title,
  value,
  summary,
  meta,
}: {
  eyebrow: string;
  title: string;
  value: string;
  summary: string;
  meta: string[];
}) {
  return (
    <div className="rounded-[1.35rem] border border-white/[0.065] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018)_55%,rgba(0,0,0,0.2))] p-4 transition-all duration-200 hover:border-fuchsia-300/16 hover:bg-white/[0.045]">
      <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-white/34">{eyebrow}</p>
      <div className="mt-3">
        <h3 className="text-base font-semibold tracking-[-0.03em] text-white">{title}</h3>
        <p className="mt-1 text-2xl font-semibold tracking-[-0.05em] text-white">{value}</p>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/54">{summary}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {meta.map((item) => (
          <span
            key={item}
            className="rounded-full border border-white/[0.07] bg-black/20 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white/50"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function BlueprintRow({ title, text, open }: { title: string; text: string; open?: boolean }) {
  return (
    <div className="rounded-[1.35rem] border border-white/[0.075] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.016)_56%,rgba(0,0,0,0.18))] p-4 transition-colors duration-200 hover:border-fuchsia-300/16 hover:bg-white/[0.045]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-black/24 text-white/52">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{title}</h3>
            <p className="mt-1 text-xs leading-5 text-white/48">{text}</p>
          </div>
        </div>
        <ChevronDown className={`h-4 w-4 shrink-0 text-white/38 ${open ? 'rotate-180' : ''}`} />
      </div>
    </div>
  );
}

function TeamStatus({ status }: { status: string }) {
  if (status === 'completed') {
    return <Check className="h-3.5 w-3.5 text-fuchsia-100" />;
  }

  if (status === 'working') {
    return <Circle className="h-3.5 w-3.5 fill-fuchsia-300/70 text-fuchsia-200" />;
  }

  return <Circle className="h-3.5 w-3.5 text-white/28" />;
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.065] bg-black/20 p-3">
      <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.11em] text-white/34">{label}</p>
      <p className="text-sm leading-5 text-white/68">{value}</p>
    </div>
  );
}

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.065] bg-black/18 p-4">
      <h3 className="mb-3 text-base font-semibold tracking-[-0.03em] text-white">{title}</h3>
      {children}
    </div>
  );
}

function StatusPill({ status }: { status: BuildDeliverable['status'] }) {
  const label = status === 'completed' ? 'Ready' : status === 'working' ? 'In progress' : 'Pending';
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] font-medium ${
        status === 'completed'
          ? 'border-fuchsia-300/18 bg-fuchsia-400/[0.08] text-fuchsia-100'
          : status === 'working'
            ? 'border-white/12 bg-white/[0.045] text-white/70'
            : 'border-white/[0.07] bg-black/20 text-white/38'
      }`}
    >
      {label}
    </span>
  );
}

export default function BuildPage() {
  const { activeSession, setActiveSession, updateStage } = useActiveBuild();
  const hydratedDesignerAssetsSessionIdRef = useRef<string | null>(null);
  const selectedIdea = activeSession?.selected_idea;
  const draft = useMemo(
    () =>
      activeSession?.product_draft ??
      createFallbackDraft(
        selectedIdea?.title ?? 'this product',
        selectedIdea?.buyer ?? 'busy beginners',
        selectedIdea?.format ?? 'Toolkit',
        selectedIdea?.priceRange ?? '$19 - $39'
      ),
    [
      activeSession?.product_draft,
      selectedIdea?.buyer,
      selectedIdea?.format,
      selectedIdea?.priceRange,
      selectedIdea?.title,
    ]
  );
  const fallbackFramework = useMemo(() => createFallbackFramework(draft), [draft]);
  const [framework, setFramework] = useState<BuildFramework>(fallbackFramework);
  const [isBuilding, setIsBuilding] = useState(false);
  const [designerRuntimeState, setDesignerRuntimeState] = useState<DesignerRuntimePanelState>({
    sessionId: activeSession?.id ?? '',
    queuedAssetCount: 0,
    failedAssetCount: 0,
    completedAssetCount: 0,
    imageGenerationMode: 'codex-assisted' as const,
    canGenerateInRuntime: false,
    codexAssistedQueueEnabled: true,
  });
  const refreshDesignerAssets = useCallback(
    async (sessionOverride?: BuildSession | null) => {
      const session = sessionOverride ?? activeSession;
      if (!session?.id) {
        return;
      }

      const result = await loadDesignerSessionStates({
        sessionId: session.id,
        assetTypes: workflowVisualAssetTypes,
      });

      setDesignerRuntimeState({
        sessionId: result.sessionId,
        queuedAssetCount: result.queuedAssetCount,
        failedAssetCount: result.failedAssetCount,
        completedAssetCount: result.completedAssetCount,
        imageGenerationMode: result.imageGenerationMode,
        canGenerateInRuntime: result.canGenerateInRuntime,
        codexAssistedQueueEnabled: result.codexAssistedQueueEnabled,
      });

      setActiveSession({
        ...session,
        designer_assets: {
          ...(session.designer_assets ?? {}),
          ...result.readyAssets,
        },
        designer_asset_states: {
          ...(session.designer_asset_states ?? {}),
          ...result.assetStates,
        },
        updated_at: new Date().toISOString(),
      });
    },
    [activeSession, setActiveSession]
  );

  useEffect(() => {
    setFramework(fallbackFramework);

    let isMounted = true;
    setIsBuilding(true);
    updateStage('build', { product_draft: draft, status: 'working' });

    runCreator({
      productTitle: draft.title,
      buyer: draft.targetBuyer,
      format: draft.category,
      modules: draft.modules,
      positioning: {
        title: draft.title,
        subtitle: draft.subtitle,
        promise: draft.promise,
        targetBuyer: draft.targetBuyer,
        category: draft.category,
        recommendedPrice: draft.recommendedPrice,
      },
      tone: 'Simple, premium, practical, and beginner-friendly.',
      notes: [
        `Positioning: ${draft.promise}`,
        `Problem: ${draft.problemSummary}`,
        `Differentiator: ${draft.differentiator}`,
        `Build plan: ${draft.buildPlan.join('; ')}`,
      ].join('\n'),
    })
      .then((output) => {
        if (!isMounted) return;
        const nextFramework = createFrameworkFromOutput(output, draft, output.source === 'gemini' ? 'ai' : 'fallback');
        setFramework(nextFramework);
        updateStage('build', {
          product_draft: draft,
          sales_kit: nextFramework.generatedSalesKit,
          status: 'working',
          next_action: 'Continue to Publish and prepare launch assets.',
        });
      })
      .catch(() => {
        if (!isMounted) return;
        setFramework(fallbackFramework);
      })
      .finally(() => {
        if (isMounted) setIsBuilding(false);
      });

    return () => {
      isMounted = false;
    };
  }, [draft, fallbackFramework, updateStage]);

  useEffect(() => {
    if (!activeSession?.id) {
      hydratedDesignerAssetsSessionIdRef.current = null;
      return;
    }

    if (hydratedDesignerAssetsSessionIdRef.current === activeSession.id) {
      return;
    }

    hydratedDesignerAssetsSessionIdRef.current = activeSession.id;
    let isMounted = true;

    refreshDesignerAssets(activeSession)
      .then(() => {
        if (!isMounted) return;
      })
      .catch(() => {
        if (!isMounted) return;
      });

    return () => {
      isMounted = false;
    };
  }, [activeSession, refreshDesignerAssets, setActiveSession]);

  const [designerIsPending, startDesignerTransition] = useTransition();
  const visualStates = workflowVisualAssetTypes.map((assetType) => {
    const state =
      getSessionDesignerState(activeSession, assetType) ??
      createSessionDesignerState(assetType, 'idle');

    return {
      assetType,
      label: designerAssetLabels[assetType],
      state,
    };
  });
  const readyVisualCount = workflowVisualAssetTypes.filter((assetType) =>
    getReadySessionAsset(activeSession, assetType)
  ).length;
  const awaitingReviewCount = visualStates.filter(
    ({ state }) => state.status === 'awaiting_approval'
  ).length;
  const failedVisualCount = visualStates.filter(
    ({ state }) => state.status === 'failed'
  ).length;
  const hasRunningAssets = visualStates.some(
    ({ state }) => state.status === 'running' || state.status === 'generating'
  );
  const hasQueuedAssets = visualStates.some(
    ({ state }) => state.status === 'queued_for_codex'
  );
  const hasAwaitingApproval = awaitingReviewCount > 0;
  const reviewerScores = visualStates
    .map(({ state }) => state.reviewerScore)
    .filter((score): score is number => typeof score === 'number');
  const averageReviewerScore = reviewerScores.length
    ? `${Math.round(
        reviewerScores.reduce((sum, score) => sum + score, 0) / reviewerScores.length
      )}`
    : 'Not scored';
  const updateAssetState = (
    session: BuildSession,
    assetType: DesignerAssetType,
    state: SessionDesignerAssetState
  ) => {
    const nextSession = applyDesignerStateToSession(session, assetType, state);
    setActiveSession(nextSession);
    return nextSession;
  };
  const handleApprovedAsset = async (
    assetType: DesignerAssetType,
    pointer: SessionPrimaryDesignerAsset
  ) => {
    if (!activeSession) return null;
    return attachApprovedDesignerAssetToSession(activeSession, assetType, pointer);
  };
  const runVisualGeneration = () => {
    startDesignerTransition(async () => {
      if (!activeSession?.id) {
        return;
      }

      let sessionSnapshot = activeSession;
      console.info('[build-page]', {
        stage: 'generate_visuals:clicked',
        sessionId: activeSession.id,
        assetCount: workflowVisualAssetTypes.length,
      });
      for (const assetType of workflowVisualAssetTypes) {
        sessionSnapshot = updateAssetState(
          sessionSnapshot,
          assetType,
          createSessionDesignerState(assetType, 'generating')
        );
      }

      for (const assetType of workflowVisualAssetTypes) {
        try {
          console.info('[build-page]', {
            stage: 'generate_visuals:asset_request_start',
            sessionId: sessionSnapshot.id,
            assetType,
          });
          const workflow = await runDesignerWorkflow({
            context: {
              projectId: '',
              sessionId: sessionSnapshot.id,
              assetType,
              productTitle: draft.title,
              productSubtitle: draft.subtitle,
              targetBuyer: draft.targetBuyer,
              corePromise: draft.promise,
              problemSummary: draft.problemSummary,
              differentiator: draft.differentiator,
              pricing: draft.recommendedPrice,
              brandDirection: framework.brand.visual,
              mode: 'production',
              sourceContext: {
                creatorSummary: framework.summary,
                salesSummary: framework.generatedSalesKit?.headline,
              },
              referenceStyleNotes:
                assetType === 'cover' || assetType === 'mockup'
                  ? framework.brand.cover
                  : framework.brand.tagline,
            },
            contextSummary: `${draft.title}. ${draft.promise}. ${framework.brand.visual}`,
          });

          const primaryVariant =
            workflow.variants.find((variant) => variant.isPrimary) ??
            workflow.variants[0] ??
            null;
          const readyPointer = workflow.primarySessionPointer;
          const nextStatus =
            workflow.asset.status === 'ready' && readyPointer
              ? 'ready'
              : workflow.asset.status === 'queued_for_codex'
                ? 'queued_for_codex'
              : workflow.asset.status === 'awaiting_approval'
                ? 'awaiting_approval'
                : 'failed';

          if (readyPointer) {
            sessionSnapshot = applyDesignerAssetPointerToSession(
              sessionSnapshot,
              assetType,
              readyPointer
            );
          }

          sessionSnapshot = updateAssetState(
            sessionSnapshot,
            assetType,
            createSessionDesignerState(
              assetType,
              nextStatus,
              {
                rowId: workflow.rowId,
                reviewerScore: primaryVariant?.reviewerScore ?? null,
                storagePath:
                  readyPointer?.storagePath ?? primaryVariant?.storagePath ?? null,
                publicUrl:
                  readyPointer?.publicUrl ?? primaryVariant?.publicUrl ?? null,
                message:
                  nextStatus === 'ready'
                    ? 'Founder approved this visual.'
                    : nextStatus === 'queued_for_codex'
                      ? visualStatusCopy.queued_for_codex
                    : nextStatus === 'awaiting_approval'
                      ? visualStatusCopy.awaiting_approval
                    : workflow.userMessage ?? visualStatusCopy.failed,
              }
            )
          );
          console.info('[build-page]', {
            stage: 'generate_visuals:asset_request_complete',
            sessionId: sessionSnapshot.id,
            assetType,
            workflowStage: workflow.stage,
            workflowStatus: workflow.asset.status,
            rowId: workflow.rowId,
          });
        } catch {
          console.error('[build-page]', {
            stage: 'generate_visuals:asset_request_failed',
            sessionId: sessionSnapshot.id,
            assetType,
          });
          sessionSnapshot = updateAssetState(
            sessionSnapshot,
            assetType,
            createSessionDesignerState(assetType, 'failed', {
              message: visualStatusCopy.failed,
            })
          );
        }
      }

      await refreshDesignerAssets(sessionSnapshot);
    });
  };
  const handleFounderAction = (
    assetType: DesignerAssetType,
    action: 'approve' | 'reject'
  ) => {
    startDesignerTransition(async () => {
      if (!activeSession) {
        return;
      }

      const currentState = getSessionDesignerState(activeSession, assetType);
      if (!currentState?.rowId) {
        return;
      }

      const pendingSession = updateAssetState(
        activeSession,
        assetType,
        createSessionDesignerState(assetType, 'generating')
      );

      try {
        const result = await founderReviewDesignerResult({
          rowId: currentState.rowId,
          action,
        });

        const readyState = createSessionDesignerState(assetType, 'ready', {
          rowId: result.rowId,
          reviewerScore:
            result.variants.find((variant) => variant.isPrimary)?.reviewerScore ??
            result.variants[0]?.reviewerScore ??
            null,
          storagePath:
            result.variants.find((variant) => variant.isPrimary)?.storagePath ??
            result.variants[0]?.storagePath ??
            null,
          publicUrl: result.primarySessionPointer?.publicUrl ?? null,
          message: 'Founder approved this visual.',
        });

        let nextSession = pendingSession;
        if (action === 'approve' && result.primarySessionPointer) {
          const approvedSession =
            (await handleApprovedAsset(assetType, result.primarySessionPointer)) ??
            pendingSession;
          nextSession = applyDesignerStateToSession(
            approvedSession,
            assetType,
            readyState
          );
        } else {
          nextSession = applyDesignerStateToSession(
            pendingSession,
            assetType,
            createSessionDesignerState(assetType, 'failed', {
              rowId: result.rowId,
              message: visualStatusCopy.failed,
            })
          );
        }

        setActiveSession(nextSession);
      } catch {
        setActiveSession(
          applyDesignerStateToSession(
            pendingSession,
            assetType,
            createSessionDesignerState(assetType, 'failed', {
              rowId: currentState.rowId,
              message: visualStatusCopy.failed,
            })
          )
        );
      }
    });
  };

  const tags = [framework.audience, framework.productType, framework.price];
  const currentStage =
    readyVisualCount === workflowVisualAssetTypes.length
      ? 'Publish readiness'
        : hasRunningAssets
          ? 'Designer generation'
        : hasQueuedAssets
          ? 'Codex asset queue'
        : hasAwaitingApproval || readyVisualCount > 0
          ? 'Asset review'
          : isBuilding
            ? 'Content drafting'
            : 'Framework ready';
  const buildStatus =
    readyVisualCount === workflowVisualAssetTypes.length
      ? 'Ready to publish'
      : hasRunningAssets
        ? 'Generating visuals'
        : hasQueuedAssets
          ? 'Queued for Codex'
        : hasAwaitingApproval
          ? 'Approval required'
          : isBuilding
            ? 'Building framework'
            : 'Build studio ready';
  const timeline = [
    { label: 'Idea', status: 'done' as const },
    { label: 'Strategy', status: 'done' as const },
    { label: 'Framework', status: 'done' as const },
    {
      label: 'Content',
      status: isBuilding ? ('active' as const) : ('done' as const),
    },
    {
      label: 'Assets',
      status:
        readyVisualCount === workflowVisualAssetTypes.length
          ? ('done' as const)
          : !isBuilding
            ? ('active' as const)
            : ('next' as const),
    },
    {
      label: 'Publish',
      status:
        readyVisualCount === workflowVisualAssetTypes.length
          ? ('active' as const)
          : ('next' as const),
    },
  ];
  const completionPercent = Math.min(
    100,
    Math.round(
      ((3 + (isBuilding ? 0.5 : 1) + readyVisualCount / 4 + (readyVisualCount === 4 ? 1 : 0)) /
        6) *
        100
    )
  );
  const blueprint = [
    {
      title: 'Overview',
      text: framework.summary,
      open: true,
    },
    {
      title: 'Product Structure',
      text: `${framework.modules.length} modules mapped for ${framework.audience}.`,
    },
    {
      title: 'Content Preview',
      text: `${framework.contentOutline.length} core lessons drafted with action steps.`,
    },
    {
      title: 'Branding',
      text: framework.brand.visual,
    },
    {
      title: 'Delivery Assets',
      text: framework.deliverables.map((item) => item.title).slice(0, 4).join(', '),
    },
  ];
  const agents = [
    { name: 'Scout', status: 'completed', detail: 'Opportunity found' },
    { name: 'Strategist', status: 'completed', detail: 'Build path chosen' },
    { name: 'Creator', status: isBuilding ? 'working' : 'completed', detail: isBuilding ? 'Building structure' : 'Framework ready' },
    {
      name: 'Designer',
      status: hasRunningAssets || hasQueuedAssets ? 'working' : readyVisualCount > 0 || hasAwaitingApproval ? 'completed' : isBuilding ? 'pending' : 'working',
      detail: hasRunningAssets ? 'Generating visuals' : hasQueuedAssets ? 'Queued for Codex' : readyVisualCount > 0 || hasAwaitingApproval ? 'Assets attached' : isBuilding ? 'Waiting for draft' : 'Preparing assets',
    },
    {
      name: 'Reviewer',
      status: hasAwaitingApproval ? 'working' : readyVisualCount > 0 ? 'completed' : 'pending',
      detail: hasAwaitingApproval ? 'Reviewing approvals' : readyVisualCount > 0 ? 'Approved visuals attached' : 'Waiting for visuals',
    },
  ];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-7">
      <section className="relative overflow-hidden rounded-[1.9rem] border border-white/[0.075] bg-[linear-gradient(145deg,rgba(255,255,255,0.068),rgba(255,255,255,0.023)_39%,rgba(6,6,12,0.93))] p-5 shadow-[0_32px_108px_-74px_rgba(217,70,239,0.86)] backdrop-blur-2xl sm:p-8 lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(217,70,239,0.16),transparent_31%),radial-gradient(circle_at_42%_0%,rgba(124,58,237,0.12),transparent_34%)]" />
        <div className="relative grid grid-cols-1 gap-5 xl:grid-cols-[1.05fr_1.18fr_0.82fr]">
          <div className="min-w-0 rounded-[1.55rem] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02)_58%,rgba(0,0,0,0.16))] p-5 sm:p-6">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-fuchsia-300/16 bg-fuchsia-400/[0.07] px-3 py-1.5 text-xs font-medium text-fuchsia-100">
              <Hammer className="h-3.5 w-3.5" />
              Product build studio
            </div>
            <h1 className="max-w-xl text-4xl font-semibold leading-[0.98] tracking-[-0.055em] text-white sm:text-5xl lg:text-6xl">
              Build Your Product
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-white/62 sm:text-lg">
              {framework.productName} is now in production mode. WIZUP is turning the strategy into a structured product, approval-ready visuals, and a publish path you can review in one place.
            </p>
            <p className="mt-4 max-w-xl text-sm leading-6 text-white/48">{draft.subtitle}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-fuchsia-300/16 bg-fuchsia-400/[0.08] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.13em] text-fuchsia-100/78">
                {buildStatus}
              </span>
              <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.13em] text-white/54">
                {completionPercent}% complete
              </span>
              <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.13em] text-white/54">
                {currentStage}
              </span>
            </div>
          </div>

          <BuildProgressPath stages={timeline} />

          <div className="rounded-[1.55rem] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02)_58%,rgba(0,0,0,0.16))] p-5 sm:p-6">
            <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-white/34">Next action</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Generate visuals</h2>
            <p className="mt-2 text-sm leading-6 text-white/52">
              Surface the emotional payoff early, then approve only the assets that are ready to appear on Build and Publish.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-2.5">
              <DetailCard label="Build focus" value={currentStage} />
              <DetailCard
                label="Review queue"
                value={
                  hasRunningAssets
                    ? visualStatusCopy.running
                    : hasQueuedAssets
                      ? visualStatusCopy.queued_for_codex
                    : hasAwaitingApproval
                      ? `${awaitingReviewCount} asset${awaitingReviewCount === 1 ? '' : 's'} waiting for approval`
                      : visualStatusCopy.idle
                }
              />
            </div>
            <div className="mt-5 flex flex-col gap-3">
              <Button
                type="button"
                onClick={runVisualGeneration}
                disabled={designerIsPending || hasRunningAssets || hasQueuedAssets || !activeSession?.id}
                className="h-12 rounded-xl bg-fuchsia-500 px-5 text-sm font-semibold text-white shadow-[0_0_24px_-11px_rgba(217,70,239,0.86)] transition-all hover:bg-fuchsia-400"
              >
                Generate visuals
              </Button>
              <Link href="/app/publish" className="block" onClick={() => updateStage('publish')}>
                <Button className="h-12 w-full rounded-xl border border-white/[0.08] bg-white/[0.03] px-5 text-sm font-semibold text-white hover:bg-white/[0.06]">
                  Continue to Publish
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="relative mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.05fr_1fr_0.82fr]">
          <ProductMockup session={activeSession} title={framework.productName} />

          <div className="rounded-[1.6rem] border border-white/[0.075] bg-white/[0.038] p-5 shadow-[0_26px_78px_-64px_rgba(217,70,239,0.68)] backdrop-blur-xl">
            <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.14em] text-white/38">Current build focus</p>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-white">{framework.productName}</h2>
            <p className="mt-4 text-sm leading-6 text-white/58">{framework.summary}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="rounded-full border border-white/[0.075] bg-white/[0.035] px-3.5 py-1.5 text-xs font-medium text-white/62">
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-2.5">
              <DetailCard label="What we're building" value={framework.summary} />
              <DetailCard label="Audience" value={framework.audience} />
              <DetailCard label="Positioning" value={framework.positioning} />
              <DetailCard label="Recommended price" value={framework.price} />
            </div>
          </div>

          <BuildOrb
            completionPercent={completionPercent}
            currentStage={currentStage}
            readyCount={readyVisualCount}
            pendingCount={awaitingReviewCount}
          />
        </div>

        <div className="relative mt-5">
          <div className="mb-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-white/34">Build command center</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Everything that matters in one frame</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <CommandCenterCard
              eyebrow="Content"
              title="Product content"
              value={`${framework.modules.length} modules`}
              summary="Structure, lessons, and product copy are mapped from the current strategy."
              meta={[
                `${framework.contentOutline.length} lessons`,
                `${framework.deliverables.length} deliverables`,
                framework.source === 'ai' ? 'AI draft' : 'Fallback draft',
              ]}
            />
            <CommandCenterCard
              eyebrow="Visuals"
              title="Asset pipeline"
              value={`${readyVisualCount}/4 ready`}
              summary="Cover, mockup, sales graphic, and social preview stay read-only until founder approval."
              meta={[
                hasRunningAssets ? 'Generating' : hasQueuedAssets ? 'Queued for Codex' : 'Waiting',
                `${awaitingReviewCount} in review`,
                `${failedVisualCount} failed`,
              ]}
            />
            <CommandCenterCard
              eyebrow="Review"
              title="Approval queue"
              value={awaitingReviewCount ? `${awaitingReviewCount} pending` : 'Clear'}
              summary="Reviewer scoring is attached per asset and only approved visuals can progress to ready."
              meta={[
                `Score ${averageReviewerScore}`,
                readyVisualCount ? `${readyVisualCount} approved` : 'No approvals yet',
                failedVisualCount ? `${failedVisualCount} issues` : 'No issues',
              ]}
            />
            <CommandCenterCard
              eyebrow="Publish readiness"
              title="Launch path"
              value={currentStage}
              summary="The publish route stays open, but the page now makes it obvious what is ready and what still needs review."
              meta={[
                `${completionPercent}% complete`,
                `${readyVisualCount}/4 assets ready`,
                readyVisualCount === 4 ? 'Ready to publish' : 'Needs visuals',
              ]}
            />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="min-w-0 rounded-[1.75rem] border border-white/[0.075] bg-white/[0.038] p-5 shadow-[0_28px_84px_-64px_rgba(217,70,239,0.72)] backdrop-blur-xl sm:p-6">
          <div className="mb-5">
            <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">Your Product Blueprint</h2>
            <p className="mt-2 text-sm leading-6 text-white/56">Review and customize every part of the product without changing the generated structure underneath.</p>
          </div>
          <div className="space-y-3">
            {blueprint.map((item) => (
              <BlueprintRow key={item.title} title={item.title} text={item.text} open={item.open} />
            ))}
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3.5 lg:grid-cols-2">
            <SectionBlock title="Product Structure">
              <div className="space-y-3">
                {framework.modules.map((module, index) => (
                  <div key={module.title} className="rounded-xl border border-white/[0.06] bg-black/18 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-[0.11em] text-white/32">Module {index + 1}</p>
                    <h4 className="mt-1 text-sm font-semibold text-white">{module.title.replace(/^Module\s*\d+:\s*/i, '')}</h4>
                    <p className="mt-2 text-xs leading-5 text-white/50">{module.goal}</p>
                    <p className="mt-2 text-xs leading-5 text-fuchsia-100/62">{module.buyerOutcome}</p>
                  </div>
                ))}
              </div>
            </SectionBlock>

            <SectionBlock title="Deliverables">
              <div className="space-y-3">
                {framework.deliverables.map((deliverable) => (
                  <div key={deliverable.title} className="rounded-xl border border-white/[0.06] bg-black/18 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-semibold text-white">{deliverable.title}</h4>
                        <p className="mt-1 text-xs leading-5 text-white/50">{deliverable.purpose}</p>
                      </div>
                      <StatusPill status={deliverable.status} />
                    </div>
                    <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.1em] text-white/32">{deliverable.value}</p>
                  </div>
                ))}
              </div>
            </SectionBlock>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3.5 lg:grid-cols-2">
            <SectionBlock title="Content Outline">
              <div className="space-y-3">
                {framework.contentOutline.map((section, index) => (
                  <div key={`${section.title}-${index}`} className="rounded-xl border border-white/[0.06] bg-black/18 p-3">
                    <p className="text-[10px] font-medium uppercase tracking-[0.11em] text-white/32">Lesson {index + 1}</p>
                    <h4 className="mt-1 text-sm font-semibold text-white">{section.title}</h4>
                    <p className="mt-2 text-xs leading-5 text-white/50">{section.body}</p>
                    <p className="mt-2 text-xs leading-5 text-fuchsia-100/62">{section.actionPrompt}</p>
                  </div>
                ))}
              </div>
            </SectionBlock>

            <SectionBlock title="Branding & Assets">
              <div className="space-y-2.5">
                <DetailCard label="Product name" value={framework.brand.name} />
                <DetailCard label="Subtitle" value={framework.brand.subtitle} />
                <DetailCard label="Tagline" value={framework.brand.tagline} />
                <DetailCard label="Cover concept" value={framework.brand.cover} />
                <DetailCard label="What should it look like?" value={framework.brand.visual} />
              </div>
            </SectionBlock>
          </div>

          <div className="mt-5 relative overflow-hidden rounded-2xl border border-fuchsia-300/14 bg-fuchsia-400/[0.065] p-5">
            <div className="absolute -right-10 -top-12 h-24 w-24 rounded-full bg-fuchsia-400/14 blur-3xl" />
            <p className="relative mb-2 text-[10px] font-medium uppercase tracking-[0.13em] text-fuchsia-100/70">What would WIZUP build?</p>
            <h3 className="relative text-xl font-semibold tracking-[-0.04em] text-white">{framework.recommendation.version}</h3>
            <div className="relative mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {framework.recommendation.reasons.map((reason) => (
                <div key={reason} className="flex items-center gap-2 text-sm leading-5 text-white/66">
                  <Layers3 className="h-3.5 w-3.5 shrink-0 text-fuchsia-100/70" />
                  {reason}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <DesignerVisualControl
            activeSession={activeSession}
            visualStates={visualStates}
            isPending={designerIsPending}
            readyCount={readyVisualCount}
            queuedCount={designerRuntimeState.queuedAssetCount}
            completedCount={designerRuntimeState.completedAssetCount}
            failedCount={designerRuntimeState.failedAssetCount}
            imageGenerationMode={designerRuntimeState.imageGenerationMode}
            canGenerateInRuntime={designerRuntimeState.canGenerateInRuntime}
            onRefreshAssets={() => {
              startDesignerTransition(async () => {
                await refreshDesignerAssets();
              });
            }}
            onGenerate={runVisualGeneration}
            onFounderAction={handleFounderAction}
          />

          <div className="rounded-[1.6rem] border border-white/[0.075] bg-white/[0.038] p-5 shadow-[0_26px_78px_-64px_rgba(217,70,239,0.68)] backdrop-blur-xl">
            <div className="mb-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-white/34">Studio activity</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white">Your AI Team</h2>
            </div>
            <div className="space-y-3">
              {agents.map((agent) => (
                <div key={agent.name} className="flex items-center justify-between rounded-xl border border-white/[0.065] bg-black/20 px-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.035]">
                      <TeamStatus status={agent.status} />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-white/78">{agent.name}</span>
                      <p className="mt-0.5 text-xs text-white/36">{agent.detail}</p>
                    </div>
                  </div>
                  <span className={`text-xs capitalize ${agent.status === 'working' ? 'text-fuchsia-100' : agent.status === 'completed' ? 'text-white/54' : 'text-white/34'}`}>{agent.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-white/[0.075] bg-white/[0.038] p-5 shadow-[0_26px_78px_-64px_rgba(217,70,239,0.68)] backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-fuchsia-100/78" />
              <h2 className="text-base font-semibold tracking-[-0.03em] text-white">WIZUP Assistant</h2>
            </div>
            <div className="grid grid-cols-1 gap-2.5">
              {assistantActions.map((action) => (
                <button key={action} type="button" className="rounded-xl border border-white/[0.065] bg-black/20 px-3 py-2.5 text-left text-sm text-white/64 transition-colors hover:border-fuchsia-300/16 hover:bg-fuchsia-400/[0.06] hover:text-white">
                  {action}
                </button>
              ))}
            </div>
            <div className="mt-4 flex h-11 items-center gap-3 rounded-xl border border-white/[0.075] bg-black/24 px-3 text-sm text-white/34">
              <PenLine className="h-4 w-4" />
              Ask for a product change...
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[1.7rem] border border-white/[0.075] bg-[linear-gradient(145deg,rgba(255,255,255,0.056),rgba(255,255,255,0.022)_48%,rgba(0,0,0,0.2))] p-5 shadow-[0_28px_84px_-64px_rgba(217,70,239,0.72)] backdrop-blur-xl sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-6">
        <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-fuchsia-400/10 blur-3xl" />
        <div className="relative">
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">Your product framework is ready.</h2>
          <p className="mt-2 text-sm leading-6 text-white/56">Continue to Publish and prepare your launch assets.</p>
        </div>
        <Link href="/app/publish" className="relative mt-5 block sm:mt-0" onClick={() => updateStage('publish')}>
          <Button className="h-12 w-full rounded-xl bg-fuchsia-500 px-5 font-semibold text-white shadow-[0_0_24px_-11px_rgba(217,70,239,0.86)] transition-all hover:bg-fuchsia-400 sm:w-auto">
            Continue to Publish
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </section>
    </div>
  );
}
