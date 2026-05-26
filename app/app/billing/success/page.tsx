import Link from 'next/link';

import { buttonVariants } from '@/components/ui/button';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function getParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function getMessage(status: string | undefined) {
  switch ((status ?? '').toLowerCase()) {
    case 'succeed':
      return "Payment received. We're confirming your subscription.";
    case 'pending':
      return "Payment is being processed. We'll update you shortly.";
    case 'failed':
      return 'Payment could not be completed. Please try again.';
    case 'canceled':
      return 'Checkout was canceled.';
    default:
      return "We're reviewing the checkout result. Your billing status will update after webhook confirmation.";
  }
}

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const params = (await searchParams) ?? {};
  const paymentId = getParam(params, 'paymentId') ?? getParam(params, 'order_id') ?? getParam(params, 'reqId');
  const status = getParam(params, 'status');

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050506] px-4 py-16 text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-[8%] h-72 w-72 rounded-full bg-amber-300/15 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-6%] h-80 w-80 rounded-full bg-cyan-400/10 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-3xl rounded-[32px] border border-white/10 bg-[#0C0C0F]/90 p-8 shadow-[0_30px_120px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-12">
        <p className="mb-4 text-xs uppercase tracking-[0.35em] text-amber-200/80">NOWPayments return</p>
        <h1 className="font-serif text-4xl text-white sm:text-5xl">Checkout returned to WIZUP.</h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">{getMessage(status)}</p>
        <p className="mt-3 text-sm text-white/45">
          Redirect status is not the final payment source of truth. We only confirm access after webhook processing.
        </p>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <p className="text-xs uppercase tracking-[0.24em] text-white/45">Checkout reference</p>
          <p className="mt-3 break-all text-base font-medium text-white">{paymentId ?? 'Unavailable'}</p>
          <p className="mt-2 text-sm capitalize text-white/60">{status ?? 'unknown'}</p>
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
