'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2, ChevronRight, ShieldCheck, Sparkles, Star } from 'lucide-react';

import { loadReadyDesignerSessionAssets } from '@/app/actions/ai';
import {
  getActiveBuildStorageKey,
  type BuildSession,
  type ProductDraft,
  type SalesKit,
} from '@/app/context/ActiveBuildSessionContext';
import { Button } from '@/components/ui/button';
import type { DesignerAssetType, SessionPrimaryDesignerAsset } from '@/lib/designer-assets';
import { createClient } from '@/lib/supabase/client';

const FALLBACK_DRAFT: ProductDraft = {
  title: 'Product Starter Kit',
  subtitle: 'A simple digital product for busy beginners.',
  promise: 'Help buyers get a clear result without feeling overwhelmed.',
  targetBuyer: 'busy beginners',
  category: 'Toolkit',
  recommendedPrice: '$29',
  problemSummary: 'Buyers need a simple way to move from confusion to action.',
  differentiator: 'Simple steps, practical examples, and fast setup.',
  keyFeatures: ['Quick-start guide', 'Checklist', 'Templates'],
  proofPoints: ['Clear buyer pain', 'Simple delivery', 'Fast setup'],
  buildPlan: ['Prepare the sales page', 'Add launch assets', 'Run a final review'],
  modules: [],
};

function normalizePrice(price: string) {
  const match = price.match(/\$?\d+/);
  return match ? `$${match[0].replace('$', '')}` : '$29';
}

function readLatestBuildSession(userId?: string | null) {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(getActiveBuildStorageKey(userId));
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as BuildSession;
  } catch {
    window.localStorage.removeItem(getActiveBuildStorageKey(userId));
    return null;
  }
}

function storefrontViewModel(draft: ProductDraft, salesKit: SalesKit | null) {
  const benefits = salesKit?.benefitBullets?.length
    ? salesKit.benefitBullets.slice(0, 4)
    : draft.keyFeatures.slice(0, 4);
  const faq = salesKit?.faq?.length
    ? salesKit.faq.slice(0, 4)
    : [
        {
          question: `Who is ${draft.title} for?`,
          answer: `It is made for ${draft.targetBuyer} who want a clear result without extra complexity.`,
        },
        {
          question: 'What do I get?',
          answer: `You get the core ${draft.category.toLowerCase()}, simple resources, and a fast path to action.`,
        },
      ];

  return {
    eyebrow: `${draft.category} preview`,
    title: salesKit?.headline || draft.title,
    subtitle: salesKit?.subheadline || draft.subtitle,
    offer: draft.promise,
    description: salesKit?.problemSection || draft.problemSummary,
    price: normalizePrice(draft.recommendedPrice),
    cta: salesKit?.callToAction || 'Checkout opens after final test',
    buyer: draft.targetBuyer,
    benefits,
    faq,
    proof: draft.proofPoints.slice(0, 3),
    differentiator: draft.differentiator,
  };
}

const storefrontAssetTypes = [
  'mockup',
  'cover',
  'sales_graphic',
  'social_preview',
] as const satisfies DesignerAssetType[];

function StorefrontDesignerImage(props: {
  asset: SessionPrimaryDesignerAsset;
  alt: string;
  className: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={props.asset.publicUrl}
      alt={props.alt}
      className={props.className}
      loading="lazy"
    />
  );
}

