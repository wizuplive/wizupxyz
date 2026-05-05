'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, LayoutTemplate, Rocket, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VaultPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto pb-24 lg:pb-8">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-medium text-white mb-1 lg:mb-2">Saved work</h1>
        <p className="text-sm lg:text-lg text-muted-foreground">All your ideas, product drafts, reports, and sales kits in one place.</p>
      </div>

      <div className="flex gap-4 mb-6 lg:mb-8">
        <div className="relative flex-1 max-w-md w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search saved work..." 
            className="pl-9 h-11 bg-card border-white/10 w-full"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-6 lg:mb-8 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        <Badge variant="secondary" className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 cursor-pointer whitespace-nowrap">All</Badge>
        <Badge variant="outline" className="bg-transparent border-white/10 hover:bg-white/5 text-muted-foreground px-3 py-1 cursor-pointer whitespace-nowrap">Ideas</Badge>
        <Badge variant="outline" className="bg-transparent border-white/10 hover:bg-white/5 text-muted-foreground px-3 py-1 cursor-pointer whitespace-nowrap">Reports</Badge>
        <Badge variant="outline" className="bg-transparent border-white/10 hover:bg-white/5 text-muted-foreground px-3 py-1 cursor-pointer whitespace-nowrap">Products</Badge>
        <Badge variant="outline" className="bg-transparent border-white/10 hover:bg-white/5 text-muted-foreground px-3 py-1 cursor-pointer whitespace-nowrap">Sales kits</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        
        {/* Item 1 */}
        <Card className="p-4 sm:p-5 bg-card border-white/5 flex flex-col group hover:border-white/10 transition-colors">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <LayoutTemplate className="w-5 h-5 text-primary" />
            </div>
            <Badge variant="outline" className="border-primary/20 text-primary bg-primary/5">Product</Badge>
          </div>
          <h3 className="text-base sm:text-lg font-medium text-white mb-1">Freelance Proposal Template</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-6 flex-1">Product draft. 45% complete.</p>
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <span className="text-[10px] sm:text-xs text-muted-foreground">Edited 2h ago</span>
            <div className="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white"><ExternalLink className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-400"><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        </Card>

        {/* Item 2 */}
        <Card className="p-4 sm:p-5 bg-card border-white/5 flex flex-col group hover:border-white/10 transition-colors">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-amber-500" />
            </div>
            <Badge variant="outline" className="border-amber-500/20 text-amber-500 bg-amber-500/5">Idea</Badge>
          </div>
          <h3 className="text-base sm:text-lg font-medium text-white mb-1">Minimalist ADHD Planner</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-6 flex-1">Score: 92/100. Target: Adults with ADHD.</p>
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <span className="text-[10px] sm:text-xs text-muted-foreground">Edited 1d ago</span>
            <div className="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white"><ExternalLink className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-400"><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        </Card>

        {/* Item 3 */}
        <Card className="p-4 sm:p-5 bg-card border-white/5 flex flex-col group hover:border-white/10 transition-colors">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Rocket className="w-5 h-5 text-emerald-500" />
            </div>
            <Badge variant="outline" className="border-emerald-500/20 text-emerald-500 bg-emerald-500/5">Sales Kit</Badge>
          </div>
          <h3 className="text-base sm:text-lg font-medium text-white mb-1">Notion Habit Tracker HQ</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-6 flex-1">Sales page and email sequence complete.</p>
          <div className="flex items-center justify-between pt-4 border-t border-white/5">
            <span className="text-[10px] sm:text-xs text-muted-foreground">Edited 3d ago</span>
            <div className="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white"><ExternalLink className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-400"><Trash2 className="w-4 h-4" /></Button>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
}
