'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleDot,
  Compass,
  FileText,
  Flag,
  Layers3,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';

import { useActiveBuild } from '@/app/context/ActiveBuildSessionContext';
import { Button } from '@/components/ui/button';
import { runStrategist } from '@/app/actions/ai';
import type { StrategistProductOutlineOutput } from '@/lib/ai';

const strategySteps = [
  { id: 'opportunity-fit', label: 'Opportunity Fit', eyebrow: 'Signal quality', icon: Target },
  { id: 'market-angle', label: 'Market Angle', eyebrow: 'Audience and offer', icon: Compass },
  { id: 'mvp-plan', label: 'MVP Plan', eyebrow: 'Pain and product shape', icon: Layers3 },
  { id: 'go-to-market', label: 'Go-To-Market', eyebrow: 'Positioning and pricing', icon: Flag },
  { id: 'success-metrics', label: 'Success Metrics', eyebrow: 'Decision and next move', icon: BarChart3 },
] as const;

type StrategySectionId = (typeof strategySteps)[number]['id'];

const coachActions = [
  'Analyze this opportunity',
  'Find unique angles',
  'Validate assumptions',
  'Suggest MVP features',
];

const templates = ['Beginner offer', 'Fast MVP', 'Launch checklist'];

const premiumTransition = {
  duration: 0.24,
  ease: [0.22, 1, 0.36, 1] as const,
};

type StrategyDecision = {
  source: 'loading' | 'ai' | 'fallback';
  audience: {
    primary: string;
    secondary: string;
    motivation: string;
    frustrations: string[];
  };
  pains: Array<{
    pain: string;
    severity: string;
    urgency: string;
    likelihood: string;
  }>;
  productType: {
    best: string;
    reason: string;
  };
  positioning: {
    statement: string;
    alternatives: string[];
  };
  monetization: {
    entry: string;
    premium: string;
    upsell: string;
    bundle: string;
    ltv: string;
  };
  risks: {
    competition: string;
    execution: string;
    audience: string;
  };
  recommendation: {
    build: string;
    reasons: string[];
  };
};

type StrategyMetric = {
  label: string;
  value: string;
  copy: string;
  progress: number;
};

function createFallbackDecision(title: string, buyer: string, format: string, price: string, score: number): StrategyDecision {
  return {
    source: 'fallback',
    audience: {
      primary: buyer,
      secondary: `Beginners who want a simpler way to solve ${title.toLowerCase()}.`,
      motivation: 'They want a clear result without spending weeks learning a complex system.',
      frustrations: ['Too many steps', 'Too much advice online', 'No simple starting point'],
    },
    pains: [
      { pain: 'They feel stuck and need a clear next step.', severity: 'High', urgency: 'High', likelihood: 'Strong' },
      { pain: 'Existing options feel too complex.', severity: 'High', urgency: 'Medium', likelihood: 'Strong' },
      { pain: 'They do not know what to do first.', severity: 'Medium', urgency: 'High', likelihood: 'Good' },
      { pain: 'They want something they can use today.', severity: 'Medium', urgency: 'Medium', likelihood: 'Good' },
      { pain: 'They need examples, not theory.', severity: 'Medium', urgency: 'Medium', likelihood: 'Good' },
    ],
    productType: {
      best: format || 'Toolkit',
      reason: 'This format is fast to build, easy to understand, and simple for buyers to use right away.',
    },
    positioning: {
      statement: `The easiest ${title.toLowerCase()} for ${buyer.toLowerCase()}.`,
      alternatives: [
        `A simple starter system for ${buyer.toLowerCase()}.`,
        `A faster way to solve ${title.toLowerCase()} without overwhelm.`,
        `A practical toolkit that helps ${buyer.toLowerCase()} move forward today.`,
      ],
    },
    monetization: {
      entry: price || '$19',
      premium: '$49 - $79',
      upsell: 'A done-with-you setup guide or template pack.',
      bundle: 'Bundle the guide, checklist, and examples.',
      ltv: score >= 88 ? '$70 - $140' : '$45 - $95',
    },
    risks: {
      competition: 'Some buyers may already compare similar products.',
      execution: 'The product must stay simple and not become too broad.',
      audience: 'Messaging must speak to one clear buyer, not everyone.',
    },
    recommendation: {
      build: `${format || 'Toolkit'} + quick-start PDF`,
      reasons: ['fastest to market', 'easy to validate', 'clear buyer outcome'],
    },
  };
}

