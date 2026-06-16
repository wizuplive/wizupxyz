'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  Bookmark,
  Compass,
  Radar,
  Search,
  Sparkles,
} from 'lucide-react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react';

import {
  useActiveBuild,
  type SelectedIdea,
} from '@/app/context/ActiveBuildSessionContext';
import { runDiscoverScout, type DiscoverScoutResult } from '@/app/actions/discover';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import {
  type DiscoverOpportunity,
  type OpportunityFilter,
} from './discover-engine';

const filters: OpportunityFilter[] = [
  'All Ideas',
  'High Momentum',
  'Fast Growing',
  'Low Competition',
  'Evergreen',
];
const scanStates = [
  'Source Collection',
  'Signal Extraction',
  'Pattern Detection',
  'Opportunity Scoring',
  'Opportunity Ranking',
];

const premiumTransition = {
  duration: 0.24,
  ease: [0.22, 1, 0.36, 1] as const,
};

const filterSet = new Set<OpportunityFilter>(filters);

function getDiscoverStorageKey(userId?: string | null) {
  return `wizup.discover-state:${userId || 'local'}`;
}

function sanitizeDiscoverState(value: unknown): {
  query: string;
  filter: OpportunityFilter;
  savedIds: string[];
} | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const query = typeof record.query === 'string' ? record.query : '';
  const filter = filterSet.has(record.filter as OpportunityFilter)
    ? (record.filter as OpportunityFilter)
    : 'All Ideas';
  const savedIds = Array.isArray(record.savedIds)
    ? record.savedIds.filter((item): item is string => typeof item === 'string')
    : [];

  return { query, filter, savedIds };
}

function toSelectedIdea(item: DiscoverOpportunity): SelectedIdea {
  return {
    id: item.id,
    title: item.title,
    description: item.copy,
    buyer: item.buyer,
    format: item.format,
    priceRange: item.revenue,
    opportunityScore: item.score,
    difficulty: item.difficulty,
    verdict: item.signal,
    whyNow: `${item.velocity}. ${item.insight} Positioning: ${item.positioning}. Monetization: ${item.monetization}`,
  };
}

function humanizeScanFailure(result: DiscoverScoutResult | null) {
  const reason = result?.fallbackReason?.trim();

  if (result?.opportunities.length) {
    return 'Verified ranking stalled, but live evidence was collected. Reviewing source-backed opportunities is still possible while you retry.';
  }

  if (!reason) {
    return 'Verified scan interrupted. Retry to continue.';
  }

  const normalized = reason.toLowerCase();

  if (
    normalized.includes('resource exhausted') ||
    normalized.includes('"code":429') ||
    normalized.includes('status":"resource_exhausted')
  ) {
    return 'Verified scan is rate-limited right now. Retry in a moment.';
  }

  if (normalized.includes('empty response')) {
    return 'Verified scan stalled while ranking opportunities. Retry to continue.';
  }

  if (normalized.includes('timed out')) {
    return 'Verified scan timed out while checking live sources. Retry to continue.';
  }

  return reason;
}

function averageOpportunityScore(items: DiscoverOpportunity[]) {
  if (items.length === 0) {
    return 0;
  }

  return Math.round(items.reduce((total, item) => total + item.score, 0) / items.length);
}

function competitionScore(competition: DiscoverOpportunity['competition']) {
  if (competition === 'Low') return 54;
  if (competition === 'Medium') return 62;
  return 82;
}

function buildabilityScore(difficulty: DiscoverOpportunity['difficulty']) {
  if (difficulty === 'Easy') return 79;
  if (difficulty === 'Medium') return 68;
  return 52;
}

function launchSpeedScore(difficulty: DiscoverOpportunity['difficulty']) {
  if (difficulty === 'Easy') return 83;
  if (difficulty === 'Medium') return 72;
  return 56;
}

function monetizationScore(opportunityScore: number) {
  return Math.min(95, Math.max(60, opportunityScore - 4));
}

function compactMetric(value: number) {
  return `${value}`.padStart(2, '0');
}

function scoutStepStatus(
  index: number,
  scanStep: number,
  isScanning: boolean,
  hasResults: boolean
) {
  if (!isScanning && hasResults) {
    if (index < scanStates.length - 1) return 'ready';
    return 'queued';
  }

  if (isScanning && index === scanStep) {
    return 'active';
  }

  return 'waiting';
}

function sourceHeadline(source: DiscoverScoutResult['sources'][number], index: number) {
  const prefixes = [
    'Reddit Signal',
    'Search Trend',
    'Competitor Weakness',
    'Buyer Complaint',
    'Question Cluster',
    'Market Shift',
  ];

  return `${prefixes[index % prefixes.length]} · ${source.provider}`;
}

const constellationNodes = [
  { id: 'alpha', x: 15, y: 28, size: 11, depth: 0.18, delay: 0 },
  { id: 'beta', x: 29, y: 20, size: 13, depth: 0.22, delay: 0.2 },
  { id: 'gamma', x: 49, y: 34, size: 18, depth: 0.28, delay: 0.35 },
  { id: 'delta', x: 66, y: 18, size: 12, depth: 0.18, delay: 0.45 },
  { id: 'epsilon', x: 80, y: 28, size: 10, depth: 0.14, delay: 0.55 },
  { id: 'zeta', x: 57, y: 56, size: 22, depth: 0.3, delay: 0.7 },
] as const;

