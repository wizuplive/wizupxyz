'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { CheckCircle2, ChevronRight, ClipboardCheck, Rocket, Store } from 'lucide-react';

import {
  useActiveBuild,
  type LaunchReadiness,
  type LaunchReadinessItem,
  type ProductDraft,
  type SalesKit,
} from '@/app/context/ActiveBuildSessionContext';
import { EmptyWorkflowState } from '@/components/workflow/workflow-panels';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

function buildReadinessChecklist(
  productTitle: string,
  hasHeadline: boolean,
  hasBenefits: boolean,
  hasEmails: boolean,
  hasFaq: boolean,
  hasProofPoints: boolean,
  hasModules: boolean
): LaunchReadinessItem[] {
  return [
    {
      label: 'Offer clarity',
      status: productTitle ? 'ready' : 'missing',
      detail: productTitle ? 'The product is clearly named and defined.' : 'Add a product title in Create.',
    },
    {
      label: 'Hero messaging',
      status: hasHeadline ? 'ready' : 'needs_work',
      detail: hasHeadline ? 'Headline and subheadline are present.' : 'Add a stronger headline and subheadline in Sell.',
    },
    {
      label: 'Offer structure',
      status: hasModules ? 'ready' : 'needs_work',
      detail: hasModules ? 'The offer has defined modules and included assets.' : 'Add at least one product module in Create.',
    },
    {
      label: 'Proof and trust',
      status: hasProofPoints ? 'ready' : 'needs_work',
      detail: hasProofPoints ? 'Proof points are available for the sales page.' : 'Add proof points to reduce buyer hesitation.',
    },
    {
      label: 'Conversion assets',
      status: hasBenefits ? 'ready' : 'needs_work',
      detail: hasBenefits ? 'Benefit bullets are ready for the landing page.' : 'Add at least three benefit bullets in Sell.',
    },
    {
      label: 'Launch campaign',
      status: hasEmails ? 'ready' : 'needs_work',
      detail: hasEmails ? 'Launch emails are ready to send.' : 'Draft at least one launch email in Sell.',
    },
    {
      label: 'Objection handling',
      status: hasFaq ? 'ready' : 'needs_work',
      detail: hasFaq ? 'FAQ covers common objections.' : 'Add FAQ entries in Sell.',
    },
  ];
}

function scoreReadiness(items: LaunchReadinessItem[]) {
  return Math.round(
    (items.reduce((total, item) => {
      if (item.status === 'ready') {
        return total + 1;
      }
      if (item.status === 'needs_work') {
        return total + 0.5;
      }
      return total;
    }, 0) /
      items.length) *
      100
  );
}

function readinessFromSession(
  productDraft: ProductDraft,
  salesKit: SalesKit
): LaunchReadiness {
  const checklist = buildReadinessChecklist(
    productDraft.title,
    Boolean(salesKit.headline && salesKit.subheadline),
    salesKit.benefitBullets.length >= 3,
    salesKit.launchEmails.length > 0,
    salesKit.faq.length > 0,
    productDraft.proofPoints.length > 0,
    productDraft.modules.length > 0
  );
  const readinessScore = scoreReadiness(checklist);
  const priorityFixes = checklist
    .filter((item) => item.status !== 'ready')
    .map((item) => item.detail)
    .slice(0, 3);

  return {
    readinessScore,
    verdict:
      readinessScore >= 85
        ? 'Ready to launch'
        : readinessScore >= 60
        ? 'Needs polish'
        : 'Not ready',
    checklist,
    priorityFixes,
    preview: {
      hero: salesKit.headline,
      offer: `${productDraft.title} • ${productDraft.recommendedPrice || 'Set pricing'}`,
      trust:
        productDraft.proofPoints[0] ||
        productDraft.modules[0]?.buyerOutcome ||
        'Add a proof point to strengthen trust.',
      nextStep: priorityFixes[0] || 'Package the offer for launch.',
    },
  };
}

function statusClasses(status: LaunchReadinessItem['status']) {
  if (status === 'ready') {
    return 'border-emerald-500 text-emerald-300';
  }

  if (status === 'needs_work') {
    return 'border-amber-500 text-amber-300';
  }

  return 'border-red-500 text-red-300';
}

