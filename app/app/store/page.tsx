'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Check,
  Clock3,
  CreditCard,
  Eye,
  Gauge,
  Package,
  ReceiptText,
  ShoppingBag,
  Sparkles,
  Store,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';

import {
  loadReadyDesignerSessionAssets,
  loadStorePaymentState,
  runAnalyst,
} from '@/app/actions/ai';
import {
  type ProductDraft,
  type SalesKit,
  useActiveBuild,
} from '@/app/context/ActiveBuildSessionContext';
import { Button } from '@/components/ui/button';
import type { AnalystExamplesOutput } from '@/lib/ai';
import type {
  DesignerAssetType,
  SessionPrimaryDesignerAsset,
} from '@/lib/designer-assets';

type Tone = 'good' | 'warn' | 'neutral';

type StoreProduct = {
  name: string;
  category: string;
  status: 'Live' | 'Processing' | 'Draft';
  price: string;
  revenue: string;
  sales: string;
  conversion: string;
  updated: string;
  accent: string;
  readiness: string;
  readinessContext: string;
  confidenceScore: number;
};

type StoreKpi = {
  label: string;
  value: string;
  change: string;
  context: string;
  icon: React.ComponentType<{ className?: string }>;
  featured?: boolean;
};

type OverviewCard = {
  label: string;
  value: string;
  context: string;
};

type PaymentCard = {
  label: string;
  value: string;
  tone: Tone;
};

type StoreActivity = {
  label: string;
  detail: string;
  tone: Tone;
};

type StoreHealthMetric = {
  label: string;
  value: string;
  score: number;
};

type StoreEngine = {
  storeName: string;
  status: string;
  revenueStatus: string;
  paymentStatus: string;
  summary: string;
  statusPills: string[];
  celebration: string;
  products: StoreProduct[];
  overview: OverviewCard[];
  kpis: StoreKpi[];
  storefront: {
    title: string;
    subtitle: string;
    publicProfile: string;
    badge: string;
    liveStatus: string;
    lastUpdated: string;
    signals: Array<{ label: string; value: string; tone: Tone }>;
  };
  payment: {
    nowpayments: string;
    provider: string;
    webhook: string;
    readiness: string;
    cards: PaymentCard[];
  };
  activity: StoreActivity[];
  health: StoreHealthMetric[];
};

const storePreviewAssetTypes = ['mockup', 'sales_graphic'] as const satisfies DesignerAssetType[];

