'use client';

import React from 'react';
import Link from 'next/link';
import { Search, SlidersHorizontal, ArrowUpRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

const MOCK_IDEAS = [
  {
    id: 1,
    name: 'Minimalist ADHD Planner',
    buyer: 'Adults with ADHD',
    format: 'Printable template',
    price: '$15 - $25',
    score: 92,
    difficulty: 'Easy',
    verdict: 'Build now',
    verdictColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
  },
  {
    id: 2,
    name: 'Canva Social Media Kit',
    buyer: 'Local businesses',
    format: 'Template pack',
    price: '$29 - $49',
    score: 84,
    difficulty: 'Medium',
    verdict: 'Build now',
    verdictColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
  },
  {
    id: 3,
    name: 'Fitness tracker spreadsheet',
    buyer: 'Gym beginners',
    format: 'Spreadsheet',
    price: '$5 - $10',
    score: 61,
    difficulty: 'Medium',
    verdict: 'Refine first',
    verdictColor: 'text-amber-500 bg-amber-500/10 border-amber-500/20'
  },
  {
    id: 4,
    name: 'Complete coding bootcamp',
    buyer: 'Junior devs',
    format: 'Video course',
    price: '$199+',
    score: 45,
    difficulty: 'Hard',
    verdict: 'Skip',
    verdictColor: 'text-red-500 bg-red-500/10 border-red-500/20'
  }
];

export default function RadarPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto h-full flex flex-col pb-24 lg:pb-8">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl font-medium text-white mb-2">Find product ideas people want</h1>
        <p className="text-muted-foreground text-base lg:text-lg">Search a niche, audience, or problem. WIZUP will score the best opportunities.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 mb-6 lg:mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Search a niche, problem, or audience..." 
            className="pl-12 h-12 lg:h-14 text-base lg:text-lg bg-card border-white/10 rounded-xl w-full"
          />
        </div>
        <div className="flex gap-3">
          <Button size="lg" variant="outline" className="h-12 lg:h-14 px-4 lg:px-6 border-white/10 bg-card hover:bg-white/5 shrink-0 gap-2 flex-1 sm:flex-none">
            <SlidersHorizontal className="w-5 h-5" />
            <span className="hidden sm:inline">Filters</span>
          </Button>
          <Button size="lg" className="h-12 lg:h-14 px-6 lg:px-8 shrink-0 flex-1 sm:flex-none">
            Scan Market
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        <Badge variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 px-3 py-1 cursor-pointer shrink-0">Market: All</Badge>
        <Badge variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 px-3 py-1 cursor-pointer shrink-0">Product type: All</Badge>
        <Badge variant="outline" className="bg-white/5 border-white/10 hover:bg-white/10 px-3 py-1 cursor-pointer shrink-0">Score: 80+</Badge>
      </div>

      {/* Desktop Table (hidden on mobile) */}
      <div className="hidden lg:flex flex-col rounded-xl border border-white/5 bg-card overflow-hidden flex-1">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-white/5 text-sm font-medium text-muted-foreground bg-white/[0.02]">
          <div className="col-span-3">Idea</div>
          <div className="col-span-2">Buyer</div>
          <div className="col-span-2">Best format</div>
          <div className="col-span-2">Price</div>
          <div className="col-span-1 text-center">Score</div>
          <div className="col-span-2 text-right">Next step</div>
        </div>

        <div className="divide-y divide-white/5">
          {MOCK_IDEAS.map((idea) => (
            <Link 
              key={idea.id} 
              href={`/studio/radar/${idea.id}`}
              className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/[0.02] transition-colors group"
            >
              <div className="col-span-3 font-medium text-white group-hover:text-primary transition-colors flex items-center gap-2">
                {idea.name}
                <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="col-span-2 text-muted-foreground text-sm">{idea.buyer}</div>
              <div className="col-span-2 text-muted-foreground text-sm">{idea.format}</div>
              <div className="col-span-2 text-muted-foreground text-sm">{idea.price}</div>
              <div className="col-span-1 flex justify-center">
                <span className={`font-medium ${idea.score >= 80 ? 'text-amber-500' : 'text-white'}`}>
                  {idea.score}
                </span>
              </div>
              <div className="col-span-2 flex justify-end">
                <Badge variant="outline" className={`px-2.5 py-0.5 rounded-full border ${idea.verdictColor}`}>
                  {idea.verdict}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile Idea Cards (hidden on lg) */}
      <div className="flex flex-col gap-4 lg:hidden">
        {MOCK_IDEAS.map((idea) => (
          <Link 
            key={idea.id} 
            href={`/studio/radar/${idea.id}`}
            className="flex flex-col bg-card border border-white/5 rounded-xl p-4 sm:p-5 hover:border-white/10 transition-colors gap-4"
          >
            <div className="flex justify-between items-start gap-4">
              <h3 className="font-medium text-white text-base leading-tight">{idea.name}</h3>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-white/5 shrink-0`}>
                <span className={`text-xs font-bold ${idea.score >= 80 ? 'text-amber-500' : 'text-white'}`}>{idea.score}</span>
              </div>
            </div>
            
            <div className="space-y-1.5 flex-1">
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Buyer</span>
                <span className="text-white/80 font-medium text-right">{idea.buyer}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Format</span>
                <span className="text-white/80 font-medium text-right">{idea.format}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Price</span>
                <span className="text-white/80 font-medium text-right">{idea.price}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/5 flex items-center justify-between mt-auto">
              <Badge variant="outline" className={`px-2.5 py-1 rounded-full border text-[11px] ${idea.verdictColor}`}>
                {idea.verdict}
              </Badge>
              <div className="text-primary text-xs font-medium flex items-center gap-1 group-hover:gap-1.5 transition-all">
                Details <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