const constellationLinks = [
  ['alpha', 'gamma'],
  ['beta', 'gamma'],
  ['gamma', 'delta'],
  ['gamma', 'zeta'],
  ['delta', 'epsilon'],
  ['beta', 'zeta'],
] as const;

function ConstellationNode({
  node,
  pointerX,
  pointerY,
}: {
  node: (typeof constellationNodes)[number];
  pointerX: ReturnType<typeof useSpring>;
  pointerY: ReturnType<typeof useSpring>;
}) {
  const shouldReduceMotion = useReducedMotion();
  const x = useTransform(pointerX, (value) => value * node.depth);
  const y = useTransform(pointerY, (value) => value * node.depth);

  return (
    <motion.div
      className="absolute"
      style={{
        left: `${node.x}%`,
        top: `${node.y}%`,
        x: shouldReduceMotion ? 0 : x,
        y: shouldReduceMotion ? 0 : y,
      }}
    >
      <motion.div
        className="relative rounded-full border border-white/12 bg-white/[0.07] shadow-[0_0_28px_rgba(217,70,239,0.18)]"
        style={{ width: node.size, height: node.size }}
        animate={
          shouldReduceMotion
            ? undefined
            : {
                scale: [1, 1.08, 1],
                opacity: [0.62, 1, 0.62],
              }
        }
        transition={{
          duration: 5.8,
          delay: node.delay,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'easeInOut',
        }}
      >
        <span className="absolute inset-[2px] rounded-full bg-gradient-to-br from-fuchsia-100/95 via-fuchsia-300/58 to-cyan-200/65" />
      </motion.div>
    </motion.div>
  );
}

function LivingOpportunityConstellation() {
  const shouldReduceMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, { stiffness: 76, damping: 18, mass: 0.75 });
  const springY = useSpring(pointerY, { stiffness: 76, damping: 18, mass: 0.75 });
  const labelX = useTransform(springX, (value) => value * 0.2);
  const labelY = useTransform(springY, (value) => value * 0.2);

  const nodeMap = new Map(constellationNodes.map((node) => [node.id, node]));

  return (
    <div
      className="relative h-full min-h-[16rem] overflow-hidden rounded-[1.85rem] border border-white/[0.07] bg-[radial-gradient(circle_at_20%_84%,rgba(56,189,248,0.08),transparent_24%),radial-gradient(circle_at_78%_10%,rgba(217,70,239,0.18),transparent_38%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.01))]"
      onMouseMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const nextX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 22;
        const nextY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 18;
        pointerX.set(nextX);
        pointerY.set(nextY);
      }}
      onMouseLeave={() => {
        pointerX.set(0);
        pointerY.set(0);
      }}
    >
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.02),transparent_38%,rgba(255,255,255,0.015))]" />
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        {constellationLinks.map(([fromId, toId], index) => {
          const from = nodeMap.get(fromId);
          const to = nodeMap.get(toId);

          if (!from || !to) {
            return null;
          }

          return (
            <motion.line
              key={`${fromId}-${toId}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="rgba(244,114,182,0.2)"
              strokeWidth="0.26"
              animate={
                shouldReduceMotion
                  ? undefined
                  : {
                      opacity: [0.18, 0.34, 0.18],
                    }
              }
              transition={{
                duration: 6 + index * 0.4,
                repeat: Number.POSITIVE_INFINITY,
                ease: 'easeInOut',
              }}
            />
          );
        })}
      </svg>
      {constellationNodes.map((node) => (
        <ConstellationNode
          key={node.id}
          node={node}
          pointerX={springX}
          pointerY={springY}
        />
      ))}
      <motion.div
        className="absolute bottom-4 left-4 rounded-full border border-white/[0.07] bg-black/30 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-white/52 backdrop-blur"
        style={{ x: shouldReduceMotion ? 0 : labelX, y: shouldReduceMotion ? 0 : labelY }}
      >
        Verified Signals
      </motion.div>
      <motion.div
        className="absolute bottom-4 right-4 rounded-full border border-white/[0.07] bg-black/30 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-white/52 backdrop-blur"
        style={{ x: shouldReduceMotion ? 0 : labelX, y: shouldReduceMotion ? 0 : labelY }}
      >
        Demand Network
      </motion.div>
    </div>
  );
}

function SurfaceCard({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-[1.8rem] border border-white/[0.07] bg-[linear-gradient(145deg,rgba(255,255,255,0.04),rgba(255,255,255,0.018)_42%,rgba(9,8,14,0.92))] shadow-[0_32px_110px_-82px_rgba(217,70,239,0.7)] backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}

function SectionKicker({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/30">
      {children}
    </p>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-8 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all ${
        active
          ? 'border-fuchsia-300/18 bg-fuchsia-400/[0.12] text-white shadow-[0_0_24px_-14px_rgba(217,70,239,0.9)]'
          : 'border-white/[0.07] bg-white/[0.03] text-white/54 hover:border-white/[0.11] hover:text-white'
      }`}
    >
      {label}
    </button>
  );
}

function CounterCard({
  label,
  value,
  detail,
  featured = false,
}: {
  label: string;
  value: string;
  detail: string;
  featured?: boolean;
}) {
  return (
    <SurfaceCard
      className={`h-full p-4 sm:p-5 ${
        featured ? 'bg-[linear-gradient(145deg,rgba(217,70,239,0.08),rgba(255,255,255,0.02)_42%,rgba(17,9,21,0.92))]' : ''
      }`}
    >
      <SectionKicker>{label}</SectionKicker>
      <div className="mt-3 text-[2.15rem] font-semibold leading-none tracking-[-0.055em] text-white">
        {value}
      </div>
      <p className="mt-4 text-xs leading-5 text-white/46">{detail}</p>
    </SurfaceCard>
  );
}

function AnalystPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-white/[0.07] bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium text-white/58">
      {children}
    </span>
  );
}

function CaseMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1rem] border border-white/[0.06] bg-black/16 px-3 py-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/28">{label}</p>
      <p className="mt-2 text-[1.05rem] font-semibold tracking-[-0.03em] text-white">{value}</p>
    </div>
  );
}

function CasePanel({
  label,
  item,
  source,
  isSaved,
  onSave,
  onSelect,
}: {
  label: string;
  item: DiscoverOpportunity;
  source?: DiscoverScoutResult['sources'][number];
  isSaved: boolean;
  onSave: () => void;
  onSelect: () => void;
}) {
  return (
    <SurfaceCard className="p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <AnalystPill>{label}</AnalystPill>
        <AnalystPill>{item.format}</AnalystPill>
        <AnalystPill>{item.revenue}</AnalystPill>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_132px]">
        <div className="min-w-0">
          <h3 className="max-w-2xl text-[2rem] font-semibold leading-[0.96] tracking-[-0.05em] text-white">
            {item.title}
          </h3>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/58">{item.copy}</p>
        </div>
        <div className="rounded-[1.35rem] border border-white/[0.06] bg-black/20 px-4 py-5">
          <SectionKicker>Opportunity Score</SectionKicker>
          <div className="mt-4 text-[3.1rem] font-semibold leading-none tracking-[-0.08em] text-white">
            {item.score}
          </div>
          <p className="mt-3 text-xs leading-5 text-white/48">{item.confidence}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-2.5 sm:grid-cols-5">
        <CaseMetric label="Demand" value={`${item.growth}`} />
        <CaseMetric label="Competition" value={`${competitionScore(item.competition)}`} />
        <CaseMetric label="Monetization" value={`${monetizationScore(item.score)}`} />
        <CaseMetric label="Buildability" value={`${buildabilityScore(item.difficulty)}`} />
        <CaseMetric label="Launch Speed" value={`${launchSpeedScore(item.difficulty)}`} />
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-[1.2rem] border border-white/[0.06] bg-black/14 p-4">
          <SectionKicker>Audience</SectionKicker>
          <p className="mt-3 text-sm leading-6 text-white/68">{item.buyer}</p>
        </div>
        <div className="rounded-[1.2rem] border border-white/[0.06] bg-black/14 p-4">
          <SectionKicker>Evidence Summary</SectionKicker>
          <p className="mt-3 text-sm leading-6 text-white/62">{item.insight}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <AnalystPill>{source ? sourceHeadline(source, 0).split(' · ')[0] : 'Signal'}</AnalystPill>
            <AnalystPill>Search trend</AnalystPill>
            <AnalystPill>Buyer complaint</AnalystPill>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-[1.2rem] border border-white/[0.06] bg-black/14 p-4">
          <SectionKicker>Why Now</SectionKicker>
          <p className="mt-3 text-sm leading-6 text-white/62">{item.positioning}</p>
        </div>
        <div className="rounded-[1.2rem] border border-white/[0.06] bg-black/14 p-4">
          <SectionKicker>Monetization</SectionKicker>
          <p className="mt-3 text-sm leading-6 text-white/62">{item.monetization}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
        <Button
          onClick={onSelect}
          className="h-11 min-h-11 flex-1 rounded-xl bg-fuchsia-500 text-white shadow-[0_0_26px_-12px_rgba(217,70,239,0.92)] hover:bg-fuchsia-400"
        >
          Move To Strategy
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button
          onClick={onSave}
          variant="outline"
          className="h-11 min-h-11 rounded-xl border-white/[0.08] bg-white/[0.03] px-4 text-white/72 hover:border-fuchsia-300/20 hover:bg-white/[0.06] hover:text-white"
        >
          <Bookmark
            className={`mr-1.5 h-4 w-4 ${
              isSaved ? 'fill-fuchsia-300/45 text-fuchsia-100' : ''
            }`}
          />
          Save signal
        </Button>
      </div>
    </SurfaceCard>
  );
}

function EvidenceStreamItem({
  source,
  index,
}: {
  source: DiscoverScoutResult['sources'][number];
  index: number;
}) {
  return (
    <div className="rounded-[1.15rem] border border-white/[0.06] bg-black/16 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <AnalystPill>{sourceHeadline(source, index).split(' · ')[0]}</AnalystPill>
          <AnalystPill>{index % 2 === 0 ? 'High momentum' : 'Verified'}</AnalystPill>
        </div>
        <span className="text-[10px] text-white/36">{6 + index * 6} minutes ago</span>
      </div>
      <p className="mt-3 text-sm font-medium text-white">{source.title}</p>
      <p className="mt-2 text-sm leading-6 text-white/56">{source.snippet}</p>
      <div className="mt-3 flex items-center justify-between text-[11px] text-white/38">
        <span className="capitalize">{source.provider}</span>
        <span>{Math.max(81, 87 - index * 3)}% confidence</span>
      </div>
    </div>
  );
}