const fallbackDraft: ProductDraft = {
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

const growthMeta = [
  { impact: 'High', difficulty: 'Low', revenue: 'High' },
  { impact: 'Medium', difficulty: 'Medium', revenue: 'High' },
  { impact: 'High', difficulty: 'Medium', revenue: 'Medium' },
  { impact: 'Medium', difficulty: 'Low', revenue: 'Medium' },
  { impact: 'High', difficulty: 'High', revenue: 'High' },
] as const;

function normalizePrice(price: string) {
  const match = price.match(/\$?\d+/);
  return match ? `$${match[0].replace('$', '')}` : '$29';
}

function toneClasses(tone: Tone) {
  if (tone === 'good') {
    return 'border-emerald-300/18 bg-emerald-400/[0.09] text-emerald-100';
  }
  if (tone === 'warn') {
    return 'border-amber-300/18 bg-amber-400/[0.08] text-amber-100';
  }
  return 'border-white/[0.08] bg-white/[0.04] text-white/62';
}

function scoreTone(score: number): Tone {
  if (score >= 80) return 'good';
  if (score >= 55) return 'warn';
  return 'neutral';
}

function createStoreEngine(
  draft: ProductDraft,
  salesKit: SalesKit | null,
  options: {
    hasProduct: boolean;
    paymentTestModeEnabled: boolean;
  }
): StoreEngine {
  const price = normalizePrice(draft.recommendedPrice);
  const productName = draft.title;
  const hasProduct = options.hasProduct;
  const checkoutReady = options.paymentTestModeEnabled;
  const status = !hasProduct
    ? 'Draft'
    : checkoutReady
      ? 'Ready to test'
      : 'Live preview';
  const paymentStatus = checkoutReady
    ? 'Ready to test'
    : 'Checkout not connected';
  const paymentDetail = checkoutReady
    ? 'Test mode available'
    : 'Not connected';
  const confidenceScore = !hasProduct ? 34 : checkoutReady ? 92 : 76;
  const liveCount = hasProduct ? 1 : 0;

  return {
    storeName: `${productName} Store`,
    status,
    revenueStatus: 'No real sales yet',
    paymentStatus,
    summary: hasProduct
      ? 'One active product is ready for preview. Revenue, customers, and payouts stay at zero until checkout is connected and tested.'
      : 'Your store is still in draft. Add product and launch details before testing checkout.',
    statusPills: [
      `${liveCount} Product${liveCount === 1 ? '' : 's'} Live`,
      hasProduct ? 'Store Active' : 'Store Draft',
      hasProduct ? 'Preview Ready' : 'Preview Pending',
    ],
    celebration: hasProduct
      ? 'Your first digital business is now online. WIZUP is tracking performance, store health, and growth opportunities.'
      : 'Your store shell is prepared. Finish the product path and WIZUP will surface launch-ready store signals here.',
    products: [
      {
        name: productName,
        category: draft.category,
        status: hasProduct ? 'Live' : 'Draft',
        price,
        revenue: '$0',
        sales: '0',
        conversion: 'Not enough data',
        updated: hasProduct ? 'Preview ready' : 'Draft',
        accent: 'from-fuchsia-400/30 to-purple-500/10',
        readiness: checkoutReady ? 'Ready to purchase' : hasProduct ? 'Preview ready' : 'Waiting for publish',
        readinessContext: checkoutReady
          ? 'Checkout test mode and preview path are both available.'
          : hasProduct
            ? 'The product is visible. Checkout still needs connection.'
            : 'Build and publish this product before testing the store.',
        confidenceScore,
      },
    ],
    overview: [
      {
        label: 'Store name',
        value: `${productName} Store`,
        context: 'Public-facing home for this product.',
      },
      {
        label: 'Products live',
        value: `${liveCount}`,
        context: hasProduct ? 'Ready to purchase or preview.' : 'No live products yet.',
      },
      {
        label: 'Store status',
        value: status,
        context: hasProduct ? 'Your storefront can be reviewed right now.' : 'Waiting for a product to go live.',
      },
      {
        label: 'Revenue status',
        value: 'No real sales yet',
        context: 'Traffic and checkout tests are the next step.',
      },
      {
        label: 'Payment status',
        value: paymentStatus,
        context: checkoutReady ? 'Infrastructure is ready for test orders.' : 'Connect checkout before scaling traffic.',
      },
    ],
    kpis: [
      {
        label: 'Total Revenue',
        value: '$0',
        change: 'No sales yet',
        context: hasProduct ? 'Your store is ready. Traffic is the next step.' : 'Publish a product to unlock store tracking.',
        icon: Banknote,
        featured: true,
      },
      {
        label: 'This Month',
        value: '$0',
        change: 'No order data',
        context: 'The first order will establish your baseline.',
        icon: TrendingUp,
      },
      {
        label: 'Customers',
        value: '0',
        change: 'No customers yet',
        context: 'Customer activity will appear after checkout tests begin.',
        icon: Users,
      },
      {
        label: 'Conversion Rate',
        value: 'Not enough data',
        change: 'No checkout events',
        context: 'Preview visits are possible. Conversion starts once checkout is tested.',
        icon: CreditCard,
      },
      {
        label: 'Payouts',
        value: checkoutReady ? '$0' : 'Not connected',
        change: paymentDetail,
        context: checkoutReady ? 'Payouts will populate after test orders convert to live orders.' : 'Connect payments to unlock order collection.',
        icon: Wallet,
      },
    ],
    storefront: {
      title: draft.title,
      subtitle: salesKit?.subheadline || draft.subtitle,
      publicProfile: `${draft.targetBuyer} can see the product, price, FAQ, and checkout path.`,
      badge: checkoutReady ? 'LIVE STORE' : 'PREVIEW STORE',
      liveStatus: checkoutReady ? 'Preview Ready' : hasProduct ? 'Ready to test' : 'Draft preview',
      lastUpdated: hasProduct ? 'Last updated 2 min ago' : 'Waiting for first launch',
      signals: [
        { label: 'Conversion Potential', value: hasProduct ? 'Growing' : 'Pending', tone: hasProduct ? 'good' : 'neutral' },
        { label: 'Customer Clarity', value: draft.promise ? 'Strong' : 'Needs review', tone: draft.promise ? 'good' : 'warn' },
        { label: 'Checkout Readiness', value: checkoutReady ? 'Testable' : 'Pending', tone: checkoutReady ? 'good' : 'warn' },
      ],
    },
    payment: {
      nowpayments: paymentDetail,
      provider: 'NOWPayments',
      webhook: checkoutReady ? 'Test webhook available' : 'Checkout not connected',
      readiness: paymentStatus,
      cards: [
        { label: 'Provider', value: 'NOWPayments', tone: 'good' },
        { label: 'Checkout Status', value: paymentStatus, tone: checkoutReady ? 'good' : 'warn' },
        { label: 'Webhook Status', value: checkoutReady ? 'Test webhook available' : 'Checkout not connected', tone: checkoutReady ? 'good' : 'warn' },
        { label: 'Launch Readiness', value: checkoutReady ? 'Ready to test' : 'Needs checkout connection', tone: checkoutReady ? 'good' : 'warn' },
      ],
    },
    activity: [
      {
        label: 'Store Published',
        detail: hasProduct ? 'The storefront shell and first product preview are live.' : 'Waiting for the first product to publish.',
        tone: hasProduct ? 'good' : 'neutral',
      },
      {
        label: 'Product Approved',
        detail: 'Build, Publish, and Store are aligned on the current product path.',
        tone: hasProduct ? 'good' : 'neutral',
      },
      {
        label: 'Checkout Connected',
        detail: checkoutReady ? 'Test mode is available for end-to-end storefront verification.' : 'Connect checkout to capture the first order event.',
        tone: checkoutReady ? 'good' : 'warn',
      },
      {
        label: 'First Sale',
        detail: 'Future customer events will appear here as soon as the first checkout completes.',
        tone: 'neutral',
      },
    ],
    health: [
      { label: 'Store Status', value: status, score: hasProduct ? 84 : 36 },
      { label: 'Revenue', value: 'No real sales yet', score: 18 },
      { label: 'Payments', value: paymentStatus, score: checkoutReady ? 86 : 46 },
      { label: 'Trust', value: hasProduct ? 'Preview ready' : 'Draft', score: hasProduct ? 72 : 40 },
      { label: 'Conversion', value: 'Not enough data', score: 28 },
      { label: 'Readiness', value: hasProduct ? 'Store active' : 'Waiting', score: confidenceScore },
    ],
  };
}

function HeroStatusPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/[0.085] bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white/70 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <span className="store-pulse h-1.5 w-1.5 rounded-full bg-fuchsia-300" />
      {label}
    </span>
  );
}

