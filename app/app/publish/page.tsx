'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Circle,
  Edit3,
  Eye,
  ExternalLink,
  FileQuestion,
  Gift,
  ImageIcon,
  MessageSquare,
  MousePointer2,
  PenLine,
  Rocket,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  Tag,
  Type,
  Users,
} from 'lucide-react';

import { loadReadyDesignerSessionAssets, runReviewer } from '@/app/actions/ai';
import {
  type BuildSession,
  type LaunchReadiness,
  type ProductDraft,
  type SalesKit,
  useActiveBuild,
} from '@/app/context/ActiveBuildSessionContext';
import { Button } from '@/components/ui/button';
import type { ReviewerStoreReadinessOutput } from '@/lib/ai';
import type {
  DesignerAssetType,
  SessionDesignerAssetState,
  SessionPrimaryDesignerAsset,
} from '@/lib/designer-assets';

type PublishAsset = {
  title: string;
  copy: string;
  icon: React.ComponentType<{ className?: string }>;
};

type Benefit = {
  outcome: string;
  emotional: string;
  practical: string;
};

type PricingPlan = {
  entry: string;
  premium: string;
  bundle: string;
  upsell: string;
  reason: string;
};

type PublishEngine = {
  productName: string;
  productType: string;
  audience: string;
  offer: string;
  price: string;
  status: string;
  summary: string;
  headline: string;
  subheadline: string;
  problem: string;
  solution: string;
  benefits: Benefit[];
  cta: string;
  faq: Array<{ question: string; answer: string }>;
  pricing: PricingPlan;
  trust: {
    guarantee: string;
    elements: string[];
    testimonials: string[];
    proof: string[];
  };
  launchAssets: PublishAsset[];
  recommendation: {
    launch: string;
    reasons: string[];
  };
};

function createFallbackDraft(): ProductDraft {
  return {
    title: 'Product Starter Kit',
    subtitle: 'A simple digital product for busy beginners.',
    promise: 'Help buyers get a clear result without feeling overwhelmed.',
    targetBuyer: 'busy beginners',
    category: 'Toolkit',
    recommendedPrice: '$19 - $39',
    problemSummary: 'Buyers need a simple way to move from confusion to action.',
    differentiator: 'Simple steps, practical examples, and fast setup.',
    keyFeatures: ['Quick-start guide', 'Checklist', 'Templates'],
    proofPoints: ['Clear buyer pain', 'Simple delivery', 'Fast setup'],
    buildPlan: ['Prepare the sales page', 'Add launch assets', 'Run a final review'],
    modules: [],
  };
}

function createSalesKitFromDraft(draft: ProductDraft): SalesKit {
  return {
    headline: draft.promise,
    subheadline: draft.subtitle,
    problemSection: draft.problemSummary,
    benefitBullets: draft.keyFeatures.length
      ? draft.keyFeatures
      : ['Start quickly', 'Follow simple steps', 'Use ready-made examples'],
    launchEmails: [
      {
        subject: `${draft.title} is ready`,
        previewText: 'A simple way to get the result you want without starting from scratch.',
        body: `${draft.title} helps ${draft.targetBuyer.toLowerCase()} use a clear system and take the next step with less stress.`,
      },
    ],
    socialPosts: [
      `${draft.title} is built for ${draft.targetBuyer.toLowerCase()} who want a simpler way to begin.`,
      `If ${draft.problemSummary.toLowerCase()}, this kit gives you a clear first step.`,
    ],
    faq: [
      {
        question: 'Who is this for?',
        answer: `It is for ${draft.targetBuyer.toLowerCase()} who want a simple product they can use right away.`,
      },
      {
        question: 'How fast can I start?',
        answer: 'You can open the product and start with the first step in a few minutes.',
      },
      {
        question: 'Do I need special tools?',
        answer: 'No. The product is designed to be simple and easy to use.',
      },
    ],
    pricingRationale: `${draft.recommendedPrice} is clear enough for a first launch and low enough for fast validation.`,
    callToAction: 'Get the toolkit',
  };
}

function buildPublishEngine(draft: ProductDraft, salesKit: SalesKit): PublishEngine {
  const benefits = salesKit.benefitBullets.slice(0, 5).map((benefit) => ({
    outcome: benefit,
    emotional: 'Feel clearer and more confident.',
    practical: 'Use a ready-made step instead of starting from zero.',
  }));

  return {
    productName: draft.title,
    productType: draft.category,
    audience: draft.targetBuyer,
    offer: salesKit.subheadline || draft.subtitle,
    price: draft.recommendedPrice,
    status: 'Sales assets ready',
    summary: `${draft.title} is ready to launch with a clear offer, simple page structure, and launch copy buyers can understand quickly.`,
    headline: salesKit.headline,
    subheadline: salesKit.subheadline,
    problem: salesKit.problemSection,
    solution: draft.promise,
    benefits,
    cta: salesKit.callToAction,
    faq: salesKit.faq.slice(0, 8),
    pricing: {
      entry: draft.recommendedPrice,
      premium: '$49 - $79',
      bundle: `${draft.category} + templates + examples`,
      upsell: 'A premium setup pack or deeper template bundle.',
      reason: salesKit.pricingRationale,
    },
    trust: {
      guarantee: 'Offer a simple 7-day satisfaction promise for first buyers.',
      elements: ['Clear included-assets list', 'Instant access message', 'Simple refund note'],
      testimonials: ['One early buyer quote', 'One before-and-after story', 'One creator note about why it works'],
      proof: draft.proofPoints.length ? draft.proofPoints : ['Show product pages', 'Add screenshots', 'Explain setup time'],
    },
    launchAssets: [
      { title: 'Product Description', copy: salesKit.subheadline || draft.subtitle, icon: Type },
      { title: 'Email Announcement', copy: salesKit.launchEmails[0]?.body || `${draft.title} is ready for buyers.`, icon: MessageSquare },
      { title: 'Social Post 1', copy: salesKit.socialPosts[0] || `${draft.title} is ready.`, icon: Share2 },
      { title: 'Social Post 2', copy: salesKit.socialPosts[1] || `A simple way to solve ${draft.problemSummary.toLowerCase()}.`, icon: Star },
      { title: 'Launch Message', copy: salesKit.callToAction, icon: Rocket },
      { title: 'Creator Announcement', copy: `I built ${draft.title} for ${draft.targetBuyer.toLowerCase()} who want a simpler way forward.`, icon: Users },
    ],
    recommendation: {
      launch: `Starter ${draft.category} + Premium Bundle`,
      reasons: ['easiest to sell', 'strongest value perception', 'fastest validation'],
    },
  };
}

