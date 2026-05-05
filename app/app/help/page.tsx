'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function HelpPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-24 lg:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-8 lg:mb-10">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-1 lg:mb-2">Help</h1>
          <p className="text-sm lg:text-base text-white/50">Find answers, learn the workflow, and get support.</p>
        </div>
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <Input 
            placeholder="Search help..." 
            className="w-full bg-[#121214] border-white/10 pl-9 text-sm h-11 lg:h-10 text-white placeholder:text-white/40 rounded-full focus-visible:ring-1 focus-visible:ring-primary/50"
          />
        </div>
      </div>

      <div className="space-y-8 lg:space-y-12">
        
        {/* Quick help cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "Getting started", desc: "Learn the basic WIZUP workflow." },
            { title: "Finding ideas", desc: "Search a niche, audience, or problem." },
            { title: "Building products", desc: "Turn a strong idea into a clear product draft." },
            { title: "Creating a sales kit", desc: "Write your page, emails, posts, and pricing." },
          ].map((item, i) => (
            <div key={i} className="bg-[#121214] border border-white/5 hover:border-white/10 transition-colors rounded-2xl p-4 sm:p-5 cursor-pointer">
              <h3 className="text-sm font-medium text-white mb-2">{item.title}</h3>
              <p className="text-xs text-white/50 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Workflow guide section */}
        <div>
          <h2 className="text-lg font-medium text-white mb-4 sm:mb-6">The WIZUP flow</h2>
          <div className="bg-[#121214] border border-white/5 rounded-2xl p-4 sm:p-6 lg:p-8">
            <div className="space-y-6 sm:space-y-8">
              {[
                { step: "1", title: "Ideas", desc: "Find product ideas people want." },
                { step: "2", title: "Examples", desc: "Study what already works." },
                { step: "3", title: "Product", desc: "Build your product draft." },
                { step: "4", title: "Sales Kit", desc: "Create sales assets." },
                { step: "5", title: "Store", desc: "Open your store page." },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-8 shrink-0 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-sm font-medium text-white/70">
                    {item.step}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white mb-1 mt-1.5">{item.title}</h4>
                    <p className="text-[13px] sm:text-sm text-white/50">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Common questions section */}
        <div>
          <h2 className="text-lg font-medium text-white mb-4 sm:mb-6">Common questions</h2>
          <div className="bg-[#121214] border border-white/5 rounded-2xl px-4 sm:px-6 lg:px-8 py-2">
            <Accordion className="w-full">
              {[
                { q: "What does WIZUP do?", a: "WIZUP is an AI-powered command center that helps you find digital product ideas, draft the product, write the sales copy, and spin up a store page—all in one seamless workflow." },
                { q: "How do I find my first product idea?", a: "Go to the Ideas tab and search for an audience or problem you're familiar with. The AI will scan the market and present validated product concepts." },
                { q: "What are Examples?", a: "Examples are high-performing digital products from across the web. We break them down so you can see why they work before building your own." },
                { q: "Can I build from my own idea?", a: "Yes. You can skip the idea discovery phase and go straight to Product to start drafting a product you already have in mind." },
                { q: "What is the Sales Kit?", a: "The Sales Kit generates all the marketing assets you need: landing page copy, launch emails, social media posts, and pricing strategy based on your product draft." },
                { q: "What does Store do?", a: "The Store gives you a clean, simple landing page to collect emails or sell your digital product immediately." },
                { q: "Can I export my work?", a: "Yes, you can export your product drafts, sales copy, and raw data to Markdown at any time from Settings." },
                { q: "Is WIZUP beginner-friendly?", a: "Absolutely. Everything is written in simple, clear language with zero marketing jargon. WIZUP guides you step-by-step." }
              ].map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-white/5 last:border-0">
                  <AccordionTrigger className="text-[13px] sm:text-sm font-medium text-white/80 hover:text-white py-4 text-left">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-[13px] sm:text-sm text-white/50 pb-4 leading-relaxed">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        {/* Contact support section */}
        <div className="bg-gradient-to-b from-[#1A1A1E] to-[#121214] border border-white/10 rounded-2xl p-6 sm:p-8 text-center sm:text-left sm:flex sm:items-center sm:justify-between gap-6">
          <div className="mb-6 sm:mb-0">
            <h3 className="text-[15px] font-medium text-white mb-2">Still need help?</h3>
            <p className="text-sm text-white/50">
              Send us a message and we'll help you get unstuck.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" className="w-full sm:w-auto bg-transparent border-white/10 hover:bg-white/5 text-white h-11 sm:h-10">
              Read FAQ
            </Button>
            <Button className="w-full sm:w-auto bg-white hover:bg-white/90 text-black h-11 sm:h-10">
              Contact support
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