function StatusPill({ status }: { status: string }) {
  const classes =
    status === 'Live'
      ? 'border-emerald-300/18 bg-emerald-400/[0.08] text-emerald-100'
      : status === 'Processing'
        ? 'border-fuchsia-300/18 bg-fuchsia-400/[0.09] text-fuchsia-100'
        : 'border-white/[0.08] bg-white/[0.04] text-white/54';

  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${classes}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_10px_currentColor]" />
      {status}
    </span>
  );
}

function ExecutiveOverviewCard({ item, featured = false }: { item: OverviewCard; featured?: boolean }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 sm:p-5 ${
        featured
          ? 'border-fuchsia-300/16 bg-[linear-gradient(145deg,rgba(217,70,239,0.1),rgba(255,255,255,0.04)_48%,rgba(0,0,0,0.2))] shadow-[0_28px_84px_-64px_rgba(217,70,239,0.78)]'
          : 'border-white/[0.07] bg-black/18'
      }`}
    >
      <div className="pointer-events-none absolute inset-x-8 top-6 h-14 rounded-full bg-fuchsia-400/10 blur-3xl" />
      <p className="relative text-[10px] font-medium uppercase tracking-[0.14em] text-white/34">
        {item.label}
      </p>
      <p className="relative mt-3 text-xl font-semibold tracking-[-0.035em] text-white sm:text-2xl">
        {item.value}
      </p>
      <p className="relative mt-3 text-sm leading-6 text-white/54">{item.context}</p>
    </div>
  );
}

function RevenueCard({ item }: { item: StoreKpi }) {
  return (
    <div
      className={`group relative overflow-hidden rounded-[1.35rem] border p-5 backdrop-blur-xl transition-all duration-500 hover:-translate-y-0.5 hover:border-fuchsia-300/18 ${
        item.featured
          ? 'border-fuchsia-300/18 bg-[linear-gradient(145deg,rgba(217,70,239,0.11),rgba(255,255,255,0.042)_48%,rgba(0,0,0,0.18))] shadow-[0_30px_90px_-64px_rgba(217,70,239,0.82)]'
          : 'border-white/[0.075] bg-white/[0.036] shadow-[0_24px_74px_-60px_rgba(217,70,239,0.55)]'
      }`}
    >
      <div className="absolute -right-12 -top-12 h-24 w-24 rounded-full bg-fuchsia-400/10 opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative mb-5 flex items-center justify-between gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/[0.08] bg-black/28 text-fuchsia-100 shadow-[inset_0_0_18px_rgba(217,70,239,0.08)]">
          <item.icon className="h-4 w-4" />
        </div>
        <span className="rounded-full border border-emerald-300/14 bg-emerald-400/[0.07] px-2.5 py-1 text-[10px] font-medium text-emerald-100/90">
          {item.change}
        </span>
      </div>
      <p className="relative mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-white/38">
        {item.label}
      </p>
      <p className="relative text-2xl font-semibold tracking-[-0.04em] text-white">
        {item.value}
      </p>
      <p className="relative mt-4 text-sm leading-6 text-white/54">{item.context}</p>
    </div>
  );
}

function SidePanel({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 max-w-full overflow-hidden rounded-2xl border border-white/[0.075] bg-white/[0.038] p-5 shadow-[0_28px_84px_-64px_rgba(217,70,239,0.72)] backdrop-blur-xl">
      {eyebrow ? (
        <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-white/34">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mb-4 text-xl font-semibold tracking-[-0.03em] text-white">{title}</h2>
      {children}
    </section>
  );
}

function StorePreviewImage({
  asset,
  alt,
  className,
}: {
  asset: SessionPrimaryDesignerAsset;
  alt: string;
  className: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={asset.publicUrl} alt={alt} className={className} loading="lazy" />
  );
}

function SignalBadge({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: Tone;
}) {
  return (
    <div className={`rounded-2xl border p-3 ${toneClasses(tone)}`}>
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] opacity-70">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}

function StorefrontVisual({
  engine,
  previewAsset,
}: {
  engine: StoreEngine;
  previewAsset: SessionPrimaryDesignerAsset | null;
}) {
  return (
    <div className="relative order-first min-w-0 max-w-full overflow-hidden lg:order-last lg:min-h-[460px]">
      <div className="absolute inset-x-10 bottom-2 h-16 rounded-[100%] bg-fuchsia-400/18 blur-3xl" />
      <div className="absolute right-6 top-4 h-44 w-44 rounded-full bg-fuchsia-400/14 blur-3xl" />
      <div className="absolute left-2 top-20 h-28 w-28 rounded-full bg-purple-500/10 blur-3xl" />

      <div className="store-float relative mx-auto mt-2 w-full max-w-[26rem] rotate-[-1.75deg] rounded-[1.9rem] border border-white/[0.1] bg-[linear-gradient(145deg,rgba(255,255,255,0.11),rgba(255,255,255,0.03)_44%,rgba(7,7,12,0.92))] p-4 shadow-[0_36px_130px_-68px_rgba(217,70,239,0.92)] backdrop-blur-2xl">
        <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-fuchsia-300/18 bg-fuchsia-400/[0.09] text-fuchsia-100 shadow-[inset_0_0_18px_rgba(217,70,239,0.08)]">
              <Store className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/38">
                {engine.storefront.badge}
              </p>
              <p className="mt-1 text-sm font-semibold tracking-[-0.02em] text-white">
                {engine.storeName}
              </p>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-white/42">
                <span className="store-pulse h-1.5 w-1.5 rounded-full bg-emerald-300" />
                {engine.storefront.lastUpdated}
              </div>
            </div>
          </div>
          <span className="rounded-full border border-emerald-300/14 bg-emerald-400/[0.07] px-3 py-1.5 text-[10px] font-medium text-emerald-100">
            {engine.storefront.liveStatus}
          </span>
        </div>

        <div className="relative overflow-hidden rounded-[1.45rem] border border-white/[0.075] bg-black/26">
          {previewAsset ? (
            <StorePreviewImage
              asset={previewAsset}
              alt={`${engine.products[0].name} storefront preview`}
              className="h-52 w-full object-cover"
            />
          ) : (
            <div className="h-36 bg-[radial-gradient(circle_at_64%_18%,rgba(217,70,239,0.26),transparent_40%),linear-gradient(135deg,rgba(255,255,255,0.09),rgba(217,70,239,0.08)_45%,rgba(0,0,0,0.2))]" />
          )}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/14 to-transparent" />
          <div className="p-4">
            <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-fuchsia-100/76">
              Featured product
            </p>
            <h3 className="max-w-sm text-[1.7rem] font-semibold leading-tight tracking-[-0.045em] text-white">
              {engine.products[0].name}
            </h3>
            <p className="mt-2 text-sm leading-6 text-white/54">
              {engine.storefront.subtitle}
            </p>
            <div className="mt-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-2xl font-semibold tracking-[-0.04em] text-white">
                  {engine.products[0].price}
                </p>
                <p className="mt-1 text-xs leading-5 text-white/46">
                  {engine.products[0].readiness}
                </p>
              </div>
              <Link
                href="/storefront"
                className="magnetic-button rounded-2xl bg-fuchsia-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_22px_-10px_rgba(217,70,239,0.9)] transition-colors hover:bg-fuchsia-400"
              >
                View Live
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {engine.storefront.signals.map((signal) => (
            <SignalBadge
              key={signal.label}
              label={signal.label}
              value={signal.value}
              tone={signal.tone}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductPerformanceCard({
  product,
  storefrontHref,
  previewAsset,
}: {
  product: StoreProduct;
  storefrontHref: string;
  previewAsset: SessionPrimaryDesignerAsset | null;
}) {
  return (
    <div className="group relative min-w-0 max-w-full overflow-hidden rounded-[1.8rem] border border-white/[0.065] bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02)_52%,rgba(0,0,0,0.22))] p-4 shadow-[0_30px_90px_-68px_rgba(217,70,239,0.66)] transition-all duration-500 hover:-translate-y-0.5 hover:border-fuchsia-300/18 hover:shadow-[0_36px_110px_-66px_rgba(217,70,239,0.82)] sm:p-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_14%,rgba(217,70,239,0.13),transparent_28%),radial-gradient(circle_at_82%_0%,rgba(124,58,237,0.1),transparent_30%)] opacity-80" />
      <div className="relative flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="flex min-w-0 flex-1 gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-[1.35rem] border border-white/[0.07] bg-black/26">
            {previewAsset ? (
              <StorePreviewImage
                asset={previewAsset}
                alt={`${product.name} product cover`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${product.accent}`}>
                <ShoppingBag className="h-6 w-6 text-white/82" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-lg font-semibold tracking-[-0.03em] text-white">
                {product.name}
              </p>
              <StatusPill status={product.status} />
            </div>
            <p className="mt-1 text-sm text-white/46">{product.category}</p>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/58">
              {product.readinessContext}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:w-[24rem] xl:grid-cols-2">
          <MetricTile label="Price" value={product.price} />
          <MetricTile label="Preview Status" value={product.updated} />
          <MetricTile label="Store Readiness" value={product.readiness} />
          <MetricTile label="Launch Confidence" value={`${product.confidenceScore}%`} tone={scoreTone(product.confidenceScore)} />
        </div>
      </div>

      <div className="relative mt-5 flex flex-wrap gap-2 border-t border-white/[0.055] pt-4">
        <Link href={storefrontHref}>
          <Button
            variant="outline"
            className="magnetic-button h-10 rounded-xl border-white/[0.085] bg-white/[0.04] px-4 text-white/82 hover:border-fuchsia-300/20 hover:bg-white/[0.06] hover:text-white"
          >
            View Storefront
          </Button>
        </Link>
        <Link href="/app/build">
          <Button
            variant="outline"
            className="magnetic-button h-10 rounded-xl border-white/[0.085] bg-white/[0.04] px-4 text-white/82 hover:border-fuchsia-300/20 hover:bg-white/[0.06] hover:text-white"
          >
            Edit Product
          </Button>
        </Link>
        <button
          type="button"
          disabled
          className="h-10 cursor-not-allowed rounded-xl border border-white/[0.085] bg-white/[0.035] px-4 text-sm font-medium text-white/40"
        >
          Duplicate Product
        </button>
      </div>
      <p className="relative mt-2 text-xs text-white/38">
        Duplicate Product stays disabled until duplication is implemented.
      </p>
    </div>
  );
}