function adaptStrategistOutput(output: StrategistProductOutlineOutput, fallback: StrategyDecision): StrategyDecision {
  const modules = output.modules.map((module) => module.title.replace(/^Module\s*\d+:\s*/i, ''));

  return {
    source: output.source === 'gemini' ? 'ai' : 'fallback',
    audience: {
      primary: output.positioning.targetBuyer,
      secondary: fallback.audience.secondary,
      motivation: output.positioning.promise,
      frustrations: output.assumptions.slice(0, 3).length ? output.assumptions.slice(0, 3) : fallback.audience.frustrations,
    },
    pains: fallback.pains.map((pain, index) => ({
      ...pain,
      pain: output.proofPoints[index] ?? pain.pain,
    })),
    productType: {
      best: output.positioning.category,
      reason: output.positioning.subtitle,
    },
    positioning: {
      statement: output.positioning.promise,
      alternatives: [
        output.positioning.subtitle,
        ...output.keyFeatures.slice(0, 2).map((feature) => `A product built around ${feature.toLowerCase()}.`),
      ],
    },
    monetization: {
      ...fallback.monetization,
      entry: output.positioning.recommendedPrice,
    },
    risks: {
      competition: output.assumptions[0] ?? fallback.risks.competition,
      execution: output.assumptions[1] ?? fallback.risks.execution,
      audience: output.assumptions[2] ?? fallback.risks.audience,
    },
    recommendation: {
      build: `${output.positioning.category} with ${modules.slice(0, 2).join(' + ')}`,
      reasons: output.buildPlan.slice(0, 3),
    },
  };
}

function clampProgress(value: number) {
  return Math.max(18, Math.min(96, value));
}

function demandValue(score: number) {
  if (score >= 88) return 'High';
  if (score >= 74) return 'Medium';
  return 'Early';
}

function demandCopy(score: number) {
  if (score >= 88) return 'Strong buyer pull right now';
  if (score >= 74) return 'Good demand with room to sharpen';
  return 'Worth validating before build';
}

function competitionValue(decision: StrategyDecision) {
  const text = decision.risks.competition.toLowerCase();
  if (text.includes('competitive') || text.includes('crowded')) return 'High';
  if (text.includes('compare') || text.includes('similar')) return 'Medium';
  return 'Low';
}

function competitionProgress(value: string) {
  if (value === 'Low') return 42;
  if (value === 'Medium') return 60;
  return 82;
}

function momentumCopy(verdict: string) {
  const normalized = verdict.toLowerCase();
  if (normalized.includes('high')) return 'Signal strength is moving with urgency';
  if (normalized.includes('build')) return 'Strong enough to move into build';
  return 'Opportunity is still gaining shape';
}

function timeToMarketValue(format: string) {
  const normalized = format.toLowerCase();
  if (normalized.includes('toolkit') || normalized.includes('guide') || normalized.includes('template')) {
    return 'Fast';
  }
  if (normalized.includes('course') || normalized.includes('audio')) {
    return 'Medium';
  }
  return 'Fast';
}

function timeToMarketProgress(value: string) {
  return value === 'Fast' ? 74 : 52;
}

function buildStrategyMetrics(
  ideaScore: number,
  decision: StrategyDecision,
  selectedIdea: {
    verdict?: string;
    format?: string;
  } | null
): StrategyMetric[] {
  const demand = demandValue(ideaScore);
  const competition = competitionValue(decision);
  const entryPrice = decision.monetization.entry;
  const momentum = selectedIdea?.verdict ?? 'Rising';
  const timeToMarket = timeToMarketValue(selectedIdea?.format ?? decision.productType.best);

  return [
    {
      label: 'Buyer Demand',
      value: demand,
      copy: demandCopy(ideaScore),
      progress: clampProgress(ideaScore),
    },
    {
      label: 'Competition',
      value: competition,
      copy: decision.productType.reason,
      progress: competitionProgress(competition),
    },
    {
      label: 'Monetization',
      value: entryPrice,
      copy: decision.monetization.bundle,
      progress: clampProgress(Math.min(90, 52 + ideaScore / 3)),
    },
    {
      label: 'Trend Momentum',
      value: momentum,
      copy: momentumCopy(momentum),
      progress: clampProgress(ideaScore - 4),
    },
    {
      label: 'Time to Market',
      value: timeToMarket,
      copy: `Best first format: ${decision.productType.best}`,
      progress: timeToMarketProgress(timeToMarket),
    },
  ];
}

