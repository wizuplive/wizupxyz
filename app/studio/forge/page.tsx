'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Bot, Settings, Wand2, FileText, CheckSquare, ListPlus, Link2, Download, Save
} from 'lucide-react';

export default function ForgePage() {
  return (
    <div className="flex h-[calc(100vh-theme(spacing.16))] lg:h-screen">
      {/* Editor Section */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative pb-24 lg:pb-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-medium text-white mb-1 lg:mb-2">Build your product</h1>
              <p className="text-sm lg:text-base text-muted-foreground">Turn your idea into a clear product draft.</p>
            </div>
            <Button variant="outline" className="w-full sm:w-auto border-white/10 text-white hover:bg-white/5">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          <form className="space-y-6 lg:space-y-8">
            <Card className="p-4 sm:p-6 bg-card border-white/5">
              <h2 className="text-lg lg:text-xl font-medium text-white mb-4 lg:mb-6">Product basics</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs lg:text-sm font-medium text-muted-foreground mb-1 block">Title</label>
                  <Input defaultValue="The Anti-Overwhelm Daily Planner" className="bg-white/[0.02] border-white/10" />
                </div>
                <div>
                  <label className="text-xs lg:text-sm font-medium text-muted-foreground mb-1 block">Subtitle</label>
                  <Input defaultValue="A minimal system for neurodivergent brains to get things done." className="bg-white/[0.02] border-white/10" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs lg:text-sm font-medium text-muted-foreground mb-1 block">Product Type</label>
                    <Input defaultValue="Printable PDF" className="bg-white/[0.02] border-white/10" />
                  </div>
                  <div>
                    <label className="text-xs lg:text-sm font-medium text-muted-foreground mb-1 block">Price</label>
                    <Input defaultValue="$15 - $25" className="bg-white/[0.02] border-white/10" />
                  </div>
                </div>
              </div>
            </Card>

            {/* Mobile AI Suggestions (hidden on desktop) */}
            <Card className="p-4 sm:p-6 bg-card border-white/5 lg:hidden border-primary/20 bg-primary/5">
              <div className="flex items-center gap-2 mb-4">
                <Bot className="w-5 h-5 text-primary" />
                <span className="font-medium text-white text-sm">Your AI team suggests...</span>
              </div>
              <div className="space-y-3">
                <div className="p-4 bg-black/20 rounded-lg border border-white/5">
                  <p className="text-sm text-muted-foreground mb-3">
                    Your title is clear, but we could make the subtitle punchier to highlight the "anti-overwhelm" aspect.
                  </p>
                  <Button size="sm" variant="secondary" className="w-full bg-primary/10 text-primary hover:bg-primary/20">
                    <Wand2 className="w-3.5 h-3.5 mr-2" /> Improve subtitle
                  </Button>
                </div>
                <div className="p-4 bg-black/20 rounded-lg border border-white/5">
                  <p className="text-sm text-muted-foreground mb-3">
                    Most ADHD planners miss a "Time Blindness" feature. Adding a visible time estimation column would add huge value.
                  </p>
                  <Button size="sm" variant="secondary" className="w-full bg-primary/10 text-primary hover:bg-primary/20">
                    <Wand2 className="w-3.5 h-3.5 mr-2" /> Add Time Column
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6 bg-card border-white/5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 lg:mb-6 gap-3">
                <h2 className="text-lg lg:text-xl font-medium text-white">Product structure</h2>
                <Button variant="ghost" size="sm" className="w-full sm:w-auto text-primary hover:text-primary hover:bg-primary/10 -ml-2 sm:ml-0 justify-start sm:justify-center">
                  <ListPlus className="w-4 h-4 mr-2" />
                  Add section
                </Button>
              </div>
              <div className="space-y-3">
                <div className="p-3 lg:p-4 rounded-lg bg-white/[0.02] border border-white/5 flex items-start gap-3 lg:gap-4 group">
                  <FileText className="w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground shrink-0 mt-1 lg:mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white mb-1 text-sm lg:text-base">Module 1: The Brain Dump</p>
                    <p className="text-xs lg:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-none">A guided, unconstrained space to empty mental loads before prioritizing.</p>
                  </div>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white lg:opacity-0 group-hover:opacity-100 shrink-0"><Settings className="w-4 h-4" /></Button>
                </div>
                <div className="p-3 lg:p-4 rounded-lg bg-white/[0.02] border border-white/5 flex items-start gap-3 lg:gap-4 group">
                  <CheckSquare className="w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground shrink-0 mt-1 lg:mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white mb-1 text-sm lg:text-base">Module 2: Top 3 Targets</p>
                    <p className="text-xs lg:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-none">Forcing mechanism to select only 3 non-negotiable tasks per day.</p>
                  </div>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white lg:opacity-0 group-hover:opacity-100 shrink-0"><Settings className="w-4 h-4" /></Button>
                </div>
                <div className="p-3 lg:p-4 rounded-lg bg-white/[0.02] border border-white/5 flex items-start gap-3 lg:gap-4 group">
                  <Link2 className="w-4 h-4 lg:w-5 lg:h-5 text-muted-foreground shrink-0 mt-1 lg:mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white mb-1 text-sm lg:text-base">Bonus: Reset Protocol</p>
                    <p className="text-xs lg:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-none">A one-page guide on how to recover when the plan completely fails.</p>
                  </div>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-white lg:opacity-0 group-hover:opacity-100 shrink-0"><Settings className="w-4 h-4" /></Button>
                </div>
              </div>
            </Card>

            <Card className="p-4 sm:p-6 bg-card border-white/5 border-dashed bg-white/[0.01]">
              <h2 className="text-lg lg:text-xl font-medium text-white mb-4">Make it better</h2>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5 text-muted-foreground hover:text-white text-xs lg:text-sm">Add examples</Button>
                <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5 text-muted-foreground hover:text-white text-xs lg:text-sm">Add templates</Button>
                <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5 text-muted-foreground hover:text-white text-xs lg:text-sm">Add checklist</Button>
                <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5 text-muted-foreground hover:text-white text-xs lg:text-sm">Add tracker</Button>
                <Button variant="outline" size="sm" className="border-white/10 hover:bg-white/5 text-muted-foreground hover:text-white text-xs lg:text-sm">Simplify language</Button>
              </div>
            </Card>
          </form>

          {/* Mobile action buttons (hidden on desktop) */}
          <div className="mt-8 lg:hidden space-y-3">
            <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-sm font-semibold">
              Create sales kit
            </Button>
            <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 text-white h-12 text-sm">
              <Save className="w-4 h-4 mr-2" />
              Save draft
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop AI Assistant Panel */}
      <div className="hidden lg:flex w-80 border-l border-white/5 bg-black/20 flex-col shrink-0">
        <div className="p-4 border-b border-white/5 flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <span className="font-medium text-white">Your AI team suggests...</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <Card className="p-4 bg-white/[0.02] border-white/5">
            <p className="text-sm text-muted-foreground mb-3">
              Your title is clear, but we could make the subtitle punchier to highlight the "anti-overwhelm" aspect.
            </p>
            <Button size="sm" variant="secondary" className="w-full bg-primary/10 text-primary hover:bg-primary/20">
              <Wand2 className="w-3.5 h-3.5 mr-2" /> Improve subtitle
            </Button>
          </Card>

          <Card className="p-4 bg-white/[0.02] border-white/5">
            <p className="text-sm text-muted-foreground mb-3">
              Most ADHD planners miss a "Time Blindness" feature. Adding a visible time estimation column would add huge value.
            </p>
            <Button size="sm" variant="secondary" className="w-full bg-primary/10 text-primary hover:bg-primary/20">
              <Wand2 className="w-3.5 h-3.5 mr-2" /> Add Time Column
            </Button>
          </Card>
        </div>
        <div className="p-4 border-t border-white/5 space-y-2">
          <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            Create sales kit
          </Button>
          <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 text-white">
            <Save className="w-4 h-4 mr-2" />
            Save draft
          </Button>
        </div>
      </div>
    </div>
  );
}
