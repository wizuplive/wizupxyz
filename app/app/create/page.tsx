'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Hammer,
  Layers3,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';

import {
  useActiveBuild,
  type ProductDraft,
  type ProductDraftModule,
} from '@/app/context/ActiveBuildSessionContext';
import { EmptyWorkflowState, WorkflowNotice } from '@/components/workflow/workflow-panels';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type DraftFormState = {
  title: string;
  subtitle: string;
  promise: string;
  targetBuyer: string;
  category: string;
  recommendedPrice: string;
  problemSummary: string;
  differentiator: string;
  keyFeatures: string[];
  proofPoints: string[];
  buildPlan: string[];
  modules: ProductDraftModule[];
};

function normalizeList(items: string[]) {
  return items.map((item) => item.trim()).filter(Boolean);
}

function createEmptyModule(index: number): ProductDraftModule {
  return {
    title: `Module ${index + 1}`,
    goal: '',
    includedAssets: [],
    buyerOutcome: '',
  };
}

function draftFromSession(
  selectedIdea: NonNullable<ReturnType<typeof useActiveBuild>['activeSession']>['selected_idea'],
  existingDraft: ProductDraft | null,
): DraftFormState {
  if (existingDraft) {
    return {
      title: existingDraft.title,
      subtitle: existingDraft.subtitle,
      promise: existingDraft.promise,
      targetBuyer: existingDraft.targetBuyer,
      category: existingDraft.category,
      recommendedPrice: existingDraft.recommendedPrice,
      problemSummary: existingDraft.problemSummary,
      differentiator: existingDraft.differentiator,
      keyFeatures: existingDraft.keyFeatures,
      proofPoints: existingDraft.proofPoints,
      buildPlan: existingDraft.buildPlan,
      modules: existingDraft.modules.length ? existingDraft.modules : [createEmptyModule(0)],
    };
  }

  return {
    title: selectedIdea?.title || '',
    subtitle: selectedIdea ? `A ${selectedIdea.format.toLowerCase()} for ${selectedIdea.buyer.toLowerCase()}.` : '',
    promise: selectedIdea?.whyNow || '',
    targetBuyer: selectedIdea?.buyer || '',
    category: selectedIdea?.format || '',
    recommendedPrice: selectedIdea?.priceRange || '',
    problemSummary: selectedIdea?.description || '',
    differentiator: selectedIdea?.whyNow || '',
    keyFeatures: [],
    proofPoints: [],
    buildPlan: [],
    modules: [createEmptyModule(0)],
  };
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] backdrop-blur-md">
      <p className="mb-1 text-[10px] uppercase tracking-[0.3em] text-white/35">{label}</p>
      <p className="text-sm text-white/80">{value || 'Not set'}</p>
    </div>
  );
}

function SurfaceField({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/10 bg-[#060709]/90 backdrop-blur-md bg-white/[0.02] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30 transition-all',
        className,
      )}
    >
      {children}
    </div>
  );
}

function SectionCard({
  badge,
  title,
  description,
  icon: Icon,
  children,
}: {
  badge: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden rounded-[28px] border-white/[0.05] bg-white/[0.02] p-0 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] backdrop-blur-md">
      <div className="border-b border-white/5 bg-[radial-gradient(circle_at_top_left,rgba(217,119,6,0.16),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))] px-6 py-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <Badge variant="outline" className="border-white/10 bg-white/5 text-[10px] uppercase tracking-[0.28em] text-white/70">
              {badge}
            </Badge>
            <h2 className="mt-4 text-2xl font-medium tracking-tight text-white">{title}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">{description}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-[0_0_24px_rgba(245,158,11,0.2)]">
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </div>
      <div className="space-y-6 px-6 py-6">{children}</div>
    </Card>
  );
}

function Field({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <label className="block text-[11px] font-medium uppercase tracking-[0.28em] text-white/42">{label}</label>
        {description ? <p className="text-sm text-white/40">{description}</p> : null}
      </div>
      {children}
    </div>
  );
}

