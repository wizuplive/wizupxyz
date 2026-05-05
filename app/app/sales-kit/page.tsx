'use client';

import React, { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Eye,
  FileText,
  Mail,
  MessageSquareText,
  Rocket,
  Save,
  Sparkles,
} from 'lucide-react';

import {
  generateSalesKit,
  listSavedProducts,
  saveSalesAsset,
  type SavedProduct,
} from '@/app/actions/workflow';
import type { CreatorAssetsOutput } from '@/lib/ai';
import {
  AiSourceBadge,
  EmptyWorkflowState,
  InlineSpinner,
  WorkflowNotice,
} from '@/components/workflow/workflow-panels';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const toneOptions = [
  { value: 'clear and practical', label: 'Clear' },
  { value: 'premium and concise', label: 'Premium' },
  { value: 'warm and direct', label: 'Warm' },
];

export default function SalesKitPage() {
  const [products, setProducts] = useState<SavedProduct[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [tone, setTone] = useState(toneOptions[0].value);
  const [assets, setAssets] = useState<CreatorAssetsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isGenerating, startGenerateTransition] = useTransition();
  const [isSaving, startSaveTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      const result = await listSavedProducts();

      if (!isMounted) {
        return;
      }

      if (result.error) {
        setError(result.error);
      } else {
        const savedProducts = result.data ?? [];
        setProducts(savedProducts);
        setSelectedProductId(
          (current) => current || savedProducts[0]?.id || ''
        );
      }

      setIsLoading(false);
    }

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? null,
    [products, selectedProductId]
  );

  function handleGenerate() {
    if (!selectedProductId) {
      setError('Select a saved product first.');
      return;
    }

    setError(null);
    setNotice(null);
    setSaveMessage(null);

    startGenerateTransition(async () => {
      const result = await generateSalesKit(selectedProductId, tone);

      if (result.error) {
        setError(result.error);
        return;
      }

      setAssets(result.data);
      setNotice(result.notice);
    });
  }

  function handleSave() {
    if (!assets || !selectedProductId) {
      return;
    }

    setError(null);
    setSaveMessage(null);

    startSaveTransition(async () => {
      const result = await saveSalesAsset(selectedProductId, assets);

      if (result.error) {
        setError(result.error);
        return;
      }

      setSaveMessage('Sales kit saved to your workspace.');
    });
  }

  return (
    <div className="mx-auto max-w-6xl p-4 pb-24 sm:p-6 lg:p-8 lg:pb-8">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center lg:mb-8">
        <div>
          <h1 className="mb-1 text-2xl font-medium text-white lg:mb-2 lg:text-3xl">
            Create your sales kit
          </h1>
          <p className="text-sm text-muted-foreground lg:text-lg">
            Creator writes sales copy, hooks, email assets, objections handling, and pricing rationale from a saved product.
          </p>
        </div>
        <Link href="/app/store" className="w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            className="h-12 w-full border-white/10 text-white hover:bg-white/5 sm:h-10 sm:w-auto"
          >
            <Eye className="h-4 w-4" />
            Open Store
          </Button>
        </Link>
      </div>

      {!isLoading && products.length === 0 ? (
        <Card className="mb-5 flex flex-col items-center justify-center border-white/5 bg-card p-8 text-center sm:p-10">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Rocket className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mb-2 text-lg font-medium text-white">
            You need a saved product first
          </h2>
          <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-muted-foreground">
            Creator needs a product architecture to generate your sales kit. Go back and save a product from the Strategist workflow.
          </p>
          <a href="/app/product">
            <Button className="h-10 px-6">Go to Strategist</Button>
          </a>
        </Card>
      ) : (
        <Card className="mb-5 border-white/5 bg-card p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_180px_auto] lg:items-end">
            <div>
              <label
                htmlFor="product-select"
                className="mb-2 block text-xs font-medium uppercase tracking-widest text-white/40"
              >
                Saved product
              </label>
              <Select
                value={selectedProductId || null}
                onValueChange={(value) => {
                  if (typeof value === 'string') {
                    setSelectedProductId(value);
                    setAssets(null);
                    setSaveMessage(null);
                  }
                }}
              >
                <SelectTrigger
                  id="product-select"
                  className="h-12 w-full border-white/10 bg-[#0A0A0B] text-sm text-white"
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
                htmlFor="tone-select"
                className="mb-2 block text-xs font-medium uppercase tracking-widest text-white/40"
              >
                Tone
              </label>
              <Select
                value={tone}
                onValueChange={(value) => {
                  if (typeof value === 'string') {
                    setTone(value);
                  }
                }}
              >
                <SelectTrigger
                  id="tone-select"
                  className="h-12 w-full border-white/10 bg-[#0A0A0B] text-sm text-white"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#121214] text-white">
                  {toneOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              disabled={isLoading || !selectedProductId || isGenerating}
              onClick={handleGenerate}
              className="h-12 px-5 font-semibold"
            >
              {isGenerating ? (
                <InlineSpinner label="Writing" />
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Run Creator
                </>
              )}
            </Button>
          </div>

          {selectedProduct ? (
            <div className="mt-4 grid grid-cols-1 gap-3 border-t border-white/5 pt-4 sm:grid-cols-3">
              <MiniStat label="Buyer" value={selectedProduct.buyer || 'Not saved'} />
              <MiniStat label="Category" value={selectedProduct.category || 'Not saved'} />
              <MiniStat label="Price" value={selectedProduct.price || 'Not saved'} />
            </div>
          ) : null}
        </Card>
      )}

      <div className="mb-5 space-y-3">
        {error ? <WorkflowNotice tone="error">{error}</WorkflowNotice> : null}
        {notice ? <WorkflowNotice>{notice}</WorkflowNotice> : null}
        {saveMessage ? (
          <WorkflowNotice tone="success">{saveMessage}</WorkflowNotice>
        ) : null}
      </div>

      {!assets ? (
        <EmptyWorkflowState icon={Rocket} title="No sales kit yet">
          {isLoading
            ? 'Loading saved products...'
            : products.length
              ? 'Choose a saved product and run Creator to generate conversion assets.'
              : 'Save a product architecture before creating the sales kit.'}
        </EmptyWorkflowState>
      ) : (
        <div className="space-y-5">
          <Card className="border-white/5 bg-card p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-primary/20 bg-primary/10 text-primary"
                  >
                    Creator
                  </Badge>
                  <AiSourceBadge
                    source={assets.source}
                    fallbackReason={assets.fallbackReason}
                  />
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-white">
                  {assets.salesKit.headline}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {assets.salesKit.subheadline}
                </p>
              </div>
              <Button
                type="button"
                disabled={isSaving}
                onClick={handleSave}
                className="h-10 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSaving ? (
                  <InlineSpinner label="Saving" />
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Asset
                  </>
                )}
              </Button>
            </div>
          </Card>

          <Tabs defaultValue="salespage" className="w-full">
            <div className="-mx-4 mb-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 lg:mb-6">
              <TabsList className="flex h-12 w-max border border-white/5 bg-white/[0.02] p-1">
                <TabsTrigger
                  value="salespage"
                  className="h-9 whitespace-nowrap rounded-md px-4 data-active:bg-primary data-active:text-primary-foreground sm:px-6"
                >
                  Sales page
                </TabsTrigger>
                <TabsTrigger
                  value="emails"
                  className="h-9 whitespace-nowrap rounded-md px-4 text-muted-foreground data-active:bg-white/10 data-active:text-white sm:px-6"
                >
                  Emails
                </TabsTrigger>
                <TabsTrigger
                  value="social"
                  className="h-9 whitespace-nowrap rounded-md px-4 text-muted-foreground data-active:bg-white/10 data-active:text-white sm:px-6"
                >
                  Social posts
                </TabsTrigger>
                <TabsTrigger
                  value="faq"
                  className="h-9 whitespace-nowrap rounded-md px-4 text-muted-foreground data-active:bg-white/10 data-active:text-white sm:px-6"
                >
                  Objections
                </TabsTrigger>
                <TabsTrigger
                  value="content"
                  className="h-9 whitespace-nowrap rounded-md px-4 text-muted-foreground data-active:bg-white/10 data-active:text-white sm:px-6"
                >
                  Product content
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="salespage" className="mt-0">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card className="border-white/5 bg-card p-4 sm:p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-medium text-white">
                      Sales copy
                    </h3>
                  </div>
                  <div className="space-y-4">
                    <CopyBlock label="Headline" value={assets.salesKit.headline} />
                    <CopyBlock
                      label="Subheadline"
                      value={assets.salesKit.subheadline}
                    />
                    <CopyBlock
                      label="Problem section"
                      value={assets.salesKit.problemSection}
                    />
                    <CopyBlock
                      label="Call to action"
                      value={assets.salesKit.callToAction}
                    />
                  </div>
                </Card>

                <Card className="border-white/5 bg-card p-4 sm:p-5">
                  <h3 className="mb-4 text-lg font-medium text-white">
                    Benefits and pricing
                  </h3>
                  <div className="mb-5 space-y-3">
                    {assets.salesKit.benefitBullets.map((benefit) => (
                      <div key={benefit} className="flex gap-3 text-sm text-muted-foreground">
                        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>
                  <CopyBlock
                    label="Pricing rationale"
                    value={assets.salesKit.pricingRationale}
                  />
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="emails" className="mt-0">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {assets.salesKit.launchEmails.map((email) => (
                  <Card key={email.subject} className="border-white/5 bg-card p-4">
                    <Mail className="mb-3 h-5 w-5 text-primary" />
                    <h3 className="mb-1 font-medium text-white">
                      {email.subject}
                    </h3>
                    <p className="mb-4 text-xs text-muted-foreground">
                      {email.previewText}
                    </p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/70">
                      {email.body}
                    </p>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="social" className="mt-0">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {assets.salesKit.socialPosts.map((post, index) => (
                  <Card key={post} className="border-white/5 bg-card p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <MessageSquareText className="h-5 w-5 text-primary" />
                      <h3 className="font-medium text-white">
                        Hook {index + 1}
                      </h3>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/75">
                      {post}
                    </p>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="faq" className="mt-0">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {assets.salesKit.faq.map((item) => (
                  <Card key={item.question} className="border-white/5 bg-card p-4">
                    <h3 className="mb-2 font-medium text-white">
                      {item.question}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {item.answer}
                    </p>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="content" className="mt-0">
              <Card className="border-white/5 bg-card p-4 sm:p-5">
                <h3 className="mb-2 text-lg font-medium text-white">
                  {assets.productContent.title}
                </h3>
                <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                  {assets.productContent.introduction}
                </p>
                <div className="space-y-4">
                  {assets.productContent.sections.map((section) => (
                    <div
                      key={section.title}
                      className="rounded-lg border border-white/5 bg-white/[0.02] p-4"
                    >
                      <h4 className="mb-2 font-medium text-white">
                        {section.title}
                      </h4>
                      <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                        {section.body}
                      </p>
                      <Badge
                        variant="outline"
                        className="border-primary/20 bg-primary/10 text-primary"
                      >
                        {section.actionPrompt}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
      <p className="mb-1 text-[10px] uppercase tracking-widest text-white/40">
        {label}
      </p>
      <p className="truncate text-sm font-medium text-white/80">{value}</p>
    </div>
  );
}

function CopyBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-[10px] uppercase tracking-widest text-white/40">
        {label}
      </p>
      <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-sm leading-relaxed text-white/75">
        {value}
      </div>
    </div>
  );
}
