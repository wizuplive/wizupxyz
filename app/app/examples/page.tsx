'use client';

import React, { useEffect, useMemo, useState, useTransition } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Layers,
  Quote,
  Search,
  TrendingUp,
} from 'lucide-react';

import {
  generateExamplesFromIdea,
  listSavedIdeas,
  saveAnalystExample,
  type SavedIdea,
} from '@/app/actions/workflow';
import type { AnalystExamplesOutput } from '@/lib/ai';
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

export default function ExamplesPage() {
  const [ideas, setIdeas] = useState<SavedIdea[]>([]);
  const [selectedIdeaId, setSelectedIdeaId] = useState('');
  const [analysis, setAnalysis] = useState<AnalystExamplesOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isGenerating, startGenerateTransition] = useTransition();
  const [isSaving, startSaveTransition] = useTransition();

  useEffect(() => {
    let isMounted = true;

    async function loadIdeas() {
      const result = await listSavedIdeas();

      if (!isMounted) {
        return;
      }

      if (result.error) {
        setError(result.error);
      } else {
        const savedIdeas = result.data ?? [];
        setIdeas(savedIdeas);
        setSelectedIdeaId((current) => current || savedIdeas[0]?.id || '');
      }

      setIsLoading(false);
    }

    loadIdeas();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedIdea = useMemo(
    () => ideas.find((idea) => idea.id === selectedIdeaId) ?? null,
    [ideas, selectedIdeaId]
  );

  function handleGenerate() {
    if (!selectedIdeaId) {
      setError('Select a saved idea first.');
      return;
    }

    setError(null);
    setNotice(null);
    setSaveMessage(null);

    startGenerateTransition(async () => {
      const result = await generateExamplesFromIdea(selectedIdeaId);

      if (result.error) {
        setError(result.error);
        return;
      }

      setAnalysis(result.data);
      setNotice(result.notice);
    });
  }

  function handleSave() {
    if (!analysis || !selectedIdeaId) {
      return;
    }

    setError(null);
    setSaveMessage(null);

    startSaveTransition(async () => {
      const result = await saveAnalystExample(selectedIdeaId, analysis);

      if (result.error) {
        setError(result.error);
        return;
      }

      setSaveMessage('Example analysis saved to your workspace.');
    });
  }

  return (
    <div className="mx-auto max-w-6xl p-4 pb-24 sm:p-6 lg:p-8 lg:pb-8">
      <div className="mb-6 lg:mb-8">
        <h1 className="mb-1 text-2xl font-medium text-white lg:mb-2 lg:text-3xl">
          Study what already works
        </h1>
        <p className="mb-4 text-sm text-muted-foreground sm:mb-6 lg:text-lg">
          Analyst turns a saved idea into reference structures, hooks, formats, and buyer complaints.
        </p>

        <div className="inline-flex w-full items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-xs text-primary sm:w-auto sm:text-sm">
          <Layers className="h-4 w-4 shrink-0" />
          <span className="leading-tight">
            Saved Analyst reports become inputs for the Product step.
          </span>
        </div>
      </div>

      {!isLoading && ideas.length === 0 ? (
        <Card className="mb-5 flex flex-col items-center justify-center border-white/5 bg-card p-8 text-center sm:p-10">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Search className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mb-2 text-lg font-medium text-white">
            You need a saved idea first
          </h2>
          <p className="mx-auto mb-6 max-w-md text-sm leading-relaxed text-muted-foreground">
            Analyst needs a saved idea to generate market examples. Head over to the Scout workflow to find and save your first idea.
          </p>
          <a href="/app/ideas">
            <Button className="h-10 px-6">Go to Scout Ideas</Button>
          </a>
        </Card>
      ) : (
        <Card className="mb-5 border-white/5 bg-card p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <label
                htmlFor="idea-select"
                className="mb-2 block text-xs font-medium uppercase tracking-widest text-white/40"
              >
                Saved idea
              </label>
              <Select
                value={selectedIdeaId || null}
                onValueChange={(value) => {
                  if (typeof value === 'string') {
                    setSelectedIdeaId(value);
                    setAnalysis(null);
                    setSaveMessage(null);
                  }
                }}
              >
                <SelectTrigger
                  id="idea-select"
                  className="h-12 w-full border-white/10 bg-[#0A0A0B] text-sm text-white"
                >
                  <SelectValue placeholder="Select a saved idea" />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-[#121214] text-white">
                  {ideas.map((idea) => (
                    <SelectItem key={idea.id} value={idea.id}>
                      {idea.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              disabled={isLoading || !selectedIdeaId || isGenerating}
              onClick={handleGenerate}
              className="h-12 px-5 font-semibold"
            >
              {isGenerating ? (
                <InlineSpinner label="Analyzing" />
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Run Analyst
                </>
              )}
            </Button>
          </div>

          {selectedIdea ? (
            <div className="mt-4 grid grid-cols-1 gap-3 border-t border-white/5 pt-4 sm:grid-cols-3">
              <MiniStat label="Buyer" value={selectedIdea.buyer || 'Not saved'} />
              <MiniStat label="Format" value={selectedIdea.format || 'Not saved'} />
              <MiniStat label="Score" value={String(selectedIdea.opportunityScore ?? 'Not saved')} />
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

      {!analysis ? (
        <EmptyWorkflowState icon={Layers} title="No Analyst report yet">
          {isLoading
            ? 'Loading saved ideas...'
            : ideas.length
              ? 'Choose a saved idea and run Analyst to generate market examples.'
              : 'Save an idea from Scout before running Analyst.'}
        </EmptyWorkflowState>
      ) : (
        <div className="space-y-5">
          <Card className="border-white/5 bg-card p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-primary/20 bg-primary/10 text-primary"
                  >
                    Analyst
                  </Badge>
                  <AiSourceBadge
                    source={analysis.source}
                    fallbackReason={analysis.fallbackReason}
                  />
                </div>
                <h2 className="text-xl font-medium text-white">
                  {analysis.ideaTitle}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {analysis.recommendation}
                </p>
              </div>
              <Button
                type="button"
                disabled={isSaving}
                onClick={handleSave}
                className="h-10 shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {isSaving ? <InlineSpinner label="Saving" /> : 'Save Example'}
              </Button>
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="border-white/5 bg-card p-4 sm:p-5">
              <h2 className="mb-4 text-lg font-medium text-white">
                Title patterns
              </h2>
              <div className="space-y-3">
                {analysis.titlePatterns.map((pattern) => (
                  <div
                    key={pattern}
                    className="rounded-lg border border-white/5 bg-white/[0.02] p-3 text-sm text-white/80"
                  >
                    {pattern}
                  </div>
                ))}
              </div>
            </Card>

            <Card className="border-white/5 bg-card p-4 sm:p-5">
              <h2 className="mb-4 text-lg font-medium text-white">
                Format and pricing
              </h2>
              <div className="space-y-3">
                {analysis.formatPricing.map((item) => (
                  <div
                    key={`${item.format}-${item.typicalPriceRange}`}
                    className="rounded-lg border border-white/5 bg-white/[0.02] p-3"
                  >
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <span className="font-medium text-white">{item.format}</span>
                      <span className="text-sm text-amber-300">
                        {item.typicalPriceRange}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {item.buyerExpectation}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card className="border-white/5 bg-card p-4 sm:p-5">
            <h2 className="mb-4 text-lg font-medium text-white">
              Reference structures
            </h2>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {analysis.competitorExamples.map((example) => (
                <div
                  key={example.title}
                  className="rounded-lg border border-white/5 bg-white/[0.02] p-4"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <h3 className="font-medium leading-tight text-white">
                      {example.title}
                    </h3>
                    <Badge
                      variant="outline"
                      className="border-white/10 bg-white/5 text-white/60"
                    >
                      {example.priceRange}
                    </Badge>
                  </div>
                  <p className="mb-3 text-xs leading-relaxed text-muted-foreground">
                    {example.positioning}
                  </p>
                  <div className="space-y-2">
                    {example.strengths.slice(0, 2).map((strength) => (
                      <div key={strength} className="flex gap-2 text-xs text-white/65">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        <span>{strength}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="relative overflow-hidden border-red-500/10 bg-card p-4 sm:p-5">
              <div className="absolute left-0 top-0 h-full w-1 bg-red-500" />
              <div className="mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <h2 className="text-lg font-medium text-white">
                  Buyer complaints
                </h2>
              </div>
              <div className="space-y-3">
                {analysis.buyerComplaints.map((complaint) => (
                  <div key={complaint} className="flex gap-3">
                    <Quote className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {complaint}
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="relative overflow-hidden border-emerald-500/10 bg-card p-4 sm:p-5">
              <div className="absolute left-0 top-0 h-full w-1 bg-emerald-500" />
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <h2 className="text-lg font-medium text-white">
                  Improvement angles
                </h2>
              </div>
              <div className="space-y-3">
                {analysis.improvementAngles.map((angle) => (
                  <div key={angle} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {angle}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
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
