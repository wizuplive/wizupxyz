import React from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MarketingHeader } from '@/components/marketing-header';
import { MarketingFooter } from '@/components/marketing-footer';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

export default function FAQPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />

      <MarketingHeader />

      <main className="flex-1 relative z-10 pb-24">
        {/* Hero Section */}
        <section className="pt-24 pb-16 px-6 text-center max-w-4xl mx-auto flex flex-col items-center">
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tighter text-white mb-6 balanced-text leading-tight">
            Frequently asked questions
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground text-center mb-8 leading-relaxed max-w-lg">
            Everything you need to know about how WIZUP works.
          </p>
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input 
              type="text" 
              placeholder="Search questions..." 
              className="w-full pl-10 h-14 bg-white/[0.02] border-white/10 text-base rounded-xl focus-visible:ring-1 focus-visible:ring-primary placeholder:text-muted-foreground"
            />
          </div>
        </section>

        {/* Categories & FAQ Section */}
        <section className="px-6 pb-24 max-w-5xl mx-auto flex flex-col lg:flex-row gap-12 lg:items-start">
          
          {/* Default to horizontal on mobile/tablet, left sticky column on large screens */}
          <div className="lg:w-1/4 lg:sticky lg:top-24 flex lg:flex-col gap-2 overflow-x-auto pb-4 lg:pb-0 scrollbar-hide">
            <a href="#getting-started" className="whitespace-nowrap px-4 py-2 hover:bg-white/5 rounded-lg text-sm text-white font-medium transition-colors">Getting started</a>
            <a href="#ideas" className="whitespace-nowrap px-4 py-2 hover:bg-white/5 rounded-lg text-sm text-muted-foreground transition-colors">Ideas</a>
            <a href="#product" className="whitespace-nowrap px-4 py-2 hover:bg-white/5 rounded-lg text-sm text-muted-foreground transition-colors">Product</a>
            <a href="#sales-kit" className="whitespace-nowrap px-4 py-2 hover:bg-white/5 rounded-lg text-sm text-muted-foreground transition-colors">Sales Kit</a>
            <a href="#store" className="whitespace-nowrap px-4 py-2 hover:bg-white/5 rounded-lg text-sm text-muted-foreground transition-colors">Store</a>
            <a href="#pricing" className="whitespace-nowrap px-4 py-2 hover:bg-white/5 rounded-lg text-sm text-muted-foreground transition-colors">Pricing</a>
            <a href="#support" className="whitespace-nowrap px-4 py-2 hover:bg-white/5 rounded-lg text-sm text-muted-foreground transition-colors">Support</a>
          </div>

          <div className="lg:w-3/4 space-y-16">
            <div id="getting-started" className="scroll-mt-32">
              <h2 className="text-2xl font-medium text-white mb-6">Getting started</h2>
              <Accordion className="w-full space-y-4">
                <AccordionItem value="gs-1" className="bg-card border border-white/5 px-6 rounded-2xl">
                  <AccordionTrigger className="text-base font-medium text-white hover:no-underline">What does WIZUP do?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                    WIZUP helps you find digital product ideas people already want, turn those ideas into original products, create your sales assets, and open your store.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="gs-2" className="bg-card border border-white/5 px-6 rounded-2xl">
                  <AccordionTrigger className="text-base font-medium text-white hover:no-underline">Who is WIZUP for?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                    WIZUP is for creators, freelancers, business owners, and anyone who wants to build and sell digital products more clearly.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="gs-3" className="bg-card border border-white/5 px-6 rounded-2xl">
                  <AccordionTrigger className="text-base font-medium text-white hover:no-underline">Do I need product experience?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                    No. WIZUP is designed to be simple enough for beginners while still powerful for experienced creators.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div id="ideas" className="scroll-mt-32">
              <h2 className="text-2xl font-medium text-white mb-6">Ideas & Examples</h2>
              <Accordion className="w-full space-y-4">
                <AccordionItem value="ide-1" className="bg-card border border-white/5 px-6 rounded-2xl">
                  <AccordionTrigger className="text-base font-medium text-white hover:no-underline">How does WIZUP help me find ideas?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                    WIZUP helps you explore product ideas based on real demand signals so you can start with stronger opportunities instead of guessing.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="ide-2" className="bg-card border border-white/5 px-6 rounded-2xl">
                  <AccordionTrigger className="text-base font-medium text-white hover:no-underline">What are "Examples"?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                    Examples help you study what is already working in the market so you can learn patterns and create something original and competitive.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div id="product" className="scroll-mt-32">
              <h2 className="text-2xl font-medium text-white mb-6">Product</h2>
              <Accordion className="w-full space-y-4">
                <AccordionItem value="prod-1" className="bg-card border border-white/5 px-6 rounded-2xl">
                  <AccordionTrigger className="text-base font-medium text-white hover:no-underline">What does the Product area do?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                    Product helps you shape your idea into a clear offer, structure, and product plan, taking you from concept to tangible outline.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="prod-2" className="bg-card border border-white/5 px-6 rounded-2xl">
                  <AccordionTrigger className="text-base font-medium text-white hover:no-underline">Can I build from my own idea?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                    Yes. You can start with a fresh idea, refine one you already have, or build based on ideas you discover in WIZUP.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div id="sales-kit" className="scroll-mt-32">
              <h2 className="text-2xl font-medium text-white mb-6">Sales Kit</h2>
              <Accordion className="w-full space-y-4">
                <AccordionItem value="sk-1" className="bg-card border border-white/5 px-6 rounded-2xl">
                  <AccordionTrigger className="text-base font-medium text-white hover:no-underline">What is the Sales Kit?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                    Sales Kit helps you create the sales page, emails, social posts, pricing, and launch content tailored for your specific product.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="sk-2" className="bg-card border border-white/5 px-6 rounded-2xl">
                  <AccordionTrigger className="text-base font-medium text-white hover:no-underline">Do I have to write everything myself?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                    No. WIZUP helps you generate and refine the key pieces, while still letting you edit everything to match your voice.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div id="store" className="scroll-mt-32">
              <h2 className="text-2xl font-medium text-white mb-6">Store</h2>
              <Accordion className="w-full space-y-4">
                <AccordionItem value="st-1" className="bg-card border border-white/5 px-6 rounded-2xl">
                  <AccordionTrigger className="text-base font-medium text-white hover:no-underline">What is the Store?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                    Store is where your product is prepared for selling, so you can present it clearly and move toward a public launch.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="st-2" className="bg-card border border-white/5 px-6 rounded-2xl">
                  <AccordionTrigger className="text-base font-medium text-white hover:no-underline">Can I preview my store before publishing?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                    Yes. You can review your store experience before making it live.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div id="pricing" className="scroll-mt-32">
              <h2 className="text-2xl font-medium text-white mb-6">Pricing</h2>
              <Accordion className="w-full space-y-4">
                <AccordionItem value="pr-1" className="bg-card border border-white/5 px-6 rounded-2xl">
                  <AccordionTrigger className="text-base font-medium text-white hover:no-underline">Is there a free plan?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                    Yes. You can start with a free plan and upgrade when you need more power and full access to workflows.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="pr-2" className="bg-card border border-white/5 px-6 rounded-2xl">
                  <AccordionTrigger className="text-base font-medium text-white hover:no-underline">Can I switch plans later?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                    Yes. You can move between plans seamlessly as your needs change.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div id="support" className="scroll-mt-32">
              <h2 className="text-2xl font-medium text-white mb-6">Support</h2>
              <Accordion className="w-full space-y-4">
                <AccordionItem value="sup-1" className="bg-card border border-white/5 px-6 rounded-2xl">
                  <AccordionTrigger className="text-base font-medium text-white hover:no-underline">Is WIZUP beginner-friendly?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                    Yes. The product is designed to be clear, simple, and approachable for anyone building a digital product.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="sup-2" className="bg-card border border-white/5 px-6 rounded-2xl">
                  <AccordionTrigger className="text-base font-medium text-white hover:no-underline">What if I still need help?</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed pt-2">
                    You can reach support for help with setup, workflow questions, and product guidance at any time.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            
          </div>
        </section>

        {/* Still Have Questions Section */}
        <section className="py-16 px-6 text-center max-w-3xl mx-auto border-t border-white/5">
          <h2 className="text-4xl font-semibold tracking-tight text-white mb-6">
            Still have questions?
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            We’re here to help you get started.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" variant="outline" className="w-full sm:w-auto text-base h-14 px-8 border-white/10 text-white hover:bg-white/5">
              Contact support
            </Button>
            <Link href="/onboarding" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto text-base h-14 px-8 bg-white text-black hover:bg-white/90">
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
