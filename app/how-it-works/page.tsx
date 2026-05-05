import React from 'react';
import Link from 'next/link';
import { Target, LayoutTemplate, Zap, ChevronRight, Store, ArrowRight, Lightbulb, Hammer, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarketingHeader } from '@/components/marketing-header';
import { MarketingFooter } from '@/components/marketing-footer';

export default function HowItWorksPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[30%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full pointer-events-none" />

      <MarketingHeader />

      <main className="flex-1 relative z-10 pb-24">
        {/* Hero Section */}
        <section className="pt-24 pb-20 px-6 text-center max-w-4xl mx-auto flex flex-col items-center">
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tighter text-white mb-6 balanced-text leading-tight">
            How WIZUP works
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground text-center mb-10 leading-relaxed max-w-2xl">
            Find what people want, build something original, and open your store &#8212; in one simple flow.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
            <Link href="/onboarding" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-base h-14 px-8 bg-white text-black hover:bg-white/90">
                Start building
              </Button>
            </Link>
            <Link href="/pricing" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base h-14 px-8 border-white/10 hover:bg-white/5">
                See pricing
              </Button>
            </Link>
          </div>
        </section>

        {/* Step-by-Step Flow Section */}
        <section className="px-6 py-20 max-w-5xl mx-auto">
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="p-8 rounded-3xl bg-card border border-white/5 flex flex-col md:flex-row items-start md:items-center gap-8 hover:border-white/10 transition-colors group">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Target className="w-8 h-8 text-primary group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-primary tracking-widest uppercase mb-2">Step 1</div>
                <h3 className="text-2xl font-medium text-white mb-2">Ideas</h3>
                <p className="text-muted-foreground text-lg">Find product ideas people already want.</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-8 rounded-3xl bg-card border border-white/5 flex flex-col md:flex-row items-start md:items-center gap-8 hover:border-white/10 transition-colors group">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center shrink-0">
                <LayoutTemplate className="w-8 h-8 text-amber-500 group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-amber-500 tracking-widest uppercase mb-2">Step 2</div>
                <h3 className="text-2xl font-medium text-white mb-2">Examples</h3>
                <p className="text-muted-foreground text-lg">See what works so you can make something better.</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-8 rounded-3xl bg-card border border-white/5 flex flex-col md:flex-row items-start md:items-center gap-8 hover:border-white/10 transition-colors group">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Hammer className="w-8 h-8 text-emerald-500 group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-emerald-500 tracking-widest uppercase mb-2">Step 3</div>
                <h3 className="text-2xl font-medium text-white mb-2">Product</h3>
                <p className="text-muted-foreground text-lg">Turn your idea into a clear product plan.</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-8 rounded-3xl bg-card border border-white/5 flex flex-col md:flex-row items-start md:items-center gap-8 hover:border-white/10 transition-colors group">
              <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <Rocket className="w-8 h-8 text-blue-500 group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-blue-500 tracking-widest uppercase mb-2">Step 4</div>
                <h3 className="text-2xl font-medium text-white mb-2">Sales Kit</h3>
                <p className="text-muted-foreground text-lg">Create your sales page, emails, and launch copy.</p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="p-8 rounded-3xl bg-card border border-white/5 flex flex-col md:flex-row items-start md:items-center gap-8 hover:border-white/10 transition-colors group">
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center shrink-0">
                <Store className="w-8 h-8 text-purple-500 group-hover:scale-110 transition-transform duration-500" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-purple-500 tracking-widest uppercase mb-2">Step 5</div>
                <h3 className="text-2xl font-medium text-white mb-2">Store</h3>
                <p className="text-muted-foreground text-lg">Open your store and start selling.</p>
              </div>
            </div>
          </div>
        </section>

        {/* What You Get Section */}
        <section className="px-6 py-24 max-w-7xl mx-auto border-t border-white/5">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.01]">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <Lightbulb className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-xl font-medium text-white mb-3">Better ideas</h4>
              <p className="text-muted-foreground leading-relaxed">Start with demand instead of guessing. WIZUP shows you what people are actively looking for.</p>
            </div>
            <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.01]">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-xl font-medium text-white mb-3">Faster building</h4>
              <p className="text-muted-foreground leading-relaxed">Move from idea to product with less friction. Our AI team helps structure your work predictably.</p>
            </div>
            <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.01]">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <ChevronRight className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-xl font-medium text-white mb-3">Clearer selling</h4>
              <p className="text-muted-foreground leading-relaxed">Turn your work into a page people understand and buy. Prepare your launch assets seamlessly.</p>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-24 px-6 text-center max-w-3xl mx-auto">
          <h2 className="text-4xl font-semibold tracking-tight text-white mb-6">
            Ready to build something people want?
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Start with your first idea and let WIZUP guide the rest.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/onboarding" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-base h-14 px-8 bg-white text-black hover:bg-white/90">
                Start building
              </Button>
            </Link>
            <Link href="/pricing" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-base h-14 px-8 border-white/10 hover:bg-white/5">
                See pricing
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
