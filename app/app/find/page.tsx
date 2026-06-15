'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  LineChart,
  Sparkles,
  Search,
  SlidersHorizontal,
  TrendingUp,
} from 'lucide-react';

import { listSavedIdeas, saveScoutIdea, scoutTopic, type SavedIdea } from '@/app/actions/workflow';
import type { ScoutIdeasOutput, ScoutOpportunity } from '@/lib/ai';
import { useActiveBuild, type SelectedIdea } from '@/app/context/ActiveBuildSessionContext';
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

function toSelectedIdea(idea: ScoutOpportunity | SavedIdea): SelectedIdea {
  return {
    id: idea.id,
    title: idea.title,
    description: 'problem' in idea ? idea.problem : idea.description,
    buyer: idea.buyer,
    format: idea.format,
    priceRange: idea.priceRange,
    opportunityScore: idea.opportunityScore ?? null,
    difficulty: idea.difficulty,
    verdict: idea.verdict,
    whyNow: idea.whyNow,
  };
}

function IdeaCard({
  idea,
  onCreate,
  onSave,
  isSaving,
  isSaved,
}: {
  idea: SavedIdea | ScoutOpportunity;
  onCreate: (idea: SavedIdea | ScoutOpportunity) => void;
  onSave?: (idea: ScoutOpportunity) => void;
  isSaving?: boolean;
  isSaved?: boolean;
}) {
  const score = idea.opportunityScore ?? 72;
  const isScoutIdea = 'problem' in idea;
  const competition = idea.difficulty?.toLowerCase().includes('easy') ? 'Low' : idea.difficulty || 'Medium';
  const revenue = idea.priceRange ? `${idea.priceRange} / sale` : '$19 - $49 / sale';

  return (
    <Card className="group relative flex min-h-[360px] flex-col overflow-hidden rounded-2xl border-white/[0.09] bg-[linear-gradient(145deg,rgba(255,255,255,0.07),rgba(255,255,255,0.025)_44%,rgba(8,8,14,0.92))] p-6 shadow-[0_28px_90px_-58px_rgba(217,70,239,0.85)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-fuchsia-300/25 hover:shadow-[0_34px_110px_-56px_rgba(217,70,239,0.95)]">
      <div className="absolute inset-x-10 -top-16 h-32 bg-fuchsia-400/16 blur-3xl transition-opacity duration-500 group-hover:opacity-90" />
      <div className="relative mb-6 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="rounded-full border-fuchsia-300/20 bg-fuchsia-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-fuchsia-100">
              {isScoutIdea ? 'Market Signal' : 'Saved Signal'}
            </Badge>
            <Badge variant="outline" className="rounded-full border-white/[0.08] bg-white/[0.045] px-3 py-1 text-[10px] text-white/62">
              {idea.verdict || 'Buyer Demand Rising'}
            </Badge>
          </div>
          <h2 className="text-2xl font-semibold leading-tight tracking-[-0.03em] text-white">{idea.title}</h2>
        </div>
        <div className="relative flex h-18 w-18 shrink-0 items-center justify-center rounded-full border border-fuchsia-300/20 bg-black/35 shadow-[inset_0_0_24px_rgba(217,70,239,0.18),0_0_24px_-10px_rgba(217,70,239,0.8)]">
          <div className="absolute inset-1 rounded-full border-4 border-fuchsia-400/70 border-b-fuchsia-400/10 border-l-fuchsia-400/25" />
          <div className="text-center">
            <div className="text-xl font-semibold text-white">{score}</div>
            <div className="text-[9px] text-white/45">demand</div>
          </div>
        </div>
      </div>

      <p className="relative mb-6 text-sm leading-7 text-white/64">
        {isScoutIdea ? idea.problem : idea.description}
      </p>

      <div className="relative mb-6 grid grid-cols-2 gap-3 text-sm">
        <MiniStat label="Growth momentum" value={idea.whyNow || 'Demand is rising'} />
        <MiniStat label="Competition" value={competition} />
        <MiniStat label="Buyer" value={idea.buyer} />
        <MiniStat label="Revenue estimate" value={revenue} />
      </div>

      <div className="relative mt-auto flex flex-col gap-2 sm:flex-row">
        <Button
          onClick={() => onCreate(idea)}
          className="h-12 flex-1 rounded-xl bg-fuchsia-500 text-white shadow-[0_0_26px_-10px_rgba(217,70,239,0.9)] transition-all duration-300 hover:bg-fuchsia-400"
        >
          View opportunity
          <ArrowRight className="h-4 w-4" />
        </Button>
        {isScoutIdea && onSave ? (
          <Button
            type="button"
            variant="outline"
            disabled={isSaving || isSaved}
            onClick={() => onSave(idea)}
            className="h-12 rounded-xl border-white/[0.09] bg-white/[0.035] text-white/82 transition-all duration-300 hover:border-fuchsia-300/20 hover:bg-fuchsia-400/[0.08] hover:text-white"
          >
            {isSaving ? (
              <InlineSpinner label="Saving" />
            ) : isSaved ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Saved
              </>
            ) : (
              'Save idea'
            )}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-20 flex-col justify-center rounded-xl border border-white/[0.07] bg-black/24 px-3.5 py-3 backdrop-blur-md">
      <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.13em] text-white/38">{label}</p>
      <p className="line-clamp-2 text-sm font-medium leading-5 text-white/88">{value || 'Not set'}</p>
    </div>
  );
}

