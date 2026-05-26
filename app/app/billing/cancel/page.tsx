import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';

export default function BillingCancelPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050506] px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-[10%] h-72 w-72 rounded-full bg-amber-300/12 blur-[120px]" />
        <div className="absolute bottom-[-8%] right-[-8%] h-80 w-80 rounded-full bg-white/5 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-3xl rounded-[32px] border border-white/10 bg-[#0C0C0F]/90 p-8 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-12">
        <p className="mb-4 text-xs uppercase tracking-[0.35em] text-amber-200/80">Checkout canceled</p>
        <h1 className="font-serif text-4xl text-white sm:text-5xl">Checkout was canceled.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">
          No charges were made. You can return to billing and start NOWPayments checkout again whenever you are ready.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/app/billing"
            className={buttonVariants({
              className: 'h-11 bg-primary text-primary-foreground hover:bg-primary/90',
            })}
          >
            Try again
          </Link>
          <Link
            href="/app"
            className={buttonVariants({
              variant: 'outline',
              className: 'h-11 border-white/10 bg-transparent text-white hover:bg-white/5',
            })}
          >
            Go to workspace
          </Link>
        </div>
      </div>
    </div>
  );
}
