'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BarChart3, Bot, ArrowRight } from 'lucide-react';

export default function AppDashboard() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8 flex-1 pb-20 lg:pb-8">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight mb-2 text-white">Your product workspace</h1>
          <p className="text-sm lg:text-base text-white/50">See your best ideas, product drafts, and sales progress in one place.</p>
        </div>
        <Link href="/app/product" className="w-full lg:w-auto mt-2 lg:mt-0">
          <Button className="w-full lg:w-auto px-6 h-12 lg:h-10 bg-white text-black font-semibold rounded-lg text-sm hover:bg-gray-200 transition-colors">
            + New Build
          </Button>
        </Link>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-white/5 p-5 rounded-2xl">
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-3">Ideas Searched</p>
          <div className="text-2xl font-bold text-white">14</div>
          <div className="mt-2 flex items-center text-[10px] text-emerald-400"><span className="mr-1">+2</span> this week</div>
        </div>
        <div className="bg-card border border-white/5 p-5 rounded-2xl">
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-3">Strong Signals</p>
          <div className="text-2xl font-bold text-white">03</div>
          <div className="mt-2 flex items-center text-[10px] text-amber-400 font-medium"><span className="mr-1">🔥</span> High demand</div>
        </div>
        <div className="bg-card border border-white/5 p-5 rounded-2xl">
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-3">Active Drafts</p>
          <div className="text-2xl font-bold text-white">01</div>
          <div className="mt-2 flex items-center text-[10px] text-white/40">1 in drafting</div>
        </div>
        <div className="bg-card border border-white/5 p-5 rounded-2xl border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]">
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-3">Top Recommendation</p>
          <div className="text-lg font-bold text-white truncate text-ellipsis">ADHD Planner</div>
          <Link href="/app/ideas/1" className="mt-2 flex items-center text-[10px] text-emerald-400 font-medium hover:underline">Review idea <ArrowRight className="w-3 h-3 ml-1" /></Link>
        </div>
      </div>

      {/* Dashboard Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:h-[340px]">
        {/* Active Build Card */}
        <div className="lg:col-span-3 bg-card border border-white/5 rounded-2xl p-5 lg:p-6 flex flex-col relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px]"></div>
          <div className="flex justify-between items-start mb-6 relative z-10">
            <div>
              <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded uppercase tracking-wider mb-2 lg:mb-3 inline-block">Currently in Product</span>
              <h2 className="text-lg lg:text-xl font-bold leading-tight text-white pr-4">Freelance Proposal Template</h2>
            </div>
            <div className="text-right shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>
          
          <div className="space-y-4 mb-auto relative z-10">
            <div className="flex items-center gap-4">
              <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[45%]"></div>
              </div>
              <span className="text-xs font-mono text-white/50">45% Complete</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                <p className="text-[10px] text-white/40 mb-1">Current Step</p>
                <p className="text-xs font-medium text-white">Product Drafting</p>
              </div>
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                <p className="text-[10px] text-white/40 mb-1">Next Up</p>
                <p className="text-xs font-medium text-white">Design Inspiration</p>
              </div>
            </div>
          </div>

          <Link href="/app/product" className="w-full mt-6 relative z-10">
            <Button variant="outline" className="w-full py-3 h-auto bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-all text-white">
              Continue Building
            </Button>
          </Link>
        </div>

        {/* AI Team Feed */}
        <div className="lg:col-span-2 bg-card border border-white/5 rounded-2xl p-5 lg:p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-white/60">Recent AI Team updates</h3>
            </div>
            <Link href="/app/ai-team" className="text-[10px] text-white/30 hover:text-white transition-colors">View all</Link>
          </div>
          
          <div className="space-y-4 flex-1 mt-2">
            <div className="flex gap-3">
              <div className="mt-0.5 shrink-0">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div>
                <p className="text-[11px] leading-relaxed text-white/80 font-medium">Scout found 42 buyer questions</p>
                <p className="text-[9px] text-white/30 mt-1">About toddler sleep routines on community forums.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="mt-0.5 shrink-0">
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>
              <div>
                <p className="text-[11px] leading-relaxed text-white/80 font-medium">Strategist scored your new idea</p>
                <p className="text-[9px] text-white/30 mt-1">"Morning Routine Checklist" scored 78/100.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="mt-0.5 shrink-0">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
              <div>
                <p className="text-[11px] leading-relaxed text-white/80 font-medium">Analyst flagged high competition</p>
                <p className="text-[9px] text-white/30 mt-1">General productivity planners are saturated.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