function scorePresentation(readinessScore: number) {
  if (readinessScore >= 85) {
    return {
      scoreClass: 'text-emerald-500',
      glowStyle: { textShadow: '0 0 24px rgba(16, 185, 129, 0.45), 0 0 60px rgba(16, 185, 129, 0.2)' },
      pillClass:
        'border border-emerald-400/25 bg-emerald-500/12 text-emerald-100 shadow-[0_0_30px_rgba(16,185,129,0.18)]',
      atmosphere:
        'radial-gradient(circle at top, rgba(16, 185, 129, 0.2), rgba(3, 7, 18, 0.92) 38%, rgba(2, 6, 23, 1) 72%)',
      panelTint: 'from-emerald-500/18 via-emerald-500/5 to-transparent',
    };
  }

  if (readinessScore >= 60) {
    return {
      scoreClass: 'text-amber-500',
      glowStyle: { textShadow: '0 0 24px rgba(245, 158, 11, 0.45), 0 0 60px rgba(245, 158, 11, 0.2)' },
      pillClass:
        'border border-amber-400/25 bg-amber-500/12 text-amber-100 shadow-[0_0_30px_rgba(245,158,11,0.18)]',
      atmosphere:
        'radial-gradient(circle at top, rgba(245, 158, 11, 0.2), rgba(3, 7, 18, 0.92) 38%, rgba(2, 6, 23, 1) 72%)',
      panelTint: 'from-amber-500/18 via-amber-500/5 to-transparent',
    };
  }

  return {
    scoreClass: 'text-red-500',
    glowStyle: { textShadow: '0 0 24px rgba(239, 68, 68, 0.45), 0 0 60px rgba(239, 68, 68, 0.2)' },
    pillClass:
      'border border-red-400/25 bg-red-500/12 text-red-100 shadow-[0_0_30px_rgba(239,68,68,0.18)]',
    atmosphere:
      'radial-gradient(circle at top, rgba(239, 68, 68, 0.2), rgba(3, 7, 18, 0.92) 38%, rgba(2, 6, 23, 1) 72%)',
    panelTint: 'from-red-500/18 via-red-500/5 to-transparent',
  };
}