function readinessFromReviewer(output: ReviewerStoreReadinessOutput): LaunchReadiness {
  return {
    readinessScore: output.readinessScore,
    verdict:
      output.verdict === 'Ready to publish'
        ? 'Ready to launch'
        : output.verdict === 'Revise before launch'
          ? 'Needs polish'
          : 'Not ready',
    checklist: output.launchChecklist.map((item) => ({
      label: item,
      status: 'ready',
      detail: 'Reviewer checked this launch step.',
    })),
    priorityFixes: output.priorityFixes,
    preview: {
      hero: output.storeSummary.hero,
      offer: output.storeSummary.offer,
      trust: output.storeSummary.trust,
      nextStep: output.storeSummary.checkout,
    },
  };
}

function fallbackReviewer(engine: PublishEngine): ReviewerStoreReadinessOutput {
  return {
    role: 'Reviewer',
    source: 'mock',
    model: 'local-fallback',
    generatedAt: new Date().toISOString(),
    readinessScore: 82,
    verdict: 'Revise before launch',
    checks: [
      { area: 'Clarity', status: 'Pass', score: 88, notes: 'The offer is easy to understand.', fix: 'Keep the promise short.' },
      { area: 'Trust', status: 'Needs work', score: 74, notes: 'Buyers need proof before checkout.', fix: 'Add one quote and a simple guarantee.' },
      { area: 'Conversion', status: 'Pass', score: 84, notes: 'The page has a clear benefit and CTA.', fix: 'Keep the CTA visible near the price.' },
      { area: 'Readiness', status: 'Needs work', score: 80, notes: 'Storefront setup is the last step.', fix: 'Test the checkout and product delivery.' },
    ],
    priorityFixes: ['Add one proof point.', 'Show exactly what files buyers get.', 'Test checkout before launch.'],
    launchChecklist: ['Review headline', 'Confirm price', 'Add FAQ', 'Prepare storefront', 'Test checkout'],
    storeSummary: {
      hero: engine.headline,
      offer: engine.offer,
      checkout: 'Storefront is pending.',
      trust: 'Add proof, FAQ, and a simple guarantee before publishing.',
    },
  };
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'completed') {
    return <Check className="h-3.5 w-3.5 text-fuchsia-100" />;
  }

  if (status === 'working') {
    return <Circle className="h-3.5 w-3.5 fill-fuchsia-300/70 text-fuchsia-200" />;
  }

  return <Sparkles className="h-3.5 w-3.5 text-fuchsia-100/76" />;
}

function PublishButton({
  children,
  icon: Icon,
  href,
  disabled = false,
}: {
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  disabled?: boolean;
}) {
  const className = `inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.085] bg-white/[0.04] px-4 text-sm font-medium shadow-[0_18px_54px_-46px_rgba(217,70,239,0.7)] transition-all ${
    disabled
      ? 'cursor-not-allowed text-white/38'
      : 'text-white/74 hover:border-fuchsia-300/16 hover:bg-fuchsia-400/[0.065] hover:text-white'
  }`;

  const content = (
    <>
      <Icon className="h-4 w-4" />
      {children}
    </>
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" disabled={disabled} className={className}>
      {content}
    </button>
  );
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.065] bg-black/20 p-3">
      <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.11em] text-white/34">{label}</p>
      <p className="text-sm leading-5 text-white/68">{value}</p>
    </div>
  );
}

function EngineBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.065] bg-black/18 p-4">
      <h3 className="mb-3 text-base font-semibold tracking-[-0.03em] text-white">{title}</h3>
      {children}
    </div>
  );
}

type ApprovedAssetPanelConfig = {
  key: DesignerAssetType;
  label: string;
  emptyLabel: string;
  description: string;
  emptyDescription: string;
  aspectClassName: string;
};

const publishAssetPanels: ApprovedAssetPanelConfig[] = [
  {
    key: 'sales_graphic',
    label: 'Sales graphic',
    emptyLabel: 'Sales graphic pending',
    description: 'Approved launch visual for the publish workspace.',
    emptyDescription: 'The approved sales graphic will appear here after Designer marks it ready.',
    aspectClassName: 'aspect-[4/5]',
  },
  {
    key: 'social_preview',
    label: 'Social preview',
    emptyLabel: 'Social preview pending',
    description: 'Approved social preview attached to this launch.',
    emptyDescription: 'The approved social preview will appear here after Designer marks it ready.',
    aspectClassName: 'aspect-[16/9]',
  },
];