function MetricTile({
  label,
  value,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  tone?: Tone;
}) {
  return (
    <div className={`rounded-2xl border p-3 ${toneClasses(tone)}`}>
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] opacity-70">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold">{value}</p>
    </div>
  );
}

function ActivityTimeline({ items }: { items: StoreActivity[] }) {
  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-white/[0.06] bg-black/18 p-4 text-sm leading-6 text-white/58">
        Waiting for first customer activity. These launch milestones will appear first.
      </div>
      {items.map((item, index) => (
        <div key={item.label} className="flex gap-3 rounded-2xl border border-white/[0.06] bg-black/18 p-4">
          <div className="flex flex-col items-center">
            <span className={`mt-1 h-3 w-3 rounded-full ${item.tone === 'good' ? 'bg-emerald-300' : item.tone === 'warn' ? 'bg-amber-300' : 'bg-white/40'}`} />
            {index < items.length - 1 ? (
              <span className="mt-2 h-full w-px bg-white/[0.08]" />
            ) : null}
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{item.label}</p>
            <p className="mt-1 text-xs leading-5 text-white/48">{item.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function PaymentStatusCard({ item }: { item: PaymentCard }) {
  return (
    <div className={`rounded-2xl border p-4 ${toneClasses(item.tone)}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] opacity-70">
          {item.label}
        </p>
        <span className="h-2.5 w-2.5 rounded-full bg-current shadow-[0_0_10px_currentColor]" />
      </div>
      <p className="mt-3 text-base font-semibold">{item.value}</p>
    </div>
  );
}

function RecommendationCard({
  suggestion,
  index,
}: {
  suggestion: string;
  index: number;
}) {
  const meta = growthMeta[index % growthMeta.length];

  return (
    <div className="group min-w-[19rem] rounded-[1.45rem] border border-white/[0.07] bg-black/18 p-4 transition-all duration-500 hover:-translate-y-0.5 hover:border-fuchsia-300/16 hover:bg-white/[0.045] md:min-w-0">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-fuchsia-300/12 bg-fuchsia-400/[0.07] text-fuchsia-100">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[10px] font-medium text-white/52">
          AI next move
        </span>
      </div>
      <p className="text-base font-semibold leading-7 text-white">{suggestion}</p>
      <p className="mt-2 text-sm leading-6 text-white/48">
        This is a practical next move based on your product, price, and early store setup.
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <MetricTile label="Impact" value={meta.impact} tone="good" />
        <MetricTile label="Difficulty" value={meta.difficulty} tone={meta.difficulty === 'Low' ? 'good' : 'warn'} />
        <MetricTile label="Revenue" value={meta.revenue} tone="good" />
      </div>
    </div>
  );
}

function HealthGauge({ item }: { item: StoreHealthMetric }) {
  const tone = scoreTone(item.score);
  const ringColor =
    tone === 'good'
      ? 'rgba(110,231,183,0.9)'
      : tone === 'warn'
        ? 'rgba(251,191,36,0.9)'
        : 'rgba(244,114,182,0.85)';

  return (
    <div className="rounded-2xl border border-white/[0.065] bg-black/18 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/34">
            {item.label}
          </p>
          <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
        </div>
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full border border-white/[0.08] text-xs font-semibold text-white"
          style={{
            background: `conic-gradient(${ringColor} ${item.score * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
          }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0a0910]">
            {item.score}%
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StorePage() {
  const { activeSession, updateStage } = useActiveBuild();
  const draft = activeSession?.product_draft ?? fallbackDraft;
  const salesKit = activeSession?.sales_kit ?? null;
  const storefrontHref = '/storefront';
  const [analysis, setAnalysis] = useState<AnalystExamplesOutput | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [paymentTestModeEnabled, setPaymentTestModeEnabled] = useState(false);
  const [readyAssets, setReadyAssets] = useState<
    Partial<Record<DesignerAssetType, SessionPrimaryDesignerAsset>>
  >({});

  const engine = useMemo(
    () =>
      createStoreEngine(draft, salesKit, {
        hasProduct: Boolean(activeSession?.product_draft),
        paymentTestModeEnabled,
      }),
    [activeSession?.product_draft, draft, paymentTestModeEnabled, salesKit]
  );

  useEffect(() => {
    let isMounted = true;

    loadStorePaymentState()
      .then((state) => {
        if (isMounted) {
          setPaymentTestModeEnabled(state.paymentTestModeEnabled);
        }
      })
      .catch(() => {
        if (isMounted) {
          setPaymentTestModeEnabled(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!activeSession?.id) {
      setReadyAssets({});
      return () => {
        isMounted = false;
      };
    }

    loadReadyDesignerSessionAssets({
      sessionId: activeSession.id,
      assetTypes: [...storePreviewAssetTypes],
      fallbackToProjectLatest: false,
    })
      .then((result) => {
        if (isMounted) {
          setReadyAssets(result.assets);
        }
      })
      .catch(() => {
        if (isMounted) {
          setReadyAssets({});
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeSession?.id]);

  useEffect(() => {
    let isMounted = true;
    setIsAnalyzing(true);
    updateStage('launch', {
      status: 'ready',
      next_action: 'Grow your live store and create the next product.',
    });

    runAnalyst({
      ideaTitle: draft.title,
      buyer: draft.targetBuyer,
      format: draft.category,
      priceRange: draft.recommendedPrice,
      notes: [
        `Revenue: ${engine.kpis[0].value}`,
        `Conversion: ${engine.kpis[3].value}`,
        `Payment status: ${engine.payment.readiness}`,
        `Storefront: ${engine.status}`,
      ].join('\n'),
    })
      .then((output) => {
        if (isMounted) setAnalysis(output);
      })
      .catch(() => {
        if (isMounted) setAnalysis(null);
      })
      .finally(() => {
        if (isMounted) setIsAnalyzing(false);
      });

    return () => {
      isMounted = false;
    };
  }, [draft, engine, updateStage]);

  const previewAsset =
    readyAssets.mockup ??
    readyAssets.sales_graphic ??
    activeSession?.designer_assets?.mockup ??
    activeSession?.designer_assets?.sales_graphic ??
    null;

  const growthSuggestions =
    analysis?.improvementAngles?.length
      ? analysis.improvementAngles.slice(0, 5)
      : [
          'Launch a bundle',
          'Add more reviews',
          'Create an upsell',
          'Improve checkout conversion',
          'Test a higher price',
        ];

  const healthNotes = analysis?.buyerComplaints?.slice(0, 3) ?? [
    "Products focus too much on parent logistics and ignore the child's emotional experience.",
    'Printables require too much ink to print or look unprofessional when printed at home.',
    "Audio tracks are too long and fail to hold a stressed child's attention in the car.",
  ];

  const nextMove = growthSuggestions[0] ?? 'Launch a bundle';
  const paymentNeedsConnection = engine.payment.readiness !== 'Ready to test';

  return (
    <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 overflow-x-hidden px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-7">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.075] bg-[linear-gradient(145deg,rgba(255,255,255,0.068),rgba(255,255,255,0.023)_39%,rgba(6,6,12,0.93))] p-5 shadow-[0_32px_108px_-74px_rgba(217,70,239,0.86)] backdrop-blur-2xl sm:p-8 lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(217,70,239,0.15),transparent_31%),radial-gradient(circle_at_42%_0%,rgba(124,58,237,0.12),transparent_34%)]" />
        <div className="relative grid gap-8 max-xl:grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-center">
          <div className="order-last min-w-0 lg:order-first">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-fuchsia-300/16 bg-fuchsia-400/[0.07] px-3 py-1.5 text-xs font-medium text-fuchsia-100">
              <Store className="h-3.5 w-3.5" />
              Store overview
            </div>
            <div className="mb-5 flex flex-wrap gap-2">
              {engine.statusPills.map((pill) => (
                <HeroStatusPill key={pill} label={pill} />
              ))}
            </div>
            <h1 className="mb-4 max-w-2xl text-4xl font-semibold leading-[0.98] tracking-[-0.055em] text-white sm:text-5xl lg:text-6xl">
              Your Products Are Live
            </h1>
            <p className="max-w-xl text-base leading-7 text-white/64 sm:text-lg">
              Manage your products, customers, sales, and growth in one place.
            </p>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/54 sm:text-base">
              {engine.celebration}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link href={storefrontHref}>
                <Button className="magnetic-button h-12 rounded-2xl bg-fuchsia-500 px-6 font-semibold text-white shadow-[0_0_28px_-12px_rgba(217,70,239,0.88)] transition-all hover:bg-fuchsia-400 hover:shadow-[0_0_34px_-12px_rgba(217,70,239,0.95)]">
                  <Eye className="h-4 w-4" />
                  View Storefront
                </Button>
              </Link>
              <Link href="/app">
                <Button
                  variant="outline"
                  className="magnetic-button h-12 rounded-2xl border-white/[0.085] bg-white/[0.035] px-6 text-white/82 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all hover:border-fuchsia-300/20 hover:bg-white/[0.06] hover:text-white"
                >
                  <Package className="h-4 w-4" />
                  Publish New Product
                </Button>
              </Link>
            </div>
          </div>
          <StorefrontVisual engine={engine} previewAsset={previewAsset} />
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.075] bg-white/[0.038] p-5 shadow-[0_28px_84px_-64px_rgba(217,70,239,0.72)] backdrop-blur-xl sm:p-6">
        <div className="mb-5">
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">
            Store Overview
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/56">
            Your business at a glance.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3.5 xl:grid-cols-5">
          {engine.overview.map((item, index) => (
            <div
              key={item.label}
              className={index === 0 ? 'col-span-2 xl:col-span-1' : ''}
            >
              <ExecutiveOverviewCard item={item} featured={index === 1} />
            </div>
          ))}
        </div>
        <p className="mt-4 rounded-2xl border border-fuchsia-300/14 bg-fuchsia-400/[0.065] p-4 text-sm leading-6 text-white/72">
          {engine.summary}
        </p>
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">
            Revenue Dashboard
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/56">
            Performance signals for sales, customers, and payouts.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-5">
          {engine.kpis.map((item) => (
            <RevenueCard key={item.label} item={item} />
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 max-xl:grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 rounded-[1.75rem] border border-white/[0.075] bg-[linear-gradient(145deg,rgba(255,255,255,0.052),rgba(255,255,255,0.022)_45%,rgba(7,7,12,0.9))] p-4 shadow-[0_30px_96px_-70px_rgba(217,70,239,0.78)] backdrop-blur-xl sm:p-5">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-[-0.03em] text-white">
                Live products
              </h2>
              <p className="mt-1 text-sm text-white/52">
                Track what is selling and what needs attention.
              </p>
            </div>
            <Button
              variant="outline"
              disabled
              className="h-10 w-fit rounded-xl border-white/[0.08] bg-white/[0.035] text-white/40 hover:border-white/[0.08] hover:bg-white/[0.035] hover:text-white/40"
            >
              <ReceiptText className="h-4 w-4" />
              Export report
            </Button>
          </div>
          <p className="mb-5 text-xs text-white/42">
            Export report stays disabled until export is implemented.
          </p>

          <div className="space-y-4">
            {engine.products.map((product) => (
              <ProductPerformanceCard
                key={product.name}
                product={product}
                storefrontHref={storefrontHref}
                previewAsset={previewAsset}
              />
            ))}
          </div>
        </div>

        <aside className="min-w-0 max-w-full space-y-5 self-start xl:w-[380px] xl:min-w-[380px] xl:max-w-[380px]">
          <SidePanel title="Storefront Preview" eyebrow="Live store preview">
            <div className="max-w-full overflow-hidden rounded-[1.6rem] border border-white/[0.07] bg-black/24">
              {previewAsset ? (
                <StorePreviewImage
                  asset={previewAsset}
                  alt={`${engine.storefront.title} product preview`}
                  className="h-52 w-full object-cover"
                />
              ) : (
                <div className="h-32 bg-[radial-gradient(circle_at_70%_20%,rgba(217,70,239,0.24),transparent_38%),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(217,70,239,0.08),rgba(0,0,0,0.18))]" />
              )}
              <div className="p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/14 bg-emerald-400/[0.07] px-2.5 py-1 text-[10px] font-medium text-emerald-100">
                    <span className="store-pulse h-1.5 w-1.5 rounded-full bg-emerald-300" />
                    {engine.storefront.liveStatus}
                  </span>
                  <span className="text-[11px] text-white/40">
                    {engine.storefront.lastUpdated}
                  </span>
                </div>
                <p className="text-xl font-semibold tracking-[-0.03em] text-white">
                  {engine.storefront.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/48">
                  {engine.storefront.subtitle}
                </p>
                <p className="mt-4 text-xl font-semibold text-white">
                  {engine.products[0].price}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/54">
                  {engine.storefront.publicProfile}
                </p>
                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <Link href={storefrontHref}>
                    <Button className="magnetic-button h-10 w-full rounded-xl bg-fuchsia-500 text-white shadow-[0_0_24px_-10px_rgba(217,70,239,0.86)] hover:bg-fuchsia-400">
                      Preview Store
                    </Button>
                  </Link>
                  <Link href={storefrontHref}>
                    <Button
                      variant="outline"
                      className="magnetic-button h-10 w-full rounded-xl border-white/[0.085] bg-white/[0.035] text-white/82 hover:border-fuchsia-300/20 hover:bg-white/[0.06] hover:text-white"
                    >
                      Open Product
                    </Button>
                  </Link>
                  <Link href={storefrontHref}>
                    <Button
                      variant="outline"
                      className="magnetic-button h-10 w-full rounded-xl border-white/[0.085] bg-white/[0.035] text-white/82 hover:border-fuchsia-300/20 hover:bg-white/[0.06] hover:text-white"
                    >
                      View Checkout
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </SidePanel>

          <SidePanel title="Customer Activity" eyebrow="Activity timeline">
            <ActivityTimeline items={engine.activity} />
          </SidePanel>

          <SidePanel title="Payment Status" eyebrow="Revenue infrastructure">
            <div className="space-y-3">
              {engine.payment.cards.map((item) => (
                <PaymentStatusCard key={item.label} item={item} />
              ))}
            </div>
            {paymentNeedsConnection ? (
              <Link href="/app/billing">
                <Button className="magnetic-button mt-4 h-10 w-full rounded-xl bg-fuchsia-500 text-white hover:bg-fuchsia-400">
                  Connect Payments
                </Button>
              </Link>
            ) : null}
          </SidePanel>
        </aside>
      </section>

      <section className="grid grid-cols-1 gap-6 max-xl:grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 rounded-2xl border border-white/[0.075] bg-white/[0.038] p-5 shadow-[0_28px_84px_-64px_rgba(217,70,239,0.72)] backdrop-blur-xl sm:p-6">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.04em] text-white">
                Growth Insights
              </h2>
              <p className="mt-2 text-sm leading-6 text-white/56">
                AI-guided growth moves for this store.
              </p>
            </div>
            <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white/52">
              {isAnalyzing ? 'Refreshing insights...' : 'Growth engine ready'}
            </span>
          </div>
          <div className="-mx-1 flex min-w-0 snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0">
            {growthSuggestions.slice(0, 4).map((suggestion, index) => (
              <div key={suggestion} className="snap-start">
                <RecommendationCard suggestion={suggestion} index={index} />
              </div>
            ))}
          </div>
        </div>

        <div className="min-w-0 max-w-full self-start xl:w-[380px] xl:min-w-[380px] xl:max-w-[380px]">
          <SidePanel title="Store Health" eyebrow="Business health radar">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {engine.health.map((item) => (
              <HealthGauge key={item.label} item={item} />
            ))}
          </div>
          <div className="mt-5 space-y-3">
            {healthNotes.map((note) => (
              <div key={note} className="flex gap-2 text-sm leading-6 text-white/52">
                <Check className="mt-1 h-4 w-4 shrink-0 text-fuchsia-100/70" />
                {note}
              </div>
            ))}
          </div>
          </SidePanel>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[1.85rem] border border-fuchsia-300/14 bg-[linear-gradient(145deg,rgba(217,70,239,0.11),rgba(255,255,255,0.035)_42%,rgba(6,6,10,0.95))] p-5 shadow-[0_34px_100px_-70px_rgba(217,70,239,0.86)] backdrop-blur-xl sm:p-6">
        <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-fuchsia-400/14 blur-3xl" />
        <div className="relative">
          <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.14em] text-fuchsia-100/70">
            What would WIZUP do next?
          </p>
          <h2 className="max-w-5xl text-3xl font-semibold leading-tight tracking-[-0.05em] text-white sm:text-4xl">
            {nextMove}
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              'strongest revenue opportunity',
              'highest customer value',
              'easiest next win',
            ].map((reason) => (
              <div
                key={reason}
                className="flex items-center gap-2 rounded-2xl border border-white/[0.07] bg-black/18 px-4 py-3 text-sm text-white/66"
              >
                <Sparkles className="h-3.5 w-3.5 shrink-0 text-fuchsia-100/70" />
                {reason}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[1.9rem] border border-fuchsia-300/14 bg-[linear-gradient(145deg,rgba(217,70,239,0.12),rgba(255,255,255,0.036)_44%,rgba(5,5,9,0.93))] p-6 shadow-[0_34px_104px_-70px_rgba(217,70,239,0.86)] backdrop-blur-2xl sm:p-8">
        <div className="absolute -right-16 -top-20 h-48 w-48 rounded-full bg-fuchsia-400/16 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
              Your business is live.
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/58 sm:text-base">
              Now focus on growth. WIZUP will help guide the next move.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/app">
              <Button className="magnetic-button h-12 w-full rounded-2xl bg-fuchsia-500 px-7 font-semibold text-white shadow-[0_0_28px_-12px_rgba(217,70,239,0.88)] hover:bg-fuchsia-400 sm:w-fit">
                Create Another Product
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href={storefrontHref}>
              <Button
                variant="outline"
                className="magnetic-button h-12 rounded-2xl border-white/[0.085] bg-white/[0.035] px-6 text-white/82 hover:border-fuchsia-300/20 hover:bg-white/[0.06] hover:text-white"
              >
                <Eye className="h-4 w-4" />
                View Storefront
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <style jsx>{`
        .store-float {
          animation: store-float 8s ease-in-out infinite;
        }

        .store-pulse {
          animation: store-pulse 2.6s ease-in-out infinite;
        }

        .magnetic-button {
          transition:
            transform 220ms ease,
            box-shadow 220ms ease,
            background-color 220ms ease,
            border-color 220ms ease,
            color 220ms ease;
        }

        .magnetic-button:hover {
          transform: translateY(-1px) scale(1.01);
        }

        @keyframes store-float {
          0%,
          100% {
            transform: translateY(0px) rotate(-1.75deg);
          }
          50% {
            transform: translateY(-8px) rotate(-1.2deg);
          }
        }

        @keyframes store-pulse {
          0%,
          100% {
            opacity: 0.65;
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(217, 70, 239, 0.35);
          }
          50% {
            opacity: 1;
            transform: scale(1.08);
            box-shadow: 0 0 0 8px rgba(217, 70, 239, 0);
          }
        }
      `}</style>
    </div>
  );
}