function DynamicListInput({
  items,
  onChange,
  placeholder,
  emptyLabel,
  addLabel,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  emptyLabel: string;
  addLabel: string;
}) {
  const [draftValue, setDraftValue] = useState('');

  function addItem() {
    const value = draftValue.trim();

    if (!value) {
      return;
    }

    onChange([...items, value]);
    setDraftValue('');
  }

  function removeItem(index: number) {
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  }

  return (
    <div className="space-y-3">
      <SurfaceField className="p-2">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={draftValue}
            onChange={(event) => setDraftValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addItem();
              }
            }}
            placeholder={placeholder}
            className="h-11 border-0 bg-transparent px-3 text-white focus-visible:border-0 focus-visible:ring-0"
          />
          <Button
            type="button"
            onClick={addItem}
            className="h-11 rounded-xl border border-primary/20 bg-primary/15 px-4 text-primary hover:bg-primary/20"
          >
            <Plus className="h-4 w-4" />
            {addLabel}
          </Button>
        </div>
      </SurfaceField>

      {items.length ? (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/12 text-[11px] font-medium text-primary">
                  {index + 1}
                </span>
                <p className="text-sm text-white/82">{item}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeItem(index)}
                className="rounded-xl text-white/45 hover:bg-white/8 hover:text-white"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-4 py-5 text-sm text-white/35">
          {emptyLabel}
        </div>
      )}
    </div>
  );
}

function ModuleBuilder({
  modules,
  onChange,
}: {
  modules: ProductDraftModule[];
  onChange: (modules: ProductDraftModule[]) => void;
}) {
  function updateModule(index: number, key: keyof ProductDraftModule, value: string | string[]) {
    onChange(
      modules.map((module, moduleIndex) =>
        moduleIndex === index
          ? {
              ...module,
              [key]: value,
            }
          : module,
      ),
    );
  }

  function addModule() {
    onChange([...modules, createEmptyModule(modules.length)]);
  }

  function removeModule(index: number) {
    if (modules.length === 1) {
      onChange([createEmptyModule(0)]);
      return;
    }

    onChange(modules.filter((_, moduleIndex) => moduleIndex !== index));
  }

  return (
    <div className="space-y-4">
      {modules.map((module, index) => (
        <div
          key={`${module.title}-${index}`}
          className="rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
        >
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/35">Module {index + 1}</p>
              <h3 className="mt-1 text-lg font-medium text-white">{module.title || `Untitled module ${index + 1}`}</h3>
            </div>
            <Button
              type="button"
              variant="ghost"
              onClick={() => removeModule(index)}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 text-white/65 hover:bg-white/8 hover:text-white"
            >
              <Trash2 className="h-4 w-4" />
              Remove module
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Field label="Module title" description="Name the transformation unit, not the file folder.">
              <SurfaceField>
                <Input
                  value={module.title}
                  onChange={(event) => updateModule(index, 'title', event.target.value)}
                  className="h-12 border-0 bg-transparent px-4 text-white focus-visible:border-0 focus-visible:ring-0"
                />
              </SurfaceField>
            </Field>

            <Field label="Buyer outcome" description="State the visible before-and-after for the buyer.">
              <SurfaceField>
                <Input
                  value={module.buyerOutcome}
                  onChange={(event) => updateModule(index, 'buyerOutcome', event.target.value)}
                  className="h-12 border-0 bg-transparent px-4 text-white focus-visible:border-0 focus-visible:ring-0"
                />
              </SurfaceField>
            </Field>
          </div>

          <div className="mt-4 space-y-4">
            <Field label="Module goal" description="Describe the single job this module must accomplish.">
              <SurfaceField>
                <Textarea
                  value={module.goal}
                  onChange={(event) => updateModule(index, 'goal', event.target.value)}
                  className="min-h-28 border-0 bg-transparent px-4 py-3 text-white focus-visible:border-0 focus-visible:ring-0"
                />
              </SurfaceField>
            </Field>

            <Field label="Included assets" description="Add templates, checklists, prompts, worksheets, or examples.">
              <DynamicListInput
                items={module.includedAssets}
                onChange={(items) => updateModule(index, 'includedAssets', items)}
                placeholder="Add one asset at a time"
                emptyLabel="No assets attached yet. Add the proof, template, or tool that makes this module feel finished."
                addLabel="Add asset"
              />
            </Field>
          </div>
        </div>
      ))}

      <Button
        type="button"
        onClick={addModule}
        className="h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-5 text-white hover:bg-white/[0.08]"
      >
        <Plus className="h-4 w-4" />
        Add another module
      </Button>
    </div>
  );
}

