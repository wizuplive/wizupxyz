import Link from 'next/link';
import { Mail } from 'lucide-react';

import { MarketingFooter } from '@/components/marketing-footer';
import { MarketingHeader } from '@/components/marketing-header';

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] h-[45%] w-[45%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <MarketingHeader />
      <main className="relative z-10 flex flex-1 items-center px-6 py-24">
        <section className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-8 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
            <Mail className="h-5 w-5 text-white/70" />
          </div>
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-white/35">Contact</p>
          <h1 className="mb-6 text-4xl font-semibold tracking-tight text-white md:text-6xl">
            Support, kept simple.
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-base leading-8 text-white/60">
            For help with your account, billing, payments, or using WIZUP, email support and include the email address on your account.
          </p>
          <Link
            href="mailto:wizuplive@gmail.com"
            className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 bg-white text-sm font-medium text-black px-6 transition hover:bg-white/90"
          >
            wizuplive@gmail.com
          </Link>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
