'use client';

import React, { useEffect, use, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Hammer,
  Lightbulb,
  Loader2,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';

import { getIdeaById, getOpportunityFromMetadata } from '@/app/actions/ideas';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';

const TREND_DATA = [
  { name: 'Jan', demand: 40 },
  { name: 'Feb', demand: 55 },
  { name: 'Mar', demand: 45 },
  { name: 'Apr', demand: 70 },
  { name: 'May', demand: 85 },
  { name: 'Jun', demand: 110 },
];

type IdeaDetail = {
  id: string;
  title: string;
  description: string;
  ai_metadata: unknown;
  created_at: string;
  updated_at: string;
};

type Opportunity = {
  id: string;
  title: string;
  buyer: string;
  problem: string;
  format: string;
  priceRange: string;
  opportunityScore: number | string;
  difficulty: string;
  verdict: string;
  whyNow: string;
};

type MetadataRecord = Record<string, unknown>;

function asRecord(value: unknown): MetadataRecord | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as MetadataRecord)
    : null;
}

export default function IdeaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [idea, setIdea] = useState<IdeaDetail | null>(null);
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadIdea() {
      setIsLoading(true);
      setError(null);

      const result = await getIdeaById(id);

      if (!isMounted) {
        return;
      }

      if (result.error) {
        setError(result.error);
        setIdea(null);
        setOpportunity(null);
        setIsLoading(false);
        return;
      }

      if (!result.idea) {
        setIdea(null);
        setOpportunity(null);
        setIsLoading(false);
        return;
      }

      const nextOpportunity = await getOpportunityFromMetadata(result.idea.ai_metadata);

      if (!isMounted) {
        return;
      }

      setIdea(result.idea);
      setOpportunity(nextOpportunity);
      setIsLoading(false);
    }

    loadIdea();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const metadata = asRecord(idea?.ai_metadata);
  const scout = asRecord(metadata?.scout);

  const scoreValue = Number(opportunity?.opportunityScore ?? 0) || 0;
  const verdict = opportunity?.verdict || 'Unknown';
  const buyer = opportunity?.buyer || 'Unknown';
  const price = opportunity?.priceRange || 'TBD';
  const difficulty = opportunity?.difficulty || 'Unknown';
  const whyNow =
    opportunity?.whyNow ||
    'This idea has enough signal to validate quickly with a focused landing page and a simple first version.';
  const whatToBuildTitle = opportunity?.title || idea?.title || 'Launch-ready digital product';
  const productFormat = opportunity?.format || 'Digital download or lightweight template pack';
  const includedAssets =
    opportunity?.problem ||
    'Start with a focused first version that solves one sharp buyer pain point clearly.';
  const competitorWeaknesses =
    (typeof scout?.competitorWeaknesses === 'string' && scout.competitorWeaknesses) ||
    'Most alternatives feel generic, overloaded, or poorly matched to the buyer’s actual workflow.';
  const strongerAngle =
    (typeof scout?.strongerAngle === 'string' && scout.strongerAngle) ||
    whyNow;
  const bonusIdea =
    (typeof scout?.bonusIdea === 'string' && scout.bonusIdea) ||
    'Add a short quick-start guide or example workflow so the buyer gets value immediately.';

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-6xl flex-col items-center justify-center p-4 text-center sm:p-6 lg:p-8">
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground lg:text-base">Loading idea details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-6xl flex-col items-center justify-center p-4 text-center sm:p-6 lg:p-8">
        <p className="mb-4 text-lg font-medium text-white">Unable to load this idea</p>
        <p className="mb-6 max-w-md text-sm text-muted-foreground lg:text-base">{error}</p>
        <Link href="/app/find">
          <Button>Back to find</Button>
        </Link>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-6xl flex-col items-center justify-center p-4 text-center sm:p-6 lg:p-8">
        <p className="mb-2 text-lg font-medium text-white">Idea not found</p>
        <p className="mb-6 max-w-md text-sm text-muted-foreground lg:text-base">
          This saved idea may have been removed or is no longer available.
        </p>
        <Link href="/app/find">
          <Button>Back to find</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto pb-24 lg:pb-8">
      <div className="mb-6 lg:mb-8">
        <Link href="/app/ideas" className="inline-flex items-center text-sm text-muted-foreground hover:text-white mb-4 sm:mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to ideas
        </Link>
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 lg:gap-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-medium text-white mb-1 lg:mb-2 leading-tight">{idea.title}</h1>
            <p className="text-sm lg:text-lg text-muted-foreground">{idea.description}</p>
          </div>
          <div className="flex gap-3 w-full lg:w-auto mt-2 lg:mt-0">
            <Button variant="outline" disabled className="border-white/10 text-white hover:bg-white/5 flex-1 lg:flex-none">
              Already saved
            </Button>
            <Link href="/app/create" className="flex-1 lg:flex-none">
              <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                Build this product
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4 mb-8 lg:mb-10">
        <Card className="p-4 bg-card border-white/5 flex flex-col items-center justify-center text-center">
          <span className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Score</span>
          <span className="text-2xl sm:text-3xl font-bold text-amber-500">{scoreValue}</span>
        </Card>
        <Card className="p-4 bg-card border-white/5 flex flex-col items-center justify-center text-center">
          <span className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Next step</span>
          <Badge variant="outline" className="mt-1 text-emerald-500 bg-emerald-500/10 border-emerald-500/20 px-2 py-0.5 text-[10px] sm:text-xs">{verdict}</Badge>
        </Card>
        <Card className="p-4 bg-card border-white/5 flex flex-col items-center justify-center text-center col-span-2 sm:col-span-1">
          <span className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Target Buyer</span>
          <span className="text-sm sm:text-base font-medium text-white">{buyer}</span>
        </Card>
        <Card className="p-4 bg-card border-white/5 flex flex-col items-center justify-center text-center">
          <span className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Suggested Price</span>
          <span className="text-sm sm:text-base font-medium text-white">{price}</span>
        </Card>
        <Card className="p-4 bg-card border-white/5 flex flex-col items-center justify-center text-center">
          <span className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Difficulty</span>
          <span className="text-sm sm:text-base font-medium text-white">{difficulty}</span>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8 mb-4 lg:mb-8">
        {/* Why this could sell */}
        <Card className="p-4 sm:p-6 bg-card border-white/5">
          <div className="flex items-center gap-2 mb-4 lg:mb-6">
            <Target className="w-5 h-5 text-primary shrink-0" />
            <h2 className="text-lg lg:text-xl font-medium text-white">Why this could sell</h2>
          </div>
          <ul className="space-y-3 sm:space-y-4">
            <li className="flex gap-3 text-sm sm:text-base text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0 mt-1 sm:mt-0.5" />
              <span>{whyNow}</span>
            </li>
            <li className="flex gap-3 text-sm sm:text-base text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0 mt-1 sm:mt-0.5" />
              <span>{buyer !== 'Unknown' ? `${buyer} have a clearly defined problem worth solving.` : 'The buyer signal is broad enough to test demand without a large upfront build.'}</span>
            </li>
            <li className="flex gap-3 text-sm sm:text-base text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0 mt-1 sm:mt-0.5" />
              <span>{opportunity?.problem || 'There is room to position this offer around a sharper, more specific pain point than generic alternatives address.'}</span>
            </li>
            <li className="flex gap-3 text-sm sm:text-base text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0 mt-1 sm:mt-0.5" />
              <span>{price !== 'TBD' ? `The ${price} price range is realistic for a first-market offer.` : 'This can start as a lightweight offer with a simple pricing test.'}</span>
            </li>
          </ul>
        </Card>

        {/* Market Evidence */}
        <Card className="p-4 sm:p-6 bg-card border-white/5">
          <div className="flex items-center gap-2 mb-4 lg:mb-6">
            <TrendingUp className="w-5 h-5 text-amber-500 shrink-0" />
            <h2 className="text-lg lg:text-xl font-medium text-white">Market evidence</h2>
          </div>
          <ul className="space-y-3 sm:space-y-4">
            <li className="flex gap-3 text-sm sm:text-base text-muted-foreground">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0 mt-1 sm:mt-0.5" />
              <span>High search volume for "adhd planner printable" on digital marketplaces.</span>
            </li>
            <li className="flex gap-3 text-sm sm:text-base text-muted-foreground">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0 mt-1 sm:mt-0.5" />
              <span>Common complaint in reviews: "too many pages, overwhelms me."</span>
            </li>
            <li className="flex gap-3 text-sm sm:text-base text-muted-foreground flex-col">
              <div className="flex gap-3">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground shrink-0 mt-1 sm:mt-0.5" />
                <span>Trend direction is strongly upwards for neurodivergent-friendly tools.</span>
              </div>
              <div className="h-40 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={TREND_DATA} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorDemand" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                      itemStyle={{ color: '#f4f4f5' }}
                    />
                    <Area type="monotone" dataKey="demand" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorDemand)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </li>
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-8">
        {/* What to build */}
        <Card className="p-4 sm:p-6 bg-card border-white/5">
          <div className="flex items-center gap-2 mb-4 lg:mb-6">
            <Hammer className="w-5 h-5 text-primary shrink-0" />
            <h2 className="text-lg lg:text-xl font-medium text-white">What to build</h2>
          </div>
          <div className="space-y-3 lg:space-y-4">
            <div>
              <span className="text-xs sm:text-sm font-medium text-muted-foreground block mb-1">Recommended Title</span>
              <p className="text-sm sm:text-base font-medium text-white">{whatToBuildTitle}</p>
            </div>
            <div>
              <span className="text-xs sm:text-sm font-medium text-muted-foreground block mb-1">Product Format</span>
              <p className="text-sm sm:text-base text-white">{productFormat}</p>
            </div>
            <div>
              <span className="text-xs sm:text-sm font-medium text-muted-foreground block mb-1">Included Assets</span>
              <p className="text-sm sm:text-base text-white">{includedAssets}</p>
            </div>
          </div>
        </Card>

        {/* How to stand out */}
        <Card className="p-4 sm:p-6 bg-card border-white/5">
          <div className="flex items-center gap-2 mb-4 lg:mb-6">
            <Lightbulb className="w-5 h-5 text-amber-500 shrink-0" />
            <h2 className="text-lg lg:text-xl font-medium text-white">How to stand out</h2>
          </div>
          <div className="space-y-3 lg:space-y-4">
            <div>
              <span className="text-xs sm:text-sm font-medium text-muted-foreground block mb-1">Competitor Weaknesses</span>
              <p className="text-sm sm:text-base text-white">{competitorWeaknesses}</p>
            </div>
            <div>
              <span className="text-xs sm:text-sm font-medium text-muted-foreground block mb-1">Stronger Angle</span>
              <p className="text-sm sm:text-base text-white">{strongerAngle}</p>
            </div>
            <div>
              <span className="text-xs sm:text-sm font-medium text-muted-foreground block mb-1">Bonus Idea</span>
              <p className="text-sm sm:text-base text-white">{bonusIdea}</p>
            </div>
          </div>
        </Card>
      </div>

    </div>
  );
}
