'use client';

import React, { useState, useTransition } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  Lightbulb,
  Search,
  SlidersHorizontal,
} from 'lucide-react';

import { scoutTopic, saveScoutIdea } from '@/app/actions/workflow';
import type { ScoutIdeasOutput, ScoutOpportunity } from '@/lib/ai';
import { AiSourceBadge, InlineSpinner, WorkflowNotice } from '@/components/workflow/workflow-panels';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const starterTopics = [
  'ADHD planning',
  'local business marketing',
  'new parent routines',
  'freelance client systems',
];

export default function IdeasPage() {
  const [topic, setTopic] = useState('');
  const [scan, setScan] = useState<ScoutIdeasOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [savedIdeaIds, setSavedIdeaIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isScanning, startScanTransition] = useTransition();
  const [isSaving, startSaveTransition] = useTransition();

  function handleScan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setSaveMessage(null);

    startScanTransition(async () => {
      const result = await scoutTopic(topic);

      if (result.error) {
        setError(result.error);
        return;
      }

      setScan(result.data);
      setNotice(result.notice);
      setSavedIdeaIds(new Set());
    });
  }

  function handleStarterTopic(value: string) {
    setTopic(value);
  }

  function handleSaveIdea(idea: ScoutOpportunity) {
    if (!scan) {
      return;
    }

    setError(null);
    setSaveMessage(null);
    setSavingId(idea.id);

    startSaveTransition(async () => {
      const result = await saveScoutIdea(idea, scan);

      if (result.error) {
        setError(result.error);
        setSavingId(null);
        return;
      }

      setSavedIdeaIds((current) => {
        const next = new Set(current);
        next.add(idea.id);
        return next;
      });
      setSaveMessage(`${idea.title} saved to your workspace.`);
      setSavingId(null);
    });
  }

  return (
    <div className="mx-auto flex h-full max-w-7xl flex-col p-4 pb-24 sm:p-6 lg:p-8 lg:pb-8">
      <div className="mb-6 lg:mb-8">
        <h1 className="mb-2 text-2xl font-medium text-white sm:text-3xl">
          Find product ideas people want
        </h1>
        <p className="text-base text-muted-foreground lg:text-lg">
          Search a niche, audience, or problem. Scout will score practical digital product opportunities.
        </p>
      </div>

      <form
        onSubmit={handleScan}
        className="mb-4 flex flex-col gap-3 lg:mb-5 lg:flex-row"
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="Search a niche, problem, or audience..."
            className="h-12 w-full rounded-xl border-white/10 bg-card pl-12 text-base lg:h-14 lg:text-lg"
          />
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="h-12 flex-1 gap-2 border-white/10 bg-card px-4 hover:bg-white/5 sm:flex-none lg:h-14 lg:px-6"
          >
            <SlidersHorizontal className="h-5 w-5" />
            <span className="hidden sm:inline">Filters</span>
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={isScanning}
            className="h-12 flex-1 px-6 font-semibold sm:flex-none lg:h-14 lg:px-8"
          >
            {isScanning ? <InlineSpinner label="Scanning" /> : 'Scan Market'}
          </Button>
        </div>
      </form>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {starterTopics.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => handleStarterTopic(value)}
            className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            {value}
          </button>
        ))}
      </div>

      <div className="mb-5 space-y-3">
        {error ? <WorkflowNotice tone="error">{error}</WorkflowNotice> : null}
        {notice ? <WorkflowNotice>{notice}</WorkflowNotice> : null}
        {saveMessage ? (
          <WorkflowNotice tone="success">{saveMessage}</WorkflowNotice>
        ) : null}
      </div>

      {!scan ? (
        <Card className="flex-1 justify-center border-white/5 bg-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Lightbulb className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mb-2 text-lg font-medium text-white">
            Run a Scout scan to fill this workspace
          </h2>
          <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-foreground">
            Generated ideas will appear here with buyer, format, price, score, risk, and a save action for the next workflow step.
          </p>
        </Card>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 rounded-xl border border-white/5 bg-card p-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-primary/20 bg-primary/10 text-primary"
                >
                  Scout
                </Badge>
                <AiSourceBadge
                  source={scan.source}
                  fallbackReason={scan.fallbackReason}
                />
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {scan.summary}
              </p>
            </div>
            <div className="min-w-0 shrink-0 text-left sm:w-64">
              <p className="mb-2 text-[10px] uppercase tracking-widest text-white/40">
                Next searches
              </p>
              <div className="flex flex-wrap gap-2">
                {scan.nextSearches.slice(0, 3).map((search) => (
                  <Badge
                    key={search}
                    variant="outline"
                    className="border-white/10 bg-white/5 text-white/70"
                  >
                    {search}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {scan.ideas.map((idea) => {
              const isSaved = savedIdeaIds.has(idea.id);
              const isSavingThis = isSaving && savingId === idea.id;

              return (
                <Card
                  key={idea.id}
                  className="border-white/5 bg-card p-4 transition-colors hover:border-white/10 sm:p-5"
                >
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={verdictClassName(idea.verdict)}
                        >
                          {idea.verdict}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="border-white/10 bg-white/5 text-white/60"
                        >
                          {idea.difficulty}
                        </Badge>
                      </div>
                      <h2 className="text-lg font-medium leading-tight text-white">
                        {idea.title}
                      </h2>
                    </div>
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/10">
                      <span className="text-sm font-bold text-amber-300">
                        {idea.opportunityScore}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                    <Metric label="Buyer" value={idea.buyer} />
                    <Metric label="Format" value={idea.format} />
                    <Metric label="Price" value={idea.priceRange} />
                  </div>

                  <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                    {idea.problem}
                  </p>

                  <div className="mb-4 grid gap-3 lg:grid-cols-2">
                    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                      <p className="mb-2 text-[10px] uppercase tracking-widest text-white/40">
                        Why now
                      </p>
                      <p className="text-xs leading-relaxed text-white/70">
                        {idea.whyNow}
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
                      <p className="mb-2 text-[10px] uppercase tracking-widest text-white/40">
                        Next step
                      </p>
                      <p className="text-xs leading-relaxed text-white/70">
                        {idea.nextStep}
                      </p>
                    </div>
                  </div>

                  <div className="mb-5 space-y-2">
                    {idea.evidence.slice(0, 2).map((item) => (
                      <div key={item} className="flex gap-2 text-xs text-white/65">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3 border-t border-white/5 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-xs text-white/40">
                      Save the idea to unlock Analyst.
                    </div>
                    <Button
                      type="button"
                      disabled={isSaved || isSavingThis}
                      onClick={() => handleSaveIdea(idea)}
                      className="h-10 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {isSavingThis ? (
                        <InlineSpinner label="Saving" />
                      ) : isSaved ? (
                        'Saved'
                      ) : (
                        <>
                          Save Idea
                          <ArrowUpRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-white/[0.02] p-3">
      <p className="mb-1 text-[10px] uppercase tracking-widest text-white/40">
        {label}
      </p>
      <p className="text-sm font-medium leading-tight text-white/85">{value}</p>
    </div>
  );
}

function verdictClassName(verdict: ScoutOpportunity['verdict']) {
  if (verdict === 'Build now') {
    return 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300';
  }

  if (verdict === 'Refine first') {
    return 'border-amber-500/20 bg-amber-500/10 text-amber-300';
  }

  return 'border-red-500/20 bg-red-500/10 text-red-300';
}