function StrategyAtlasVisual({ activeLabel }: { activeLabel: string }) {
  const shouldReduceMotion = useReducedMotion();
  const nodes = [
    { label: 'demand strength', left: '16%', top: '28%' },
    { label: 'buyer clarity', left: '24%', top: '72%' },
    { label: 'positioning', left: '78%', top: '26%' },
    { label: 'offer path', left: '82%', top: '70%' },
  ];

  return (
    <div className="relative h-[18rem] overflow-hidden rounded-[1.8rem] border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.045),rgba(255,255,255,0.012))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:h-[21rem]">
      <motion.div
        className="absolute inset-0 opacity-80"
        animate={shouldReduceMotion ? undefined : { backgroundPosition: ['0% 0%', '100% 32%', '0% 0%'] }}
        transition={{ duration: 24, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
        style={{
          backgroundImage:
            'radial-gradient(circle at 16% 20%, rgba(255,255,255,0.06) 0, transparent 16%), radial-gradient(circle at 76% 18%, rgba(217,70,239,0.18) 0, transparent 28%), radial-gradient(circle at 54% 78%, rgba(56,189,248,0.08) 0, transparent 24%)',
          backgroundSize: '150% 150%',
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(217,70,239,0.08),transparent_34%),radial-gradient(circle_at_72%_14%,rgba(124,58,237,0.14),transparent_28%)]" />

      {[0, 1, 2].map((ring) => (
        <motion.div
          key={ring}
          className="absolute left-1/2 top-1/2 rounded-full border border-fuchsia-300/[0.09]"
          style={{
            width: `${160 + ring * 88}px`,
            height: `${160 + ring * 88}px`,
            marginLeft: `${-(160 + ring * 88) / 2}px`,
            marginTop: `${-(160 + ring * 88) / 2}px`,
          }}
          animate={shouldReduceMotion ? undefined : { rotate: ring % 2 === 0 ? 360 : -360 }}
          transition={{ duration: 36 + ring * 8, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
        />
      ))}

      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <motion.path
          d="M12 68 C30 72 38 58 50 50 C62 42 74 30 88 34"
          fill="none"
          stroke="rgba(217,70,239,0.52)"
          strokeWidth="0.45"
          strokeLinecap="round"
          animate={shouldReduceMotion ? undefined : { pathLength: [0.58, 1, 0.58], opacity: [0.4, 0.82, 0.4] }}
          transition={{ duration: 7, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        />
        <motion.path
          d="M16 24 C34 32 48 42 56 58 C64 74 78 78 90 62"
          fill="none"
          stroke="rgba(244,114,182,0.24)"
          strokeWidth="0.35"
          strokeLinecap="round"
          animate={shouldReduceMotion ? undefined : { pathLength: [0.7, 1, 0.7], opacity: [0.2, 0.46, 0.2] }}
          transition={{ duration: 8.4, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        />
        <ellipse cx="50" cy="50" rx="24" ry="24" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="0.2" />
      </svg>

      <motion.div
        className="absolute left-1/2 top-1/2 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-fuchsia-300/20 bg-black/34 text-center shadow-[inset_0_0_32px_rgba(217,70,239,0.14),0_0_28px_-18px_rgba(217,70,239,0.82)] backdrop-blur-md"
        animate={shouldReduceMotion ? undefined : { boxShadow: ['0 0 20px rgba(217,70,239,0.16)', '0 0 34px rgba(217,70,239,0.28)', '0 0 20px rgba(217,70,239,0.16)'] }}
        transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
      >
        <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/48">Current focus</span>
        <span className="mt-2 px-4 text-sm font-semibold leading-5 text-white">{activeLabel}</span>
      </motion.div>

      {nodes.map((node, index) => (
        <motion.div
          key={node.label}
          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.08] bg-black/40 px-3 py-1.5 text-[10px] font-medium text-white/62 shadow-[0_0_20px_-14px_rgba(217,70,239,0.9)] backdrop-blur-md"
          style={{ left: node.left, top: node.top }}
          animate={shouldReduceMotion ? undefined : { y: [0, index % 2 === 0 ? -4 : 4, 0] }}
          transition={{ duration: 4.8 + index * 0.6, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
        >
          {node.label}
        </motion.div>
      ))}

      <div className="absolute inset-x-5 bottom-5 rounded-[1.2rem] border border-white/[0.06] bg-black/24 p-3 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/32">Signal to strategy path</p>
            <p className="mt-1 truncate text-sm text-white/72">Demand to angle to offer to launch plan</p>
          </div>
          <div className="rounded-full border border-fuchsia-300/18 bg-fuchsia-400/[0.08] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.14em] text-fuchsia-100/78">
            Live map
          </div>
        </div>
      </div>
    </div>
  );
}

function StrategyChip({
  active,
  item,
  onClick,
}: {
  active: boolean;
  item: (typeof strategySteps)[number];
  onClick: () => void;
}) {
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium transition-all ${
        active
          ? 'border-fuchsia-300/28 bg-fuchsia-400/[0.13] text-fuchsia-50 shadow-[0_0_24px_-14px_rgba(217,70,239,0.92)]'
          : 'border-white/[0.08] bg-white/[0.035] text-white/62 hover:border-white/14 hover:bg-white/[0.06] hover:text-white/84'
      }`}
    >
      <Icon className={`h-3.5 w-3.5 ${active ? 'text-fuchsia-100' : 'text-white/40 group-hover:text-white/64'}`} />
      {item.label}
    </button>
  );
}

function InsightCard({ item, index }: { item: StrategyMetric; index: number }) {
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
              boxShadow: '0 30px 90px -64px rgba(217,70,239,0.74)',
            }
      }
      transition={{ ...premiumTransition, delay: index * 0.04 }}
      className="relative overflow-hidden rounded-[1.45rem] border border-white/[0.075] bg-[linear-gradient(145deg,rgba(255,255,255,0.056),rgba(255,255,255,0.02)_48%,rgba(0,0,0,0.16))] p-4 shadow-[0_24px_72px_-60px_rgba(217,70,239,0.62)] backdrop-blur-xl sm:p-5"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(217,70,239,0.14),transparent_34%)]" />
      <motion.div
        className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-white/34 to-transparent"
        animate={shouldReduceMotion ? undefined : { opacity: [0.18, 0.46, 0.18] }}
        transition={{ duration: 5.2, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
      />
      <p className="relative mb-3 text-[10px] font-medium uppercase tracking-[0.15em] text-white/34">{item.label}</p>
      <div className="relative mb-1 text-2xl font-semibold tracking-[-0.04em] text-white">{item.value}</div>
      <p className="relative min-h-12 text-sm leading-6 text-white/54">{item.copy}</p>
      <div className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.065]">
        <motion.div
          className="h-full rounded-full bg-fuchsia-400 shadow-[0_0_14px_rgba(217,70,239,0.55)]"
          animate={{ width: `${item.progress}%` }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </motion.div>
  );
}

function SectionShell({
  id,
  title,
  eyebrow,
  description,
  children,
}: {
  id: StrategySectionId;
  title: string;
  eyebrow: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-28 rounded-[1.55rem] border border-white/[0.07] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(0,0,0,0.16))] p-5 shadow-[0_24px_76px_-66px_rgba(217,70,239,0.68)] backdrop-blur-xl sm:p-6">
      <div className="mb-5 flex flex-col gap-2">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-white/32">{eyebrow}</p>
        <h2 className="text-[1.8rem] font-semibold tracking-[-0.045em] text-white sm:text-[2rem]">{title}</h2>
        {description ? <p className="max-w-3xl text-sm leading-6 text-white/54">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function ContentCard({
  title,
  eyebrow,
  children,
  accent,
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.45rem] border p-5 backdrop-blur-xl sm:p-6 ${
        accent
          ? 'border-fuchsia-300/14 bg-[linear-gradient(145deg,rgba(217,70,239,0.09),rgba(255,255,255,0.02)_48%,rgba(0,0,0,0.12))] shadow-[0_30px_84px_-70px_rgba(217,70,239,0.82)]'
          : 'border-white/[0.06] bg-[linear-gradient(180deg,rgba(255,255,255,0.028),rgba(0,0,0,0.14))] shadow-[0_22px_72px_-64px_rgba(217,70,239,0.52)]'
      }`}
    >
      {eyebrow ? <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-white/32">{eyebrow}</p> : null}
      <h3 className="mb-4 text-[1.55rem] font-semibold tracking-[-0.04em] text-white">{title}</h3>
      {children}
    </div>
  );
}

function SidebarCard({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.45rem] border border-white/[0.07] bg-white/[0.038] p-5 shadow-[0_24px_72px_-62px_rgba(217,70,239,0.66)] backdrop-blur-xl">
      <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.16em] text-white/32">{eyebrow}</p>
      <h2 className="mb-4 text-[1.55rem] font-semibold tracking-[-0.04em] text-white">{title}</h2>
      {children}
    </div>
  );
}

function SummaryBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-white/[0.06] bg-black/18 px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.14em] text-white/34">{label}</p>
      <p className="truncate text-sm font-semibold text-white/82">{value}</p>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-b border-white/[0.055] py-3.5 last:border-b-0">
      <p className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-white/32">{label}</p>
      <p className="text-sm leading-7 text-white/68">{value}</p>
    </div>
  );
}

function BulletLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 text-sm leading-7 text-white/62">
      <CircleDot className="mt-1.5 h-3.5 w-3.5 shrink-0 text-fuchsia-200/70" />
      <span>{children}</span>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-[1rem] border border-white/[0.055] bg-white/[0.025] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
      <p className="mb-1 text-[9px] font-medium uppercase tracking-[0.12em] text-white/30">{label}</p>
      <p className="truncate text-xs font-medium text-white/70">{value}</p>
    </div>
  );
}

function StrategyStatusPill({
  icon: Icon,
  label,
}: {
  icon: typeof TrendingUp;
  label: string;
}) {
  return (
    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-fuchsia-300/16 bg-fuchsia-400/[0.07] px-3 py-1.5 text-xs font-medium text-fuchsia-100">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </div>
  );
}

export default function StrategyPage() {
  const { activeSession, updateStage } = useActiveBuild();
  const selectedIdea = activeSession?.selected_idea;
  const ideaTitle = selectedIdea?.title ?? 'this idea';
  const ideaScore = selectedIdea?.opportunityScore ?? 88;
  const fallbackDecision = useMemo(
    () =>
      createFallbackDecision(
        ideaTitle,
        selectedIdea?.buyer ?? 'first-time buyers',
        selectedIdea?.format ?? 'Toolkit',
        selectedIdea?.priceRange ?? '$19 - $39',
        ideaScore
      ),
    [ideaScore, ideaTitle, selectedIdea?.buyer, selectedIdea?.format, selectedIdea?.priceRange]
  );
  const [decision, setDecision] = useState<StrategyDecision>(fallbackDecision);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeSection, setActiveSection] = useState<StrategySectionId>('opportunity-fit');

  const signalText = selectedIdea
    ? `${selectedIdea.title} has a ${ideaScore}/100 demand score and ${selectedIdea.verdict.toLowerCase()} signal.`
    : 'ADHD productivity tools saw 3x more searches this month.';

  const metrics = useMemo(() => buildStrategyMetrics(ideaScore, decision, selectedIdea ?? null), [decision, ideaScore, selectedIdea]);

  const scrollToSection = useCallback((sectionId: StrategySectionId) => {
    const node = document.getElementById(sectionId);
    if (!node) return;
    node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(sectionId);
  }, []);

  useEffect(() => {
    setDecision(fallbackDecision);

    if (!selectedIdea) {
      return;
    }

    let isMounted = true;
    setIsAnalyzing(true);

    runStrategist({
      ideaTitle: selectedIdea.title,
      buyer: selectedIdea.buyer,
      problem: selectedIdea.description,
      format: selectedIdea.format,
      priceRange: selectedIdea.priceRange,
      differentiator: selectedIdea.whyNow,
      notes: `Demand score: ${selectedIdea.opportunityScore ?? 'unknown'}. Signal: ${selectedIdea.verdict}. Difficulty: ${selectedIdea.difficulty}.`,
    })
      .then((output) => {
        if (!isMounted) return;
        setDecision(adaptStrategistOutput(output, fallbackDecision));
      })
      .catch(() => {
        if (!isMounted) return;
        setDecision(fallbackDecision);
      })
      .finally(() => {
        if (isMounted) setIsAnalyzing(false);
      });

    return () => {
      isMounted = false;
    };
  }, [fallbackDecision, selectedIdea]);

  useEffect(() => {
    const sections = strategySteps
      .map((item) => document.getElementById(item.id))
      .filter((node): node is HTMLElement => Boolean(node));

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio || a.boundingClientRect.top - b.boundingClientRect.top);

        if (!visible.length) return;
        const nextId = visible[0].target.id as StrategySectionId;
        setActiveSection(nextId);
      },
      {
        rootMargin: '-22% 0px -52% 0px',
        threshold: [0.15, 0.35, 0.55, 0.75],
      }
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const activeStepIndex = Math.max(
    0,
    strategySteps.findIndex((step) => step.id === activeSection)
  );
  const activeStep = strategySteps[activeStepIndex] ?? strategySteps[0];
  const focusPercent = Math.round(((activeStepIndex + 1) / strategySteps.length) * 100);
  const coachItems = [
    {
      label: isAnalyzing ? 'Strategist is analyzing market' : 'Strategist analysis ready',
      meta: isAnalyzing ? 'live now' : decision.source === 'ai' ? 'analysis complete' : 'standing by',
      active: isAnalyzing || decision.source === 'ai',
    },
    {
      label: selectedIdea ? 'Analyst is scoring opportunity' : 'Analyst waiting for opportunity',
      meta: selectedIdea ? 'signal attached' : 'waiting',
      active: Boolean(selectedIdea),
    },
    {
      label: 'Reviewer is validating recommendation',
      meta: decision.source === 'ai' ? 'watching clarity' : 'queued',
      active: true,
    },
    {
      label: coachActions[0],
      meta: 'recommended action',
      active: false,
    },
  ];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5 overflow-x-clip px-3 pb-24 pt-4 sm:px-6 lg:gap-6 lg:px-8 lg:pb-12 lg:pt-7">
      <section className="relative overflow-hidden rounded-[1.95rem] border border-white/[0.075] bg-[linear-gradient(145deg,rgba(255,255,255,0.068),rgba(255,255,255,0.023)_39%,rgba(6,6,12,0.93))] p-5 shadow-[0_34px_120px_-78px_rgba(217,70,239,0.88)] backdrop-blur-2xl sm:p-8 lg:p-10">
        <motion.div
          className="pointer-events-none absolute inset-0 opacity-75"
          animate={{ backgroundPosition: ['0% 0%', '100% 28%', '0% 0%'] }}
          transition={{ duration: 22, repeat: Number.POSITIVE_INFINITY, ease: 'linear' }}
          style={{
            backgroundImage:
              'radial-gradient(circle at 18% 24%, rgba(255,255,255,0.06) 0, transparent 18%), radial-gradient(circle at 78% 18%, rgba(217,70,239,0.18) 0, transparent 28%), radial-gradient(circle at 26% 76%, rgba(56,189,248,0.08) 0, transparent 24%)',
            backgroundSize: '150% 150%',
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_14%,rgba(217,70,239,0.16),transparent_28%),radial-gradient(circle_at_42%_0%,rgba(124,58,237,0.12),transparent_34%)]" />

        <div className="relative grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1.02fr)_minmax(22rem,0.98fr)] lg:items-center">
          <div className="min-w-0">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-fuchsia-300/16 bg-fuchsia-400/[0.07] px-3 py-1.5 text-xs font-medium text-fuchsia-100">
              <Target className="h-3.5 w-3.5" />
              Strategy studio
            </div>
            <h1 className="mb-4 max-w-3xl text-4xl font-semibold leading-[0.96] tracking-[-0.055em] text-white sm:text-5xl lg:text-6xl">
              Turn signals into a winning strategy.
            </h1>
            <p className="mb-7 max-w-2xl text-base leading-7 text-white/64 sm:text-lg">
              {selectedIdea
                ? `Define the angle for ${ideaTitle}, validate demand, and create a clear path before you build.`
                : 'Define your angle, validate demand, and create a clear path before you build.'}
            </p>

            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {strategySteps.map((item) => (
                <StrategyChip key={item.id} item={item} active={activeSection === item.id} onClick={() => scrollToSection(item.id)} />
              ))}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:max-w-2xl">
              <div className="rounded-[1.25rem] border border-white/[0.08] bg-black/20 px-4 py-3.5 backdrop-blur-md">
                <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-white/34">Current focus</p>
                <p className="mt-1 text-sm font-semibold text-white">{activeStep.label}</p>
              </div>
              <div className="rounded-[1.25rem] border border-fuchsia-300/12 bg-fuchsia-400/[0.06] px-4 py-3.5 backdrop-blur-md">
                <p className="text-[10px] font-medium uppercase tracking-[0.15em] text-fuchsia-100/58">Live strategy signal</p>
                <p className="mt-1 truncate text-sm text-white/76">{signalText}</p>
              </div>
            </div>
          </div>

          <div className="min-w-0 lg:pl-3">
            <StrategyAtlasVisual activeLabel={activeStep.label} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-5">
          <SectionShell
            id="opportunity-fit"
            title="Does this idea have real potential?"
            eyebrow="Opportunity fit"
            description={
              selectedIdea
                ? `A clearer read on demand, timing, positioning, and what to build first for ${ideaTitle}.`
                : 'A clearer read on demand, timing, positioning, and what to build first.'
            }
          >
            <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0" />
              <StrategyStatusPill icon={TrendingUp} label={activeStep.label} />
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-5">
              {metrics.map((item, index) => (
                <InsightCard key={item.label} item={item} index={index} />
              ))}
            </div>

            <div className="mt-5 flex items-start gap-3 rounded-[1.4rem] border border-fuchsia-300/14 bg-fuchsia-400/[0.065] p-4 text-sm leading-6 text-white/72">
              <CircleDot className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-200" />
              <span>{signalText}</span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryBox label="Opportunity" value={ideaTitle} />
              <SummaryBox label="Demand Score" value={`${ideaScore}/100`} />
              <SummaryBox label="Momentum" value={selectedIdea?.verdict ?? 'High'} />
              <SummaryBox label="Confidence" value={decision.source === 'ai' ? 'AI analyzed' : 'Fallback ready'} />
            </div>
          </SectionShell>

          <SectionShell
            id="market-angle"
            title="Audience and angle"
            eyebrow="Market angle"
            description="Understand who this is for and what first offer format gives the clearest buyer outcome."
          >
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <ContentCard title="Audience Intelligence" eyebrow="Who this is for">
                <DetailRow label="Primary" value={decision.audience.primary} />
                <DetailRow label="Secondary" value={decision.audience.secondary} />
                <DetailRow label="Buying motivation" value={decision.audience.motivation} />
                <div className="mt-4 space-y-2.5">
                  {decision.audience.frustrations.slice(0, 3).map((item) => (
                    <BulletLine key={item}>{item}</BulletLine>
                  ))}
                </div>
              </ContentCard>

              <ContentCard title="Product Recommendation" eyebrow="Best first format">
                <DetailRow label="Best product type" value={decision.productType.best} />
                <p className="mt-4 text-sm leading-7 text-white/58">{decision.productType.reason}</p>
              </ContentCard>
            </div>
          </SectionShell>

          <SectionShell
            id="mvp-plan"
            title="Pain and product shape"
            eyebrow="MVP plan"
            description="Keep the first version close to the buyer’s strongest pressure points and easiest decision path."
          >
            <div className="space-y-5">
              <ContentCard title="Pain Point Analysis" eyebrow="Where the buyer feels the problem">
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {decision.pains.map((pain) => (
                    <div key={pain.pain} className="rounded-[1.35rem] border border-white/[0.06] bg-black/18 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                      <p className="text-lg font-medium leading-8 text-white">{pain.pain}</p>
                      <div className="mt-4 grid grid-cols-3 gap-2.5">
                        <MiniMetric label="Severity" value={pain.severity} />
                        <MiniMetric label="Urgency" value={pain.urgency} />
                        <MiniMetric label="Buy" value={pain.likelihood} />
                      </div>
                    </div>
                  ))}
                </div>
              </ContentCard>

              <ContentCard title="Positioning Engine" eyebrow="How WIZUP would frame it">
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(18rem,0.95fr)]">
                  <div>
                    <p className="rounded-[1.35rem] border border-fuchsia-300/12 bg-fuchsia-400/[0.055] p-4 text-sm leading-7 text-white/72">
                      {decision.positioning.statement}
                    </p>
                    <div className="mt-4 space-y-2.5">
                      {decision.positioning.alternatives.slice(0, 3).map((angle) => (
                        <BulletLine key={angle}>{angle}</BulletLine>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-[1.35rem] border border-white/[0.06] bg-black/18 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                    <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/30">Positioning read</p>
                    <p className="mt-3 text-sm leading-7 text-white/62">
                      The product angle should stay narrow, beginner-friendly, and immediately useful so the offer reads as calm direction rather than more work.
                    </p>
                  </div>
                </div>
              </ContentCard>
            </div>
          </SectionShell>

          <SectionShell
            id="go-to-market"
            title="Pricing and launch risk"
            eyebrow="Go-To-Market"
            description="Define the first pricing path, then pressure-test what could slow the launch down."
          >
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <ContentCard title="Monetization Plan" eyebrow="Pricing path">
                <div className="grid grid-cols-2 gap-2.5">
                  <MiniMetric label="Entry" value={decision.monetization.entry} />
                  <MiniMetric label="Premium" value={decision.monetization.premium} />
                  <MiniMetric label="Upsell" value={decision.monetization.upsell} />
                  <MiniMetric label="LTV" value={decision.monetization.ltv} />
                </div>
                <p className="mt-4 text-sm leading-7 text-white/54">{decision.monetization.bundle}</p>
              </ContentCard>

              <ContentCard title="Risk Assessment" eyebrow="What could slow this down">
                <DetailRow label="Competition" value={decision.risks.competition} />
                <DetailRow label="Execution" value={decision.risks.execution} />
                <DetailRow label="Audience" value={decision.risks.audience} />
              </ContentCard>
            </div>
          </SectionShell>

          <SectionShell
            id="success-metrics"
            title="What WIZUP would build next"
            eyebrow="Success metrics"
            description="Pull the recommendation into one clear build direction, then move directly into Build."
          >
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <ContentCard title="What WIZUP would build" eyebrow="Recommendation" accent>
                <h3 className="text-[2.1rem] font-semibold leading-tight tracking-[-0.05em] text-white">
                  {decision.recommendation.build}
                </h3>
                <div className="mt-5 space-y-3">
                  {decision.recommendation.reasons.slice(0, 3).map((reason) => (
                    <BulletLine key={reason}>{reason}</BulletLine>
                  ))}
                </div>
              </ContentCard>

              <div className="relative overflow-hidden rounded-[1.6rem] border border-white/[0.07] bg-[linear-gradient(145deg,rgba(255,255,255,0.056),rgba(255,255,255,0.022)_48%,rgba(0,0,0,0.2))] p-5 shadow-[0_28px_84px_-64px_rgba(217,70,239,0.72)] backdrop-blur-xl sm:p-6">
                <div className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-fuchsia-400/10 blur-3xl" />
                <div className="relative min-w-0">
                  <h2 className="text-[2rem] font-semibold tracking-[-0.045em] text-white sm:text-[2.2rem]">Ready to move forward?</h2>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-white/56">
                    {selectedIdea ? `${ideaTitle} is ready for positioning and a first build plan.` : 'This opportunity looks promising. Let’s define your positioning.'}
                  </p>
                </div>
                <div className="relative mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <Button
                    variant="outline"
                    className="h-12 w-full rounded-xl border-white/[0.09] bg-white/[0.035] px-5 text-white hover:bg-white/[0.07] sm:w-auto sm:flex-none"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Save Strategy
                  </Button>
                  <Link href="/app/build" onClick={() => updateStage('build')} className="flex w-full sm:w-auto sm:flex-none">
                    <Button className="h-12 w-full min-w-0 rounded-xl bg-fuchsia-500 px-5 font-semibold text-white shadow-[0_0_24px_-11px_rgba(217,70,239,0.86)] transition-all hover:bg-fuchsia-400 sm:min-w-[13.5rem] sm:w-auto">
                      Continue to Build
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </SectionShell>
        </div>

        <div className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <SidebarCard title="Strategy Progress" eyebrow="Current focus">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-base font-medium text-white">{activeStep.label}</p>
                <p className="mt-1 text-sm text-white/46">Section {activeStepIndex + 1} of {strategySteps.length}</p>
              </div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-fuchsia-300/18 bg-black/32 text-sm font-semibold text-white shadow-[inset_0_0_20px_rgba(217,70,239,0.12)]">
                {focusPercent}%
              </div>
            </div>
            <div className="mb-5 h-2 overflow-hidden rounded-full bg-white/[0.065]">
              <motion.div
                className="h-full rounded-full bg-fuchsia-400 shadow-[0_0_16px_rgba(217,70,239,0.62)]"
                animate={{ width: `${focusPercent}%` }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
            <div className="space-y-2.5">
              {strategySteps.map((step, index) => {
                const isActive = step.id === activeSection;
                const isPast = index < activeStepIndex;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => scrollToSection(step.id)}
                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition-colors ${
                      isActive
                        ? 'border-fuchsia-300/18 bg-fuchsia-400/[0.08]'
                        : 'border-white/[0.055] bg-black/16 hover:border-white/12 hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full border text-[11px] font-semibold ${
                          isActive
                            ? 'border-fuchsia-300/30 bg-fuchsia-400/16 text-fuchsia-100'
                            : isPast
                              ? 'border-white/12 bg-white/[0.05] text-white/76'
                              : 'border-white/10 bg-white/[0.03] text-white/36'
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <p className={isActive || isPast ? 'text-sm font-medium text-white/82' : 'text-sm font-medium text-white/48'}>{step.label}</p>
                        <p className="text-[10px] uppercase tracking-[0.14em] text-white/26">{step.eyebrow}</p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.14em] text-white/28">
                      {isActive ? 'live' : isPast ? 'viewed' : 'next'}
                    </span>
                  </button>
                );
              })}
            </div>
          </SidebarCard>

          <SidebarCard title="AI Strategy Coach" eyebrow="Team activity">
            <div className="space-y-2.5">
              {coachItems.map((item) => (
                <div
                  key={item.label}
                  className={`flex items-start gap-3 rounded-xl border px-3 py-3 ${
                    item.active ? 'border-fuchsia-300/18 bg-fuchsia-400/[0.055]' : 'border-white/[0.065] bg-black/20'
                  }`}
                >
                  <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${item.active ? 'bg-fuchsia-300 shadow-[0_0_12px_rgba(217,70,239,0.78)]' : 'bg-white/22'}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-white/78">{item.label}</span>
                    <span className="mt-1 block text-[11px] uppercase tracking-[0.12em] text-white/34">{item.meta}</span>
                  </span>
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-200/80" />
                </div>
              ))}
            </div>
          </SidebarCard>

          <SidebarCard title="Strategy Templates" eyebrow="Reusable starts">
            <div className="space-y-2.5">
              {templates.map((template) => (
                <button
                  key={template}
                  type="button"
                  className="flex w-full items-center justify-between rounded-xl border border-white/[0.065] bg-black/20 px-3 py-3 text-left text-sm text-white/68 transition-colors hover:border-white/12 hover:bg-white/[0.045] hover:text-white"
                >
                  <span className="inline-flex min-w-0 items-center gap-3">
                    <FileText className="h-4 w-4 shrink-0 text-white/42" />
                    <span className="truncate">{template}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-white/34" />
                </button>
              ))}
            </div>
          </SidebarCard>
        </div>
      </section>
    </div>
  );
}