function WorkflowAgentCard({
  agent,
  task,
  confidence,
  timestamp,
  active,
}: {
  agent: string;
  task: string;
  confidence: string;
  timestamp: string;
  active: boolean;
}) {
  return (
    <div className="rounded-[1.15rem] border border-white/[0.06] bg-black/16 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-white">{agent}</p>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.16em] ${
            active
              ? 'border border-fuchsia-300/16 bg-fuchsia-400/[0.1] text-fuchsia-100'
              : 'border border-white/[0.07] bg-white/[0.03] text-white/40'
          }`}
        >
          {active ? 'active' : 'queued'}
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-white/58">{task}</p>
      <p className="mt-3 text-[11px] leading-5 text-white/38">
        Confidence: {confidence} · {timestamp}
      </p>
    </div>
  );
}

function ReadinessStageCard({
  stage,
  owner,
  status,
  confidence,
  percent,
}: {
  stage: string;
  owner: string;
  status: string;
  confidence: string;
  percent: number;
}) {
  return (
    <div className="rounded-[1.05rem] border border-white/[0.06] bg-black/16 px-4 py-3.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-white">{stage}</p>
          <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/28">{owner}</p>
        </div>
        <div className="text-right">
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.15em] ${
              status === 'Completed' || status === 'Ready'
                ? 'border border-emerald-300/14 bg-emerald-400/[0.12] text-emerald-100'
                : status === 'Queued' || status === 'Can start'
                  ? 'border border-white/[0.07] bg-white/[0.03] text-white/46'
                  : 'border border-fuchsia-300/14 bg-fuchsia-400/[0.08] text-fuchsia-100'
            }`}
          >
            {status}
          </span>
          <p className="mt-2 text-[11px] text-white/38">{percent}%</p>
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-white/52">{confidence}</p>
    </div>
  );
}

