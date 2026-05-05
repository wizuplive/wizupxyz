'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Bot, Activity, BrainCircuit, ScanSearch, CheckSquare, Sparkles } from 'lucide-react';

const AGENTS = [
  { name: 'Scout', role: 'Finds buyer problems', icon: ScanSearch, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { name: 'Analyst', role: 'Spots patterns', icon: Search, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { name: 'Strategist', role: 'Scores the idea', icon: BrainCircuit, color: 'text-primary', bg: 'bg-primary/10' },
  { name: 'Creator', role: 'Builds product draft', icon: Sparkles, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  { name: 'Reviewer', role: 'Checks clarity', icon: CheckSquare, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
];

const LOGS = [
  { id: 1, agent: 'Scout', time: 'Just now', icon: ScanSearch, message: 'Found 42 buyer questions about toddler sleep routines.', details: 'Source: Reddit (r/parenting), Facebook Groups.' },
  { id: 2, agent: 'Strategist', time: '2m ago', icon: BrainCircuit, message: 'Scored "Morning Routine Checklist": 78/100.', details: 'Strong demand, but competition is high.' },
  { id: 3, agent: 'Analyst', time: '15m ago', icon: Search, message: 'Found 3 common product gaps in ADHD planners.', details: '1. Too many colors. 2. 24h schedules. 3. No reset protocol.' },
  { id: 4, agent: 'Reviewer', time: '1h ago', icon: CheckSquare, message: 'Flagged 2 sections in "Freelance Proposal" module.', details: 'Language is too formal, simplified to 8th-grade reading level.' },
  { id: 5, agent: 'Creator', time: '1h ago', icon: Sparkles, message: 'Generated 12-page guide outline.', details: 'Draft saved to your workspace.' },
];

export default function KratosPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto pb-24 lg:pb-8">
      <div className="mb-6 lg:mb-10">
        <h1 className="text-2xl lg:text-3xl font-medium text-white mb-1 lg:mb-2">Your AI team</h1>
        <p className="text-sm lg:text-lg text-muted-foreground">See how WIZUP researches, scores, and builds your product.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4 mb-8 lg:mb-12">
        {AGENTS.map(agent => (
          <Card key={agent.name} className="p-4 bg-card border-white/5 flex flex-col items-center text-center">
            <div className={`w-10 h-10 rounded-full ${agent.bg} flex items-center justify-center mb-3`}>
              <agent.icon className={`w-5 h-5 ${agent.color}`} />
            </div>
            <h3 className="font-medium text-white text-sm mb-1">{agent.name}</h3>
            <p className="text-xs text-muted-foreground leading-tight">{agent.role}</p>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-white/5 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-white/5 bg-white/[0.02] flex items-center gap-2 sm:gap-3">
          <Activity className="w-5 h-5 text-primary shrink-0" />
          <h2 className="text-lg sm:text-xl font-medium text-white truncate">Live Activity Log</h2>
          <Badge variant="outline" className="ml-auto sm:ml-2 bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-2 py-0.5 border-0 flex gap-1.5 items-center shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="hidden sm:inline">Active</span>
          </Badge>
        </div>
        
        <div className="divide-y divide-white/5">
          {LOGS.map(log => (
            <div key={log.id} className="p-4 sm:p-6 hover:bg-white/[0.01] transition-colors flex gap-3 sm:gap-4 items-start">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <log.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between mb-1 gap-2">
                  <span className="font-medium text-white text-sm sm:text-base">{log.agent}</span>
                  <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap shrink-0">{log.time}</span>
                </div>
                <p className="text-sm sm:text-[15px] text-white/90 mb-2 leading-relaxed">{log.message}</p>
                <div className="px-3 py-2 bg-black/20 rounded border border-white/5 text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">
                  {log.details}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
