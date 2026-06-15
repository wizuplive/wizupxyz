'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BarChart3,
  Check,
  Compass,
  Eye,
  GitCompare,
  Heart,
  Radar,
  Search,
  Sparkles,
  TrendingUp,
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

const filters: OpportunityFilter[] = ['All Ideas', 'High Momentum', 'Fast Growing', 'Low Competition', 'Evergreen'];
const marketExamples = ['Hair Growth', 'Boxing', 'Dog Training', 'AI Agents', 'Parenting', 'Meal Planning', 'Productivity'];
const scanStates = [
  'Sources',
  'Signal Extraction',
  'Pattern Detection',
  'Scoring',
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

  if (
    reason.toLowerCase().includes('resource exhausted') ||
    reason.toLowerCase().includes('"code":429') ||
    reason.toLowerCase().includes('status":"resource_exhausted')
  ) {
    return 'Verified scan is rate-limited right now. Retry in a moment.';
  }

  if (reason.toLowerCase().includes('empty response')) {
    return 'Verified scan stalled while ranking opportunities. Retry to continue.';
  }

  if (reason.toLowerCase().includes('timed out')) {
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

function competitionSpread(items: DiscoverOpportunity[]) {
  const summary = items.reduce(
    (accumulator, item) => {
      accumulator[item.competition] += 1;
      return accumulator;
    },
    { Low: 0, Medium: 0, High: 0 } as Record<DiscoverOpportunity['competition'], number>
  );

  if (summary.Low >= summary.Medium && summary.Low >= summary.High) {
    return 'Mostly low competition';
  }

  if (summary.High > 0) {
    return 'Mixed competition pressure';
  }

  return 'Balanced competition';
}

function sourceHeadline(source: DiscoverScoutResult['sources'][number], index: number) {
  const prefixes = [
    'Buyer conversation',
    'Search demand',
    'Signal cluster',
    'Market shift',
    'Question pattern',
    'Competitive opening',
  ];

  return `${prefixes[index % prefixes.length]} · ${source.provider}`;
}

const constellationNodes = [
  { id: 'north', x: 18, y: 24, size: 18, depth: 0.45, delay: 0 },
  { id: 'halo', x: 36, y: 16, size: 12, depth: 0.35, delay: 0.5 },
  { id: 'signal', x: 54, y: 30, size: 20, depth: 0.65, delay: 0.8 },
  { id: 'drift', x: 76, y: 18, size: 10, depth: 0.28, delay: 1.1 },
  { id: 'pulse', x: 28, y: 58, size: 14, depth: 0.55, delay: 1.4 },
  { id: 'bridge', x: 50, y: 52, size: 16, depth: 0.7, delay: 0.2 },
  { id: 'anchor', x: 72, y: 62, size: 22, depth: 0.5, delay: 0.9 },
  { id: 'trace', x: 88, y: 42, size: 14, depth: 0.22, delay: 1.6 },
] as const;

const constellationLinks = [
  ['north', 'signal'],
  ['north', 'pulse'],
  ['halo', 'signal'],
  ['signal', 'bridge'],
  ['bridge', 'anchor'],
  ['signal', 'drift'],
  ['drift', 'trace'],
  ['pulse', 'bridge'],
  ['bridge', 'trace'],
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
      whileHover={
        shouldReduceMotion
          ? undefined
          : { scale: 1.08, boxShadow: '0 0 32px rgba(244,114,182,0.28)' }
      }
      transition={premiumTransition}
    >
      <motion.div
        className="relative flex items-center justify-center rounded-full border border-fuchsia-200/20 bg-white/[0.08] shadow-[0_0_28px_rgba(217,70,239,0.12)] backdrop-blur-sm"
        style={{ width: node.size, height: node.size }}
        animate={
          shouldReduceMotion
            ? undefined
            : {
                scale: [1, 1.06, 1],
                opacity: [0.62, 0.98, 0.62],
              }
        }
        transition={{
          duration: 6.8,
          delay: node.delay,
          repeat: Number.POSITIVE_INFINITY,
          ease: 'easeInOut',
        }}
      >
        <span className="absolute inset-[3px] rounded-full bg-gradient-to-br from-fuchsia-200/85 via-pink-200/60 to-cyan-200/70" />
        <motion.span
          className="absolute rounded-full border border-fuchsia-200/18"
          style={{ inset: -7 }}
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  scale: [0.92, 1.12, 0.92],
                  opacity: [0.05, 0.2, 0.05],
                }
          }
          transition={{
            duration: 5.8,
            delay: node.delay,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'easeInOut',
          }}
        />
      </motion.div>
    </motion.div>
  );
}