const publishVisualAssetTypes: DesignerAssetType[] = ['sales_graphic', 'social_preview'];

const visualStatusCopy = {
  idle: 'Visuals not generated yet.',
  running: 'Designer is creating visuals…',
  awaiting_approval: 'Visuals waiting for approval.',
  failed: 'Designer could not generate visuals. Try again.',
} as const;

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

function getPublishVisualMessage(session: BuildSession | null) {
  const states = publishVisualAssetTypes
    .map((assetType) => getSessionDesignerState(session, assetType))
    .filter((state): state is SessionDesignerAssetState => Boolean(state));

  if (states.some((state) => state.status === 'failed')) {
    return visualStatusCopy.failed;
  }

  if (states.some((state) => state.status === 'running')) {
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

function ApprovedPublishAssets({ session }: { session: BuildSession | null }) {
  const readyAssets = publishAssetPanels
    .map((config) => ({ config, asset: getReadySessionAsset(session, config.key) }))
    .filter((item) => item.asset !== null);
  const emptyStateMessage = getPublishVisualMessage(session);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-white/40">Approved designer assets</p>
          <h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">Launch visuals</h3>
        </div>
        <div className="rounded-full border border-fuchsia-300/16 bg-fuchsia-400/[0.08] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.13em] text-fuchsia-100/74">
          {readyAssets.length}/2 ready
        </div>
      </div>

      {publishAssetPanels.map(({ key, label, emptyLabel, description, emptyDescription, aspectClassName }) => {
        const asset = getReadySessionAsset(session, key);

        if (!asset) {
          return (
            <div key={key} className="rounded-2xl border border-dashed border-white/10 bg-black/18 p-4">
              <div className={`flex ${aspectClassName} items-center justify-center rounded-xl border border-white/[0.06] bg-white/[0.025]`}>
                <div className="max-w-[15rem] text-center">
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
            className="group block rounded-2xl border border-white/[0.075] bg-black/18 p-4 transition-colors hover:border-fuchsia-300/18 hover:bg-white/[0.04]"
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
  );
}

function LandingPreview({ engine, session }: { engine: PublishEngine; session: BuildSession | null }) {
  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.075] bg-[linear-gradient(145deg,rgba(255,255,255,0.068),rgba(255,255,255,0.023)_39%,rgba(6,6,12,0.93))] p-5 shadow-[0_32px_108px_-74px_rgba(217,70,239,0.86)] backdrop-blur-2xl sm:p-6">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_12%,rgba(217,70,239,0.14),transparent_30%),radial-gradient(circle_at_25%_0%,rgba(124,58,237,0.1),transparent_34%)]" />
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.075] bg-[#08080d]/88 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
        <div className="mb-6 flex items-center justify-between border-b border-white/[0.06] pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl border border-fuchsia-300/16 bg-fuchsia-400/[0.09]" />
            <span className="text-sm font-semibold text-white">{engine.productName}</span>
          </div>
          <Link
            href="/storefront"
            className="rounded-full border border-white/[0.08] bg-white/[0.035] px-3 py-1.5 text-xs font-medium text-white/68 transition-colors hover:border-fuchsia-300/16 hover:bg-fuchsia-400/[0.065] hover:text-white"
          >
            {engine.cta}
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px]">
          <div>
            <p className="mb-3 inline-flex rounded-full border border-fuchsia-300/16 bg-fuchsia-400/[0.07] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.13em] text-fuchsia-100">
              {engine.audience}
            </p>
            <h2 className="max-w-xl text-4xl font-semibold leading-[1.02] tracking-[-0.05em] text-white">
              {engine.headline}
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-6 text-white/58">{engine.subheadline}</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/storefront"
                className="inline-flex h-11 items-center justify-center rounded-xl bg-fuchsia-500 px-5 text-sm font-semibold text-white shadow-[0_0_24px_-11px_rgba(217,70,239,0.86)] transition-colors hover:bg-fuchsia-400"
              >
                {engine.cta}
              </Link>
              <Link
                href="/storefront"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/[0.085] bg-white/[0.035] px-5 text-sm font-medium text-white/74 transition-colors hover:border-fuchsia-300/16 hover:bg-fuchsia-400/[0.06] hover:text-white"
              >
                See preview
              </Link>
            </div>
            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {engine.benefits.slice(0, 3).map((benefit) => (
                <div key={benefit.outcome} className="rounded-xl border border-white/[0.065] bg-white/[0.032] p-3">
                  <Check className="mb-2 h-4 w-4 text-fuchsia-100/80" />
                  <p className="text-xs leading-5 text-white/66">{benefit.outcome}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative min-h-[320px] rounded-2xl border border-white/[0.075] bg-[radial-gradient(circle_at_50%_8%,rgba(217,70,239,0.12),transparent_42%),linear-gradient(145deg,rgba(255,255,255,0.055),rgba(0,0,0,0.28))] p-5">
            <ApprovedPublishAssets session={session} />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-3">
          <div className="rounded-2xl border border-white/[0.065] bg-black/20 p-4">
            <p className="text-sm font-semibold text-white">Problem</p>
            <p className="mt-2 text-xs leading-5 text-white/50">{engine.problem}</p>
          </div>
          <div className="rounded-2xl border border-white/[0.065] bg-black/20 p-4">
            <p className="text-sm font-semibold text-white">Offer</p>
            <p className="mt-2 text-xs leading-5 text-white/50">{engine.offer}</p>
          </div>
          <div className="rounded-2xl border border-white/[0.065] bg-black/20 p-4">
            <p className="text-sm font-semibold text-white">FAQ</p>
            <p className="mt-2 text-xs leading-5 text-white/50">{engine.faq[0]?.answer}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditCard({ item }: { item: PublishAsset }) {
  const Icon = item.icon;

  return (
    <div className="rounded-2xl border border-white/[0.075] bg-white/[0.032] p-4 transition-colors hover:border-fuchsia-300/16 hover:bg-white/[0.045]">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-black/24 text-white/52">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="text-sm font-semibold text-white">{item.title}</h3>
      <p className="mt-2 min-h-10 text-xs leading-5 text-white/48">{item.copy}</p>
      <Link
        href="/app/sell"
        className="mt-4 inline-flex h-9 items-center gap-2 rounded-xl border border-white/[0.075] bg-white/[0.035] px-3 text-xs font-medium text-white/68 transition-colors hover:border-fuchsia-300/16 hover:bg-fuchsia-400/[0.06] hover:text-white"
      >
        <Edit3 className="h-3.5 w-3.5" />
        Edit
      </Link>
    </div>
  );
}

function ScoreTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.065] bg-black/20 p-3">
      <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.11em] text-white/34">{label}</p>
      <p className="text-2xl font-semibold tracking-[-0.04em] text-white">{value}</p>
    </div>
  );
}

function LaunchOrbitMap({
  readinessScore,
  currentNode,
}: {
  readinessScore: number;
  currentNode: string;
}) {
  const nodes = ['Offer', 'Assets', 'Pricing', 'Trust', 'Store', 'Launch'];

  return (
    <div className="relative overflow-hidden rounded-[1.6rem] border border-white/[0.07] bg-[radial-gradient(circle_at_50%_18%,rgba(217,70,239,0.12),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.18))] p-5 shadow-[0_28px_90px_-70px_rgba(217,70,239,0.78)]">
      <div className="absolute left-1/2 top-7 h-40 w-40 -translate-x-1/2 rounded-full border border-fuchsia-300/12" />
      <div className="absolute left-1/2 top-12 h-60 w-60 -translate-x-1/2 rounded-full border border-fuchsia-300/[0.055]" />
      <div className="absolute left-1/2 top-16 h-80 w-[80%] -translate-x-1/2 rounded-[999px] border border-fuchsia-300/[0.04]" />
      <div className="absolute inset-x-10 top-1/2 h-px bg-[linear-gradient(90deg,transparent,rgba(217,70,239,0.28),transparent)]" />

      <div className="relative mb-5">
        <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-white/34">Launch visualization</p>
        <h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">Go-live sequence</h3>
      </div>

      <div className="relative mx-auto flex h-28 w-28 items-center justify-center rounded-full border border-fuchsia-300/18 bg-black/34 shadow-[inset_0_0_30px_rgba(217,70,239,0.13),0_0_34px_-22px_rgba(217,70,239,0.9)] backdrop-blur-md">
        <Rocket className="h-7 w-7 text-fuchsia-100/80" />
      </div>

      <div className="relative mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {nodes.map((node) => {
          const active = node === currentNode;
          return (
            <div
              key={node}
              className={`rounded-xl border px-3 py-2 text-center text-xs font-medium transition-colors ${
                active
                  ? 'border-fuchsia-300/24 bg-fuchsia-400/[0.12] text-fuchsia-100 shadow-[0_0_18px_-12px_rgba(217,70,239,0.9)]'
                  : 'border-white/[0.07] bg-white/[0.03] text-white/52'
              }`}
            >
              {node}
            </div>
          );
        })}
      </div>

      <div className="relative mt-5 grid grid-cols-2 gap-2.5">
        <MiniCard label="Launch readiness" value={`${readinessScore}%`} />
        <MiniCard label="Current node" value={currentNode} />
      </div>
    </div>
  );
}

function LaunchControlCard({
  eyebrow,
  title,
  value,
  status,
  detail,
}: {
  eyebrow: string;
  title: string;
  value: string;
  status: string;
  detail: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-white/[0.065] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018)_55%,rgba(0,0,0,0.2))] p-4 transition-all duration-200 hover:border-fuchsia-300/16 hover:bg-white/[0.045]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-white/34">{eyebrow}</p>
          <h3 className="mt-2 text-base font-semibold tracking-[-0.03em] text-white">{title}</h3>
          <p className="mt-1 text-2xl font-semibold tracking-[-0.05em] text-white">{value}</p>
        </div>
        <span className="rounded-full border border-white/[0.07] bg-black/20 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white/56">
          {status}
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-white/54">{detail}</p>
    </div>
  );
}

