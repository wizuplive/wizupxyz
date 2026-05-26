# WIZUP PhotonPay Integration Design

## Status: PENDING HUMAN REVIEW

## PhotonPay Product Fit

Based on MEMORY.md context and PhotonPay's positioning as a cross-border payment provider:

**Recommended: PhotonPay Checkout API**
- PhotonPay provides a hosted checkout flow (redirect-based)
- Merchant creates a payment order via API -> receives checkout URL -> redirects user
- User completes payment on PhotonPay's hosted page
- PhotonPay sends webhook notification on payment completion
- Supports 60+ currencies, 150+ countries

**Alternative: Payment Link API** (if checkout redirect is not suitable)
- Generate payment links that can be shared
- Less integrated but simpler to implement

## Required Environment Variables

```
PHOTONPAY_API_BASE_URL=       # e.g. https://api.photonpay.com or sandbox URL
PHOTONPAY_MERCHANT_ID=        # Merchant ID from PhotonPay dashboard
PHOTONPAY_API_KEY=            # API key for server-side requests
PHOTONPAY_API_SECRET=         # API secret for request signing
PHOTONPAY_WEBHOOK_SECRET=     # Webhook signature verification secret
NEXT_PUBLIC_APP_URL=          # App URL for return/cancel redirects
```

**NO VALUES ARE SET** — these must be provided by the human operator from the PhotonPay dashboard.

## API Endpoint Assumptions (REQUIRES DOC VERIFICATION)

⚠️ **BLOCKER**: The PhotonPay API docs at https://api-doc.photonpay.com/?lang=en are a JavaScript-rendered SPA. The OpenAPI spec is embedded in the JS bundle and cannot be extracted without browser rendering. The following endpoint assumptions are based on standard payment provider patterns and MUST be verified against the actual docs.

### Assumed Endpoints:
1. **Create Payment Order**: `POST /api/v1/orders` or `POST /api/v1/checkout`
   - Request: { amount, currency, merchant_order_id, description, return_url, cancel_url, notify_url }
   - Response: { order_id, checkout_url, expires_at }

2. **Query Payment Status**: `GET /api/v1/orders/{order_id}`
   - Response: { order_id, status, amount, currency, paid_at }

3. **Webhook Notification**: PhotonPay POSTs to our webhook URL
   - Payload: { order_id, status, amount, currency, signature }
   - We verify signature and update local state

### Assumed Authentication:
- API Key + API Secret for HMAC-SHA256 signature
- Signature = HMAC-SHA256(timestamp + method + path + body, secret)
- Headers: X-API-Key, X-Timestamp, X-Signature

⚠️ **MUST BE VERIFIED** against actual PhotonPay docs.

## Routes to Implement

1. `app/api/payments/photonpay/checkout/route.ts` — Create payment order, redirect to checkout
2. `app/api/payments/photonpay/webhook/route.ts` — Receive and verify webhook notifications
3. `app/billing/success/page.tsx` — Payment success return page (public)
4. `app/billing/cancel/page.tsx` — Payment cancel return page (public)

## Data Model Changes

New migration: `supabase/migrations/20260519000001_payments.sql`

```sql
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null default 'photonpay',
  provider_payment_id text,
  provider_order_id text,
  status text not null default 'pending',
  amount integer not null,
  currency text not null default 'USD',
  description text,
  checkout_url text,
  idempotency_key text unique,
  raw_event jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null default 'inactive',
  plan_id text not null default 'pro_creator',
  provider text not null default 'photonpay',
  provider_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'photonpay',
  event_id text unique,
  event_type text,
  payload jsonb not null default '{}'::jsonb,
  processed boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now())
);

-- RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments FORCE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events FORCE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "Users can insert own payments" ON public.payments FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
CREATE POLICY "Service can update payments" ON public.payments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
CREATE POLICY "Service can manage subscriptions" ON public.subscriptions FOR ALL TO authenticated USING (true);
CREATE POLICY "Service can manage webhook_events" ON public.webhook_events FOR ALL TO authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS payments_user_id_idx ON public.payments (user_id);
CREATE INDEX IF NOT EXISTS payments_provider_order_id_idx ON public.payments (provider_order_id);
CREATE INDEX IF NOT EXISTS payments_idempotency_key_idx ON public.payments (idempotency_key);
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions (user_id);
CREATE INDEX IF NOT EXISTS webhook_events_event_id_idx ON public.webhook_events (event_id);
```

## Webhook Verification Strategy

1. Receive POST request from PhotonPay
2. Extract signature from header (assumed: X-Signature or similar)
3. Verify signature using PHOTONPAY_WEBHOOK_SECRET
4. If signature docs are not confirmed → **FAIL CLOSED** in production (reject all webhooks)
5. Allow explicit mock/test mode for local development only
6. Idempotently process: check webhook_events table for duplicate event_id
7. Update payment status and subscription state
8. Return 200 only after safe processing

## Local Mock Strategy

When PhotonPay credentials are missing:
- Checkout route returns a mock checkout URL pointing to a local test page
- Webhook route accepts mock payloads with a test header
- Payment records are created with provider = 'photonpay-mock'
- All mock data is clearly marked and never treated as real payments

## Billing UI Changes

1. Replace hardcoded $29/mo "Pro Creator" with dynamic subscription state
2. Add "Start subscription" button for users without active subscription
3. Add "Manage billing" button for users with active subscription
4. Show subscription status: active / pending / canceled / inactive
5. Show usage metrics (ideas scanned, products created, etc.)
6. Keep premium WIZUP dark cinematic style

## Human Approval Gates

1. **PHOTONPAY DOCS ACCESS**: Human must provide API endpoint details, auth method, and webhook signature scheme from the PhotonPay dashboard/docs
2. **CREDENTIALS**: Human must provide sandbox API key/secret from PhotonPay merchant dashboard
3. **WEBHOOK URL**: Human must register webhook URL in PhotonPay dashboard (requires deployed URL)
4. **LIVE ACTIVATION**: Human must approve switching from mock mode to live mode
5. **PRODUCTION DEPLOY**: Human must approve Vercel deployment with production env vars

## Implementation Order

1. Create lib/payments/photonpay.ts provider module
2. Create lib/payments/types.ts and lib/payments/index.ts
3. Create checkout route (app/api/payments/photonpay/checkout/route.ts)
4. Create webhook route (app/api/payments/photonpay/webhook/route.ts)
5. Create success/cancel pages
6. Update billing page with dynamic state
7. Add Supabase migration draft
8. Add tests
9. Run build + smoke validation
10. EKKO audit of billing UX

## Known Unknowns (Require Human/Provider Input)

1. Exact API base URL (sandbox vs production)
2. Exact endpoint paths for create order, query order
3. Exact authentication method (HMAC signature format, header names)
4. Exact webhook payload structure and signature header name
5. Exact error response format
6. Supported currencies and minimum amounts
7. Refund API availability
8. Subscription/recurring payment support