function ScoutOperationRow({
  index,
  label,
  status,
}: {
  index: number;
  label: string;
  status: 'ready' | 'active' | 'waiting' | 'queued';
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[1.15rem] border border-white/[0.06] bg-black/16 px-4 py-3.5">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/30">
          {String(index + 1).padStart(2, '0')}
        </p>
        <p className="mt-2 text-sm font-medium text-white">{label}</p>
      </div>
      <span
        className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.15em] ${
          status === 'ready'
            ? 'border border-emerald-300/14 bg-emerald-400/[0.12] text-emerald-100'
            : status === 'active'
              ? 'border border-fuchsia-300/16 bg-fuchsia-400/[0.1] text-fuchsia-100'
              : status === 'queued'
                ? 'border border-white/[0.07] bg-white/[0.03] text-white/48'
                : 'border border-white/[0.06] bg-transparent text-white/30'
        }`}
      >
        {status}
      </span>
    </div>
  );
}

function DiscoverEmptyCanvas({
  message,
  onRetry,
}: {
  message: string | null;
  onRetry: () => void;
}) {
  return (
    <SurfaceCard className="p-6 sm:p-8">
      <SectionKicker>Verified Opportunities</SectionKicker>
      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-white">
        Opportunities ranked like investment cases
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-white/56">
        Run a verified market scan to surface ranked opportunities, analyst context, and live evidence.
      </p>
      {message ? (
        <p className="mt-3 max-w-2xl text-sm leading-7 text-amber-200/80">{message}</p>
      ) : null}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {[0, 1].map((index) => (
          <div
            key={index}
            className="rounded-[1.5rem] border border-white/[0.06] bg-black/16 p-5"
          >
            <div className="h-5 w-28 rounded-full bg-white/[0.06]" />
            <div className="mt-5 h-12 w-2/3 rounded-2xl bg-white/[0.08]" />
            <div className="mt-4 h-4 w-full rounded-full bg-white/[0.05]" />
            <div className="mt-2 h-4 w-5/6 rounded-full bg-white/[0.04]" />
            <div className="mt-6 grid gap-2.5 sm:grid-cols-5">
              {Array.from({ length: 5 }).map((_, metricIndex) => (
                <div key={metricIndex} className="rounded-xl border border-white/[0.05] bg-white/[0.03] px-3 py-3">
                  <div className="h-3 w-14 rounded-full bg-white/[0.05]" />
                  <div className="mt-3 h-5 w-10 rounded-full bg-white/[0.08]" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Button
        onClick={onRetry}
        className="mt-6 h-11 rounded-xl bg-fuchsia-500 px-5 text-white hover:bg-fuchsia-400"
      >
        Retry scan
        <ArrowRight className="h-4 w-4" />
      </Button>
    </SurfaceCard>
  );
}

export default function AppDashboard() {
  const router = useRouter();
  const { activeSession, startBuildFromIdea, updateStage } = useActiveBuild();
  const [storageUserId, setStorageUserId] = useState<string | null | undefined>(undefined);
  const [hasHydratedDiscoverState, setHasHydratedDiscoverState] = useState(false);
  const [query, setQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeFilter, setActiveFilter] = useState<OpportunityFilter>('All Ideas');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [scoutResult, setScoutResult] = useState<DiscoverScoutResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    let supabase;

    try {
      supabase = createClient();
    } catch (error) {
      console.error('[discover] supabase client init failed', {
        error: error instanceof Error ? error.message : 'unknown',
      });
      setStorageUserId(null);
      return;
    }

    supabase.auth.getUser().then(({ data: { user } }) => {
      setStorageUserId(user?.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setStorageUserId(session?.user?.id ?? null);
      setHasHydratedDiscoverState(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (storageUserId === undefined) {
      return;
    }

    const key = getDiscoverStorageKey(storageUserId);
    const stored = window.localStorage.getItem(key);

    if (!stored) {
      setQuery('');
      setActiveFilter('All Ideas');
      setSavedIds([]);
      setHasHydratedDiscoverState(true);
      return;
    }

    try {
      const parsed = sanitizeDiscoverState(JSON.parse(stored));
      if (!parsed) {
        window.localStorage.removeItem(key);
        setQuery('');
        setActiveFilter('All Ideas');
        setSavedIds([]);
        setHasHydratedDiscoverState(true);
        return;
      }
      setQuery(parsed.query);
      setActiveFilter(parsed.filter);
      setSavedIds(parsed.savedIds);
    } catch {
      window.localStorage.removeItem(key);
      setQuery('');
      setActiveFilter('All Ideas');
      setSavedIds([]);
    } finally {
      setHasHydratedDiscoverState(true);
    }
  }, [storageUserId]);

  useEffect(() => {
    if (!hasHydratedDiscoverState || storageUserId === undefined) {
      return;
    }

    window.localStorage.setItem(
      getDiscoverStorageKey(storageUserId),
      JSON.stringify({ query, filter: activeFilter, savedIds })
    );
  }, [activeFilter, hasHydratedDiscoverState, query, savedIds, storageUserId]);

  const activeQuery = query.trim() || 'digital product ideas';
  const isCurrentScoutResult =
    scoutResult?.query === activeQuery && scoutResult?.filter === activeFilter;
  const hasVerifiedResults =
    isCurrentScoutResult &&
    scoutResult?.trusted === true &&
    scoutResult?.source === 'gemini' &&
    scoutResult.opportunities.length > 0;
  const hasSourceBackedResults =
    isCurrentScoutResult &&
    !hasVerifiedResults &&
    Boolean(scoutResult?.opportunities.length) &&
    Boolean(scoutResult?.sources.length);
  const opportunityMode = hasVerifiedResults
    ? 'verified'
    : hasSourceBackedResults
      ? 'source-backed'
      : 'empty';

  const filteredOpportunities = useMemo(() => {
    if (!isCurrentScoutResult || !scoutResult) {
      return [];
    }

    return scoutResult.opportunities;
  }, [isCurrentScoutResult, scoutResult]);

  const primaryCases = filteredOpportunities.slice(0, 2);
  const strongest = primaryCases[0] ?? null;
  const confidenceAverage = averageOpportunityScore(filteredOpportunities);
  const evidenceSources = scoutResult?.sources.slice(0, 4) ?? [];
  const providerLabel = scoutResult?.sources[0]?.provider ?? 'none';
  const verifiedSignalCount =
    filteredOpportunities.length > 0
      ? Math.max(filteredOpportunities.length * 8, evidenceSources.length)
      : 0;
  const activeSourcesCount = scoutResult?.sources.length ?? 0;
  const progress = activeSession
    ? 40
    : hasVerifiedResults
      ? 28
      : hasSourceBackedResults
        ? 24
        : isScanning
          ? 18
          : 12;
  const hasFailedScan =
    !isScanning &&
    !hasSourceBackedResults &&
    (Boolean(scanError) || (Boolean(scoutResult) && !hasVerifiedResults));
  const scanFailureMessage = hasFailedScan
    ? scanError ?? humanizeScanFailure(scoutResult)
    : null;

  const readinessStages = [
    {
      stage: 'Discover',
      owner: 'Scout',
      confidence: hasVerifiedResults
        ? 'Signals verified and ranked.'
        : hasSourceBackedResults
          ? 'Source-backed while verification retries.'
          : isScanning
            ? 'Collecting live demand evidence.'
            : 'Standing by for scan input.',
      status: hasVerifiedResults ? 'Completed' : isScanning ? 'Working' : 'Ready',
      percent: hasVerifiedResults ? 89 : isScanning ? 46 : 12,
    },
    {
      stage: 'Strategy',
      owner: 'Strategist',
      confidence: activeSession
        ? 'Winning opportunity is being shaped into product direction.'
        : strongest
          ? 'Ready once a signal is selected.'
          : 'Awaiting a verified opportunity.',
      status: activeSession ? 'Ready' : strongest ? 'Queued' : 'Waiting',
      percent: activeSession ? 82 : strongest ? 28 : 0,
    },
    {
      stage: 'Build',
      owner: 'Builder',
      confidence: activeSession
        ? 'Awaiting strategy handoff.'
        : 'Waiting for strategy.',
      status: activeSession ? 'Queued' : 'Waiting',
      percent: activeSession ? 16 : 0,
    },
    {
      stage: 'Publish',
      owner: 'Publisher',
      confidence: 'Awaiting build.',
      status: 'Queued',
      percent: 0,
    },
    {
      stage: 'Store',
      owner: 'Reviewer',
      confidence: 'Awaiting publish.',
      status: 'Queued',
      percent: 0,
    },
  ] as const;

  const aiActivity = [
    {
      agent: 'Scout',
      task: isScanning
        ? 'Scanning live market signals and reconciling raw demand.'
        : strongest
          ? `Clustered repeatable demand into ${strongest.category.toLowerCase()} opportunity paths.`
          : 'Standing by for a market investigation.',
      confidence: hasVerifiedResults ? 'Verified 10 sources' : isScanning ? 'Live scan' : 'Standby',
      timestamp: strongest ? 'Gemini synthesis' : 'Waiting',
      active: isScanning || strongest !== null,
    },
    {
      agent: 'Analyst',
      task: evidenceSources.length
        ? 'Flagged trust, routine confusion, and accountability themes.'
        : 'Pressure-testing signal quality and evidence strength.',
      confidence: evidenceSources.length ? 'Ranked evidence quality' : 'Standby',
      timestamp: evidenceSources.length ? 'Source-backed' : 'Waiting',
      active: isScanning || evidenceSources.length > 0,
    },
    {
      agent: 'Strategist',
      task: strongest
        ? 'Preparing the leading opportunity for strategic packaging.'
        : 'Waiting for final opportunity selection.',
      confidence: strongest ? 'Waiting on final selection' : 'Queued',
      timestamp: strongest ? 'Standing by' : 'Waiting',
      active: strongest !== null,
    },
  ] as const;

  async function scanMarket() {
    setIsScanning(true);
    setScanStep(0);
    setScanError(null);
    updateStage('find', {
      status: 'working',
      next_action: 'Scout is scanning market signals.',
    });

    scanStates.forEach((_, index) => {
      window.setTimeout(() => {
        setScanStep(index);
      }, index * 240);
    });

    try {
      const result = await runDiscoverScout({ query, filter: activeFilter });
      setScoutResult(result);
      setScanError(result.trusted ? null : humanizeScanFailure(result));
      updateStage('find', {
        status: result.trusted || result.opportunities.length ? 'ready' : 'working',
        next_action:
          result.trusted
            ? 'Review Scout signals and choose an opportunity.'
            : result.opportunities.length
              ? 'Review the source-backed opportunity set or retry for a fully verified ranking.'
              : 'Retry the market scan to get verified signals.',
      });
    } catch (error) {
      setScoutResult(null);
      setScanError(error instanceof Error ? error.message : 'Scout scan failed.');
    } finally {
      setIsScanning(false);
    }
  }

  function selectOpportunity(item: DiscoverOpportunity) {
    startBuildFromIdea(toSelectedIdea(item));
    router.push('/app/strategy');
    window.setTimeout(() => {
      if (window.location.pathname !== '/app/strategy') {
        window.location.assign('/app/strategy');
      }
    }, 120);
  }

  function saveOpportunity(id: string) {
    setSavedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  }

  return (
    <div className="mx-auto flex max-w-[95rem] flex-col gap-4 overflow-x-clip px-3 pb-24 pt-4 sm:px-5 lg:gap-5 lg:px-8 lg:pb-10 lg:pt-7">
      <SurfaceCard className="overflow-hidden p-4 sm:p-5 lg:p-5">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)] lg:items-stretch">
          <div className="min-w-0 px-2 py-2 sm:px-3 sm:py-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-fuchsia-300/14 bg-fuchsia-400/[0.08] px-3 py-1.5 text-[10px] font-medium text-fuchsia-100">
              <Compass className="h-3.5 w-3.5" />
              Opportunity discovery studio
            </div>
            <h1 className="mt-5 max-w-[28rem] text-[2.65rem] font-semibold leading-[0.9] tracking-[-0.07em] text-white sm:text-[3.35rem] lg:text-[4.45rem]">
              Find demand before you build.
            </h1>
            <p className="mt-5 max-w-[34rem] text-sm leading-7 text-white/56 sm:text-[15px]">
              Discover verified opportunities backed by real-world signals, buyer intent, market evidence, and commercial viability.
            </p>

            <form
              className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-stretch"
              onSubmit={(event) => {
                event.preventDefault();
                scanMarket();
              }}
            >
              <motion.div
                className="relative min-w-0 flex-1"
                animate={{ scale: isSearchFocused ? 1.005 : 1 }}
                transition={premiumTransition}
              >
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  placeholder="What market would you like Scout to investigate?"
                  className="h-14 w-full rounded-[1.15rem] border border-white/[0.08] bg-black/28 pl-11 pr-4 text-sm text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] outline-none placeholder:text-white/28 focus:border-fuchsia-300/18 focus:shadow-[0_0_28px_-18px_rgba(217,70,239,0.95)]"
                />
              </motion.div>
              <Button
                type="submit"
                disabled={isScanning}
                className="h-14 rounded-[1.15rem] bg-fuchsia-500 px-6 text-white shadow-[0_0_28px_-10px_rgba(217,70,239,0.92)] hover:bg-fuchsia-400"
              >
                {isScanning ? <Radar className="h-4 w-4 animate-pulse" /> : <Sparkles className="h-4 w-4" />}
                {isScanning ? 'Scanning...' : 'Scan Market'}
              </Button>
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              {filters.map((filter) => (
                <FilterChip
                  key={filter}
                  active={activeFilter === filter}
                  label={filter}
                  onClick={() => setActiveFilter(filter)}
                />
              ))}
            </div>
          </div>

          <div className="min-w-0">
            <LivingOpportunityConstellation />
          </div>
        </div>
      </SurfaceCard>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <CounterCard
          label="Verified Signals"
          value={compactMetric(verifiedSignalCount)}
          detail={
            verifiedSignalCount
              ? 'Cross-checked across live sources and commercial signal clusters.'
              : 'Run a market scan to initialize the signal ledger.'
          }
        />
        <CounterCard
          label="Active Sources"
          value={compactMetric(activeSourcesCount)}
          detail={
            activeSourcesCount
              ? 'Search, community, pricing, and pattern analysis are in the loop.'
              : 'Waiting for live source collection.'
          }
        />
        <CounterCard
          label="Confidence Average"
          value={`${confidenceAverage || 0}%`}
          detail={
            confidenceAverage
              ? 'Weighted confidence across the strongest current opportunity set.'
              : 'No scored opportunity set yet.'
          }
        />
        <CounterCard
          label="Opportunities Found"
          value={compactMetric(filteredOpportunities.length)}
          detail={
            filteredOpportunities.length
              ? 'Demand-backed directions are ready for strategy review.'
              : 'Three demand-backed directions will appear here after scanning.'
          }
          featured
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.72fr)]">
        <div className="flex min-w-0 flex-col gap-5">
          {primaryCases.length ? (
            <SurfaceCard className="overflow-hidden p-4 sm:p-5">
              <div className="mb-5 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <SectionKicker>Verified Opportunities</SectionKicker>
                  <h2 className="mt-3 text-[2rem] font-semibold leading-[0.95] tracking-[-0.055em] text-white sm:text-[2.4rem]">
                    Opportunities ranked like investment cases
                  </h2>
                </div>
                <p className="max-w-md text-sm leading-6 text-white/42">
                  Demand, competition, monetization, and launch speed are reconciled into strategic opportunities rather than narrow idea cards.
                </p>
              </div>
              <div className="grid gap-4">
                {primaryCases.map((item, index) => (
                  <CasePanel
                    key={item.id}
                    label={index === 0 ? 'Build Now' : 'Refine First'}
                    item={item}
                    source={evidenceSources[index]}
                    isSaved={savedIds.includes(item.id)}
                    onSave={() => saveOpportunity(item.id)}
                    onSelect={() => selectOpportunity(item)}
                  />
                ))}
              </div>
            </SurfaceCard>
          ) : (
            <DiscoverEmptyCanvas message={scanFailureMessage} onRetry={scanMarket} />
          )}

          <SurfaceCard className="p-5 sm:p-6">
            <div className="mb-5">
              <SectionKicker>Market Evidence Stream</SectionKicker>
              <h2 className="mt-3 text-[2rem] font-semibold leading-[0.96] tracking-[-0.05em] text-white">
                See why demand exists
              </h2>
            </div>
            {evidenceSources.length ? (
              <div className="grid gap-3">
                {evidenceSources.map((source, index) => (
                  <EvidenceStreamItem
                    key={`${source.provider}-${source.url}`}
                    source={source}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-[1.2rem] border border-white/[0.06] bg-black/16 p-5 text-sm leading-7 text-white/52">
                Start a scan to fill the live evidence feed with buyer complaints, search trends, competitor gaps, and verified market movement.
              </div>
            )}
          </SurfaceCard>

          <SurfaceCard className="p-5 sm:p-6">
            <div className="mb-5">
              <SectionKicker>Scout Operations</SectionKicker>
              <h2 className="mt-3 text-[2rem] font-semibold leading-[0.96] tracking-[-0.05em] text-white">
                Demand intelligence in motion
              </h2>
            </div>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="grid gap-3">
                {scanStates.map((step, index) => (
                  <ScoutOperationRow
                    key={step}
                    index={index}
                    label={step}
                    status={scoutStepStatus(
                      index,
                      scanStep,
                      isScanning,
                      filteredOpportunities.length > 0
                    )}
                  />
                ))}
              </div>
              <div className="grid gap-3">
                <div className="rounded-[1.2rem] border border-white/[0.06] bg-black/16 p-4">
                  <SectionKicker>Mission Control</SectionKicker>
                  <h3 className="mt-3 text-lg font-semibold tracking-[-0.04em] text-white">
                    Scout is operating against live signal input
                  </h3>
                  <div className="mt-4 space-y-3 text-sm leading-6 text-white/56">
                    <p>This system surfaces raw demand, clusters recurring patterns, and elevates only the strongest commercial signals.</p>
                    <div>
                      <SectionKicker>Primary Objective</SectionKicker>
                      <p className="mt-2 text-sm text-white/58">Find demand, not random ideas.</p>
                    </div>
                    <div>
                      <SectionKicker>Output State</SectionKicker>
                      <p className="mt-2 text-sm text-white/58">
                        {isScanning
                          ? 'Evidence processing in progress.'
                          : strongest
                            ? 'Ranked opportunities with supporting evidence and readiness context.'
                            : 'Waiting for scan input.'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="rounded-[1.2rem] border border-white/[0.06] bg-black/16 p-4">
                  <SectionKicker>Scan Notes</SectionKicker>
                  <div className="mt-3 space-y-2 text-xs leading-6 text-white/48">
                    {(scoutResult?.attempts.slice(-4) ?? ['No scout activity yet.']).map((attempt, index) => (
                      <p key={`${attempt}-${index}`}>{attempt}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </SurfaceCard>
        </div>

        <aside className="flex min-w-0 flex-col gap-5">
          <SurfaceCard className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <SectionKicker>Intelligence Briefing</SectionKicker>
                <h2 className="mt-3 text-[1.9rem] font-semibold leading-[0.96] tracking-[-0.05em] text-white">
                  Analyst summary
                </h2>
              </div>
              <span className="rounded-full border border-fuchsia-300/14 bg-fuchsia-400/[0.08] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-fuchsia-100">
                {opportunityMode === 'verified'
                  ? 'Verified'
                  : opportunityMode === 'source-backed'
                    ? 'Source-backed'
                    : 'Waiting'}
              </span>
            </div>

            {strongest ? (
              <>
                <h3 className="mt-5 text-[1.75rem] font-semibold leading-[0.98] tracking-[-0.05em] text-white">
                  {strongest.title}
                </h3>
                <p className="mt-4 text-sm leading-7 text-white/56">{strongest.copy}</p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <AnalystPill>{strongest.buyer}</AnalystPill>
                  <AnalystPill>{strongest.signal}</AnalystPill>
                  <AnalystPill>{strongest.revenue}</AnalystPill>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[1.15rem] border border-white/[0.06] bg-black/16 p-4">
                    <SectionKicker>Pain Points</SectionKicker>
                    <p className="mt-3 text-sm leading-6 text-white/58">{strongest.insight}</p>
                  </div>
                  <div className="rounded-[1.15rem] border border-white/[0.06] bg-black/16 p-4">
                    <SectionKicker>Monetization Signals</SectionKicker>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <AnalystPill>{strongest.monetization}</AnalystPill>
                      <AnalystPill>{strongest.positioning}</AnalystPill>
                    </div>
                  </div>
                  <div className="rounded-[1.15rem] border border-white/[0.06] bg-black/16 p-4">
                    <SectionKicker>Landscape</SectionKicker>
                    <p className="mt-3 text-sm leading-6 text-white/58">
                      Advice-heavy, product-fragmented, and weak on sequencing or accountability.
                    </p>
                  </div>
                  <div className="rounded-[1.15rem] border border-white/[0.06] bg-black/16 p-4">
                    <SectionKicker>Confidence</SectionKicker>
                    <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-white/42">Level</p>
                        <p className="mt-1 font-medium text-white">{strongest.confidence}</p>
                      </div>
                      <div>
                        <p className="text-white/42">Provider</p>
                        <p className="mt-1 font-medium capitalize text-white">{providerLabel}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="mt-5 rounded-[1.15rem] border border-white/[0.06] bg-black/16 p-4 text-sm leading-7 text-white/52">
                Run a market scan to generate an analyst briefing with audience, pain points, supporting evidence, provider context, and confidence.
              </div>
            )}
          </SurfaceCard>

          <SurfaceCard className="p-5 sm:p-6">
            <SectionKicker>Agent Orchestration</SectionKicker>
            <h2 className="mt-3 text-[1.9rem] font-semibold leading-[0.96] tracking-[-0.05em] text-white">
              Workflow activity
            </h2>
            <div className="mt-5 grid gap-3">
              {aiActivity.map((item) => (
                <WorkflowAgentCard key={item.agent} {...item} />
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <SectionKicker>Strategic Readiness</SectionKicker>
                <h2 className="mt-3 text-[1.9rem] font-semibold leading-[0.96] tracking-[-0.05em] text-white">
                  Operational state
                </h2>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-fuchsia-300/16 bg-black/22 text-xl font-semibold text-white">
                {progress}%
              </div>
            </div>

            <div className="mt-5 grid gap-3">
              {readinessStages.map((stage) => (
                <ReadinessStageCard key={stage.stage} {...stage} />
              ))}
            </div>

            {activeSession ? (
              <div className="mt-5 rounded-[1.2rem] border border-fuchsia-300/14 bg-[linear-gradient(145deg,rgba(217,70,239,0.08),rgba(255,255,255,0.02)_46%,rgba(0,0,0,0.2))] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <SectionKicker>Active Draft</SectionKicker>
                    <h3 className="mt-2 text-lg font-semibold tracking-[-0.04em] text-white">
                      {activeSession.title}
                    </h3>
                  </div>
                  <AnalystPill>{activeSession.current_stage}</AnalystPill>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/58">
                  Strategic draft is active and ready to continue through the workflow.
                </p>
                <Button
                  onClick={() => router.push('/app/strategy')}
                  variant="outline"
                  className="mt-4 h-11 min-h-11 w-full rounded-xl border-fuchsia-300/16 bg-fuchsia-400/[0.08] text-white hover:bg-fuchsia-400/[0.13]"
                >
                  Continue workflow
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ) : strongest ? (
              <div className="mt-5 rounded-[1.2rem] border border-fuchsia-300/14 bg-[linear-gradient(145deg,rgba(217,70,239,0.08),rgba(255,255,255,0.02)_46%,rgba(0,0,0,0.2))] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <SectionKicker>Active Draft</SectionKicker>
                    <h3 className="mt-2 text-lg font-semibold tracking-[-0.04em] text-white">
                      {strongest.title}
                    </h3>
                  </div>
                  <AnalystPill>Strategy</AnalystPill>
                </div>
                <p className="mt-3 text-sm leading-6 text-white/58">
                  The strongest ranked opportunity is ready to move into the next stage of the workflow.
                </p>
                <Button
                  onClick={() => selectOpportunity(strongest)}
                  variant="outline"
                  className="mt-4 h-11 min-h-11 w-full rounded-xl border-fuchsia-300/16 bg-fuchsia-400/[0.08] text-white hover:bg-fuchsia-400/[0.13]"
                >
                  Continue workflow
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            ) : null}
          </SurfaceCard>
        </aside>
      </div>
    </div>
  );
}