export default function PublishPage() {
  const { activeSession, setActiveSession, updateStage, setLaunchReadiness } = useActiveBuild();
  const hydratedDesignerAssetsSessionIdRef = useRef<string | null>(null);
  const draft = activeSession?.product_draft ?? createFallbackDraft();
  const salesKit = activeSession?.sales_kit ?? createSalesKitFromDraft(draft);
  const engine = useMemo(() => buildPublishEngine(draft, salesKit), [draft, salesKit]);
  const [review, setReview] = useState<ReviewerStoreReadinessOutput>(() => fallbackReviewer(engine));
  const [isReviewing, setIsReviewing] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fallback = fallbackReviewer(engine);
    setReview(fallback);
    setIsReviewing(true);
    updateStage('publish', {
      sales_kit: salesKit,
      status: 'working',
      next_action: 'Review launch assets and prepare the live storefront.',
    });

    runReviewer({
      productTitle: engine.productName,
      buyer: engine.audience,
      headline: engine.headline,
      subheadline: engine.subheadline,
      price: engine.price,
      includedAssets: engine.launchAssets.map((asset) => asset.title),
      notes: [
        `Offer: ${engine.offer}`,
        `CTA: ${engine.cta}`,
        `Pricing: ${engine.pricing.reason}`,
        `Trust: ${engine.trust.elements.join('; ')}`,
      ].join('\n'),
    })
      .then((output) => {
        if (!isMounted) return;
        setReview(output);
        setLaunchReadiness(readinessFromReviewer(output));
        updateStage('publish', {
          sales_kit: salesKit,
          launch_readiness: readinessFromReviewer(output),
          status: output.readinessScore >= 85 ? 'ready' : 'needs_review',
          next_action: 'Continue to Store and prepare your live storefront.',
        });
      })
      .catch(() => {
        if (!isMounted) return;
        setReview(fallback);
      })
      .finally(() => {
        if (isMounted) setIsReviewing(false);
      });

    return () => {
      isMounted = false;
    };
  }, [engine, salesKit, setLaunchReadiness, updateStage]);

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

    loadReadyDesignerSessionAssets({
      sessionId: activeSession.id,
      assetTypes: publishVisualAssetTypes,
    })
      .then((result) => {
        if (!isMounted) return;
        if (Object.keys(result.assets).length === 0) return;

        const readyStates = Object.fromEntries(
          Object.keys(result.assets).map((assetType) => [
            assetType,
            {
              assetType: assetType as DesignerAssetType,
              status: 'ready',
              message: 'Founder approved this visual.',
              rowId: null,
              reviewerScore: null,
              storagePath: null,
              updatedAt: new Date().toISOString(),
            } satisfies SessionDesignerAssetState,
          ])
        );

        setActiveSession({
          ...activeSession,
          designer_assets: {
            ...(activeSession.designer_assets ?? {}),
            ...result.assets,
          },
          designer_asset_states: {
            ...(activeSession.designer_asset_states ?? {}),
            ...readyStates,
          },
          updated_at: new Date().toISOString(),
        });
      })
      .catch(() => {
        if (!isMounted) return;
      });

    return () => {
      isMounted = false;
    };
  }, [activeSession, setActiveSession]);

  const agents = [
    { name: 'Scout', status: 'completed', detail: 'Research complete' },
    { name: 'Strategist', status: 'completed', detail: 'Offer path chosen' },
    { name: 'Creator', status: 'completed', detail: 'Product assets ready' },
    { name: 'Copywriter', status: 'completed', detail: 'Sales copy generated' },
    { name: 'Reviewer', status: isReviewing ? 'working' : 'polishing', detail: isReviewing ? 'Checking sales assets' : 'Readiness scored' },
  ];
  const readyAssetCount = publishVisualAssetTypes.filter((assetType) =>
    getReadySessionAsset(activeSession, assetType)
  ).length;
  const visualMessage = getPublishVisualMessage(activeSession);
  const readinessScore = review.readinessScore;
  const launchStatus =
    readinessScore >= 90
      ? 'Launch ready'
      : readinessScore >= 80
        ? 'Needs final review'
        : 'Blocked';
  const currentNode =
    readyAssetCount === publishVisualAssetTypes.length
      ? 'Store'
      : readyAssetCount > 0
        ? 'Assets'
        : isReviewing
          ? 'Trust'
          : 'Offer';
  const launchSnapshot = [
    { label: 'Product', value: engine.productName },
    { label: 'Audience', value: engine.audience },
    { label: 'Offer', value: engine.offer },
    { label: 'Price', value: engine.price },
    {
      label: 'Store readiness',
      value: readyAssetCount === publishVisualAssetTypes.length ? 'Ready to test' : 'Needs assets',
    },
    { label: 'Launch status', value: launchStatus },
    { label: 'Conversion confidence', value: `${review.checks[2]?.score ?? 84}%` },
  ];
  const launchModules = [
    { title: 'Hero', copy: engine.headline },
    { title: 'Problem', copy: engine.problem },
    { title: 'Solution', copy: engine.solution },
    { title: 'Offer', copy: engine.offer },
    { title: 'CTA', copy: engine.cta },
    { title: 'FAQ', copy: engine.faq[0]?.question ?? 'FAQ pending' },
    { title: 'Trust', copy: engine.trust.guarantee },
  ];
  const assistantActions = [
    'Improve headline',
    'Improve offer',
    'Improve CTA',
    'Improve pricing',
    'Generate social proof',
    'Strengthen trust',
    'Increase conversions',
    'Create urgency',
  ];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-7">
      <section className="relative overflow-hidden rounded-[1.85rem] border border-white/[0.075] bg-[linear-gradient(145deg,rgba(255,255,255,0.068),rgba(255,255,255,0.023)_39%,rgba(6,6,12,0.93))] p-5 shadow-[0_32px_108px_-74px_rgba(217,70,239,0.86)] backdrop-blur-2xl sm:p-8 lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(217,70,239,0.16),transparent_31%),radial-gradient(circle_at_42%_0%,rgba(124,58,237,0.12),transparent_34%)]" />
        <div className="relative grid grid-cols-1 gap-5 xl:grid-cols-[1.02fr_1fr_0.82fr]">
          <div className="rounded-[1.55rem] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02)_58%,rgba(0,0,0,0.16))] p-5 sm:p-6">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-fuchsia-300/16 bg-fuchsia-400/[0.07] px-3 py-1.5 text-xs font-medium text-fuchsia-100">
              <Rocket className="h-3.5 w-3.5" />
              Launch control
            </div>
            <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-white/34">Product name</p>
            <h1 className="mt-2 max-w-3xl text-4xl font-semibold leading-[0.98] tracking-[-0.055em] text-white sm:text-5xl lg:text-6xl">
              Ready to launch your product?
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/64 sm:text-lg">
              WIZUP has prepared your offer, sales assets, pricing, launch copy, and storefront strategy.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-fuchsia-300/16 bg-fuchsia-400/[0.08] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.13em] text-fuchsia-100/78">
                {launchStatus}
              </span>
              <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.13em] text-white/54">
                {readinessScore}% readiness
              </span>
              <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.13em] text-white/54">
                Launch score {readinessScore}
              </span>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <MiniCard label="Product" value={engine.productName} />
              <MiniCard label="Category" value={engine.productType} />
              <MiniCard label="Status" value={launchStatus} />
              <MiniCard label="Current focus" value={currentNode} />
            </div>
          </div>

          <LaunchOrbitMap readinessScore={readinessScore} currentNode={currentNode} />

          <div className="rounded-[1.55rem] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02)_58%,rgba(0,0,0,0.16))] p-5 sm:p-6">
            <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-white/34">Launch actions</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Preview before go-live</h2>
            <p className="mt-2 text-sm leading-6 text-white/52">
              Review the buyer-facing page, storefront, and final share surfaces before you move into Store.
            </p>
            <div className="mt-5 flex flex-col gap-3">
              <PublishButton icon={Eye} href="/storefront">Preview Sales Page</PublishButton>
              <PublishButton icon={ExternalLink} href="/storefront">Preview Store</PublishButton>
              <PublishButton icon={Share2} disabled>Share Preview</PublishButton>
            </div>
            <div className="mt-5">
              <MiniCard label="Launch readiness badge" value={`${readyAssetCount}/2 launch visuals ready`} />
              <p className="mt-3 text-xs leading-5 text-white/42">
                Share Preview stays disabled until the share flow exists.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
        <LaunchControlCard
          eyebrow="Sales assets"
          title="Offer materials"
          value={`${engine.launchAssets.length} assets`}
          status={readyAssetCount ? 'Ready' : 'Needs asset'}
          detail={visualMessage}
        />
        <LaunchControlCard
          eyebrow="Pricing"
          title="Entry offer"
          value={engine.pricing.entry}
          status="Ready"
          detail={engine.pricing.reason}
        />
        <LaunchControlCard
          eyebrow="Storefront"
          title="Preview route"
          value="/storefront"
          status={readyAssetCount === publishVisualAssetTypes.length ? 'Ready' : 'Needs review'}
          detail="Store preview is available now. Final launch depends on ready visuals and store confirmation."
        />
        <LaunchControlCard
          eyebrow="Conversion"
          title="Confidence"
          value={`${review.checks[2]?.score ?? 84}%`}
          status={(review.checks[2]?.score ?? 84) >= 80 ? 'Ready' : 'Needs review'}
          detail={review.checks[2]?.notes ?? 'CTA and offer need one last pass.'}
        />
        <LaunchControlCard
          eyebrow="Trust"
          title="Proof state"
          value={`${review.checks[1]?.score ?? 74}%`}
          status={(review.checks[1]?.score ?? 74) >= 80 ? 'Ready' : 'Blocked'}
          detail={review.priorityFixes[0] ?? 'Add final proof before launch.'}
        />
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_380px]">
        <LandingPreview engine={engine} session={activeSession} />

        <div className="space-y-5">
          <div className="rounded-[1.55rem] border border-white/[0.075] bg-white/[0.038] p-5 shadow-[0_26px_78px_-64px_rgba(217,70,239,0.68)] backdrop-blur-xl">
            <div className="mb-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-white/34">Mission status</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white">AI Team Status</h2>
            </div>
            <div className="space-y-3">
              {agents.map((agent) => (
                <div key={agent.name} className="flex items-center justify-between rounded-xl border border-white/[0.065] bg-black/20 px-3 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/[0.07] bg-white/[0.035]">
                      <StatusIcon status={agent.status} />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-white/78">{agent.name}</span>
                      <p className="mt-0.5 text-xs text-white/36">{agent.detail}</p>
                    </div>
                  </div>
                  <span className={`text-xs capitalize ${agent.status === 'working' ? 'text-fuchsia-100' : agent.status === 'polishing' ? 'text-fuchsia-100/70' : 'text-white/54'}`}>
                    {agent.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.55rem] border border-white/[0.075] bg-white/[0.038] p-5 shadow-[0_26px_78px_-64px_rgba(217,70,239,0.68)] backdrop-blur-xl">
            <div className="mb-4">
              <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-white/34">Readiness monitor</p>
              <h2 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white">Launch Confidence Panel</h2>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <ScoreTile label="Clarity" value={`${review.checks[0]?.score ?? 82}%`} />
              <ScoreTile label="Trust" value={`${review.checks[1]?.score ?? 74}%`} />
              <ScoreTile label="Conversion" value={`${review.checks[2]?.score ?? 84}%`} />
              <ScoreTile label="Readiness" value={`${review.readinessScore}%`} />
            </div>
            <p className="mt-4 text-sm font-medium text-white">Top improvement</p>
            <p className="mt-1 text-sm leading-6 text-white/56">{review.priorityFixes[0] ?? 'Add final proof before launch.'}</p>
          </div>

          <div className="rounded-[1.55rem] border border-white/[0.075] bg-white/[0.038] p-5 shadow-[0_26px_78px_-64px_rgba(217,70,239,0.68)] backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-fuchsia-100/78" />
              <h2 className="text-base font-semibold tracking-[-0.03em] text-white">Launch Assistant</h2>
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
              Ask for a sales page change...
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[1.7rem] border border-white/[0.075] bg-white/[0.038] p-5 shadow-[0_28px_84px_-64px_rgba(217,70,239,0.72)] backdrop-blur-xl sm:p-6">
        <div className="mb-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-white/34">Launch snapshot</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">One-glance launch summary</h2>
          <p className="mt-2 text-sm leading-6 text-white/56">The product, offer, price, readiness, and conversion state in one horizontal summary.</p>
        </div>
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-7">
          {launchSnapshot.map((item) => (
            <MiniCard key={item.label} label={item.label} value={item.value} />
          ))}
        </div>
      </section>

      <section className="rounded-[1.7rem] border border-white/[0.075] bg-white/[0.038] p-5 shadow-[0_28px_84px_-64px_rgba(217,70,239,0.72)] backdrop-blur-xl sm:p-6">
        <div className="mb-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-white/34">Sales page architecture</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Review the launch page like a real landing page</h2>
          <p className="mt-2 text-sm leading-6 text-white/56">Each module maps to how buyers will experience the page from first impression to final trust check.</p>
        </div>
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {launchModules.map((module) => (
            <EngineBlock key={module.title} title={module.title}>
              <p className="text-sm leading-6 text-white/66">{module.copy}</p>
            </EngineBlock>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <div className="rounded-[1.7rem] border border-white/[0.075] bg-white/[0.038] p-5 shadow-[0_28px_84px_-64px_rgba(217,70,239,0.72)] backdrop-blur-xl sm:p-6">
            <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-white/34">Benefits engine</p>
            <h2 className="mb-5 mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Strategic benefit framing</h2>
            <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
              {engine.benefits.map((benefit, index) => (
                <div key={benefit.outcome} className="rounded-2xl border border-white/[0.065] bg-black/18 p-4">
                  <h3 className="text-sm font-semibold text-white">{benefit.outcome}</h3>
                  <p className="mt-2 text-xs leading-5 text-fuchsia-100/62">{benefit.emotional}</p>
                  <p className="mt-2 text-xs leading-5 text-white/48">{benefit.practical}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2.5">
                    <MiniCard label="Impact" value={index < 2 ? 'High' : 'Medium'} />
                    <MiniCard label="Conversion" value={`${review.checks[2]?.score ?? 84}%`} />
                    <MiniCard label="Emotion" value={index === 0 ? 'Strong' : 'Clear'} />
                    <MiniCard label="Clarity" value={`${review.checks[0]?.score ?? 82}%`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.7rem] border border-white/[0.075] bg-white/[0.038] p-5 shadow-[0_28px_84px_-64px_rgba(217,70,239,0.72)] backdrop-blur-xl sm:p-6">
            <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-white/34">Launch asset studio</p>
            <h2 className="mb-5 mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Production-ready launch assets</h2>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
              {engine.launchAssets.map((item, index) => (
                <div key={item.title} className="rounded-2xl border border-white/[0.075] bg-white/[0.032] p-4 transition-colors hover:border-fuchsia-300/16 hover:bg-white/[0.045]">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.07] bg-black/24 text-white/52">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span className="rounded-full border border-white/[0.07] bg-black/20 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white/56">
                      {index < 2 ? 'Ready' : 'Needs review'}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                  <p className="mt-2 min-h-10 text-xs leading-5 text-white/48">{item.copy}</p>
                  <div className="mt-4 grid grid-cols-2 gap-2.5">
                    <MiniCard label="Reviewer score" value={`${review.readinessScore}%`} />
                    <MiniCard label="Asset quality" value={index < 2 ? 'Strong' : 'Review'} />
                  </div>
                  <p className="mt-3 text-xs leading-5 text-white/42">
                    AI suggestion: {index % 2 === 0 ? 'Tighten the headline and keep the benefit immediate.' : 'Add more trust or specificity before final launch.'}
                  </p>
                  <Link
                    href="/app/sell"
                    className="mt-4 inline-flex h-9 items-center gap-2 rounded-xl border border-white/[0.075] bg-white/[0.035] px-3 text-xs font-medium text-white/68 transition-colors hover:border-fuchsia-300/16 hover:bg-fuchsia-400/[0.06] hover:text-white"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-[1.55rem] border border-white/[0.075] bg-white/[0.038] p-5 shadow-[0_26px_78px_-64px_rgba(217,70,239,0.68)] backdrop-blur-xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-white/34">Pricing strategy</p>
            <h2 className="mb-4 mt-2 text-xl font-semibold tracking-[-0.03em] text-white">Launch pricing board</h2>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <MiniCard label="Entry" value={engine.pricing.entry} />
              <MiniCard label="Core" value={engine.price} />
              <MiniCard label="Premium" value={engine.pricing.premium} />
              <MiniCard label="Bundle" value={engine.pricing.bundle} />
              <MiniCard label="Upsell" value={engine.pricing.upsell} />
              <MiniCard label="Launch score" value={`${readinessScore}%`} />
            </div>
            <p className="mt-4 text-sm leading-6 text-white/52">{engine.pricing.reason}</p>
          </div>

          <div className="rounded-[1.55rem] border border-white/[0.075] bg-white/[0.038] p-5 shadow-[0_26px_78px_-64px_rgba(217,70,239,0.68)] backdrop-blur-xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-white/34">Objection handling engine</p>
            <h2 className="mb-4 mt-2 text-xl font-semibold tracking-[-0.03em] text-white">Questions, trust, and missing objections</h2>
            <div className="space-y-3">
              {engine.faq.map((item) => (
                <div key={item.question} className="rounded-2xl border border-white/[0.065] bg-black/18 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-white">{item.question}</h3>
                      <p className="mt-2 text-xs leading-5 text-white/50">{item.answer}</p>
                    </div>
                    <FileQuestion className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-100/72" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.55rem] border border-white/[0.075] bg-white/[0.038] p-5 shadow-[0_26px_78px_-64px_rgba(217,70,239,0.68)] backdrop-blur-xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-white/34">Conversion intelligence</p>
            <h2 className="mb-4 mt-2 text-xl font-semibold tracking-[-0.03em] text-white">Trust signals, proof gaps, and quick wins</h2>
            <MiniCard label="Guarantee" value={engine.trust.guarantee} />
            <div className="mt-4 grid grid-cols-1 gap-3">
              {[
                { title: 'Trust signals', list: engine.trust.elements, icon: ShieldCheck },
                { title: 'Testimonials needed', list: engine.trust.testimonials, icon: Users },
                { title: 'Quick wins', list: engine.trust.proof, icon: Gift },
              ].map(({ title, list, icon: Icon }) => (
                <div key={title} className="rounded-2xl border border-white/[0.065] bg-black/18 p-4">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-fuchsia-100/72" />
                    <h3 className="text-sm font-semibold text-white">{title}</h3>
                  </div>
                  <div className="mt-3 space-y-2">
                    {list.map((item) => (
                      <div key={item} className="flex gap-2 text-xs leading-5 text-white/52">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-fuchsia-100/70" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.55rem] border border-white/[0.075] bg-white/[0.038] p-5 shadow-[0_26px_78px_-64px_rgba(217,70,239,0.68)] backdrop-blur-xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-white/34">Launch confidence</p>
            <h2 className="mb-4 mt-2 text-xl font-semibold tracking-[-0.03em] text-white">Executive launch recommendation</h2>
            <div className="grid grid-cols-2 gap-2.5">
              <ScoreTile label="Clarity" value={`${review.checks[0]?.score ?? 82}%`} />
              <ScoreTile label="Trust" value={`${review.checks[1]?.score ?? 74}%`} />
              <ScoreTile label="Conversion" value={`${review.checks[2]?.score ?? 84}%`} />
              <ScoreTile label="Readiness" value={`${review.readinessScore}%`} />
            </div>
            <p className="mt-4 text-sm leading-6 text-white/56">{review.priorityFixes[0] ?? 'Add final proof before launch.'}</p>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[1.65rem] border border-fuchsia-300/14 bg-fuchsia-400/[0.065] p-5 shadow-[0_28px_84px_-64px_rgba(217,70,239,0.72)] backdrop-blur-xl sm:p-6">
        <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-fuchsia-400/14 blur-3xl" />
        <p className="relative mb-2 text-[10px] font-medium uppercase tracking-[0.13em] text-fuchsia-100/70">What would WIZUP launch?</p>
        <h2 className="relative text-2xl font-semibold tracking-[-0.04em] text-white">{engine.recommendation.launch}</h2>
        <div className="relative mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {engine.recommendation.reasons.map((reason) => (
            <div key={reason} className="flex items-center gap-2 text-sm leading-5 text-white/66">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-fuchsia-100/70" />
              {reason}
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.075] bg-[linear-gradient(145deg,rgba(255,255,255,0.056),rgba(255,255,255,0.022)_48%,rgba(0,0,0,0.2))] p-5 shadow-[0_28px_84px_-64px_rgba(217,70,239,0.72)] backdrop-blur-xl sm:p-6">
        <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-fuchsia-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-fuchsia-300/16 bg-fuchsia-400/[0.07] px-3 py-1.5 text-xs font-medium text-fuchsia-100">
              <ShieldCheck className="h-3.5 w-3.5" />
              Launch decision panel
            </div>
            <h2 className="text-3xl font-semibold tracking-[-0.04em] text-white">Everything is prepared for the final stage.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/56">Review the store path, asset state, and launch confidence, then move into Store when you are satisfied.</p>
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              <MiniCard label="Store ready" value={readyAssetCount === publishVisualAssetTypes.length ? 'Yes' : 'Needs assets'} />
              <MiniCard label="Assets ready" value={`${readyAssetCount}/2`} />
              <MiniCard label="Launch ready" value={launchStatus} />
              <MiniCard label="Revenue ready" value="Store next" />
            </div>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-[260px]">
            <Link href="/app/store" className="block" onClick={() => updateStage('launch')}>
              <Button className="h-12 w-full rounded-xl bg-fuchsia-500 px-5 font-semibold text-white shadow-[0_0_24px_-11px_rgba(217,70,239,0.86)] transition-all hover:bg-fuchsia-400">
                Continue to Store
                <MousePointer2 className="h-4 w-4" />
              </Button>
            </Link>
            <PublishButton icon={Eye} href="/storefront">Preview Everything</PublishButton>
          </div>
        </div>
      </section>
    </div>
  );
}