export default function FindPage() {
  const router = useRouter();
  const { activeSession, startBuildFromIdea } = useActiveBuild();
  const [topic, setTopic] = useState('');
  const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>([]);
  const [scan, setScan] = useState<ScoutIdeasOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [savedIdeaIds, setSavedIdeaIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(true);
  const [isScanning, startScanTransition] = useTransition();
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
        setSavedIdeas(result.data ?? []);
      }

      setIsLoadingIdeas(false);
    }

    loadIdeas();

    return () => {
      isMounted = false;
    };
  }, []);

  function handleScan(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!topic.trim()) {
      setError('Enter a niche, audience, or buyer problem first.');
      return;
    }

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

  function handleCreate(idea: SavedIdea | ScoutOpportunity) {
    startBuildFromIdea(toSelectedIdea(idea));
    router.push('/app/create');
  }

  function handleSave(idea: ScoutOpportunity) {
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
      setSavedIdeas((current) => [result.data!, ...current.filter((item) => item.id !== result.data!.id)]);
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
              <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#d946ef" stopOpacity="0.34" />
                <stop offset="100%" stopColor="#d946ef" stopOpacity="0" />
              </linearGradient>
              <filter id="trendGlow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path d="M10 220 C70 224 88 180 145 182 C184 184 192 150 236 154 C282 160 292 112 340 122 C384 132 402 96 440 96 C480 96 492 70 532 82 C570 94 588 42 626 58 C666 74 678 30 710 22 L710 280 L10 280 Z" fill="url(#trendFill)" />
            <path d="M10 220 C70 224 88 180 145 182 C184 184 192 150 236 154 C282 160 292 112 340 122 C384 132 402 96 440 96 C480 96 492 70 532 82 C570 94 588 42 626 58 C666 74 678 30 710 22" fill="none" stroke="#d946ef" strokeWidth="3" filter="url(#trendGlow)" />
            {[145,236,340,440,532,626,710].map((x, index) => (
              <circle key={x} cx={x} cy={[182,154,122,96,82,58,22][index]} r="5" fill="#f5d0fe" filter="url(#trendGlow)" />
            ))}
          </svg>
        </div>
        <div className="relative max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-fuchsia-300/18 bg-fuchsia-400/[0.08] px-3 py-1.5 text-xs font-medium text-fuchsia-100">
            <TrendingUp className="h-3.5 w-3.5" />
            Buyer demand is already moving
          </div>
          <h1 className="mb-5 max-w-2xl text-4xl font-semibold leading-[0.98] tracking-[-0.055em] text-white sm:text-5xl lg:text-6xl">
            Discover market opportunities
          </h1>
          <p className="mb-8 max-w-xl text-base leading-7 text-white/66 sm:text-lg">
            Find products people are already searching for. Start with a niche, a problem, or a group of buyers.
          </p>
        </div>

      {activeSession?.selected_idea ? (
        <div className="relative mb-6 flex items-center justify-between rounded-2xl border border-fuchsia-300/18 bg-fuchsia-400/[0.08] px-4 py-3 backdrop-blur-md">
          <div className="min-w-0">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-primary/85">Active session</p>
            <h2 className="truncate text-sm font-medium text-white">{activeSession.selected_idea.title}</h2>
            <p className="mt-1 text-xs text-white/60">{activeSession.next_action}</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => router.push('/app/create')}
            className="ml-4 shrink-0 border-primary/30 bg-black/30 text-white hover:bg-primary/20"
          >
            Continue in Create
          </Button>
        </div>
      ) : null}

      <form onSubmit={handleScan} className="relative mb-4 flex flex-col gap-3 lg:flex-row">
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
            onClick={() => value === 'All Ideas' ? setTopic('') : setTopic(value.toLowerCase())}
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
        {saveMessage ? <WorkflowNotice tone="success">{saveMessage}</WorkflowNotice> : null}
      </div>

      {scan ? (
        <section className="mb-8">
          <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur-md sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">
                  Market Scan
                </Badge>
                <AiSourceBadge source={scan.source} fallbackReason={scan.fallbackReason} />
              </div>
              <p className="text-sm leading-relaxed text-white/68">{scan.summary}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {scan.ideas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onCreate={handleCreate}
                onSave={handleSave}
                isSaving={isSaving && savingId === idea.id}
                isSaved={savedIdeaIds.has(idea.id)}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-[-0.03em] text-white">Saved ideas</h2>
            <p className="text-sm text-white/58">Return to signals you want to explore.</p>
          </div>
          <Badge variant="outline" className="border-white/10 bg-white/5 text-white/70">
            {savedIdeas.length} saved
          </Badge>
        </div>

        {isLoadingIdeas ? (
          <Card className="rounded-2xl border-white/[0.08] bg-white/[0.035] p-8 text-center text-sm text-white/60 backdrop-blur-md">
            Loading saved ideas...
          </Card>
        ) : savedIdeas.length === 0 ? (
          <Card className="rounded-2xl border-white/[0.08] bg-white/[0.035] p-8 text-center backdrop-blur-md">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-fuchsia-400/10">
              <LineChart className="h-6 w-6 text-fuchsia-200" />
            </div>
            <h2 className="mb-2 text-lg font-medium text-white">No saved ideas yet</h2>
            <p className="mx-auto max-w-lg text-sm leading-relaxed text-white/60">
              Scan a market, save the signals you want to keep, then come back when you are ready to build.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {savedIdeas.map((idea) => (
              <IdeaCard key={idea.id} idea={idea} onCreate={handleCreate} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