export default function LaunchPage() {
  const { activeSession, setLaunchReadiness, updateStage } = useActiveBuild();

  useEffect(() => {
    updateStage('launch');
  }, [updateStage]);

  const productDraft = activeSession?.product_draft ?? null;
  const salesKit = activeSession?.sales_kit ?? null;
  const existingReadiness = activeSession?.launch_readiness ?? null;
  const existingReadinessScore = existingReadiness?.readinessScore;
  const existingVerdict = existingReadiness?.verdict;

  useEffect(() => {
    if (!productDraft || !salesKit) {
      return;
    }

    const computed = readinessFromSession(productDraft, salesKit);

    if (
      existingReadiness == null ||
      existingReadinessScore !== computed.readinessScore ||
      existingVerdict !== computed.verdict
    ) {
      setLaunchReadiness(computed);
    }
  }, [
    productDraft,
    salesKit,
    existingReadiness,
    existingReadinessScore,
    existingVerdict,
    setLaunchReadiness,
  ]);

  if (!productDraft || !salesKit) {
    return (
      <div className="mx-auto max-w-4xl p-4 pb-24 sm:p-6 lg:p-8 lg:pb-8">
        <EmptyWorkflowState icon={Store} title="Build the sales kit first">
          Launch needs both a product draft and a sales kit before it can score readiness.
        </EmptyWorkflowState>
        <div className="mt-4">
          <Link href="/app/sell">
            <Button>Go to Sell</Button>
          </Link>
        </div>
      </div>
    );
  }

  const readiness = existingReadiness ?? readinessFromSession(productDraft, salesKit);
  const scoreUi = scorePresentation(readiness.readinessScore);

  return (
    <div className="relative isolate overflow-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10" style={{ background: scoreUi.atmosphere }} />
      <div className="mx-auto max-w-7xl p-4 pb-24 sm:p-6 lg:p-8 lg:pb-8">
        <section className="relative mb-8 overflow-hidden rounded-[32px] border border-white/10 bg-black/45 px-6 py-8 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:px-8 lg:px-10 lg:py-10">
          <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${scoreUi.panelTint}`} />
          <div className="pointer-events-none absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" />
          <div className="relative">
            <Badge variant="outline" className="mb-4 border-white/10 bg-white/5 text-white/70">
              Launch telemetry
            </Badge>
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.35em] text-white/40">Readiness signal</p>
                <div
                  className={`mt-3 text-8xl font-bold tracking-tighter ${scoreUi.scoreClass}`}
                  style={scoreUi.glowStyle}
                >
                  {readiness.readinessScore}
                </div>
                <div className={`mt-4 inline-flex rounded-full px-4 py-2 text-sm font-medium ${scoreUi.pillClass}`}>
                  {readiness.verdict}
                </div>
              </div>
              <div className="max-w-xl space-y-3">
                <h1 className="text-2xl font-semibold text-white sm:text-3xl">Tactical launch-readiness telemetry</h1>
                <p className="text-sm leading-relaxed text-white/65 sm:text-base">
                  Audit buyer-facing assets, trust signals, and campaign readiness before you put the offer in motion.
                </p>
                <div className="grid grid-cols-1 gap-3 text-sm text-white/55 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/35">Product</p>
                    <p className="mt-2 text-white/85">{productDraft.title || 'Untitled offer'}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/35">Price</p>
                    <p className="mt-2 text-white/85">{productDraft.recommendedPrice || 'Set pricing'}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/35">CTA</p>
                    <p className="mt-2 text-white/85">{salesKit.callToAction || 'Set CTA'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mb-6 grid grid-cols-1 gap-5 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className="border-white/5 bg-card/80 p-5 backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-medium text-white">Tactical flight-check</h2>
            </div>
            <div className="divide-y divide-white/5">
              {readiness.checklist.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-4 border-b border-white/5 py-4 last:border-b-0">
                  <div className={`min-w-0 border-l-4 pl-4 ${statusClasses(item.status)}`}>
                    <h3 className="font-medium text-white">{item.label}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-white/60">{item.detail}</p>
                  </div>
                  <div className={`shrink-0 font-mono text-xs uppercase tracking-[0.24em] ${statusClasses(item.status)}`}>
                    {item.status === 'ready' ? 'Ready' : item.status === 'needs_work' ? 'Needs Work' : 'Missing'}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="rounded-2xl border border-white/10 bg-black/60 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
            <div className="mb-4 flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-medium text-white">Launch preview</h2>
            </div>
            <div className="space-y-4">
              <PreviewBlock label="Hero" value={readiness.preview.hero} />
              <PreviewBlock label="Offer" value={readiness.preview.offer} />
              <PreviewBlock label="Trust" value={readiness.preview.trust} />
              <PreviewBlock label="Next fix" value={readiness.preview.nextStep} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card className="border-white/5 bg-card/80 p-5 backdrop-blur-xl">
            <h2 className="mb-3 text-lg font-medium text-white">Offer snapshot</h2>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><span className="text-white">Product:</span> {productDraft.title}</p>
              <p><span className="text-white">Buyer:</span> {productDraft.targetBuyer}</p>
              <p><span className="text-white">Price:</span> {productDraft.recommendedPrice || 'Not set'}</p>
              <p><span className="text-white">CTA:</span> {salesKit.callToAction || 'Not set'}</p>
            </div>
          </Card>

          <Card className="border-white/5 bg-card/80 p-5 backdrop-blur-xl">
            <h2 className="mb-3 text-lg font-medium text-white">Priority fixes</h2>
            <div className="space-y-3 text-sm text-muted-foreground">
              {readiness.priorityFixes.length > 0 ? (
                readiness.priorityFixes.map((fix) => (
                  <div
                    key={fix}
                    className="flex items-start gap-3 rounded-r-lg border-l-4 border-red-500 bg-red-950/20 p-4 text-red-200"
                  >
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                    <p className="leading-relaxed">{fix}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-100">
                  All core launch checks are in place.
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link href="/app/sell">
            <Button variant="outline" className="border-white/10 text-white hover:bg-white/5">
              Back to Sell
            </Button>
          </Link>
          <Link href="/app/team">
            <Button>
              Review trust layer
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function PreviewBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
      <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.28em] text-white/35">{label}</p>
      <p className="text-sm leading-relaxed text-white/85">{value || 'Not set'}</p>
    </div>
  );
}
