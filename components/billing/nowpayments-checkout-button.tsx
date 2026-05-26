'use client';

import { useState } from 'react';

import { Button } from '@/components/ui/button';

type Props = {
  amount?: number;
  currency?: string;
  description?: string;
  payCurrency?: string;
  className?: string;
};

export function NowPaymentsCheckoutButton({
  amount = 29,
  currency = 'USD',
  description = 'WIZUP Pro Creator subscription',
  payCurrency,
  className,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/nowpayments/checkout', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ amount, currency, description, payCurrency }),
      });

      const result = (await response.json()) as {
        ok?: boolean;
        checkoutUrl?: string;
        reused?: boolean;
        error?: string;
      };

      if (!response.ok || !result.ok || !result.checkoutUrl) {
        throw new Error(result.error || 'Unable to start NOWPayments checkout');
      }

      window.location.href = result.checkoutUrl;
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to start NOWPayments checkout');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full sm:w-auto">
      <Button
        type="button"
        onClick={onClick}
        disabled={loading}
        className={
          className ??
          'w-full sm:w-auto h-11 border border-emerald-300/20 bg-[linear-gradient(135deg,rgba(74,222,128,0.2),rgba(255,255,255,0.06))] text-white shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-sm transition hover:border-emerald-200/35 hover:bg-[linear-gradient(135deg,rgba(74,222,128,0.28),rgba(255,255,255,0.09))]'
        }
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Launching checkout
          </span>
        ) : (
          'Pay with Crypto'
        )}
      </Button>
      {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
    </div>
  );
}
