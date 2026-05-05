'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dna, AlertCircle, Quote, TrendingUp, CheckCircle2 } from 'lucide-react';

export default function StudyWinnersPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto pb-24 lg:pb-8">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-medium text-white mb-1 lg:mb-2">Study what already works</h1>
        <p className="text-sm lg:text-lg text-muted-foreground mb-4 sm:mb-6">See the patterns behind high-performing digital products — then build something original.</p>
        
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 text-xs sm:text-sm text-primary w-full sm:w-auto">
          <Dna className="w-4 h-4 shrink-0" />
          <span className="leading-tight">WIZUP helps you learn from the market, then create something original.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8 mb-4 lg:mb-8">
        {/* Title Patterns */}
        <Card className="p-4 sm:p-6 bg-card border-white/5">
          <h2 className="text-lg lg:text-xl font-medium text-white mb-4 lg:mb-6">Title patterns that work</h2>
          <div className="space-y-3 lg:space-y-4">
            <div className="p-3 lg:p-4 rounded-lg bg-white/[0.02] border border-white/5">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Pattern: [Adjective] [Noun] for [Specific Person]</p>
              <p className="text-sm sm:text-base font-medium text-white">"Minimalist Planner for ADHD Adults"</p>
            </div>
            <div className="p-3 lg:p-4 rounded-lg bg-white/[0.02] border border-white/5">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Pattern: The [Timeframe] [Result] System</p>
              <p className="text-sm sm:text-base font-medium text-white">"The 30-Day Content System"</p>
            </div>
            <div className="p-3 lg:p-4 rounded-lg bg-white/[0.02] border border-white/5">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1">Pattern: [Action] Your [Pain Point]</p>
              <p className="text-sm sm:text-base font-medium text-white">"Simplify Your Meal Prep"</p>
            </div>
          </div>
        </Card>

        {/* Format & Price */}
        <div className="space-y-4 lg:space-y-8">
          <Card className="p-4 sm:p-6 bg-card border-white/5">
            <h2 className="text-lg lg:text-xl font-medium text-white mb-4 lg:mb-6">Common formats and prices</h2>
            <div className="flex flex-col gap-3 lg:gap-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-sm sm:text-base font-medium text-white">Printable Templates</span>
                <span className="text-sm sm:text-base text-muted-foreground">$10 - $25</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-sm sm:text-base font-medium text-white">Notion Dashboards</span>
                <span className="text-sm sm:text-base text-muted-foreground">$29 - $49</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5">
                <span className="text-sm sm:text-base font-medium text-white">Mini-Courses</span>
                <span className="text-sm sm:text-base text-muted-foreground">$49 - $99</span>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:p-6 bg-card border-white/5">
            <h2 className="text-lg lg:text-xl font-medium text-white mb-3 lg:mb-4">Common bonuses</h2>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-white/5 border-white/10 px-2.5 sm:px-3 py-1 text-xs sm:text-sm">Video walkthroughs</Badge>
              <Badge variant="outline" className="bg-white/5 border-white/10 px-2.5 sm:px-3 py-1 text-xs sm:text-sm">Example filled sheets</Badge>
              <Badge variant="outline" className="bg-white/5 border-white/10 px-2.5 sm:px-3 py-1 text-xs sm:text-sm">Support community</Badge>
              <Badge variant="outline" className="bg-white/5 border-white/10 px-2.5 sm:px-3 py-1 text-xs sm:text-sm">Lifetime updates</Badge>
            </div>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-8">
        {/* Buyer Complaints */}
        <Card className="p-4 sm:p-6 bg-card border-red-500/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
          <div className="flex items-center gap-2 mb-4 lg:mb-6">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h2 className="text-lg lg:text-xl font-medium text-white">What buyers complain about</h2>
          </div>
          <div className="space-y-3 lg:space-y-4">
            <div className="flex gap-3">
              <Quote className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
              <p className="text-sm sm:text-base text-muted-foreground">"The design was too cluttered and wasted all my printer ink."</p>
            </div>
            <div className="flex gap-3">
              <Quote className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
              <p className="text-sm sm:text-base text-muted-foreground">"It assumed I already knew how to use Notion."</p>
            </div>
            <div className="flex gap-3">
              <Quote className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
              <p className="text-sm sm:text-base text-muted-foreground">"Way too much fluff. I just wanted the checklists."</p>
            </div>
          </div>
        </Card>

        {/* How to improve */}
        <Card className="p-4 sm:p-6 bg-card border-emerald-500/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
          <div className="flex items-center gap-2 mb-4 lg:mb-6">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg lg:text-xl font-medium text-white">How to make a better version</h2>
          </div>
          <div className="space-y-3 lg:space-y-4">
            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-sm sm:text-base text-muted-foreground">Include an "ink-saver" black and white version.</p>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-sm sm:text-base text-muted-foreground">Add a 5-minute quick start video to the first page.</p>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <p className="text-sm sm:text-base text-muted-foreground">Remove all complex tracking that people abandon after 3 days.</p>
            </div>
          </div>
        </Card>
      </div>

    </div>
  );
}