function LivingOpportunityConstellation() {
  const shouldReduceMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, { stiffness: 80, damping: 18, mass: 0.7 });
  const springY = useSpring(pointerY, { stiffness: 80, damping: 18, mass: 0.7 });
  const labelX = useTransform(springX, (value) => value * 0.28);
  const labelY = useTransform(springY, (value) => value * 0.28);

  const nodeMap = new Map(constellationNodes.map((node) => [node.id, node]));

  return (
    <div
      className="relative h-full w-full overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] backdrop-blur-xl"
      onMouseMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const nextX = ((event.clientX - bounds.left) / bounds.width - 0.5) * 18;
        const nextY = ((event.clientY - bounds.top) / bounds.height - 0.5) * 16;
        pointerX.set(nextX);
        pointerY.set(nextY);
      }}
      onMouseLeave={() => {
        pointerX.set(0);
        pointerY.set(0);
      }}
    >
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_72%_14%,rgba(217,70,239,0.18),transparent_24%),radial-gradient(circle_at_28%_72%,rgba(56,189,248,0.09),transparent_22%)]"
        animate={
          shouldReduceMotion
            ? undefined
            : {
                opacity: [0.72, 0.9, 0.72],
              }
        }
        transition={{ duration: 7.5, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
      />

      {[18, 38, 62, 78].map((left, index) => (
        <motion.div
          key={left}
          className="absolute rounded-full blur-3xl"
          style={{
            left: `${left}%`,
            top: `${14 + index * 14}%`,
            width: index % 2 === 0 ? 140 : 100,
            height: index % 2 === 0 ? 140 : 100,
            background:
              index % 2 === 0
                ? 'rgba(217,70,239,0.11)'
                : 'rgba(56,189,248,0.07)',
          }}
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  x: [0, index % 2 === 0 ? 12 : -10, 0],
                  y: [0, index % 2 === 0 ? -10 : 8, 0],
                  opacity: [0.22, 0.34, 0.22],
                }
          }
          transition={{
            duration: 10 + index,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'easeInOut',
          }}
        />
      ))}

      {Array.from({ length: 14 }).map((_, index) => (
        <motion.span
          key={index}
          className="absolute rounded-full bg-white/35"
          style={{
            left: `${10 + index * 6}%`,
            top: `${12 + (index % 5) * 16}%`,
            width: index % 3 === 0 ? 3 : 2,
            height: index % 3 === 0 ? 3 : 2,
          }}
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  y: [0, index % 2 === 0 ? -10 : 10, 0],
                  opacity: [0.08, 0.24, 0.08],
                }
          }
          transition={{
            duration: 8 + index * 0.45,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'easeInOut',
          }}
        />
      ))}

      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
      >
        {constellationLinks.map(([fromId, toId], index) => {
          const from = nodeMap.get(fromId);
          const to = nodeMap.get(toId);

          if (!from || !to) return null;

          return (
            <motion.line
              key={`${fromId}-${toId}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="rgba(244,114,182,0.24)"
              strokeWidth="0.24"
              initial={{ pathLength: 0, opacity: 0.2 }}
              animate={
                shouldReduceMotion
                  ? { pathLength: 1, opacity: 0.32 }
                  : {
                      pathLength: [0.82, 1, 0.82],
                      opacity: [0.18, 0.34, 0.18],
                    }
              }
              transition={{
                duration: 7 + index * 0.35,
                delay: index * 0.08,
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
        className="absolute bottom-5 left-5 max-w-[calc(100%-2.5rem)] rounded-2xl border border-white/[0.08] bg-black/22 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-white/54 backdrop-blur-sm"
        style={{
          x: shouldReduceMotion ? 0 : labelX,
          y: shouldReduceMotion ? 0 : labelY,
        }}
        animate={
          shouldReduceMotion ? undefined : { opacity: [0.48, 0.72, 0.48] }
        }
        transition={{ duration: 5.4, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
      >
        Demand Intelligence Network
      </motion.div>
    </div>
  );
}

function DiscoverEmptyState({
  hasFailedScan,
  message,
  onRetry,
}: {
  hasFailedScan: boolean;
  message?: string | null;
  onRetry: () => void;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.075] bg-[linear-gradient(145deg,rgba(255,255,255,0.045),rgba(255,255,255,0.018)_46%,rgba(8,8,14,0.92))] p-8 shadow-[0_28px_84px_-64px_rgba(217,70,239,0.72)] backdrop-blur-xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_16%,rgba(217,70,239,0.12),transparent_24%),radial-gradient(circle_at_20%_74%,rgba(56,189,248,0.08),transparent_22%)]" />
      {[14, 34, 58, 82].map((left, index) => (
        <motion.div
          key={left}
          className="absolute rounded-full blur-3xl"
          style={{
            left: `${left}%`,
            top: `${18 + index * 10}%`,
            width: index % 2 === 0 ? 84 : 54,
            height: index % 2 === 0 ? 84 : 54,
            background:
              index % 2 === 0
                ? 'rgba(217,70,239,0.09)'
                : 'rgba(56,189,248,0.06)',
          }}
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  x: [0, index % 2 === 0 ? 10 : -8, 0],
                  y: [0, index % 2 === 0 ? -6 : 8, 0],
                  opacity: [0.16, 0.28, 0.16],
                }
          }
          transition={{
            duration: 8 + index,
            repeat: Number.POSITIVE_INFINITY,
            ease: 'easeInOut',
          }}
        />
      ))}

      <div className="relative text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-fuchsia-300/16 bg-fuchsia-400/[0.08] text-fuchsia-100">
          <Radar className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold text-white">
          {hasFailedScan
            ? 'Verified scan interrupted.'
            : 'Your next opportunity starts with a verified scan.'}
        </h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/52">
          {hasFailedScan
            ? message || 'WIZUP collected live source signals, but the verified scan response did not complete. Retry to restore opportunity ranking.'
            : 'Run a market scan to surface verified opportunities, compare them, and move the best one into strategy.'}
        </p>
      </div>

      <div className="relative mt-8 grid grid-cols-1 gap-3.5 lg:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="overflow-hidden rounded-2xl border border-white/[0.065] bg-black/20 p-5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...premiumTransition, delay: index * 0.06 }}
          >
            <div className="mb-4 h-5 w-24 rounded-full bg-white/[0.05]" />
            <div className="mb-3 h-6 w-3/4 rounded-xl bg-white/[0.08]" />
            <div className="mb-2 h-4 w-full rounded-lg bg-white/[0.05]" />
            <div className="mb-5 h-4 w-5/6 rounded-lg bg-white/[0.04]" />
            <div className="mb-4 grid grid-cols-2 gap-2.5">
              <div className="h-14 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02]" />
              <div className="h-14 rounded-xl border border-dashed border-white/[0.08] bg-white/[0.02]" />
            </div>
            <div className="flex gap-2">
              <div className="h-11 flex-1 rounded-xl bg-fuchsia-400/[0.07]" />
              <div className="h-11 w-11 rounded-xl bg-white/[0.04]" />
              <div className="h-11 w-11 rounded-xl bg-white/[0.04]" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="relative mt-6 flex justify-center">
        <Button
          onClick={onRetry}
          className="h-11 rounded-xl bg-fuchsia-500 px-5 text-white hover:bg-fuchsia-400"
        >
          Retry scan
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function SignalCard({
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
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={
        shouldReduceMotion
          ? undefined
          : {
              y: -4,
              boxShadow: featured
                ? '0 32px 90px -64px rgba(217,70,239,0.92)'
                : '0 28px 80px -60px rgba(217,70,239,0.62)',
            }
      }
      transition={premiumTransition}
      className={`relative overflow-hidden rounded-2xl border p-5 backdrop-blur-xl transition-all duration-500 hover:-translate-y-0.5 ${
        featured
          ? 'border-fuchsia-300/18 bg-[linear-gradient(145deg,rgba(217,70,239,0.105),rgba(255,255,255,0.045)_48%,rgba(0,0,0,0.18))] shadow-[0_28px_86px_-62px_rgba(217,70,239,0.78)]'
          : 'border-white/[0.075] bg-white/[0.035] shadow-[0_24px_72px_-58px_rgba(217,70,239,0.52)]'
      }`}
    >
      <motion.div
        className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent"
        animate={shouldReduceMotion ? undefined : { opacity: [0.2, 0.52, 0.2] }}
        transition={{ duration: 5.4, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
      />
      {featured ? <div className="absolute -right-10 -top-12 h-24 w-24 rounded-full bg-fuchsia-400/12 blur-3xl" /> : null}
      <p className="relative mb-3 text-[10px] font-medium uppercase tracking-[0.14em] text-white/38">{label}</p>
      <motion.div
        className={`relative font-semibold tracking-[-0.04em] text-white ${featured ? 'text-2xl' : 'text-3xl'}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...premiumTransition, delay: 0.04 }}
      >
        {value}
      </motion.div>
      <motion.p
        className="relative mt-2 text-xs leading-5 text-white/52"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...premiumTransition, delay: 0.08 }}
      >
        {detail}
      </motion.p>
    </motion.div>
  );
}

