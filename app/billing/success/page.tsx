import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const paymentId = Array.isArray(params.paymentId) ? params.paymentId[0] : params.paymentId;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050506] px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-[8%] h-72 w-72 rounded-full bg-primary/15 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-6%] h-80 w-80 rounded-full bg-fuchsia-500/10 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-3xl rounded-[32px] border border-white/10 bg-[#0C0C0F]/90 p-8 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-12">
        <p className="mb-4 text-xs uppercase tracking-[0.35em] text-primary/80">Payment success</p>
        <h1 className="font-serif text-4xl text-white sm:text-5xl">Your WIZUP upgrade is in motion.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">
          {paymentId
            ? 'We received your payment request and are confirming the subscription details now.'
            : 'We could not find a payment reference, but your account may still update shortly if checkout completed.'}
        </p>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-white/45">Payment details</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-white/45">Reference</p>
              <p className="mt-1 break-all text-base font-medium text-white">
                {paymentId ?? 'Unavailable'}
              </p>
            </div>
            <div>
              <p className="text-sm text-white/45">Status</p>
              <p className="mt-1 text-base font-medium text-emerald-400">Processing confirmation</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/app"
            className={buttonVariants({
              className: 'h-11 bg-primary text-primary-foreground hover:bg-primary/90',
            })}
          >
            Go to workspace
          </Link>
          <Link
            href="/app/billing"
            className={buttonVariants({
              variant: 'outline',
              className: 'h-11 border-white/10 bg-transparent text-white hover:bg-white/5',
            })}
          >
            Back to billing
          </Link>
        </div>
      </div>
    </div>
  );
}
