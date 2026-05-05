'use client';

import React, { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Save,
  Sparkles,
  Store,
} from 'lucide-react';

import {
  listSavedProducts,
  listSavedSalesAssets,
  reviewStoreReadiness,
  saveStoreReview,
  type SavedProduct,
  type SavedSalesAsset,
  type StoreReviewRequest,
} from '@/app/actions/workflow';
import type { ReviewerStoreReadinessOutput } from '@/lib/ai';
import {
  AiSourceBadge,
  EmptyWorkflowState,
  InlineSpinner,
  WorkflowNotice,
} from '@/components/workflow/workflow-panels';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const NO_ASSET = 'none';

export default function StorePage() {
  const [products, setProducts] = useState<SavedProduct[]>([]);
  const [salesAssets, setSalesAssets] = useState<SavedSalesAsset[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedSalesAssetId, setSelectedSalesAssetId] = useState('');
  const [productTitle, setProductTitle] = useState('');
  const [buyer, setBuyer] = useState('');
  const [headline, setHeadline] = useState('');
  const [subheadline, setSubheadline] = useState('');
  const [price, setPrice] = useState('');
  const [includedAssets, setIncludedAssets] = useState('');
  const [notes, setNotes] = useState('');
  const [review, setReview] = useState<ReviewerStoreReadinessOutput | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isReviewing, startReviewTransition] = useTransition();
  const [isSaving, startSaveTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;

    async function loadInputs() {
      const [productsResult, assetsResult] = await Promise.all([
        listSavedProducts(),
        listSavedSalesAssets(),
      ]);

      if (!isMounted) {
        return;
      }

      if (productsResult.error) {
        setError(productsResult.error);
      } else {
        const savedProducts = productsResult.data ?? [];
        setProducts(savedProducts);
        const firstProduct = savedProducts[0];
        setSelectedProductId((current) => current || firstProduct?.id || '');

        if (firstProduct) {
          applyProduct(firstProduct);
        }
      }

      if (assetsResult.error) {
        setError((current) => current ?? assetsResult.error);
      } else {
        const savedAssets = assetsResult.data ?? [];
        setSalesAssets(savedAssets);
        const firstAsset = savedAssets[0];
        setSelectedSalesAssetId((current) => current || firstAsset?.id || NO_ASSET);

        if (firstAsset) {
          applySalesAsset(firstAsset);
        }
      }

      setIsLoading(false);
    }

    loadInputs();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? null,
    [products, selectedProductId]
  );
  const selectedSalesAsset = useMemo(
    () =>
      salesAssets.find((asset) => asset.id === selectedSalesAssetId) ?? null,
    [salesAssets, selectedSalesAssetId]
  );

  function applyProduct(product: SavedProduct) {
    setProductTitle(product.title);
    setBuyer(product.buyer);
    setPrice(product.price);
    setIncludedAssets(
      product.product?.modules
        .flatMap((module) => module.includedAssets)
        .slice(0, 8)
        .join('\n') ?? ''
    );
  }

  function applySalesAsset(asset: SavedSalesAsset) {
    setHeadline(asset.headline);
    setSubheadline(asset.subheadline);
  }

  function buildRequest(): StoreReviewRequest {
    return {
      productId: selectedProductId || undefined,
      salesAssetId:
        selectedSalesAssetId && selectedSalesAssetId !== NO_ASSET
          ? selectedSalesAssetId
          : undefined,
      productTitle,
      buyer,
      headline,
      subheadline,
      price,
      includedAssets,
      notes,
    };
  }

  function handleReview() {
    setError(null);
    setNotice(null);
    setSaveMessage(null);

    const request = buildRequest();

    startReviewTransition(async () => {
      const result = await reviewStoreReadiness(request);

      if (result.error) {
        setError(result.error);
        return;
      }

      setReview(result.data);
      setNotice(result.notice);
    });
  }

  function handleSaveReview() {
    if (!review) {
      return;
    }

    setError(null);
    setSaveMessage(null);

    const request = buildRequest();

    startSaveTransition(async () => {
      const result = await saveStoreReview(request, review);

      if (result.error) {
        setError(result.error);
        return;
      }

      setSaveMessage('Store review saved to your workspace.');
    });
  }

  return (
    <div className="min-h-full bg-background p-4 pb-24 sm:p-6 lg:p-8 lg:pb-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Link
              href="/app/sales-kit"
              className="mb-4 inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-white"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to sales kit
            </Link>
            <h1 className="mb-1 text-2xl font-medium text-white lg:text-3xl">
              Review store readiness
            </h1>
            <p className="text-sm text-muted-foreground lg:text-base">
              Configure the offer from saved workflow assets, then let Reviewer find launch blockers.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              disabled={isReviewing}
              onClick={handleReview}
              className="h-11 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isReviewing ? (
                <InlineSpinner label="Reviewing" />
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Run Reviewer
                </>
              )}
            </Button>
            <Button
              type="button"
              disabled={!review || isSaving}
              onClick={handleSaveReview}
              variant="outline"
              className="h-11 border-white/10 text-white hover:bg-white/5"
            >
              {isSaving ? (
                <InlineSpinner label="Saving" />
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="mb-5 space-y-3">
          {error ? <WorkflowNotice tone="error">{error}</WorkflowNotice> : null}
          {notice ? <WorkflowNotice>{notice}</WorkflowNotice> : null}
          {saveMessage ? (
            <WorkflowNotice tone="success">{saveMessage}</WorkflowNotice>
          ) : null}
        </div>

        {!isLoading && products.length === 0 ? (
          <Card className="flex flex-col items-center justify-center border-white/5 bg-card p-8 text-center sm:p-10">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <h2 className="mb-2 text-lg font-medium text-white">
              You need a saved product first
            </h2>
            <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-muted-foreground">
              Reviewer needs a product architecture to score your store readiness. Go back and save a product from the Strategist workflow.
            </p>
            <a href="/app/product">
              <Button className="h-10 px-6">Go to Strategist</Button>
            </a>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[420px_1fr]">
            <Card className="border-white/5 bg-card p-4 sm:p-5">
              <div className="mb-5 flex items-center gap-2">
                <Store className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-medium text-white">Store settings</h2>
              </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="store-product"
                  className="mb-2 block text-xs font-medium uppercase tracking-widest text-white/40"
                >
                  Saved product
                </label>
                <Select
                  value={selectedProductId || null}
                  onValueChange={(value) => {
                    if (typeof value === 'string') {
                      setSelectedProductId(value);
                      const product = products.find((item) => item.id === value);

                      if (product) {
                        applyProduct(product);
                      }
                    }
                  }}
                >
                  <SelectTrigger
                    id="store-product"
                    className="h-11 w-full border-white/10 bg-[#0A0A0B] text-sm text-white"
                  >
                    <SelectValue placeholder="Select a saved product" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#121214] text-white">
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label
                  htmlFor="store-assets"
                  className="mb-2 block text-xs font-medium uppercase tracking-widest text-white/40"
                >
                  Sales asset
                </label>
                <Select
                  value={selectedSalesAssetId || NO_ASSET}
                  onValueChange={(value) => {
                    if (typeof value === 'string') {
                      setSelectedSalesAssetId(value);
                      const asset = salesAssets.find((item) => item.id === value);

                      if (asset) {
                        applySalesAsset(asset);
                      }
                    }
                  }}
                >
                  <SelectTrigger
                    id="store-assets"
                    className="h-11 w-full border-white/10 bg-[#0A0A0B] text-sm text-white"
                  >
                    <SelectValue placeholder="Select a sales asset" />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-[#121214] text-white">
                    <SelectItem value={NO_ASSET}>No saved sales asset</SelectItem>
                    {salesAssets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field
                  label="Product title"
                  value={productTitle}
                  onChange={setProductTitle}
                />
                <Field label="Price" value={price} onChange={setPrice} />
              </div>

              <Field label="Target buyer" value={buyer} onChange={setBuyer} />
              <Field label="Headline" value={headline} onChange={setHeadline} />
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-white/40">
                  Subheadline
                </label>
                <Textarea
                  value={subheadline}
                  onChange={(event) => setSubheadline(event.target.value)}
                  className="min-h-20 resize-none border-white/10 bg-white/[0.02] text-sm"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-white/40">
                  Included assets
                </label>
                <Textarea
                  value={includedAssets}
                  onChange={(event) => setIncludedAssets(event.target.value)}
                  className="min-h-28 resize-none border-white/10 bg-white/[0.02] text-sm"
                />
              </div>
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-white/40">
                  Launch notes
                </label>
                <Textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Guarantee, delivery method, checkout notes, proof, deadlines..."
                  className="min-h-24 resize-none border-white/10 bg-white/[0.02] text-sm"
                />
              </div>
            </div>
          </Card>

          <div className="space-y-5">
            <Card className="border-white/5 bg-card p-4 sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-medium text-white">Store preview</h2>
              </div>
              <div className="rounded-xl border border-white/5 bg-[#0A0A0B] p-5">
                <div className="mb-4 flex flex-wrap gap-2">
                  {selectedProduct ? (
                    <Badge
                      variant="outline"
                      className="border-primary/20 bg-primary/10 text-primary"
                    >
                      {selectedProduct.category || 'Product'}
                    </Badge>
                  ) : null}
                  {selectedSalesAsset ? (
                    <Badge
                      variant="outline"
                      className="border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                    >
                      Sales kit connected
                    </Badge>
                  ) : null}
                </div>
                <h3 className="max-w-3xl text-2xl font-semibold tracking-tight text-white">
                  {headline || productTitle || 'Your product headline'}
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  {subheadline ||
                    'Connect a saved product and sales asset to populate the store offer.'}
                </p>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="text-3xl font-bold text-white">
                    {price || '$ --'}
                  </div>
                  <Button className="h-11 bg-primary text-primary-foreground hover:bg-primary/90 sm:ml-auto">
                    Buy now
                  </Button>
                </div>
              </div>
            </Card>

            {!review ? (
              <EmptyWorkflowState icon={ClipboardCheck} title="No review yet">
                {isLoading
                  ? 'Loading saved workflow assets...'
                  : products.length
                    ? 'Run Reviewer to generate a launch checklist, critique, and priority fixes.'
                    : 'Save a product architecture before reviewing store readiness.'}
              </EmptyWorkflowState>
            ) : (
              <ReviewResults review={review} />
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium uppercase tracking-widest text-white/40">
        {label}
      </label>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 border-white/10 bg-white/[0.02] text-sm"
      />
    </div>
  );
}

function ReviewResults({ review }: { review: ReviewerStoreReadinessOutput }) {
  return (
    <div className="space-y-5">
      <Card className="border-white/5 bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="border-primary/20 bg-primary/10 text-primary"
              >
                Reviewer
              </Badge>
              <AiSourceBadge
                source={review.source}
                fallbackReason={review.fallbackReason}
              />
              <Badge
                variant="outline"
                className={verdictClassName(review.verdict)}
              >
                {review.verdict}
              </Badge>
            </div>
            <h2 className="text-xl font-medium text-white">
              Launch readiness score
            </h2>
          </div>
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary/10">
            <span className="text-2xl font-bold text-white">
              {review.readinessScore}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-white/5 bg-card p-4 sm:p-5">
          <h3 className="mb-4 text-lg font-medium text-white">
            Priority fixes
          </h3>
          <div className="space-y-3">
            {review.priorityFixes.map((fix) => (
              <div key={fix} className="flex gap-3 text-sm text-muted-foreground">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                <span>{fix}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-white/5 bg-card p-4 sm:p-5">
          <h3 className="mb-4 text-lg font-medium text-white">
            Launch checklist
          </h3>
          <div className="space-y-3">
            {review.launchChecklist.map((item) => (
              <div key={item} className="flex gap-3 text-sm text-muted-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="border-white/5 bg-card p-4 sm:p-5">
        <h3 className="mb-4 text-lg font-medium text-white">Critique</h3>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {review.checks.map((check) => (
            <div
              key={check.area}
              className="rounded-lg border border-white/5 bg-white/[0.02] p-4"
            >
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-medium text-white">{check.area}</h4>
                  <Badge
                    variant="outline"
                    className={`mt-2 ${statusClassName(check.status)}`}
                  >
                    {check.status}
                  </Badge>
                </div>
                <span className="text-sm font-semibold text-white">
                  {check.score}/100
                </span>
              </div>
              <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
                {check.notes}
              </p>
              <p className="text-xs leading-relaxed text-white/60">
                Fix: {check.fix}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="border-white/5 bg-card p-4 sm:p-5">
        <h3 className="mb-4 text-lg font-medium text-white">Store summary</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Summary label="Hero" value={review.storeSummary.hero} />
          <Summary label="Offer" value={review.storeSummary.offer} />
          <Summary label="Checkout" value={review.storeSummary.checkout} />
          <Summary label="Trust" value={review.storeSummary.trust} />
        </div>
      </Card>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
      <p className="mb-1 text-[10px] uppercase tracking-widest text-white/40">
        {label}
      </p>
      <p className="text-sm leading-relaxed text-white/75">{value}</p>
    </div>
  );
}

function verdictClassName(verdict: ReviewerStoreReadinessOutput['verdict']) {
  if (verdict === 'Ready to publish') {
    return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300';
  }

  if (verdict === 'Revise before launch') {
    return 'border-amber-500/20 bg-amber-500/10 text-amber-300';
  }

  return 'border-red-500/20 bg-red-500/10 text-red-300';
}

function statusClassName(status: string) {
  if (status === 'Pass') {
    return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300';
  }

  if (status === 'Needs work') {
    return 'border-amber-500/20 bg-amber-500/10 text-amber-300';
  }

  return 'border-red-500/20 bg-red-500/10 text-red-300';
}
