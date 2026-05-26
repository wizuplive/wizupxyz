'use client';

import React, { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  Search,
  SlidersHorizontal,
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
  'ADHD planning',
  'local business marketing',
  'new parent routines',
  'freelance client systems',
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
  return (
    <Card className="group relative flex flex-col border-white/10 bg-gradient-to-br from-white/[0.03] to-transparent p-6 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_10px_40px_-15px_rgba(var(--primary),0.2)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-300">
              {idea.verdict}
            </Badge>
            <Badge variant="outline" className="border-white/10 bg-white/5 text-white/70">
              {idea.difficulty}
            </Badge>
          </div>
          <h2 className="text-lg font-medium text-white">{idea.title}</h2>
        </div>
        <div className="font-mono text-2xl font-bold text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.4)]">
          {idea.opportunityScore ?? 0}/100
        </div>
      </div>

      <p className="mb-5 text-sm leading-relaxed text-white/68">
        {'problem' in idea ? idea.problem : idea.description}
      </p>

      <div className="mb-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <MiniStat label="Buyer" value={idea.buyer} />
        <MiniStat label="Format" value={idea.format} />
        <MiniStat label="Price" value={idea.priceRange} />
        <MiniStat label="Why now" value={idea.whyNow} />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          onClick={() => onCreate(idea)}
          className="flex-1 bg-primary/90 text-primary-foreground shadow-[0_0_0_rgba(var(--primary),0)] transition-all duration-300 group-hover:bg-primary group-hover:shadow-[0_0_24px_-6px_rgba(var(--primary),0.65)]"
        >
          Create this product
          <ArrowRight className="h-4 w-4" />
        </Button>
        {'problem' in idea && onSave ? (
          <Button
            type="button"
            variant="outline"
            disabled={isSaving || isSaved}
            onClick={() => onSave(idea)}
            className="border-white/10 bg-white/[0.02] text-white/90 transition-all duration-300 hover:bg-white/10 group-hover:border-primary/25 group-hover:bg-primary/[0.08] group-hover:text-white"
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
    <div className="flex flex-col justify-center rounded-md border border-white/5 bg-black/20 px-3 py-2 backdrop-blur-md">
      <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.2em] text-white/40">{label}</p>
      <p className="text-sm font-medium text-white/90">{value || 'Not set'}</p>
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
    <div className="mx-auto flex h-full max-w-7xl flex-col p-4 pb-24 sm:p-6 lg:p-8 lg:pb-8">
      <div className="mb-6 flex flex-col gap-3 lg:mb-8">
        <div>
          <h1 className="mb-2 text-2xl font-medium text-white sm:text-3xl">
            Find an idea worth building
          </h1>
          <p className="text-base text-white/65 lg:text-lg">
            Scout fresh opportunities or reopen saved ideas, then move directly into the guided build flow.
          </p>
        </div>
      </div>

      {activeSession?.selected_idea ? (
        <div className="mb-6 flex items-center justify-between rounded-lg border border-white/10 border-l-4 border-l-primary bg-primary/5 px-4 py-3 backdrop-blur-md">
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

      <form onSubmit={handleScan} className="mb-4 flex flex-col gap-3 lg:mb-5 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="Search a niche, buyer problem, or market..."
            className="h-14 w-full rounded-xl border-white/10 bg-black/40 pl-12 text-lg shadow-inner transition-colors focus-visible:border-primary/50 focus-visible:ring-1 focus-visible:ring-primary/50"
          />
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="h-14 flex-1 gap-2 border-white/10 bg-black/30 px-4 text-white/80 backdrop-blur-md hover:bg-white/5 hover:text-white sm:flex-none lg:px-6"
          >
            <SlidersHorizontal className="h-5 w-5" />
            <span className="hidden sm:inline">Filters</span>
          </Button>
          <Button
            type="submit"
            size="lg"
            disabled={isScanning}
            className="h-14 flex-1 px-8 font-bold tracking-wide shadow-[0_0_15px_-3px_rgba(var(--primary),0.3)] hover:shadow-[0_0_20px_-3px_rgba(var(--primary),0.5)] sm:flex-none"
          >
            {isScanning ? <InlineSpinner label="Scanning" /> : 'Scan market'}
          </Button>
        </div>
      </form>

      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        {starterTopics.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTopic(value)}
            className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          >
            {value}
          </button>
        ))}
      </div>

      <div className="mb-5 space-y-3">
        {error ? <WorkflowNotice tone="error">{error}</WorkflowNotice> : null}
        {notice ? <WorkflowNotice>{notice}</WorkflowNotice> : null}
        {saveMessage ? <WorkflowNotice tone="success">{saveMessage}</WorkflowNotice> : null}
      </div>

      {scan ? (
        <section className="mb-8">
          <div className="mb-4 flex flex-col gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-md sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-primary/20 bg-primary/10 text-primary">
                  Scout
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
            <h2 className="text-lg font-medium text-white">Saved ideas</h2>
            <p className="text-sm text-white/60">Use existing research as the starting point for Create.</p>
          </div>
          <Badge variant="outline" className="border-white/10 bg-white/5 text-white/70">
            {savedIdeas.length} saved
          </Badge>
        </div>

        {isLoadingIdeas ? (
          <Card className="border-white/10 bg-white/[0.03] p-8 text-center text-sm text-white/60 backdrop-blur-md">
            Loading saved ideas...
          </Card>
        ) : savedIdeas.length === 0 ? (
          <Card className="border-white/10 bg-white/[0.03] p-8 text-center backdrop-blur-md">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Lightbulb className="h-6 w-6 text-primary" />
            </div>
            <h2 className="mb-2 text-lg font-medium text-white">No saved ideas yet</h2>
            <p className="mx-auto max-w-lg text-sm leading-relaxed text-white/60">
              Run a Scout scan above, save the ideas you want to keep, then reopen them here to start the guided build.
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
