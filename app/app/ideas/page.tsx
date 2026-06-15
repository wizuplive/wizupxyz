'use client';

import React, { useState, useTransition } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  LineChart,
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
} from 'lucide-react';

import { scoutTopic, saveScoutIdea } from '@/app/actions/workflow';
import type { ScoutIdeasOutput, ScoutOpportunity } from '@/lib/ai';
import { AiSourceBadge, InlineSpinner, WorkflowNotice } from '@/components/workflow/workflow-panels';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const starterTopics = [
  'All Ideas',
  'High Momentum',
  'Fast Growing',
  'Low Competition',
  'Evergreen',
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
    if (!topic.trim()) return;

    setError(null);
    setNotice(null);
    setSaveMessage(null);
    setScan(null);

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
    <div className="mx-auto flex h-full max-w-7xl flex-col px-4 pb-24 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">
      <section className="relative mb-8 overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(255,255,255,0.075),rgba(255,255,255,0.025)_38%,rgba(6,6,12,0.92))] p-5 shadow-[0_34px_120px_-72px_rgba(217,70,239,0.95)] backdrop-blur-2xl sm:p-8 lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_18%,rgba(217,70,239,0.22),transparent_30%),radial-gradient(circle_at_48%_0%,rgba(124,58,237,0.16),transparent_34%)]" />
        <div className="absolute right-0 top-4 hidden h-72 w-[58%] opacity-80 lg:block">
          <svg viewBox="0 0 720 280" className="h-full w-full overflow-visible">
            <defs>
              <linearGradient id="ideasTrendFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#d946ef" stopOpacity="0.34" />
                <stop offset="100%" stopColor="#d946ef" stopOpacity="0" />
              </linearGradient>
              <filter id="ideasTrendGlow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path d="M10 220 C70 224 88 180 145 182 C184 184 192 150 236 154 C282 160 292 112 340 122 C384 132 402 96 440 96 C480 96 492 70 532 82 C570 94 588 42 626 58 C666 74 678 30 710 22 L710 280 L10 280 Z" fill="url(#ideasTrendFill)" />
            <path d="M10 220 C70 224 88 180 145 182 C184 184 192 150 236 154 C282 160 292 112 340 122 C384 132 402 96 440 96 C480 96 492 70 532 82 C570 94 588 42 626 58 C666 74 678 30 710 22" fill="none" stroke="#d946ef" strokeWidth="3" filter="url(#ideasTrendGlow)" />
          </svg>
        </div>
        <div className="relative max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-fuchsia-300/18 bg-fuchsia-400/[0.08] px-3 py-1.5 text-xs font-medium text-fuchsia-100">
            <TrendingUp className="h-3.5 w-3.5" />
            Market signals, not guesses
          </div>
          <h1 className="mb-5 max-w-2xl text-4xl font-semibold leading-[0.98] tracking-[-0.055em] text-white sm:text-5xl lg:text-6xl">
            Discover market opportunities
          </h1>
          <p className="mb-8 max-w-xl text-base leading-7 text-white/66 sm:text-lg">
            Search a niche, a problem, or an audience. WIZUP will surface product ideas people are already looking for.
          </p>
        </div>

      <form
        onSubmit={handleScan}
        className="relative mb-4 flex flex-col gap-3 lg:flex-row"
      >
        <div className="relative flex-1">
          <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/42" />
          <Input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="Search niches, problems, or product ideas..."
            className="h-16 w-full rounded-2xl border-white/[0.09] bg-black/42 pl-14 text-base text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_0_0_rgba(217,70,239,0)] transition-all duration-300 placeholder:text-white/35 focus-visible:border-fuchsia-300/35 focus-visible:ring-2 focus-visible:ring-fuchsia-400/22 focus-visible:shadow-[0_0_38px_-18px_rgba(217,70,239,0.9)] sm:text-lg"
          />
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="h-16 flex-1 gap-2 rounded-2xl border-white/[0.09] bg-black/30 px-4 text-white/80 backdrop-blur-md hover:bg-white/[0.06] hover:text-white sm:flex-none lg:px-6"
          >
            <SlidersHorizontal className="h-5 w-5" />
            <span className="hidden sm:inline">Filters</span>
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={isScanning}
            className="h-16 flex-1 rounded-2xl bg-fuchsia-500 px-8 font-semibold text-white shadow-[0_0_32px_-12px_rgba(217,70,239,0.95)] transition-all hover:bg-fuchsia-400 hover:shadow-[0_0_42px_-10px_rgba(217,70,239,1)] sm:flex-none"
          >
            {isScanning ? <InlineSpinner label="Scanning" /> : (
              <>
                <Sparkles className="h-4 w-4" />
                Scan Market
              </>
            )}
          </Button>
        </div>
      </form>

      <div className="relative flex gap-2 overflow-x-auto pb-1">
        {starterTopics.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => handleStarterTopic(value === 'All Ideas' ? '' : value.toLowerCase())}
            className="shrink-0 rounded-full border border-white/[0.09] bg-white/[0.045] px-4 py-2 text-xs font-medium text-white/70 transition-all hover:border-fuchsia-300/22 hover:bg-fuchsia-400/[0.09] hover:text-white"
          >
            {value}
          </button>
        ))}
      </div>
      </section>

      <div className="mb-5 space-y-3">
        {error ? <WorkflowNotice tone="error">{error}</WorkflowNotice> : null}
        {notice ? <WorkflowNotice>{notice}</WorkflowNotice> : null}
        {saveMessage ? (
          <WorkflowNotice tone="success">{saveMessage}</WorkflowNotice>
        ) : null}
      </div>

      {!scan ? (
        <Card className="flex-1 justify-center rounded-2xl border-white/[0.08] bg-white/[0.035] p-8 text-center shadow-[0_28px_90px_-64px_rgba(217,70,239,0.75)] backdrop-blur-xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-fuchsia-400/10">
            <LineChart className="h-6 w-6 text-fuchsia-200" />
          </div>
          <h2 className="mb-2 text-lg font-medium text-white">
            Scan a market to begin
          </h2>
          <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-foreground">
            Opportunities will appear here with demand, growth, competition, and a clear next step.
          </p>
        </Card>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 shadow-[0_24px_80px_-64px_rgba(217,70,239,0.75)] backdrop-blur-xl sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="rounded-full border-fuchsia-300/20 bg-fuchsia-400/10 px-3 py-1 text-fuchsia-100"
                >
                  Market Scan
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
                  className="group relative overflow-hidden rounded-2xl border-white/[0.09] bg-[linear-gradient(145deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025)_44%,rgba(8,8,14,0.92))] p-5 shadow-[0_28px_90px_-58px_rgba(217,70,239,0.85)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-fuchsia-300/25 hover:shadow-[0_34px_110px_-56px_rgba(217,70,239,0.95)] sm:p-6"
                >
                  <div className="absolute inset-x-10 -top-16 h-32 bg-fuchsia-400/16 blur-3xl transition-opacity duration-500 group-hover:opacity-90" />
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className="rounded-full border-fuchsia-300/20 bg-fuchsia-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.13em] text-fuchsia-100"
                        >
                          Market Signal
                        </Badge>
                        <Badge
                          variant="outline"
                          className="rounded-full border-white/[0.08] bg-white/[0.045] px-3 py-1 text-[10px] text-white/62"
                        >
                          {idea.verdict}
                        </Badge>
                      </div>
                      <h2 className="text-2xl font-semibold leading-tight tracking-[-0.03em] text-white">
                        {idea.title}
                      </h2>
                    </div>
                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-fuchsia-300/20 bg-black/35 shadow-[inset_0_0_24px_rgba(217,70,239,0.18),0_0_24px_-10px_rgba(217,70,239,0.8)]">
                      <div className="absolute inset-1 rounded-full border-4 border-fuchsia-400/70 border-b-fuchsia-400/10 border-l-fuchsia-400/25" />
                      <span className="relative text-lg font-semibold text-white">
                        {idea.opportunityScore}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
                    <Metric label="Demand score" value={`${idea.opportunityScore}/100`} />
                    <Metric label="Competition" value={idea.difficulty} />
                    <Metric label="Revenue estimate" value={`${idea.priceRange} / sale`} />
                  </div>

                  <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
                    {idea.problem}
                  </p>

                  <div className="mb-4 grid gap-3 lg:grid-cols-2">
                    <div className="rounded-xl border border-white/[0.07] bg-black/24 p-3">
                      <p className="mb-2 text-[10px] uppercase tracking-widest text-white/40">
                        Growth momentum
                      </p>
                      <p className="text-xs leading-relaxed text-white/70">
                        {idea.whyNow}
                      </p>
                    </div>
                    <div className="rounded-xl border border-white/[0.07] bg-black/24 p-3">
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

                  <div className="flex flex-col gap-3 border-t border-white/[0.07] pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-xs text-white/40">
                      Save this signal for the next step.
                    </div>
                    <Button
                      type="button"
                      disabled={isSaved || isSavingThis}
                      onClick={() => handleSaveIdea(idea)}
                      className="h-11 rounded-xl bg-fuchsia-500 text-white shadow-[0_0_26px_-10px_rgba(217,70,239,0.9)] hover:bg-fuchsia-400"
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
    <div className="rounded-xl border border-white/[0.07] bg-black/24 p-3">
      <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.13em] text-white/38">
        {label}
      </p>
      <p className="text-sm font-medium leading-tight text-white/85">{value}</p>
    </div>
  );
}
