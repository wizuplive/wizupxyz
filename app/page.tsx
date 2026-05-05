import React from 'react';
import Link from 'next/link';
import { ChevronRight, ArrowRight, Target, Zap, LayoutTemplate } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarketingHeader } from '@/components/marketing-header';
import { MarketingFooter } from '@/components/marketing-footer';

export default function MarketingHomepage() {
  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      {/* Navigation */}
      <MarketingHeader />

      <main className="flex-1 relative z-10">
        {/* Hero Section */}
        <section className="pt-20 md:pt-24 pb-20 md:pb-32 px-6 text-center max-w-5xl mx-auto flex flex-col items-center">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-semibold tracking-tighter text-white mb-6 balanced-text leading-tight">
            Discover what sells.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">Build what wins.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl text-center mb-10 leading-relaxed">
            WIZUP helps you find digital product ideas people already want &#8212; then turns the best ones into original products, sales pages, and launch plans.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link href="/onboarding" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-base h-14 px-8 bg-white text-black hover:bg-white/90">
                Find my first product idea
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-base h-14 px-8 border-white/10 hover:bg-white/5">
              Watch demo
            </Button>
          </div>
        </section>

        {/* Feature Grid preview */}
        <section className="px-6 pb-32 max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="p-6 rounded-2xl bg-card border border-white/5 flex flex-col items-start hover:border-white/10 transition-colors">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">Ideas</h3>
              <p className="text-muted-foreground">Find product ideas with real buyer demand before you spend time building them.</p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-white/5 flex flex-col items-start hover:border-white/10 transition-colors">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-6">
                <LayoutTemplate className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">Examples</h3>
              <p className="text-muted-foreground">Study what successful products in your niche have in common.</p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-white/5 flex flex-col items-start hover:border-white/10 transition-colors">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">Product</h3>
              <p className="text-muted-foreground">Turn your idea into a clear product draft with your AI team.</p>
            </div>

            <div className="p-6 rounded-2xl bg-card border border-white/5 flex flex-col items-start hover:border-white/10 transition-colors">
              <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
                <ChevronRight className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">Sales Kit</h3>
              <p className="text-muted-foreground">Create the sales page, emails, social posts, and pricing to prepare for launch.</p>
            </div>

          </div>
        </section>

      </main>

      <MarketingFooter />
    </div>
  );
}
