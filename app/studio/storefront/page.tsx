'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function StorefrontPreviewPage() {
  return (
    <div className="h-[calc(100vh-theme(spacing.16))] lg:h-screen flex flex-col bg-background relative overflow-hidden">
      {/* Editor top bar overlay */}
      <div className="min-h-[56px] py-3 sm:py-0 border-b border-white/5 bg-background/80 backdrop-blur-md flex flex-wrap items-center justify-between px-4 sm:px-6 shrink-0 sticky top-0 z-50 gap-x-4 gap-y-2">
        <Link href="/studio/launch" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Back to editing</span>
          <span className="sm:hidden">Back</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium px-2 py-1 bg-white/10 text-white rounded hidden sm:inline-block">Store</span>
        </div>
        <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 h-8 sm:h-9">
          Export page
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto w-full bg-[#fafafa] dark:bg-[#050505] pb-20 sm:pb-0">
        {/* Fake Browser Chrome */}
        <div className="w-full sm:max-w-5xl mx-auto sm:my-8 lg:mb-16 sm:rounded-xl border-y sm:border border-black/10 dark:border-white/10 overflow-hidden shadow-none sm:shadow-2xl bg-white dark:bg-[#0a0a0a]">
          <div className="h-10 border-b border-black/5 dark:border-white/5 flex items-center px-4 gap-2 bg-[#f4f4f5] dark:bg-[#121214]">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-amber-400" />
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="h-6 w-48 sm:w-64 bg-black/5 dark:bg-white/5 rounded-md flex items-center justify-center text-[10px] text-muted-foreground truncate px-2">
                yourdomain.com/planner
              </div>
            </div>
            <div className="w-[42px] hidden sm:block"></div> {/* Balance spacer */}
          </div>

          {/* Actual Preview Content */}
          <div className="p-6 sm:p-8 md:p-16">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-black dark:text-white mb-4 sm:mb-6 balanced-text leading-tight text-center">
                Stop letting your brain dictate your day. Take control with the ADHD planner that actually works.
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-neutral-600 dark:text-neutral-400 text-center mb-8 sm:mb-12">
                A minimalist, high-contrast, printable template system designed specifically for neurodivergent brains to eliminate overwhelm.
              </p>

              <div className="w-full aspect-[4/3] sm:aspect-[16/9] bg-neutral-100 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 mb-10 sm:mb-16 flex items-center justify-center relative overflow-hidden">
                <div className="w-32 sm:w-48 h-48 sm:h-64 bg-white shadow-xl rotate-[-5deg] rounded border border-neutral-200 absolute -translate-x-8 sm:-translate-x-12 translate-y-4" />
                <div className="w-32 sm:w-48 h-48 sm:h-64 bg-white shadow-xl rotate-[5deg] rounded border border-neutral-200 absolute translate-x-8 sm:translate-x-12 -translate-y-4" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
                <span className="relative z-10 text-neutral-400 font-medium tracking-widest uppercase text-xs sm:text-sm">Product Mockup</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 items-start">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white mb-4 sm:mb-6">What's included</h2>
                  <ul className="space-y-3 sm:space-y-4">
                    <li className="flex gap-3 text-neutral-600 dark:text-neutral-400">
                      <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 shrink-0" />
                      <span className="text-sm sm:text-base">The Daily Brain Dump Worksheet</span>
                    </li>
                    <li className="flex gap-3 text-neutral-600 dark:text-neutral-400">
                      <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 shrink-0" />
                      <span className="text-sm sm:text-base">The "Top 3 Only" Prioritization Matrix</span>
                    </li>
                    <li className="flex gap-3 text-neutral-600 dark:text-neutral-400">
                      <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 shrink-0" />
                      <span className="text-sm sm:text-base">The Reset Protocol for bad days</span>
                    </li>
                    <li className="flex gap-3 text-neutral-600 dark:text-neutral-400">
                      <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500 shrink-0" />
                      <span className="text-sm sm:text-base">Ink-friendly black & white PDF</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-neutral-50 dark:bg-white/[0.02] border border-neutral-200 dark:border-white/5 p-6 sm:p-8 rounded-2xl">
                  <span className="text-4xl sm:text-5xl font-bold text-black dark:text-white mb-2 block">$19</span>
                  <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm mb-6">One-time payment. Instant download.</p>
                  <Button className="w-full h-12 sm:h-14 text-base sm:text-lg bg-primary hover:bg-primary/90 text-white rounded-xl mb-4 shadow-lg shadow-primary/20">
                    Get the Planner Now
                  </Button>
                  <p className="text-center text-[10px] sm:text-xs text-neutral-400 dark:text-neutral-500 flex items-center justify-center gap-1.5">
                    Secure checkout powered by Stripe
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
