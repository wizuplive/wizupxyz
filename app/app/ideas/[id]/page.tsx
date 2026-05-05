'use client';

import React, { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Target, TrendingUp, Users, CheckCircle2, AlertTriangle, Lightbulb, Hammer } from 'lucide-react';
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

export default function IdeaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto pb-24 lg:pb-8">
      <div className="mb-6 lg:mb-8">
        <Link href="/app/ideas" className="inline-flex items-center text-sm text-muted-foreground hover:text-white mb-4 sm:mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to ideas
        </Link>
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 lg:gap-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-medium text-white mb-1 lg:mb-2 leading-tight">Minimalist ADHD Planner</h1>
            <p className="text-sm lg:text-lg text-muted-foreground">A printable template system designed for adults with ADHD.</p>
          </div>
          <div className="flex gap-3 w-full lg:w-auto mt-2 lg:mt-0">
            <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 flex-1 lg:flex-none">
              Save idea
            </Button>
            <Link href="/app/product" className="flex-1 lg:flex-none">
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
          <span className="text-2xl sm:text-3xl font-bold text-amber-500">92</span>
        </Card>
        <Card className="p-4 bg-card border-white/5 flex flex-col items-center justify-center text-center">
          <span className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Next step</span>
          <Badge variant="outline" className="mt-1 text-emerald-500 bg-emerald-500/10 border-emerald-500/20 px-2 py-0.5 text-[10px] sm:text-xs">Build now</Badge>
        </Card>
        <Card className="p-4 bg-card border-white/5 flex flex-col items-center justify-center text-center col-span-2 sm:col-span-1">
          <span className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Target Buyer</span>
          <span className="text-sm sm:text-base font-medium text-white">Adults with ADHD</span>
        </Card>
        <Card className="p-4 bg-card border-white/5 flex flex-col items-center justify-center text-center">
          <span className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Suggested Price</span>
          <span className="text-sm sm:text-base font-medium text-white">$15 - $25</span>
        </Card>
        <Card className="p-4 bg-card border-white/5 flex flex-col items-center justify-center text-center">
          <span className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">Difficulty</span>
          <span className="text-sm sm:text-base font-medium text-white">Easy</span>
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
              <span>Buyers have a clear, daily pain point (overwhelming tasks).</span>
            </li>
            <li className="flex gap-3 text-sm sm:text-base text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0 mt-1 sm:mt-0.5" />
              <span>The product is easy to explain and instantly delivery.</span>
            </li>
            <li className="flex gap-3 text-sm sm:text-base text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0 mt-1 sm:mt-0.5" />
              <span>Existing products leave gaps (they are too complex).</span>
            </li>
            <li className="flex gap-3 text-sm sm:text-base text-muted-foreground">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0 mt-1 sm:mt-0.5" />
              <span>The price range is realistic for impulse buys.</span>
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
              <p className="text-sm sm:text-base font-medium text-white">The Anti-Overwhelm Daily Planner</p>
            </div>
            <div>
              <span className="text-xs sm:text-sm font-medium text-muted-foreground block mb-1">Product Format</span>
              <p className="text-sm sm:text-base text-white">Printable PDF & Notion Template</p>
            </div>
            <div>
              <span className="text-xs sm:text-sm font-medium text-muted-foreground block mb-1">Included Assets</span>
              <p className="text-sm sm:text-base text-white">Daily brain dump, hyper-focus tracker, priority matrix.</p>
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
              <p className="text-sm sm:text-base text-white">Most competitors use distracting colors and complex 24-hour schedules.</p>
            </div>
            <div>
              <span className="text-xs sm:text-sm font-medium text-muted-foreground block mb-1">Stronger Angle</span>
              <p className="text-sm sm:text-base text-white">Focus completely on minimal, high-contrast, black-and-white designs with generous whitespace.</p>
            </div>
            <div>
              <span className="text-xs sm:text-sm font-medium text-muted-foreground block mb-1">Bonus Idea</span>
              <p className="text-sm sm:text-base text-white">Include a quick-start guide on "how to plan when your brain says no".</p>
            </div>
          </div>
        </Card>
      </div>

    </div>
  );
}
