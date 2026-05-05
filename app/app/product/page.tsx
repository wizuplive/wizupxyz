'use client';

import React, { useEffect, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import {
  Bot,
  CheckCircle2,
  Download,
  FileText,
  Hammer,
  Layers,
  Lightbulb,
  Save,
  Sparkles,
} from 'lucide-react';

import {
  generateProductArchitecture,
  listProductSources,
  saveProductArchitecture,
  type ProductSourceOption,
} from '@/app/actions/workflow';
import type { StrategistProductOutlineOutput } from '@/lib/ai';
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

export default function ProductPage() {
  const [sources, setSources] = useState<ProductSourceOption[]>([]);
  const [selectedSourceKey, setSelectedSourceKey] = useState('');
  const [product, setProduct] =
    useState<StrategistProductOutlineOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isGenerating, startGenerateTransition] = useTransition();
  const [isSaving, startSaveTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;

    async function loadSources() {
      const result = await listProductSources();

      if (!isMounted) {
        return;
      }

      if (result.error) {
        setError(result.error);
      } else {
        const options = result.data ?? [];
        setSources(options);
        setSelectedSourceKey((current) => current || options[0]?.key || '');
      }

      setIsLoading(false);
    }

    loadSources();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedSource = useMemo(
    () => sources.find((source) => source.key === selectedSourceKey) ?? null,
    [sources, selectedSourceKey]
  );

  function handleGenerate() {
    if (!selectedSourceKey) {
      setError('Select a saved idea or example first.');
      return;
    }

    setError(null);
    setNotice(null);
    setSaveMessage(null);

    startGenerateTransition(async () => {
      const result = await generateProductArchitecture(selectedSourceKey);

      if (result.error) {
        setError(result.error);
        return;
      }

      setProduct(result.data);
      setNotice(result.notice);
    });
  }

  function handleSave() {
    if (!product) {
      return;
    }

    setError(null);
    setSaveMessage(null);

    startSaveTransition(async () => {
      const result = await saveProductArchitecture(selectedSourceKey, product);

      if (result.error) {
        setError(result.error);
        return;
      }

      setSaveMessage('Product architecture saved to your workspace.');
    });
  }

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      <div className="flex-1 overflow-y-auto p-4 pb-24 sm:p-6 lg:p-8 lg:pb-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center lg:mb-8">
            <div>
              <h1 className="mb-1 text-2xl font-medium text-white lg:mb-2 lg:text-3xl">
                Build your product
              </h1>
              <p className="text-sm text-muted-foreground lg:text-base">
                Strategist turns saved research into modules, pacing, pricing, and a build plan.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full border-white/10 text-white hover:bg-white/5 sm:w-auto"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>

          {!isLoading && sources.length === 0 ? (
            <Card className="mb-5 flex flex-col items-center justify-center border-white/5 bg-card p-8 text-center sm:p-10">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Hammer className="h-6 w-6 text-primary" />
              </div>
              <h2 className="mb-2 text-lg font-medium text-white">
                You need saved research first
              </h2>
              <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-muted-foreground">
                Strategist needs a saved idea or Analyst report to generate your product architecture. Go back and save some research first.
              </p>
              <div className="flex gap-3">
                <a href="/app/ideas">
                  <Button variant="outline" className="h-10 border-white/10 px-6 text-white hover:bg-white/5">Go to Scout Ideas</Button>
                </a>
                <a href="/app/examples">
                  <Button className="h-10 px-6">Go to Analyst</Button>
                </a>
              </div>
            </Card>
          ) : (
            <Card className="mb-5 border-white/5 bg-card p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                <div>
                  <label
                    htmlFor="product-source"
                    className="mb-2 block text-xs font-medium uppercase tracking-widest text-white/40"
                  >
                    Saved research
                  </label>
                  <Select
                    value={selectedSourceKey || null}
                    onValueChange={(value) => {
                      if (typeof value === 'string') {
                        setSelectedSourceKey(value);
                        setProduct(null);
                        setSaveMessage(null);
                      }
                    }}
                  >
                    <SelectTrigger
                      id="product-source"
                      className="h-12 w-full border-white/10 bg-[#0A0A0B] text-sm text-white"
                    >
                      <SelectValue placeholder="Select a saved idea or example" />
                    </SelectTrigger>
                    <SelectContent className="border-white/10 bg-[#121214] text-white">
                      {sources.map((source) => (
                        <SelectItem key={source.key} value={source.key}>
                          {source.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  disabled={isLoading || !selectedSourceKey || isGenerating}
                  onClick={handleGenerate}
                  className="h-12 px-5 font-semibold"
                >
                  {isGenerating ? (
                    <InlineSpinner label="Structuring" />
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Run Strategist
                    </>
                  )}
                </Button>
              </div>

              {selectedSource ? (
                <div className="mt-4 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        selectedSource.kind === 'example'
                          ? 'border-primary/20 bg-primary/10 text-primary'
                          : 'border-amber-500/20 bg-amber-500/10 text-amber-300'
                      }
                    >
                      {selectedSource.eyebrow}
                    </Badge>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {selectedSource.description}
                  </p>
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

          {!product ? (
            <EmptyWorkflowState icon={Hammer} title="No product architecture yet">
              {isLoading
                ? 'Loading saved ideas and examples...'
                : sources.length
                  ? 'Choose a saved input and run Strategist to generate the product architecture.'
                  : 'Save an idea or Analyst report before building the product architecture.'}
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
                        Strategist
                      </Badge>
                      <AiSourceBadge
                        source={product.source}
                        fallbackReason={product.fallbackReason}
                      />
                    </div>
                    <h2 className="text-2xl font-semibold tracking-tight text-white">
                      {product.positioning.title}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {product.positioning.subtitle}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      type="button"
                      disabled={isSaving}
                      onClick={handleSave}
                      variant="outline"
                      className="h-10 border-white/10 text-white hover:bg-white/5"
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
                    <Link href="/app/sales-kit">
                      <Button className="h-10 w-full bg-primary text-primary-foreground hover:bg-primary/90">
                        Create Sales Kit
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Metric label="Buyer" value={product.positioning.targetBuyer} />
                <Metric label="Category" value={product.positioning.category} />
                <Metric label="Price" value={product.positioning.recommendedPrice} />
                <Metric label="Promise" value={product.positioning.promise} />
              </div>

              <Card className="border-white/5 bg-card p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-medium text-white">
                    Product modules
                  </h2>
                </div>
                <div className="space-y-3">
                  {product.modules.map((module, index) => (
                    <div
                      key={module.title}
                      className="rounded-lg border border-white/5 bg-white/[0.02] p-4"
                    >
                      <div className="mb-2 flex items-start gap-3">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-medium text-white">
                            {module.title}
                          </h3>
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                            {module.goal}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {module.includedAssets.map((asset) => (
                          <Badge
                            key={asset}
                            variant="outline"
                            className="border-white/10 bg-white/5 text-white/60"
                          >
                            {asset}
                          </Badge>
                        ))}
                      </div>
                      <p className="mt-3 text-xs leading-relaxed text-white/55">
                        Buyer outcome: {module.buyerOutcome}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <ChecklistCard
                  icon={CheckCircle2}
                  title="Key features"
                  items={product.keyFeatures}
                  iconClassName="text-emerald-400"
                />
                <ChecklistCard
                  icon={Layers}
                  title="Proof points"
                  items={product.proofPoints}
                  iconClassName="text-amber-300"
                />
              </div>

              <Card className="border-white/5 bg-card p-4 sm:p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-medium text-white">Build plan</h2>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {product.buildPlan.map((step, index) => (
                    <div
                      key={step}
                      className="rounded-lg border border-white/5 bg-white/[0.02] p-3"
                    >
                      <p className="mb-1 text-[10px] uppercase tracking-widest text-white/40">
                        Step {index + 1}
                      </p>
                      <p className="text-sm leading-relaxed text-white/75">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      <aside className="hidden w-80 shrink-0 border-l border-white/5 bg-black/20 lg:flex lg:flex-col">
        <div className="flex items-center gap-2 border-b border-white/5 p-4">
          <Bot className="h-5 w-5 text-primary" />
          <span className="font-medium text-white">Strategist notes</span>
        </div>
        <div className="space-y-4 overflow-y-auto p-4">
          <Card className="border-white/5 bg-white/[0.02] p-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Start from Analyst output when available. It gives Strategist stronger pricing and differentiation signals than an idea alone.
            </p>
          </Card>
          <Card className="border-white/5 bg-white/[0.02] p-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Save the architecture before creating a sales kit so Creator can pull the modules and positioning from the database.
            </p>
          </Card>
        </div>
      </aside>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-white/5 bg-card p-4">
      <p className="mb-2 text-[10px] uppercase tracking-widest text-white/40">
        {label}
      </p>
      <p className="line-clamp-3 text-sm font-medium leading-relaxed text-white">
        {value}
      </p>
    </Card>
  );
}

function ChecklistCard({
  icon: Icon,
  title,
  items,
  iconClassName,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: string[];
  iconClassName: string;
}) {
  return (
    <Card className="border-white/5 bg-card p-4 sm:p-5">
      <h2 className="mb-4 text-lg font-medium text-white">{title}</h2>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item} className="flex gap-3 text-sm text-muted-foreground">
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconClassName}`} />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
