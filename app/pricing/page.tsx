import React from 'react';
import Link from 'next/link';
import { Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarketingHeader } from '@/components/marketing-header';
import { MarketingFooter } from '@/components/marketing-footer';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

export default function PricingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <MarketingHeader />

      <main className="flex-1 relative z-10 pb-24">
        {/* Hero Section */}
        <section className="pt-24 pb-16 px-6 text-center max-w-4xl mx-auto flex flex-col items-center">
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tighter text-white mb-6 balanced-text leading-tight">
            Simple pricing for building digital products
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground text-center mb-10 leading-relaxed max-w-2xl">
            Start small, grow when you’re ready, and use WIZUP to move from idea to store.
          </p>
        </section>

        {/* Pricing Cards Section */}
        <section className="px-6 pb-24 max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Starter Plan */}
            <div className="p-8 rounded-3xl bg-card border border-white/5 flex flex-col hover:border-white/10 transition-colors">
              <h3 className="text-2xl font-medium text-white mb-2">Starter</h3>
              <p className="text-sm text-muted-foreground mb-6">For getting started</p>
              <div className="mb-8">
                <span className="text-5xl font-bold text-white">Free</span>
              </div>
              <Link href="/onboarding" className="w-full mb-8">
                <Button className="w-full bg-white/10 text-white hover:bg-white/20 h-12 text-sm font-medium">
                  Get started
                </Button>
              </Link>
              <div className="flex-1 space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-white/80">Explore ideas</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-white/80">Save a few projects</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-white/80">Basic product workflow</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-white/80">Limited exports</span>
                </div>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="p-8 rounded-3xl bg-card border-2 border-primary/50 relative flex flex-col shadow-[0_0_40px_rgba(37,99,235,0.1)]">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider">
                  Most popular
                </span>
              </div>
              <h3 className="text-2xl font-medium text-white mb-2">Pro</h3>
              <p className="text-sm text-muted-foreground mb-6">For serious creators</p>
              <div className="mb-8 flex items-baseline gap-1">
                <span className="text-5xl font-bold text-white">$29</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <Link href="/onboarding" className="w-full mb-8">
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-sm font-medium">
                  Start Pro
                </Button>
              </Link>
              <div className="flex-1 space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-sm text-white/80">Unlimited ideas</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-sm text-white/80">Full product workflow</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-sm text-white/80">Sales Kit tools</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-sm text-white/80">Store tools</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-sm text-white/80">Better exports</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-sm text-white/80">Priority support</span>
                </div>
              </div>
            </div>

            {/* Studio Plan */}
            <div className="p-8 rounded-3xl bg-card border border-white/5 flex flex-col hover:border-white/10 transition-colors">
              <h3 className="text-2xl font-medium text-white mb-2">Studio</h3>
              <p className="text-sm text-muted-foreground mb-6">For advanced creators and teams</p>
              <div className="mb-8 flex items-baseline gap-1">
                <span className="text-5xl font-bold text-white">$99</span>
                <span className="text-sm text-muted-foreground">/month</span>
              </div>
              <Link href="/onboarding" className="w-full mb-8">
                <Button className="w-full bg-white/10 text-white hover:bg-white/20 h-12 text-sm font-medium">
                  Start Studio
                </Button>
              </Link>
              <div className="flex-1 space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-white/80">Everything in Pro</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-white/80">More workspace power</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-white/80">Team collaboration</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-white/80">Advanced AI assistance</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-white/80">More brand / product capacity</span>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-muted-foreground shrink-0" />
                  <span className="text-sm text-white/80">Premium support</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section className="px-6 pb-24 max-w-5xl mx-auto">
          <div className="grid md:grid-cols-4 gap-4">
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
              <h4 className="text-sm font-medium text-white mb-1">Cancel anytime</h4>
              <p className="text-xs text-muted-foreground">No long-term contracts</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
              <h4 className="text-sm font-medium text-white mb-1">No hidden fees</h4>
              <p className="text-xs text-muted-foreground">Transparent pricing</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
              <h4 className="text-sm font-medium text-white mb-1">Upgrade when ready</h4>
              <p className="text-xs text-muted-foreground">Prorated charges applied</p>
            </div>
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center">
              <h4 className="text-sm font-medium text-white mb-1">Built for creators</h4>
              <p className="text-xs text-muted-foreground">Independent tools</p>
            </div>
          </div>
        </section>

        {/* Feature Comparison Table */}
        <section className="px-6 pb-24 max-w-5xl mx-auto">
          <h2 className="text-3xl font-medium text-white mb-8 text-center">Compare plans</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-4 px-6 text-left font-medium text-muted-foreground w-1/4">Feature</th>
                  <th className="py-4 px-6 text-center font-medium text-white w-1/4">Starter</th>
                  <th className="py-4 px-6 text-center font-medium text-white w-1/4">Pro</th>
                  <th className="py-4 px-6 text-center font-medium text-white w-1/4">Studio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-white/80">
                <tr className="hover:bg-white/[0.01]">
                  <td className="py-4 px-6">Ideas</td>
                  <td className="py-4 px-6 text-center text-muted-foreground">Limited</td>
                  <td className="py-4 px-6 text-center">Unlimited</td>
                  <td className="py-4 px-6 text-center">Unlimited</td>
                </tr>
                <tr className="hover:bg-white/[0.01]">
                  <td className="py-4 px-6">Examples</td>
                  <td className="py-4 px-6 text-center text-muted-foreground">Basic</td>
                  <td className="py-4 px-6 text-center">Full access</td>
                  <td className="py-4 px-6 text-center">Full access</td>
                </tr>
                <tr className="hover:bg-white/[0.01]">
                  <td className="py-4 px-6">Product workflow</td>
                  <td className="py-4 px-6 text-center text-muted-foreground">Manual</td>
                  <td className="py-4 px-6 text-center">AI-assisted</td>
                  <td className="py-4 px-6 text-center">Advanced AI</td>
                </tr>
                <tr className="hover:bg-white/[0.01]">
                  <td className="py-4 px-6">Sales Kit</td>
                  <td className="py-4 px-6 text-center text-muted-foreground">—</td>
                  <td className="py-4 px-6 text-center"><Check className="w-4 h-4 mx-auto text-primary" /></td>
                  <td className="py-4 px-6 text-center"><Check className="w-4 h-4 mx-auto text-primary" /></td>
                </tr>
                <tr className="hover:bg-white/[0.01]">
                  <td className="py-4 px-6">Store</td>
                  <td className="py-4 px-6 text-center text-muted-foreground">—</td>
                  <td className="py-4 px-6 text-center"><Check className="w-4 h-4 mx-auto text-primary" /></td>
                  <td className="py-4 px-6 text-center"><Check className="w-4 h-4 mx-auto text-primary" /></td>
                </tr>
                <tr className="hover:bg-white/[0.01]">
                  <td className="py-4 px-6">Export tools</td>
                  <td className="py-4 px-6 text-center text-muted-foreground">Text only</td>
                  <td className="py-4 px-6 text-center">PDF & HTML</td>
                  <td className="py-4 px-6 text-center">All formats</td>
                </tr>
                <tr className="hover:bg-white/[0.01]">
                  <td className="py-4 px-6">Team features</td>
                  <td className="py-4 px-6 text-center text-muted-foreground">—</td>
                  <td className="py-4 px-6 text-center text-muted-foreground">—</td>
                  <td className="py-4 px-6 text-center"><Check className="w-4 h-4 mx-auto text-primary" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ Mini Section */}
        <section className="px-6 pb-24 max-w-3xl mx-auto">
          <h2 className="text-3xl font-medium text-white mb-8 text-center">Pricing questions</h2>
          <Accordion className="w-full space-y-4">
            <AccordionItem value="item-1" className="bg-card border border-white/5 px-6 rounded-2xl">
              <AccordionTrigger className="text-base font-medium text-white hover:no-underline">
                Can I start for free?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                Yes. You can explore the Ideas tool, view examples, and set up your initial workspace completely free. Upgrade when you are ready to use the full Product and Sales Kit workflows.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="bg-card border border-white/5 px-6 rounded-2xl">
              <AccordionTrigger className="text-base font-medium text-white hover:no-underline">
                Can I change plans later?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                Absolutely. You can upgrade from Starter to Pro, or from Pro to Studio at any time from your account settings.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="bg-card border border-white/5 px-6 rounded-2xl">
              <AccordionTrigger className="text-base font-medium text-white hover:no-underline">
                What happens if I cancel?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                If you cancel, you will retain access to your paid features until the end of your current billing cycle. After that, your account will revert to the free Starter plan.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4" className="bg-card border border-white/5 px-6 rounded-2xl">
              <AccordionTrigger className="text-base font-medium text-white hover:no-underline">
                Do I need to know how to code?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                Not at all. WIZUP is designed to be completely visual and guided. You provide the ideas, and our platform helps structure, draft, and assemble your products.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* Final CTA */}
        <section className="py-12 px-6 text-center max-w-3xl mx-auto border-t border-white/5">
          <h2 className="text-4xl font-semibold tracking-tight text-white mb-6">
            Start with a plan that fits
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            You can explore for free and upgrade when you’re ready to build faster.
          </p>
          <div className="flex justify-center">
            <Link href="/onboarding">
              <Button size="lg" className="text-base h-14 px-8 bg-white text-black hover:bg-white/90">
                Start building
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}
