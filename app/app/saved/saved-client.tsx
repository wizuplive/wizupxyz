'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, LayoutTemplate, Rocket, Trash2, ExternalLink, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SavedIdea, SavedExample, SavedProduct, SavedSalesAsset } from '@/app/actions/workflow';
import { formatDistanceToNow } from 'date-fns';

type Filter = 'All' | 'Ideas' | 'Reports' | 'Products' | 'Sales kits';

type UnifiedItem = {
  id: string;
  type: Filter;
  title: string;
  description: string;
  date: string;
  icon: React.ReactNode;
  badgeClass: string;
  link: string;
};

export function SavedClient({
  ideas,
  examples,
  products,
  salesAssets,
}: {
  ideas: SavedIdea[];
  examples: SavedExample[];
  products: SavedProduct[];
  salesAssets: SavedSalesAsset[];
}) {
  const [filter, setFilter] = useState<Filter>('All');
  const [search, setSearch] = useState('');

  const unifiedItems: UnifiedItem[] = [
    ...ideas.map(i => ({
      id: i.id,
      type: 'Ideas' as Filter,
      title: i.title,
      description: `Score: ${i.opportunityScore || 0}/100. Target: ${i.buyer}`,
      date: i.updatedAt,
      icon: <Lightbulb className="w-5 h-5 text-amber-500" />,
      badgeClass: 'border-amber-500/20 text-amber-500 bg-amber-500/5',
      link: '/app/ideas'
    })),
    ...examples.map(e => ({
      id: e.id,
      type: 'Reports' as Filter,
      title: e.title,
      description: e.summary || 'Market pattern analysis',
      date: e.createdAt,
      icon: <FileText className="w-5 h-5 text-primary" />,
      badgeClass: 'border-primary/20 text-primary bg-primary/5',
      link: '/app/examples'
    })),
    ...products.map(p => ({
      id: p.id,
      type: 'Products' as Filter,
      title: p.title || 'Product Draft',
      description: p.buyer ? `Target: ${p.buyer}` : 'Product Architecture',
      date: p.createdAt,
      icon: <LayoutTemplate className="w-5 h-5 text-primary" />,
      badgeClass: 'border-primary/20 text-primary bg-primary/5',
      link: '/app/product'
    })),
    ...salesAssets.map(s => ({
      id: s.id,
      type: 'Sales kits' as Filter,
      title: s.title || 'Sales Kit',
      description: s.headline || 'Sales collateral',
      date: s.createdAt,
      icon: <Rocket className="w-5 h-5 text-emerald-500" />,
      badgeClass: 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5',
      link: '/app/sales-kit'
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredItems = unifiedItems.filter(item => {
    if (filter !== 'All' && item.type !== filter) return false;
    if (search && !item.title.toLowerCase().includes(search.toLowerCase()) && !item.description.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

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
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search saved work..." 
            className="pl-9 h-11 bg-card border-white/10 w-full"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-6 lg:mb-8 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        {(['All', 'Ideas', 'Reports', 'Products', 'Sales kits'] as Filter[]).map((f) => (
          <Badge 
            key={f}
            onClick={() => setFilter(f)}
            variant={filter === f ? 'secondary' : 'outline'} 
            className={`${filter === f ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-transparent border-white/10 hover:bg-white/5 text-muted-foreground'} px-3 py-1 cursor-pointer whitespace-nowrap`}
          >
            {f === 'Reports' ? 'Examples' : f}
          </Badge>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <Card className="flex-1 justify-center border-white/5 bg-card p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <LayoutTemplate className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mb-2 text-lg font-medium text-white">
            No saved items yet
          </h2>
          <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-foreground">
            Complete workflow steps to save ideas, examples, products, and sales kits to your Saved items.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
          {filteredItems.map(item => (
            <Card key={item.id} className="p-4 sm:p-5 bg-card border-white/5 flex flex-col group hover:border-white/10 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.badgeClass.replace('border-', 'bg-').replace('/20', '/10').split(' ')[2]}`}>
                  {item.icon}
                </div>
                <Badge variant="outline" className={item.badgeClass}>{item.type === 'Reports' ? 'Example' : item.type.replace(/s$/, '')}</Badge>
              </div>
              <h3 className="text-base sm:text-lg font-medium text-white mb-1 line-clamp-1">{item.title}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-6 flex-1 line-clamp-2">{item.description}</p>
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <span className="text-[10px] sm:text-xs text-muted-foreground">Edited {formatDistanceToNow(new Date(item.date))} ago</span>
                <div className="flex gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-white" onClick={() => window.location.href = item.link}>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-400"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