export default function CreatePage() {
  const router = useRouter();
  const { activeSession, setProductDraft, updateStage } = useActiveBuild();
  const selectedIdea = activeSession?.selected_idea ?? null;
  const existingDraft = activeSession?.product_draft ?? null;
  const [form, setForm] = useState(() => draftFromSession(selectedIdea, existingDraft));
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    updateStage('create');
  }, [updateStage]);

  useEffect(() => {
    setForm(draftFromSession(selectedIdea, existingDraft));
  }, [selectedIdea, existingDraft]);

  if (!selectedIdea) {
    return (
      <div className="mx-auto max-w-4xl p-4 pb-24 sm:p-6 lg:p-8 lg:pb-8">
        <EmptyWorkflowState icon={Hammer} title="Choose an idea first">
          Pick an idea from Find before writing the product draft.
        </EmptyWorkflowState>
        <div className="mt-4">
          <Link href="/app/find">
            <Button>Go to Find</Button>
          </Link>
        </div>
      </div>
    );
  }

  const sourceIdea = selectedIdea;

  function handleChange<K extends keyof DraftFormState>(key: K, value: DraftFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSaveAndContinue() {
    const draft: ProductDraft = {
      title: form.title.trim() || sourceIdea.title,
      subtitle: form.subtitle.trim(),
      promise: form.promise.trim(),
      targetBuyer: form.targetBuyer.trim() || sourceIdea.buyer,
      category: form.category.trim() || sourceIdea.format,
      recommendedPrice: form.recommendedPrice.trim() || sourceIdea.priceRange,
      problemSummary: form.problemSummary.trim() || sourceIdea.description,
      differentiator: form.differentiator.trim() || sourceIdea.whyNow,
      keyFeatures: normalizeList(form.keyFeatures),
      proofPoints: normalizeList(form.proofPoints),
      buildPlan: normalizeList(form.buildPlan),
      modules: form.modules
        .map((module, index) => ({
          title: module.title.trim() || `Module ${index + 1}`,
          goal: module.goal.trim() || 'Clarify the buyer outcome.',
          includedAssets: normalizeList(module.includedAssets),
          buyerOutcome: module.buyerOutcome.trim() || 'Knows exactly what to do next.',
        }))
        .filter((module) => module.title || module.goal || module.includedAssets.length || module.buyerOutcome),
    };

    setProductDraft({
      ...draft,
      modules: draft.modules.length ? draft.modules : [createEmptyModule(0)],
    });
    setMessage('Product draft saved to the active build session.');
    router.push('/app/sell');
  }

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[#040506]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(circle_at_top,rgba(245,158,11,0.14),transparent_38%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-40 h-96 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.06),transparent_24%),radial-gradient(circle_at_80%_0%,rgba(245,158,11,0.08),transparent_18%)]" />

      <div className="relative mx-auto max-w-6xl p-4 pb-24 sm:p-6 lg:p-8 lg:pb-10">
        <div className="mb-8 flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-300">
                  Product-Builder Cockpit
                </Badge>
                <Badge variant="outline" className="border-white/10 bg-white/5 text-white/70">
                  {selectedIdea.opportunityScore ?? 0}/100
                </Badge>
              </div>
              <h1 className="text-3xl font-medium tracking-tight text-white lg:text-5xl">
                Draft the offer like a product system, not an admin form.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/55 lg:text-base">
                Shape the framing, stack the proof, and architect the modules before moving into the sales kit.
              </p>
            </div>

            <Card className="w-full max-w-md rounded-[24px] border-white/[0.05] bg-white/[0.02] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] backdrop-blur-md">
              <p className="mb-2 text-[10px] uppercase tracking-[0.28em] text-white/35">Source idea</p>
              <h2 className="text-base font-medium text-white">{sourceIdea.title}</h2>
              <p className="mt-2 text-sm leading-6 text-white/55">{sourceIdea.description}</p>
            </Card>
          </div>

          {message ? (
            <div>
              <WorkflowNotice tone="success">{message}</WorkflowNotice>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MiniStat label="Buyer" value={sourceIdea.buyer} />
            <MiniStat label="Format" value={sourceIdea.format} />
            <MiniStat label="Price" value={sourceIdea.priceRange} />
            <MiniStat label="Why now" value={sourceIdea.whyNow} />
          </div>
        </div>

        <div className="space-y-6">
          <SectionCard
            badge="Phase 01"
            title="Offer Framing"
            description="Set the market position, outcome promise, and pricing logic with enough sharpness that every downstream asset inherits clarity."
            icon={Sparkles}
          >
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Field label="Product title">
                <SurfaceField>
                  <Input
                    value={form.title}
                    onChange={(event) => handleChange('title', event.target.value)}
                    className="h-12 border-0 bg-transparent px-4 text-white focus-visible:border-0 focus-visible:ring-0"
                  />
                </SurfaceField>
              </Field>

              <Field label="Subtitle">
                <SurfaceField>
                  <Input
                    value={form.subtitle}
                    onChange={(event) => handleChange('subtitle', event.target.value)}
                    className="h-12 border-0 bg-transparent px-4 text-white focus-visible:border-0 focus-visible:ring-0"
                  />
                </SurfaceField>
              </Field>
            </div>

            <Field label="Promise">
              <SurfaceField>
                <Textarea
                  value={form.promise}
                  onChange={(event) => handleChange('promise', event.target.value)}
                  className="min-h-24 border-0 bg-transparent px-4 py-3 text-white focus-visible:border-0 focus-visible:ring-0"
                />
              </SurfaceField>
            </Field>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Field label="Target buyer">
                <SurfaceField>
                  <Input
                    value={form.targetBuyer}
                    onChange={(event) => handleChange('targetBuyer', event.target.value)}
                    className="h-12 border-0 bg-transparent px-4 text-white focus-visible:border-0 focus-visible:ring-0"
                  />
                </SurfaceField>
              </Field>

              <Field label="Category">
                <SurfaceField>
                  <Input
                    value={form.category}
                    onChange={(event) => handleChange('category', event.target.value)}
                    className="h-12 border-0 bg-transparent px-4 text-white focus-visible:border-0 focus-visible:ring-0"
                  />
                </SurfaceField>
              </Field>

              <Field label="Price">
                <SurfaceField>
                  <Input
                    value={form.recommendedPrice}
                    onChange={(event) => handleChange('recommendedPrice', event.target.value)}
                    className="h-12 border-0 bg-transparent px-4 text-white focus-visible:border-0 focus-visible:ring-0"
                  />
                </SurfaceField>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Field label="Problem summary">
                <SurfaceField>
                  <Textarea
                    value={form.problemSummary}
                    onChange={(event) => handleChange('problemSummary', event.target.value)}
                    className="min-h-32 border-0 bg-transparent px-4 py-3 text-white focus-visible:border-0 focus-visible:ring-0"
                  />
                </SurfaceField>
              </Field>

              <Field label="Differentiator">
                <SurfaceField>
                  <Textarea
                    value={form.differentiator}
                    onChange={(event) => handleChange('differentiator', event.target.value)}
                    className="min-h-32 border-0 bg-transparent px-4 py-3 text-white focus-visible:border-0 focus-visible:ring-0"
                  />
                </SurfaceField>
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            badge="Phase 02"
            title="Proof & Plan"
            description="Build the decision-support layer. Each list should read like an operator signal, not a notes dump."
            icon={FileText}
          >
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <Field label="Key features" description="What the buyer gets, in the order that matters most.">
                <DynamicListInput
                  items={form.keyFeatures}
                  onChange={(items) => handleChange('keyFeatures', items)}
                  placeholder="Add a feature"
                  emptyLabel="No features added yet. Start with the one that carries the offer."
                  addLabel="Add feature"
                />
              </Field>

              <Field label="Proof points" description="Signals that reduce skepticism and justify action.">
                <DynamicListInput
                  items={form.proofPoints}
                  onChange={(items) => handleChange('proofPoints', items)}
                  placeholder="Add a proof point"
                  emptyLabel="No proof points yet. Add evidence, credibility markers, or speed advantages."
                  addLabel="Add proof"
                />
              </Field>

              <Field label="Build plan" description="Sequence the making work into clear production steps.">
                <DynamicListInput
                  items={form.buildPlan}
                  onChange={(items) => handleChange('buildPlan', items)}
                  placeholder="Add a build step"
                  emptyLabel="No build steps yet. Add the production path from draft to finished asset."
                  addLabel="Add step"
                />
              </Field>
            </div>
          </SectionCard>

          <SectionCard
            badge="Phase 03"
            title="Module Architecture"
            description="Turn the product into a composed system of transformation blocks. Define the job, the assets, and the buyer outcome for each module."
            icon={Layers3}
          >
            <ModuleBuilder modules={form.modules} onChange={(modules) => handleChange('modules', modules)} />
          </SectionCard>
        </div>

        <div className="mt-8">
          <Card className="rounded-[28px] border-white/[0.05] bg-[linear-gradient(135deg,rgba(245,158,11,0.12),rgba(255,255,255,0.03)_28%,rgba(255,255,255,0.02)_100%)] p-5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] backdrop-blur-md">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/42">Phase Complete</p>
                <h2 className="mt-2 text-xl font-medium text-white">Lock the draft and move into the sales kit.</h2>
                <div className="mt-3 flex items-center gap-2 text-sm text-white/55">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Next step: turn this architecture into launch-ready sell assets.
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={handleSaveAndContinue}
                  className="h-12 min-w-60 rounded-2xl bg-primary px-5 text-primary-foreground shadow-[0_0_15px_rgba(var(--primary),0.3)] hover:brightness-110"
                >
                  Save draft and continue to Sell
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Link href="/app/find">
                  <Button variant="outline" className="h-12 rounded-2xl border-white/10 bg-white/[0.03] px-5 text-white hover:bg-white/8">
                    Back to Find
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