export default function StorefrontPage() {
  const [session, setSession] = useState<BuildSession | null>(null);
  const [readyAssets, setReadyAssets] = useState<
    Partial<Record<DesignerAssetType, SessionPrimaryDesignerAsset>>
  >({});

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const hydrateStorefrontSession = async (userId?: string | null) => {
      const nextSession = readLatestBuildSession(userId);
      if (cancelled) return;

      setSession(nextSession);

      if (!nextSession?.id) {
        setReadyAssets({});
        return;
      }

      try {
        const result = await loadReadyDesignerSessionAssets({
          sessionId: nextSession.id,
          assetTypes: [...storefrontAssetTypes],
          fallbackToProjectLatest: false,
        });

        if (!cancelled) {
          setReadyAssets(result.assets);
        }
      } catch {
        if (!cancelled) {
          setReadyAssets(nextSession.designer_assets ?? {});
        }
      }
    };

    supabase.auth.getUser().then(({ data: { user } }) => {
      hydrateStorefrontSession(user?.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      hydrateStorefrontSession(nextSession?.user?.id ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const draft = session?.product_draft ?? FALLBACK_DRAFT;
  const salesKit = session?.sales_kit ?? null;
  const view = useMemo(() => storefrontViewModel(draft, salesKit), [draft, salesKit]);
  const storefrontAssets = useMemo(
    () => ({ ...(session?.designer_assets ?? {}), ...readyAssets }),
    [readyAssets, session?.designer_assets]
  );
  const mockupAsset = storefrontAssets.mockup;
  const coverAsset = storefrontAssets.cover;
  const salesGraphicAsset = storefrontAssets.sales_graphic;
  const socialPreviewAsset = storefrontAssets.social_preview;

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_48%_-12%,rgba(192,38,211,0.18),transparent_32%),linear-gradient(135deg,#050507_0%,#0a0a0e_48%,#08060d_100%)] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.024)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20" />

      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between gap-3">
          <Link href="/app/store" className="inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to Store
          </Link>
          <span className="rounded-full border border-fuchsia-300/16 bg-fuchsia-400/[0.08] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-fuchsia-100/82">
            Buyer-facing preview
          </span>
        </div>

        <section className="relative overflow-hidden rounded-[2rem] border border-white/[0.075] bg-[linear-gradient(145deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025)_44%,rgba(6,6,12,0.94))] p-6 shadow-[0_34px_110px_-70px_rgba(217,70,239,0.88)] backdrop-blur-2xl sm:p-8 lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(217,70,239,0.18),transparent_30%),radial-gradient(circle_at_24%_0%,rgba(124,58,237,0.12),transparent_34%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
            <div>
              <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.16em] text-fuchsia-100/74">{view.eyebrow}</p>
              <h1 className="max-w-3xl text-4xl font-semibold leading-[0.96] tracking-[-0.055em] text-white sm:text-5xl lg:text-6xl">
                {view.title}
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/64 sm:text-lg">
                {view.subtitle}
              </p>
              <div className="mt-5 rounded-2xl border border-fuchsia-300/14 bg-fuchsia-400/[0.06] p-4 text-sm leading-6 text-white/74">
                {view.offer}
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="rounded-2xl border border-white/[0.075] bg-black/22 px-4 py-3">
                  <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/38">Launch price</p>
                  <p className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-white">{view.price}</p>
                </div>
                <Button
                  disabled
                  className="h-12 rounded-2xl bg-fuchsia-500/90 px-6 font-semibold text-white opacity-100 shadow-[0_0_28px_-12px_rgba(217,70,239,0.88)] disabled:pointer-events-none disabled:opacity-100"
                >
                  {view.cta}
                </Button>
              </div>
              <p className="mt-3 text-xs leading-5 text-white/42">Checkout stays inactive here until live payment testing is complete.</p>
            </div>

            <div className="relative">
              <div className="absolute inset-x-10 bottom-6 h-16 rounded-[100%] bg-fuchsia-400/16 blur-3xl" />
              <div className="relative rounded-[1.75rem] border border-white/[0.08] bg-black/24 p-4 shadow-[0_32px_90px_-66px_rgba(217,70,239,0.82)] backdrop-blur-xl">
                <div className="overflow-hidden rounded-[1.35rem] border border-white/[0.075] bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.015))]">
                  <div className="border-b border-white/[0.06] px-5 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{draft.title}</p>
                        <p className="mt-1 text-xs text-white/42">For {view.buyer}</p>
                      </div>
                      <span className="rounded-full border border-emerald-300/16 bg-emerald-400/[0.08] px-2.5 py-1 text-[10px] font-medium text-emerald-100">
                        Live preview
                      </span>
                    </div>
                  </div>
                  <div className="px-5 py-6">
                    {mockupAsset ? (
                      <div className="mb-6 overflow-hidden rounded-[1.15rem] border border-white/[0.075] bg-black/30">
                        <StorefrontDesignerImage
                          asset={mockupAsset}
                          alt={`${draft.title} mockup`}
                          className="h-[260px] w-full object-cover"
                        />
                      </div>
                    ) : null}
                    <h2 className="max-w-lg text-3xl font-semibold leading-tight tracking-[-0.04em] text-white">{view.title}</h2>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-white/58">{view.description}</p>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      {view.benefits.map((benefit) => (
                        <div key={benefit} className="rounded-2xl border border-white/[0.065] bg-white/[0.03] p-4">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-fuchsia-300/14 bg-fuchsia-400/[0.07] text-fuchsia-100">
                              <CheckCircle2 className="h-4 w-4" />
                            </div>
                            <p className="text-sm leading-6 text-white/74">{benefit}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      {view.proof.map((point) => (
                        <div key={point} className="rounded-2xl border border-white/[0.065] bg-black/20 p-4">
                          <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/34">Proof</p>
                          <p className="mt-2 text-sm leading-6 text-white/68">{point}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.06fr_0.94fr]">
          <div className="rounded-[1.75rem] border border-white/[0.075] bg-white/[0.036] p-5 shadow-[0_28px_84px_-64px_rgba(217,70,239,0.7)] backdrop-blur-xl sm:p-6">
            <div className="mb-5 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-fuchsia-100" />
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-white">What buyers get</h2>
            </div>
            {coverAsset ? (
              <div className="mb-5 overflow-hidden rounded-[1.4rem] border border-white/[0.07] bg-black/20">
                <StorefrontDesignerImage
                  asset={coverAsset}
                  alt={`${draft.title} cover`}
                  className="h-[220px] w-full object-cover"
                />
              </div>
            ) : null}
            <div className="space-y-4">
              {draft.modules.length > 0 ? (
                draft.modules.slice(0, 4).map((module, index) => (
                  <div key={module.title} className="rounded-2xl border border-white/[0.065] bg-black/18 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-white/[0.075] bg-white/[0.03] text-sm font-semibold text-white/82">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{module.title}</p>
                        <p className="mt-1 text-sm leading-6 text-white/54">{module.goal}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-white/[0.065] bg-black/18 p-4 text-sm leading-6 text-white/58">
                  This storefront preview will show the product structure here once your build modules are ready.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <section className="rounded-[1.75rem] border border-white/[0.075] bg-white/[0.036] p-5 shadow-[0_28px_84px_-64px_rgba(217,70,239,0.7)] backdrop-blur-xl sm:p-6">
              <div className="mb-5 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-fuchsia-100" />
                <h2 className="text-xl font-semibold tracking-[-0.03em] text-white">Why it stands out</h2>
              </div>
              {salesGraphicAsset ? (
                <div className="mb-5 overflow-hidden rounded-[1.4rem] border border-white/[0.07] bg-black/20">
                  <StorefrontDesignerImage
                    asset={salesGraphicAsset}
                    alt={`${draft.title} sales graphic`}
                    className="h-[220px] w-full object-cover"
                  />
                </div>
              ) : null}
              <p className="rounded-2xl border border-fuchsia-300/12 bg-fuchsia-400/[0.055] p-4 text-sm leading-6 text-white/72">
                {view.differentiator}
              </p>
            </section>

            <section className="rounded-[1.75rem] border border-white/[0.075] bg-white/[0.036] p-5 shadow-[0_28px_84px_-64px_rgba(217,70,239,0.7)] backdrop-blur-xl sm:p-6">
              <div className="mb-5 flex items-center gap-2">
                <Star className="h-4 w-4 text-fuchsia-100" />
                <h2 className="text-xl font-semibold tracking-[-0.03em] text-white">FAQ</h2>
              </div>
              {socialPreviewAsset ? (
                <div className="mb-5 overflow-hidden rounded-[1.4rem] border border-white/[0.07] bg-black/20">
                  <StorefrontDesignerImage
                    asset={socialPreviewAsset}
                    alt={`${draft.title} social preview`}
                    className="h-[220px] w-full object-cover"
                  />
                </div>
              ) : null}
              <div className="space-y-3">
                {view.faq.map((item) => (
                  <div key={item.question} className="rounded-2xl border border-white/[0.065] bg-black/18 p-4">
                    <p className="text-sm font-semibold text-white">{item.question}</p>
                    <p className="mt-2 text-sm leading-6 text-white/54">{item.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>

        <section className="mt-6 rounded-[1.75rem] border border-fuchsia-300/14 bg-[linear-gradient(145deg,rgba(217,70,239,0.11),rgba(255,255,255,0.034)_45%,rgba(5,5,9,0.94))] p-6 shadow-[0_34px_104px_-70px_rgba(217,70,239,0.82)] backdrop-blur-2xl sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.13em] text-fuchsia-100/70">Storefront status</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">Preview is ready for review.</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/56">
                Review the buyer-facing copy, FAQ, and pricing here before you turn on live checkout.
              </p>
            </div>
            <Link href="/app/store">
              <Button className="h-12 rounded-2xl bg-fuchsia-500 px-6 font-semibold text-white shadow-[0_0_28px_-12px_rgba(217,70,239,0.88)] hover:bg-fuchsia-400">
                Return to Store
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