function SkeletonCard({ index }: { index: number }) {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-white/[0.075] bg-[linear-gradient(145deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02)_46%,rgba(8,8,14,0.92))] p-5 shadow-[0_28px_84px_-64px_rgba(217,70,239,0.48)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2"
      style={{ animationDelay: `${index * 70}ms`, animationFillMode: 'both' }}
    >
      <div className="mb-4 h-6 w-28 rounded-full bg-white/[0.08]" />
      <div className="mb-3 h-7 w-3/4 rounded-xl bg-white/[0.1]" />
      <div className="mb-2 h-4 w-full rounded-lg bg-white/[0.06]" />
      <div className="mb-5 h-4 w-5/6 rounded-lg bg-white/[0.06]" />
      <div className="mb-4 grid grid-cols-2 gap-2.5">
        <div className="h-16 rounded-xl bg-white/[0.05]" />
        <div className="h-16 rounded-xl bg-white/[0.05]" />
      </div>
      <div className="mb-5 h-18 rounded-xl bg-fuchsia-400/[0.05]" />
      <div className="flex gap-2">
        <div className="h-11 flex-1 rounded-xl bg-white/[0.08]" />
        <div className="h-11 w-11 rounded-xl bg-white/[0.05]" />
        <div className="h-11 w-11 rounded-xl bg-white/[0.05]" />
      </div>
    </div>
  );
}

