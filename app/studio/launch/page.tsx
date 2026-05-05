'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Eye } from 'lucide-react';
import Link from 'next/link';

export default function LaunchPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto pb-24 lg:pb-8">
      <div className="mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-medium text-white mb-1 lg:mb-2">Create your sales kit</h1>
          <p className="text-sm lg:text-lg text-muted-foreground">Create the sales page, emails, social posts, and pricing for your product.</p>
        </div>
        <Link href="/studio/storefront" className="w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto border-white/10 text-white hover:bg-white/5 h-12 sm:h-10">
            <Eye className="w-4 h-4 mr-2" />
            Open Store
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="salespage" className="w-full">
        <div className="w-full overflow-x-auto pb-2 scrollbar-hide mb-4 lg:mb-8 -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="bg-white/[0.02] border border-white/5 p-1 flex w-max h-12">
            <TabsTrigger value="salespage" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-9 px-4 sm:px-6 rounded-md whitespace-nowrap">Sales page</TabsTrigger>
            <TabsTrigger value="emails" className="data-[state=active]:bg-white/10 data-[state=active]:text-white h-9 px-4 sm:px-6 rounded-md text-muted-foreground whitespace-nowrap">Emails</TabsTrigger>
            <TabsTrigger value="hooks" className="data-[state=active]:bg-white/10 data-[state=active]:text-white h-9 px-4 sm:px-6 rounded-md text-muted-foreground whitespace-nowrap">Social posts</TabsTrigger>
            <TabsTrigger value="offer" className="data-[state=active]:bg-white/10 data-[state=active]:text-white h-9 px-4 sm:px-6 rounded-md text-muted-foreground whitespace-nowrap">Pricing</TabsTrigger>
            <TabsTrigger value="faq" className="data-[state=active]:bg-white/10 data-[state=active]:text-white h-9 px-4 sm:px-6 rounded-md text-muted-foreground whitespace-nowrap">FAQ</TabsTrigger>
            <TabsTrigger value="checklist" className="data-[state=active]:bg-white/10 data-[state=active]:text-white h-9 px-4 sm:px-6 rounded-md text-muted-foreground whitespace-nowrap">Checklist</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="salespage" className="mt-0">
          <div className="space-y-4 lg:space-y-6">
            <Card className="p-4 sm:p-6 bg-card border-white/5">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-white">Headline</label>
                <Button variant="ghost" size="sm" className="h-8 text-primary hover:text-primary hover:bg-primary/10">
                  <Sparkles className="w-3.5 h-3.5 mr-2" /> <span className="hidden sm:inline">Auto-write</span>
                </Button>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3">This is the first sentence buyers see. Make it clear and specific.</p>
              <Input 
                defaultValue="Stop letting your brain dictate your day. Take control with the ADHD planner that actually works."
                className="bg-white/[0.02] border-white/10 h-10 lg:h-12 text-sm lg:text-lg"
              />
            </Card>

            <Card className="p-4 sm:p-6 bg-card border-white/5">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-white">Subheadline</label>
                <Button variant="ghost" size="sm" className="h-8 text-primary hover:text-primary hover:bg-primary/10">
                  <Sparkles className="w-3.5 h-3.5 mr-2" /> <span className="hidden sm:inline">Auto-write</span>
                </Button>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3">Expand on the headline. Explain exactly what the product is.</p>
              <Textarea 
                defaultValue="A minimalist, high-contrast, printable template system designed specifically for neurodivergent brains to eliminate overwhelm and focus on what matters."
                className="bg-white/[0.02] border-white/10 min-h-[100px] text-sm lg:text-base resize-none"
              />
            </Card>

            <Card className="p-4 sm:p-6 bg-card border-white/5">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-white">The Problem</label>
                <Button variant="ghost" size="sm" className="h-8 text-primary hover:text-primary hover:bg-primary/10">
                  <Sparkles className="w-3.5 h-3.5 mr-2" /> <span className="hidden sm:inline">Auto-write</span>
                </Button>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3">Agitate the pain point. Why are they looking for this right now?</p>
              <Textarea 
                defaultValue="Standard planners are built for neurotypical brains. They have too many boxes, complex 24-hour schedules, and distracting colors. By day 3, you feel overwhelmed and abandon them entirely, adding another layer of guilt."
                className="bg-white/[0.02] border-white/10 min-h-[120px] text-sm lg:text-base resize-none"
              />
            </Card>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <Button variant="outline" className="border-white/10 text-white hover:bg-white/5 w-full sm:w-auto h-12 sm:h-10">Save changes</Button>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto h-12 sm:h-10">Continue to Emails</Button>
            </div>
          </div>
        </TabsContent>
        
        {/* Placeholder contents for other tabs (omitted full implementation for brevity, maintaining premium look) */}
        <TabsContent value="emails">
          <Card className="p-12 bg-card border-white/5 flex flex-col items-center justify-center text-center">
            <Sparkles className="w-8 h-8 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-white mb-2">Let your AI team write your emails</h3>
            <p className="text-muted-foreground max-w-md mb-6">WIZUP will generate a 3-part launch sequence (Teaser, Launch, Last Call) based on your product blueprint.</p>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              Generate email sequence
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
