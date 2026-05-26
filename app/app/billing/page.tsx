import Link from 'next/link';
import { redirect } from 'next/navigation';

import { NowPaymentsCheckoutButton } from '@/components/billing/nowpayments-checkout-button';
import { Button, buttonVariants } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { createClient } from '@/lib/supabase/server';

const PRO_PLAN = {
  amount: 29,
  currency: 'USD',
  description: 'WIZUP Pro Creator subscription',
};

type BillingSearchParams = Promise<Record<string, string | string[] | undefined>>;

type SubscriptionRecord = {
  id: string;
  status: string;
  plan_id: string;
  current_period_end: string | null;
  current_period_start: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
};

type PaymentRecord = {
  id: string;
  amount: number | string;
  currency: string;
  status: string;
  created_at: string;
  checkout_url: string | null;
};

function getValue(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function formatCurrency(amount: number | string, currency: string) {
  const numericAmount =
    typeof amount === 'number' ? amount : Number.parseFloat(amount);

  if (!Number.isFinite(numericAmount)) {
    return `${currency} ${amount}`;
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(numericAmount);
  } catch {
    return `${currency} ${numericAmount.toFixed(2)}`;
  }
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return 'Not scheduled';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not scheduled';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function humanizeStatus(status: string) {
  return status.replace(/_/g, ' ');
}

function isActiveSubscription(status: string) {
  return ['active', 'trialing', 'past_due'].includes(status);
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams?: BillingSearchParams;
}) {
  const params = (await searchParams) ?? {};
  const errorMessage = getValue(params, 'error');
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/app/billing');
  }

  const subscriptionQuery = await (supabase as any)
    .from('subscriptions')
    .select('id, status, plan_id, current_period_end, current_period_start, cancel_at_period_end, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const paymentsQuery = await (supabase as any)
    .from('payments')
    .select('id, amount, currency, status, created_at, checkout_url')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  const subscription = (subscriptionQuery.data as SubscriptionRecord | null) ?? null;
  const invoices = ((paymentsQuery.data as PaymentRecord[] | null) ?? []).filter((payment) =>
    ['succeeded', 'processing', 'failed', 'pending', 'canceled', 'expired', 'suspended'].includes(payment.status)
  );
  const hasActiveSubscription = subscription ? isActiveSubscription(subscription.status) : false;
  const latestSuccessfulPayment = invoices.find((invoice) => invoice.status === 'succeeded');
  const planPrice = latestSuccessfulPayment?.amount ?? PRO_PLAN.amount;
  const planCurrency = latestSuccessfulPayment?.currency ?? PRO_PLAN.currency;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-24 lg:pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 lg:mb-8">
        <div>
          <h1 className="font-serif text-3xl lg:text-4xl text-white mb-1 lg:mb-2 tracking-tight">Billing</h1>
          <p className="text-sm lg:text-base text-white/50">Manage your plan, payment method, and invoices.</p>
        </div>
      </div>

      {errorMessage ? (
        <div className="mb-6 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          <div id="current-plan" className="bg-[#121214] border border-white/5 rounded-2xl p-4 sm:p-6 lg:p-8">
            <div className="flex justify-between items-start mb-6 gap-4">
              <div>
                <h2 className="text-[15px] font-medium text-white mb-1">Current plan</h2>
                <p className="text-2xl sm:text-3xl font-bold text-white mt-2 sm:mt-4">
                  {hasActiveSubscription ? (
                    <>
                      {formatCurrency(planPrice, planCurrency)}
                      <span className="text-sm font-normal text-white/50">/month</span>
                    </>
                  ) : (
                    'Free plan'
                  )}
                </p>
              </div>
              <div
                className={`inline-flex items-center rounded-md px-2.5 py-1 text-[10px] sm:text-xs font-semibold ${
                  hasActiveSubscription
                    ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                    : 'bg-white/5 border border-white/10 text-white/70'
                }`}
              >
                {hasActiveSubscription ? (subscription?.plan_id === 'pro_creator' ? 'Pro Creator' : subscription?.plan_id) : 'Starter'}
              </div>
            </div>

            <div className="flex flex-col gap-1 mb-8">
              {hasActiveSubscription ? (
                <>
                  <p className="text-sm text-white/70">
                    Next billing date: {formatDate(subscription?.current_period_end)}
                  </p>
                  <p className="text-sm text-white/70 flex items-center gap-2">
                    Status:{' '}
                    <span className="text-emerald-400 font-medium capitalize">
                      {humanizeStatus(subscription?.status ?? 'active')}
                    </span>
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm text-white/70">
                    Upgrade to unlock Pro Creator workflows, premium outputs, and uninterrupted building.
                  </p>
                  <p className="text-sm text-white/70 flex items-center gap-2">
                    Status: <span className="text-white font-medium">Inactive</span>
                  </p>
                </>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              {hasActiveSubscription ? (
                <>
                  <Link
                    href="/app/billing#invoices"
                    className={buttonVariants({
                      variant: 'outline',
                      className:
                        'w-full sm:w-auto bg-transparent border-white/10 hover:bg-white/5 text-white h-11 sm:h-10',
                    })}
                  >
                    View invoices
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full sm:w-auto text-white/50 hover:text-white hover:bg-white/5 h-11 sm:h-10"
                    disabled
                  >
                    Cancellation portal pending
                  </Button>
                </>
              ) : (
                <>
                  <NowPaymentsCheckoutButton
                    amount={PRO_PLAN.amount}
                    currency={PRO_PLAN.currency}
                    description={PRO_PLAN.description}
                    className="w-full sm:w-auto h-11 sm:h-10 border border-amber-300/20 bg-[linear-gradient(135deg,rgba(255,221,153,0.22),rgba(255,255,255,0.06))] text-white hover:border-amber-200/35 hover:bg-[linear-gradient(135deg,rgba(255,221,153,0.28),rgba(255,255,255,0.09))]"
                  />
                  <Link
                    href="/pricing"
                    className={buttonVariants({
                      variant: 'ghost',
                      className:
                        'w-full sm:w-auto text-white/50 hover:text-white hover:bg-white/5 h-11 sm:h-10',
                    })}
                  >
                    Compare plans
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="bg-[#121214] border border-white/5 rounded-2xl p-4 sm:p-6 lg:p-8">
            <h2 className="text-[15px] font-medium text-white mb-4 sm:mb-6">Payment method</h2>

            <div className="flex items-center justify-between p-3 sm:p-4 rounded-xl border border-white/5 bg-[#0A0A0B] mb-4 sm:mb-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 sm:w-12 h-6 sm:h-8 bg-white/10 rounded flex items-center justify-center">
                  <span className="text-[10px] sm:text-xs font-bold text-white tracking-[0.2em]">PAY</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white leading-none mb-1">
                    {hasActiveSubscription ? 'Managed via NOWPayments checkout' : 'Payment method added during checkout'}
                  </p>
                  <p className="text-[10px] sm:text-xs text-white/50">
                    {hasActiveSubscription
                      ? 'Billing details refresh after confirmed webhook processing.'
                      : 'Start a subscription to add a billing method.'}
                  </p>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full sm:w-auto bg-transparent border-white/10 hover:bg-white/5 text-white h-11 sm:h-10"
              disabled
            >
              Update payment method
            </Button>
          </div>

          <div id="invoices" className="bg-[#121214] border border-white/5 rounded-2xl overflow-hidden">
            <div className="p-4 sm:p-6 lg:p-8 border-b border-white/5">
              <h2 className="text-[15px] font-medium text-white">Invoices</h2>
            </div>

            {invoices.length > 0 ? (
              <>
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="px-6 lg:px-8 py-3 text-xs font-medium text-white/50">Date</th>
                        <th className="px-6 lg:px-8 py-3 text-xs font-medium text-white/50">Amount</th>
                        <th className="px-6 lg:px-8 py-3 text-xs font-medium text-white/50">Status</th>
                        <th className="px-6 lg:px-8 py-3 text-xs font-medium text-white/50 text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {invoices.map((invoice) => (
                        <tr key={invoice.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 lg:px-8 py-4 text-white/90">{formatDate(invoice.created_at)}</td>
                          <td className="px-6 lg:px-8 py-4 text-white/90">
                            {formatCurrency(invoice.amount, invoice.currency)}
                          </td>
                          <td className="px-6 lg:px-8 py-4">
                            <span className="inline-flex items-center rounded bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/70 capitalize">
                              {humanizeStatus(invoice.status)}
                            </span>
                          </td>
                          <td className="px-6 lg:px-8 py-4 text-right">
                            <span className="text-white/35 font-medium text-[13px]">Receipt unavailable</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="sm:hidden flex flex-col divide-y divide-white/5">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="p-4 flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-white text-sm">{formatDate(invoice.created_at)}</div>
                          <div className="text-white/70 text-sm mt-0.5">
                            {formatCurrency(invoice.amount, invoice.currency)}
                          </div>
                        </div>
                        <span className="inline-flex items-center rounded bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/70 capitalize">
                          {humanizeStatus(invoice.status)}
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-white/10 text-white h-10 bg-white/5 font-medium"
                        disabled
                      >
                        Receipt unavailable
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="p-6 sm:p-8 text-sm text-white/55">
                No invoices yet. Your first payment record will appear here after checkout is initiated.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 lg:space-y-6">
          <div className="bg-[#121214] border border-white/5 rounded-2xl p-4 sm:p-6">
            <h2 className="text-[15px] font-medium text-white mb-4 sm:mb-6">Usage this month</h2>

            <div className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/70">Ideas scanned</span>
                  <span className="text-xs font-medium text-white">14 / <span className="text-white/40">unlimited</span></span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/70">Products created</span>
                  <span className="text-xs font-medium text-white">3 / <span className="text-white/40">unlimited</span></span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/70">Sales kits created</span>
                  <span className="text-xs font-medium text-white">2 / <span className="text-white/40">unlimited</span></span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-white/70">Store pages</span>
                  <span className="text-xs font-medium text-white">1 / <span className="text-white/40">5</span></span>
                </div>
                <Progress value={20} className="h-1.5 bg-white/10" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-b from-[#1A1A1E] to-[#121214] border border-white/10 rounded-2xl p-4 sm:p-6">
            <h3 className="text-sm font-medium text-white mb-2">
              {hasActiveSubscription ? 'Scale beyond your current plan?' : 'Need more workspace power?'}
            </h3>
            <p className="text-xs text-white/50 mb-4 sm:mb-6 leading-relaxed">
              {hasActiveSubscription
                ? 'Team billing support is not wired yet, but the next plan tier can layer on collaboration and expanded limits.'
                : 'Upgrade to Pro Creator for premium workflows today, then move to Team for collaboration and more store pages.'}
            </p>
            {hasActiveSubscription ? (
              <Link
                href="/pricing"
                className={buttonVariants({
                  variant: 'outline',
                  className:
                    'w-full border-white/10 bg-transparent text-white hover:bg-white/5 text-sm h-11 sm:h-9',
                })}
              >
                View Team plan
              </Link>
            ) : (
              <Link
                href="#current-plan"
                className={buttonVariants({
                  variant: 'outline',
                  className:
                    'w-full border-white/10 bg-transparent text-white hover:bg-white/5 text-sm h-11 sm:h-9',
                })}
              >
                Review Pro plan
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