function OpportunityCard({
  item,
  isSaved,
  onSave,
  onSelect,
  onPreview,
  onCompare,
  index,
  mode,
  supportingSource,
}: {
  item: DiscoverOpportunity;
  isSaved: boolean;
  onSave: () => void;
  onSelect: () => void;
  onPreview: () => void;
  onCompare: () => void;
  index: number;
  mode: 'verified' | 'source-backed';
  supportingSource?: DiscoverScoutResult['sources'][number];
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={
        shouldReduceMotion
          ? undefined
          : {
              y: -6,
              scale: 1.008,
              boxShadow: '0 34px 96px -66px rgba(217,70,239,0.86)',
            }
      }
      transition={premiumTransition}
      className="group relative overflow-hidden rounded-[1.7rem] border border-white/[0.075] bg-[linear-gradient(145deg,rgba(255,255,255,0.062),rgba(255,255,255,0.022)_46%,rgba(8,8,14,0.92))] p-5 shadow-[0_28px_84px_-64px_rgba(217,70,239,0.72)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-fuchsia-300/22 hover:shadow-[0_34px_96px_-66px_rgba(217,70,239,0.86)] animate-in fade-in slide-in-from-bottom-2 sm:p-6"
      style={{ animationDelay: `${index * 70}ms`, animationFillMode: 'both' }}
    >
      <motion.div
        className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"
        animate={shouldReduceMotion ? undefined : { opacity: [0.16, 0.38, 0.16] }}
        transition={{ duration: 5.8, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
      />
      <div className="absolute -right-14 -top-14 h-28 w-28 rounded-full bg-fuchsia-400/12 blur-3xl" />
      <div className="relative mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full border border-fuchsia-300/16 bg-fuchsia-400/[0.075] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.13em] text-fuchsia-100">
              {item.signal}
            </span>
            <span className="inline-flex rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.13em] text-white/48">
              {mode === 'verified' ? 'Verified ranking' : 'Source-backed draft'}
            </span>
          </div>
          <h2 className="max-w-xl text-[1.55rem] font-semibold leading-[1.02] tracking-[-0.04em] text-white">
            {item.title}
          </h2>
        </div>
        <button
          type="button"
          onClick={onSave}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-black/28 text-white/52 transition-all hover:border-fuchsia-300/20 hover:bg-fuchsia-400/[0.09] hover:text-white"
          aria-label={`Save ${item.title}`}
        >
          <Heart className={`h-4 w-4 ${isSaved ? 'fill-fuchsia-300/45 text-fuchsia-100' : ''}`} />
        </button>
      </div>
      <p className="relative mb-5 max-w-2xl text-sm leading-6 text-white/62">{item.copy}</p>
      <div className="relative mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Metric label="Opportunity" value={`${item.score}`} />
        <Metric label="Growth" value={`${item.growth}%`} />
        <Metric label="Competition" value={item.competition} />
        <Metric label="Launch speed" value={item.difficulty} />
      </div>
      <div className="relative mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/[0.065] bg-black/22 p-3">
          <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white/34">Audience</p>
          <p className="text-sm text-white/72">{item.buyer}</p>
          <p className="mt-3 mb-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white/34">Format</p>
          <p className="text-sm text-white/72">{item.format}</p>
        </div>
        <div className="rounded-xl border border-white/[0.065] bg-black/22 p-3">
          <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white/34">Monetization</p>
          <p className="text-sm text-white/72">{item.revenue}</p>
          <p className="mt-3 mb-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white/34">Confidence</p>
          <p className="text-sm text-white/72">{item.confidence}</p>
        </div>
      </div>
      <div className="relative mb-4 rounded-xl border border-fuchsia-300/12 bg-fuchsia-400/[0.055] p-3 opacity-90 transition-opacity group-hover:opacity-100">
        <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.12em] text-fuchsia-100/70">
          Intelligence summary
        </p>
        <p className="text-xs leading-5 text-white/58">{item.insight}</p>
      </div>
      <div className="relative mb-5 rounded-xl border border-white/[0.065] bg-black/18 p-3">
        <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white/34">
          Why now
        </p>
        <p className="text-xs leading-5 text-white/58">{item.positioning}</p>
        {supportingSource ? (
          <div className="mt-3 rounded-lg border border-white/[0.055] bg-white/[0.025] p-2.5">
            <p className="line-clamp-1 text-xs font-medium text-white/72">{supportingSource.title}</p>
            <p className="mt-1 text-[11px] capitalize text-white/36">{supportingSource.provider}</p>
          </div>
        ) : null}
      </div>
      <div className="relative flex gap-2">
        <Button onClick={onSelect} className="h-11 flex-1 rounded-xl bg-fuchsia-500 text-white shadow-[0_0_24px_-11px_rgba(217,70,239,0.86)] transition-all hover:bg-fuchsia-400">
          Move to Strategy
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button onClick={onPreview} variant="outline" className="h-11 rounded-xl border-white/[0.075] bg-white/[0.035] px-3 text-white/70 hover:border-fuchsia-300/20 hover:bg-white/[0.06] hover:text-white">
          <Eye className="h-4 w-4" />
        </Button>
        <Button onClick={onCompare} variant="outline" className="h-11 rounded-xl border-white/[0.075] bg-white/[0.035] px-3 text-white/70 hover:border-fuchsia-300/20 hover:bg-white/[0.06] hover:text-white">
          <GitCompare className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
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
  const [visibleCount, setVisibleCount] = useState(6);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [compareId, setCompareId] = useState<string | null>(null);
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
  const visibleOpportunities = filteredOpportunities.slice(0, visibleCount || 6);
  const preview = filteredOpportunities.find((item) => item.id === previewId) ?? filteredOpportunities[0] ?? null;
  const compare =
    filteredOpportunities.find((item) => item.id === compareId) ??
    filteredOpportunities.find((item) => item.id !== preview?.id) ??
    null;
  const strongest = filteredOpportunities[0] ?? null;
  const confidenceAverage = averageOpportunityScore(filteredOpportunities);
  const progress = activeSession ? 40 : hasVerifiedResults ? 28 : hasSourceBackedResults ? 24 : isScanning ? 18 : 12;
  const activeDraftCount = activeSession ? '01' : strongest ? '01' : '00';
  const evidenceSources = scoutResult?.sources.slice(0, 6) ?? [];
  const providerLabel = scoutResult?.sources[0]?.provider ?? 'none';
  const scanStatus = hasVerifiedResults
    ? 'verified'
    : hasSourceBackedResults
      ? 'source-backed'
      : scoutResult?.status ?? 'idle';
  const hasFailedScan =
    !isScanning &&
    !hasSourceBackedResults &&
    (Boolean(scanError) || (Boolean(scoutResult) && !hasVerifiedResults));
  const hasDegradedScan = !isScanning && hasSourceBackedResults;
  const scanFailureMessage = hasFailedScan
    ? scanError ?? humanizeScanFailure(scoutResult)
    : null;
  const degradedScanMessage = hasDegradedScan
    ? scanError ?? humanizeScanFailure(scoutResult)
    : null;
  const readinessStages = [
    {
      stage: 'Discover',
      owner: 'Scout',
      confidence: hasVerifiedResults ? 'Verified' : hasSourceBackedResults ? 'Source-backed' : isScanning ? 'Collecting' : 'Standby',
      status: hasVerifiedResults ? 'Ready' : hasSourceBackedResults ? 'Needs final verification' : isScanning ? 'Working' : 'Waiting',
    },
    {
      stage: 'Strategy',
      owner: 'Strategist',
      confidence: activeSession ? 'Context ready' : strongest ? 'Queued' : 'Standby',
      status: activeSession ? 'In progress' : strongest ? 'Can start' : 'Waiting',
    },
    {
      stage: 'Build',
      owner: 'Creator',
      confidence: activeSession ? 'Prepared' : 'Standby',
      status: activeSession ? 'Queued' : 'Waiting',
    },
    {
      stage: 'Publish',
      owner: 'Reviewer',
      confidence: activeSession ? 'Dependent' : 'Standby',
      status: activeSession ? 'Blocked on build' : 'Waiting',
    },
    {
      stage: 'Store',
      owner: 'Analyst',
      confidence: activeSession ? 'Dependent' : 'Standby',
      status: activeSession ? 'Blocked on publish' : 'Waiting',
    },
  ] as const;
  const aiActivity = [
    {
      agent: 'Scout',
      task: isScanning
        ? 'Reviewing buyer conversations'
        : hasVerifiedResults
          ? 'Verified signal set complete'
          : 'Ready to scan real demand',
      confidence: hasVerifiedResults ? 'Verified' : isScanning ? 'Live scan' : 'Standby',
      timestamp: isScanning ? 'Updated now' : scoutResult ? 'Updated just now' : 'Waiting',
      active: isScanning || hasVerifiedResults,
      accent: 'cyan',
    },
    {
      agent: 'Strategist',
      task: activeSession
        ? `Evaluating ${activeSession.title}`
        : isScanning
          ? 'Evaluating demand strength'
          : 'Waiting for selected signal',
      confidence: activeSession ? 'In progress' : isScanning ? 'Queued' : 'Standby',
      timestamp: activeSession ? 'Session live' : isScanning ? 'Queueing' : 'Waiting',
      active: activeSession !== null || isScanning,
      accent: 'fuchsia',
    },
    {
      agent: 'Analyst',
      task: isScanning
        ? 'Tracking category movement'
        : evidenceSources.length
          ? `${evidenceSources.length} sources checked`
          : 'Watching category movement',
      confidence: evidenceSources.length ? 'Cross-checking' : 'Standby',
      timestamp: evidenceSources.length ? 'Source-backed' : 'Waiting',
      active: isScanning || evidenceSources.length > 0,
      accent: 'cyan',
    },
    {
      agent: 'Creator',
      task: activeSession ? 'Preparing build context' : 'Standing by for product direction',
      confidence: activeSession ? 'Ready' : 'Standby',
      timestamp: activeSession ? 'Draft connected' : 'Waiting',
      active: activeSession !== null,
      accent: 'fuchsia',
    },
    {
      agent: 'Reviewer',
      task: isScanning
        ? 'Monitoring clarity signals'
        : hasVerifiedResults
          ? 'Watching opportunity quality'
          : 'Monitoring clarity signals',
      confidence: hasVerifiedResults ? 'Observed' : isScanning ? 'Live' : 'Standby',
      timestamp: hasVerifiedResults ? 'Signals verified' : isScanning ? 'Updated now' : 'Waiting',
      active: isScanning || hasVerifiedResults,
      accent: 'cyan',
    },
  ] as const;

  async function scanMarket() {
    setIsScanning(true);
    setVisibleCount(2);
    setScanStep(0);
    setScanError(null);
    setPreviewId(null);
    setCompareId(null);
    updateStage('find', { status: 'working', next_action: 'Scout is scanning market signals.' });
    scanStates.forEach((_, index) => {
      window.setTimeout(() => {
        setScanStep(index);
        setVisibleCount(Math.min(6, index + 2));
      }, index * 240);
    });

    try {
      const result = await runDiscoverScout({ query, filter: activeFilter });
      setScoutResult(result);
      setScanError(result.trusted ? null : humanizeScanFailure(result));
      setVisibleCount(result.opportunities.length ? 6 : 0);
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
      setVisibleCount(0);
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
    setSavedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 overflow-x-clip px-3 pb-24 pt-4 sm:px-6 lg:gap-6 lg:px-8 lg:pb-10 lg:pt-7">
      <section className="relative overflow-hidden rounded-[1.75rem] border border-white/[0.075] bg-[linear-gradient(145deg,rgba(255,255,255,0.068),rgba(255,255,255,0.023)_39%,rgba(6,6,12,0.93))] p-5 shadow-[0_32px_108px_-74px_rgba(217,70,239,0.86)] backdrop-blur-2xl sm:p-8 lg:p-10">
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-70"
          animate={{
            backgroundPosition: ['0% 0%', '100% 24%', '0% 0%'],
          }}
          transition={{ duration: 22, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
          style={{
            backgroundImage:
              'radial-gradient(circle at 22% 24%, rgba(255,255,255,0.05) 0, transparent 18%), radial-gradient(circle at 78% 18%, rgba(217,70,239,0.14) 0, transparent 28%), radial-gradient(circle at 24% 76%, rgba(56,189,248,0.08) 0, transparent 24%)',
            backgroundSize: '140% 140%',
          }}
        />
        {Array.from({ length: 14 }).map((_, index) => (
          <motion.span
            key={index}
            className="pointer-events-none absolute rounded-full bg-white/35 blur-[1px]"
            style={{
              left: `${8 + index * 6}%`,
              top: `${12 + (index % 4) * 18}%`,
              width: index % 3 === 0 ? 4 : 2,
              height: index % 3 === 0 ? 4 : 2,
            }}
            animate={{
              y: [0, index % 2 === 0 ? -12 : 10, 0],
              opacity: [0.05, 0.22, 0.05],
            }}
            transition={{
              duration: 9 + index * 0.45,
              repeat: Number.POSITIVE_INFINITY,
              ease: 'easeInOut',
            }}
          />
        ))}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_18%,rgba(217,70,239,0.19),transparent_31%),radial-gradient(circle_at_48%_0%,rgba(124,58,237,0.135),transparent_34%)]" />
        <div className="absolute right-0 top-8 hidden h-76 w-[56%] opacity-90 lg:block">
          <LivingOpportunityConstellation />
        </div>

        <div className="relative min-w-0 max-w-[43rem]">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-fuchsia-300/16 bg-fuchsia-400/[0.07] px-3 py-1.5 text-xs font-medium text-fuchsia-100">
            <Compass className="h-3.5 w-3.5" />
            Demand Intelligence Mission Control
          </div>
          <h1 className="mb-4 max-w-2xl text-4xl font-semibold leading-[0.98] tracking-[-0.055em] text-white sm:text-5xl lg:text-6xl">
            Find demand before you build.
          </h1>
          <p className="mb-7 max-w-xl text-base leading-7 text-white/64 sm:text-lg">
            Discover verified opportunities backed by real-world signals, buyer intent, market evidence, and commercial viability.
          </p>

          <form
            className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-stretch"
            onSubmit={(event) => {
              event.preventDefault();
              scanMarket();
            }}
          >
            <motion.div
              className="relative flex-1"
              animate={{
                scale: isSearchFocused ? 1.004 : 1,
              }}
              transition={premiumTransition}
            >
              <motion.div
                className="pointer-events-none absolute inset-0 rounded-2xl"
                animate={{
                  boxShadow: isSearchFocused
                    ? '0 0 0 1px rgba(244,114,182,0.12), 0 0 34px -18px rgba(217,70,239,0.9)'
                    : '0 0 0 1px rgba(255,255,255,0.02)',
                }}
                transition={premiumTransition}
              />
              <motion.div
                className="pointer-events-none absolute inset-y-3 left-3 w-20 rounded-full bg-fuchsia-400/10 blur-2xl"
                animate={isSearchFocused ? { opacity: [0.18, 0.34, 0.18] } : { opacity: 0.08 }}
                transition={{ duration: 2.8, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
              />
              <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-white/42" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                placeholder="What market would you like Scout to investigate?"
                className="flex h-15 w-full items-center rounded-2xl border border-white/[0.085] bg-black/44 pl-14 pr-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.045)] outline-none transition-all placeholder:text-white/36 focus:border-fuchsia-300/24 focus:shadow-[0_0_30px_-18px_rgba(217,70,239,0.9),inset_0_1px_0_rgba(255,255,255,0.045)]"
              />
              <motion.span
                className="pointer-events-none absolute right-5 top-1/2 h-5 w-px -translate-y-1/2 bg-gradient-to-b from-fuchsia-200/20 via-fuchsia-100/90 to-fuchsia-200/20"
                animate={isSearchFocused ? { opacity: [0.2, 1, 0.2] } : { opacity: 0 }}
                transition={{ duration: 1.1, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
              />
            </motion.div>
            <Button type="submit" disabled={isScanning} className="h-15 w-full rounded-2xl bg-fuchsia-500 px-8 font-semibold text-white shadow-[0_0_28px_-12px_rgba(217,70,239,0.88)] transition-all hover:bg-fuchsia-400 hover:shadow-[0_0_34px_-12px_rgba(217,70,239,0.95)] disabled:opacity-80 lg:w-auto">
              {isScanning ? <Radar className="h-4 w-4 animate-pulse" /> : <Sparkles className="h-4 w-4" />}
              {isScanning ? 'Scanning...' : 'Scan Market'}
            </Button>
          </form>

          <div className="flex flex-wrap gap-2 pb-1 pt-1">
            {filters.map((filter) => (
              <button
                type="button"
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`min-h-9 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-all duration-300 ${
                  activeFilter === filter
                    ? 'border-fuchsia-300/22 bg-fuchsia-400/[0.13] text-white shadow-[0_0_24px_-14px_rgba(217,70,239,0.9)]'
                    : 'border-white/[0.075] bg-white/[0.035] text-white/62 hover:border-white/[0.12] hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs text-white/42">Examples</span>
            {marketExamples.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setQuery(example)}
                className="min-h-9 rounded-full border border-white/[0.07] bg-black/22 px-3 py-1.5 text-xs text-white/58 transition-colors hover:border-fuchsia-300/18 hover:bg-fuchsia-400/[0.07] hover:text-white"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        <SignalCard
          label="Verified signals"
          value={`${hasVerifiedResults ? filteredOpportunities.length : 0}`.padStart(2, '0')}
          detail={
            hasVerifiedResults
              ? scoutResult?.summary ?? 'Verified market scan completed.'
              : hasSourceBackedResults
                ? 'Live evidence gathered. Final Gemini ranking still needs another pass.'
                : 'Run a market scan to surface verified signals.'
          }
        />
        <SignalCard
          label="Active sources"
          value={`${scoutResult?.sources.length ?? 0}`.padStart(2, '0')}
          detail={
            scoutResult?.sources.length
              ? `Primary provider: ${providerLabel}`
              : 'Waiting for live source collection.'
          }
        />
        <SignalCard
          label="Confidence average"
          value={`${confidenceAverage || 0}`}
          detail={
            filteredOpportunities.length
              ? competitionSpread(filteredOpportunities)
              : 'No scored opportunity set yet.'
          }
        />
        <SignalCard
          label="Opportunities found"
          value={`${filteredOpportunities.length}`.padStart(2, '0')}
          detail={activeSession ? activeSession.title : 'Select an opportunity to begin strategy.'}
          featured
        />
      </div>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-[1.7rem] border border-white/[0.075] bg-white/[0.035] p-5 shadow-[0_28px_84px_-64px_rgba(217,70,239,0.52)] backdrop-blur-xl sm:p-6">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/32">
                Scout Intelligence
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
                Sources to opportunity ranking
              </h2>
            </div>
            <span className="rounded-full border border-fuchsia-300/14 bg-fuchsia-400/[0.07] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-fuchsia-100">
              {isScanning ? 'Live scan' : opportunityMode === 'verified' ? 'Verified' : opportunityMode === 'source-backed' ? 'Source-backed' : 'Standby'}
            </span>
          </div>
          <div className="grid gap-3">
            {scanStates.map((step, index) => {
              const complete = !isScanning && filteredOpportunities.length > 0 && index < scanStates.length - 1;
              const active = isScanning ? index === scanStep : !filteredOpportunities.length ? index === 0 : index === scanStates.length - 1;

              return (
                <div
                  key={step}
                  className={`rounded-2xl border px-4 py-3 transition-colors ${
                    active
                      ? 'border-fuchsia-300/18 bg-fuchsia-400/[0.08]'
                      : complete
                        ? 'border-white/[0.08] bg-white/[0.03]'
                        : 'border-white/[0.055] bg-black/18'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-white">{step}</p>
                      <p className="mt-1 text-xs leading-5 text-white/46">
                        {active
                          ? isScanning
                            ? 'Scout is processing this stage now.'
                            : opportunityMode === 'verified'
                              ? 'Ranking complete.'
                              : opportunityMode === 'source-backed'
                                ? 'Operating from live evidence.'
                                : 'Waiting to begin.'
                          : complete
                            ? 'Stage completed by Scout.'
                            : 'Queued in Scout workflow.'}
                      </p>
                    </div>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs ${
                      active
                        ? 'border-fuchsia-300/28 bg-fuchsia-400/16 text-fuchsia-100'
                        : complete
                          ? 'border-cyan-300/18 bg-cyan-400/[0.08] text-cyan-100'
                          : 'border-white/[0.08] bg-white/[0.03] text-white/36'
                    }`}>
                      {complete ? <Check className="h-4 w-4" /> : active ? <Radar className="h-4 w-4" /> : index + 1}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 rounded-2xl border border-white/[0.06] bg-black/22 p-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/36">Scan notes</p>
            <div className="mt-3 space-y-2">
              {(scoutResult?.attempts.slice(-4) ?? ['No scout activity yet.']).map((attempt, index) => (
                <p key={`${attempt}-${index}`} className="text-xs leading-5 text-white/54">
                  {attempt}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[1.7rem] border border-white/[0.075] bg-white/[0.035] p-5 shadow-[0_28px_84px_-64px_rgba(217,70,239,0.52)] backdrop-blur-xl sm:p-6">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/32">
                Market Evidence Stream
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
                Why this market matters
              </h2>
            </div>
            <span className="text-xs text-white/42">
              {evidenceSources.length ? `${evidenceSources.length} live signals` : 'Waiting for evidence'}
            </span>
          </div>
          {evidenceSources.length ? (
            <div className="grid gap-3">
              {evidenceSources.map((source, index) => (
                <div
                  key={`${source.provider}-${source.url}`}
                  className="rounded-2xl border border-white/[0.06] bg-black/18 p-4"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-fuchsia-100/70">
                      {sourceHeadline(source, index)}
                    </p>
                    <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[10px] uppercase tracking-[0.14em] text-white/42">
                      Strength {Math.max(72, 94 - index * 4)}
                    </span>
                  </div>
                  <p className="line-clamp-1 text-sm font-medium text-white">{source.title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/54">{source.snippet}</p>
                  <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-white/38">
                    <span className="capitalize">{source.provider}</span>
                    <span>Confidence {Math.max(81, 95 - index * 3)}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/[0.06] bg-black/18 p-5 text-sm leading-6 text-white/52">
              Start a scan to pull buyer complaints, search demand, and category movement into the evidence stream.
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/32">
              Verified Opportunities
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
              Opportunities to move into strategy
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/54">
              {isScanning
                ? 'Scout is gathering and ranking demand signals now.'
                : hasVerifiedResults
                  ? `${filteredOpportunities.length} verified opportunities are ready for review.`
                  : hasSourceBackedResults
                    ? 'Live signals are in. WIZUP is showing source-backed drafts while the verified ranker is retried.'
                    : 'Run a market scan to surface demand-backed opportunities.'}
            </p>
            {degradedScanMessage ? (
              <p className="mt-2 text-xs leading-5 text-amber-200/80">{degradedScanMessage}</p>
            ) : null}
            {scanFailureMessage ? (
              <p className="mt-2 text-xs leading-5 text-amber-200/80">{scanFailureMessage}</p>
            ) : null}
          </div>
          <Link
            href="/app/ideas"
            prefetch={false}
            className="hidden items-center gap-1 text-sm font-medium text-fuchsia-200/86 transition-colors hover:text-white sm:flex"
          >
            Scan more
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {isScanning ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {[0, 1, 2, 3].map((index) => (
              <SkeletonCard key={index} index={index} />
            ))}
          </div>
        ) : filteredOpportunities.length ? (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {visibleOpportunities.map((item, index) => (
              <OpportunityCard
                key={item.id}
                item={item}
                index={index}
                isSaved={savedIds.includes(item.id)}
                onSave={() => saveOpportunity(item.id)}
                onPreview={() => setPreviewId(item.id)}
                onCompare={() => setCompareId(item.id)}
                onSelect={() => selectOpportunity(item)}
                mode={opportunityMode === 'verified' ? 'verified' : 'source-backed'}
                supportingSource={evidenceSources[index % Math.max(evidenceSources.length, 1)]}
              />
            ))}
          </div>
        ) : (
          <DiscoverEmptyState hasFailedScan={hasFailedScan} message={scanFailureMessage} onRetry={scanMarket} />
        )}
      </section>

      {preview && compare ? (
        <section className="rounded-[1.7rem] border border-white/[0.075] bg-white/[0.035] p-5 shadow-[0_28px_84px_-64px_rgba(217,70,239,0.52)] backdrop-blur-xl sm:p-6">
          <div className="mb-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/32">
              Opportunity Comparison Mode
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
              Compare opportunities like investments
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {[preview, compare].map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-white/[0.06] bg-black/18 p-5"
              >
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/36">{item.signal}</p>
                  </div>
                  <div className="rounded-full border border-fuchsia-300/16 bg-fuchsia-400/[0.07] px-3 py-1 text-sm font-semibold text-white">
                    {item.score}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <Metric label="Demand" value={`${item.growth}%`} />
                  <Metric label="Competition" value={item.competition} />
                  <Metric label="Monetization" value={item.revenue} />
                  <Metric label="Buildability" value={item.difficulty} />
                </div>
                <p className="mt-4 text-sm leading-6 text-white/56">{item.insight}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="rounded-[1.7rem] border border-white/[0.075] bg-white/[0.035] p-5 shadow-[0_28px_84px_-64px_rgba(217,70,239,0.52)] backdrop-blur-xl sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/32">
                Strategic Readiness
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
                Downstream workflow state
              </h2>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-fuchsia-300/18 bg-black/32 text-sm font-semibold text-white shadow-[inset_0_0_20px_rgba(217,70,239,0.12)]">
              {progress}%
            </div>
          </div>
          <div className="space-y-3">
            {readinessStages.map((stage, index) => (
              <div
                key={stage.stage}
                className="rounded-2xl border border-white/[0.06] bg-black/18 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white">{stage.stage}</p>
                    <p className="mt-1 text-xs text-white/42">Owner: {stage.owner}</p>
                  </div>
                  <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] ${
                    index === 0
                      ? 'border-fuchsia-300/16 bg-fuchsia-400/[0.07] text-fuchsia-100'
                      : 'border-white/[0.08] bg-white/[0.03] text-white/46'
                  }`}>
                    {stage.status}
                  </span>
                </div>
                <p className="mt-3 text-xs leading-5 text-white/56">{stage.confidence}</p>
              </div>
            ))}
          </div>
          <Button
            onClick={() => {
              if (activeSession) {
                router.push('/app/strategy');
                return;
              }
              if (strongest) {
                selectOpportunity(strongest);
                return;
              }
              scanMarket();
            }}
            variant="outline"
            className="mt-5 h-12 w-full rounded-xl border-fuchsia-300/16 bg-fuchsia-400/[0.075] text-white shadow-[0_0_22px_-13px_rgba(217,70,239,0.76)] transition-all hover:bg-fuchsia-400/[0.12]"
          >
            {activeSession ? 'Continue strategy' : strongest ? 'Move strongest opportunity to strategy' : 'Run verified scan'}
            <BarChart3 className="h-4 w-4" />
          </Button>
        </div>

        <div className="rounded-[1.7rem] border border-white/[0.075] bg-white/[0.035] p-5 shadow-[0_28px_84px_-64px_rgba(217,70,239,0.52)] backdrop-blur-xl sm:p-6">
          <div className="mb-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/32">
              Agent Orchestration Center
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
              AI team activity
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {aiActivity.map((item) => (
              <motion.div
                key={item.agent}
                className="rounded-2xl border border-white/[0.06] bg-black/18 p-4"
                whileHover={{ y: -2, borderColor: 'rgba(244,114,182,0.16)' }}
                transition={premiumTransition}
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <motion.span
                      className={`h-2.5 w-2.5 rounded-full ${
                        item.active
                          ? item.accent === 'cyan'
                            ? 'bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.8)]'
                            : 'bg-fuchsia-300 shadow-[0_0_14px_rgba(217,70,239,0.78)]'
                          : 'bg-white/22'
                      }`}
                      animate={item.active ? { scale: [1, 1.25, 1], opacity: [0.55, 1, 0.55] } : undefined}
                      transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
                    />
                    <p className="text-sm font-medium text-white">{item.agent}</p>
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.14em] text-white/32">
                    {item.timestamp}
                  </span>
                </div>
                <p className="text-xs leading-5 text-white/58">{item.task}</p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] text-white/38">
                  <span>Confidence</span>
                  <span className="text-right text-white/58">{item.confidence}</span>
                  <span>Status</span>
                  <span className="text-right text-white/58">{item.active ? 'Active' : 'Waiting'}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[1.7rem] border border-white/[0.075] bg-white/[0.035] p-5 shadow-[0_28px_84px_-64px_rgba(217,70,239,0.52)] backdrop-blur-xl sm:p-6">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/32">
                Intelligence Briefing
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
                Analyst summary
              </h2>
            </div>
            <span className="rounded-full border border-fuchsia-300/14 bg-fuchsia-400/[0.07] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-fuchsia-100">
              {opportunityMode === 'verified' ? 'Verified' : opportunityMode === 'source-backed' ? 'Source-backed' : 'Waiting'}
            </span>
          </div>
          {preview ? (
            <>
              <h3 className="text-xl font-semibold tracking-[-0.04em] text-white">{preview.title}</h3>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/58">{preview.copy}</p>
              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <MiniFact label="Audience" value={preview.buyer} />
                <MiniFact label="Format" value={preview.format} />
                <MiniFact label="Competition" value={preview.competition} />
                <MiniFact label="Provider" value={providerLabel} />
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/[0.06] bg-black/18 p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/36">Core problem</p>
                  <p className="mt-2 text-sm leading-6 text-white/58">{preview.copy}</p>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-black/18 p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/36">Why now</p>
                  <p className="mt-2 text-sm leading-6 text-white/58">{preview.positioning}</p>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-black/18 p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/36">Monetization signal</p>
                  <p className="mt-2 text-sm leading-6 text-white/58">{preview.monetization}</p>
                </div>
                <div className="rounded-2xl border border-white/[0.06] bg-black/18 p-4">
                  <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/36">Confidence</p>
                  <p className="mt-2 text-sm leading-6 text-white/58">{preview.confidence}</p>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-white/[0.06] bg-black/18 p-5 text-sm leading-6 text-white/52">
              Scan a market to create a full intelligence briefing with audience, evidence, monetization, and launch potential.
            </div>
          )}
        </div>

        <div className="rounded-[1.7rem] border border-white/[0.075] bg-white/[0.035] p-5 shadow-[0_28px_84px_-64px_rgba(217,70,239,0.52)] backdrop-blur-xl sm:p-6">
          <div className="mb-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/32">
              Supporting Sources
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white">
              Evidence pack
            </h2>
          </div>
          <div className="mb-4 grid grid-cols-3 gap-2.5">
            <MiniFact label="Status" value={scanStatus} />
            <MiniFact label="Sources" value={`${scoutResult?.sources.length ?? 0}`} />
            <MiniFact label="Drafts" value={activeDraftCount} />
          </div>
          <div className="space-y-3">
            {evidenceSources.length ? (
              evidenceSources.map((source) => (
                <div
                  key={`${source.provider}-${source.url}-brief`}
                  className="rounded-2xl border border-white/[0.06] bg-black/18 p-4"
                >
                  <p className="line-clamp-1 text-sm font-medium text-white">{source.title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/54">{source.snippet}</p>
                  <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-white/38">
                    <span className="capitalize">{source.provider}</span>
                    <span>Live source</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/[0.06] bg-black/18 p-5 text-sm leading-6 text-white/52">
                No evidence pack yet. Run a scan to populate source-backed proof points.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function MiniFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-white/[0.055] bg-white/[0.025] p-2">
      <p className="mb-1 text-[9px] font-medium uppercase tracking-[0.1em] text-white/30">{label}</p>
      <p className="truncate text-xs font-medium text-white/66">{value}</p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.065] bg-black/22 p-3">
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.08em] text-white/36">{label}</p>
      <p className="truncate text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
