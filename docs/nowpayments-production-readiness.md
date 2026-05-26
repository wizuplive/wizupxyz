# NOWPayments Production Readiness

Date: 2026-05-26
Project: WIZUP
Scope: Controlled production billing activation readiness. No deployment, Vercel mutation, Supabase schema change, auth change, onboarding change, or UI redesign is included here.

## Current Status

The local TEST_MODE lifecycle is validated end to end:

- Invoice creation works.
- NOWPayments hosted checkout works.
- MetaMask payment succeeds on Base ETH.
- Redirect return flow works.
- Payment row persistence works.
- Webhook replay works.
- Pending to completed transition works.
- TEST_MODE remains isolated from subscription/entitlement mutation.
- Subscription mutation is gated.

Production code paths are prepared for shadow-mode activation, but live subscription mutation must remain disabled until a controlled production callback has been verified.

## Production Env Requirements

Required:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `NOWPAYMENTS_API_URL=https://api.nowpayments.io/v1`
- `NOWPAYMENTS_API_KEY`
- `NOWPAYMENTS_IPN_SECRET`

Safety controls:

- `WIZUP_BILLING_WEBHOOK_KILL_SWITCH=1` immediately disables production webhook processing.
- `WIZUP_BILLING_SUBSCRIPTION_MUTATIONS_ENABLED` must be unset/false for shadow mode.
- `WIZUP_BILLING_SUBSCRIPTION_MUTATIONS_ENABLED=true` is required for live subscription mutation.
- `WIZUP_NOWPAYMENTS_TEST_MODE` and `WIZUP_NOWPAYMENTS_TEST_TOKEN` are local-only controls and should not expose public checkout UX.
- `NOWPAYMENTS_WEBHOOK_ALLOWED_IPS` is optional. Enable only after confirmed provider source IPs are known.

## Readiness Audit

Ready:

- NOWPayments request signing and IPN signature verification exist.
- Production webhook rejects TEST_MODE order ids.
- TEST_MODE webhook can mutate only payment rows and never subscriptions.
- Replay protection uses stable event ids.
- Duplicate provider-payment protection exists.
- Payment state machine handles pending, confirming, completed, failed, expired, and rollback_required.
- Billing entitlement planner is centralized.
- Subscription mutation path is centralized in reconciliation.
- Mutation is disabled unless an explicit env flag is set.
- Billing audit events are written separately from raw provider webhook events.
- Rollback/refund does not grant entitlement.
- Late callbacks do not downgrade completed payments.

Needs production verification:

- Provider-delivered webhook arrival on production URL.
- Source IP behavior if an allowlist is used.
- Production log visibility and alerting.
- Reconciliation cron behavior against real production data.

## Staged Rollout Plan

1. Local validated
   - Keep `WIZUP_NOWPAYMENTS_TEST_MODE=true` only locally.
   - Create TEST_MODE invoice, pay, replay webhook, confirm payment row reaches `completed`.
   - Confirm subscription rows do not change.

2. Tunnel verified
   - Expose only the webhook route through a temporary tunnel.
   - Use a hidden TEST_MODE payment.
   - Confirm NOWPayments callback reaches the route and signature verification passes.
   - Confirm payment row mutation and audit events.
   - Disable tunnel immediately after test.

3. Staging verified
   - Use staging env values and staging URL.
   - Keep subscription mutation disabled.
   - Execute a low-value production-provider payment if staging has isolated data.
   - Confirm webhook, duplicate replay, stale replay, refund simulation, and rollback planning.

4. Production shadow mode
   - Deploy code with `WIZUP_BILLING_SUBSCRIPTION_MUTATIONS_ENABLED` unset/false.
   - Keep public billing checkout hidden.
   - Confirm production webhooks update payments and write billing audit events.
   - Confirm no subscription or entitlement changes.

5. Production live mode
   - Enable `WIZUP_BILLING_SUBSCRIPTION_MUTATIONS_ENABLED=true`.
   - Start with one internal account only.
   - Watch webhook, payment, subscription, and billing audit events.
   - Keep `WIZUP_BILLING_WEBHOOK_KILL_SWITCH` ready.

## Observability Recommendations

Log and monitor:

- Webhook received count by `payment_status`.
- Signature failures.
- Payment lookup failures.
- Duplicate payment detections.
- Replay ignored events.
- Payment status transitions.
- Billing reconciliation actions.
- Subscription mutation attempts and failures.
- `rollback_required` events.
- `payment_expired` events.

Alerts:

- Any signature failure spike.
- Any webhook 500.
- Any `payment_completed` without billing audit event.
- Any `activate_subscription` without matching completed payment.
- Any duplicate provider payment id.
- Any rollback/refund callback for active subscriber.
- Any payment pending longer than the timeout window.

## Failure Recovery Strategy

Webhook fails before payment update:

- Replay the signed provider payload using `scripts/billing/nowpayments-harness.mjs replay`.
- If payload is unavailable, fetch by provider payment id and use `replay-latest-np`.

Payment completed but subscription not activated:

- Run `inspect --paymentId <payment_id>`.
- Confirm payment is `completed`.
- Run mutation preview first.
- Enable mutation only after confirming the target subscription row.

Duplicate callbacks:

- Expected to be idempotent.
- Confirm event action is `replay_ignored` or `duplicate_ignored`.

Refund or rollback:

- Confirm payment transitions or plans `rollback_required`.
- Do not grant entitlement from refund callbacks.
- Manually review subscription state before any entitlement revocation.

## Cron Recommendations

Run a reconciliation job on a short interval after launch:

- Find `pending` NOWPayments payments older than 15 minutes and inspect provider status.
- Find `confirming` payments older than 30 minutes and inspect provider status.
- Find `completed` payments without `billing:` audit events and reconcile.
- Find `payment_expired` candidates older than timeout and mark/reconcile.
- Emit a report, not silent mutations, until production live mode is stable.

Suggested cadence:

- Shadow mode: every 15 minutes, report-only.
- First live day: every 10 minutes, report plus guarded reconciliation.
- Stable live mode: every 30 minutes.

## Rollback Procedures

Immediate stop:

1. Set `WIZUP_BILLING_WEBHOOK_KILL_SWITCH=1`.
2. Confirm production webhook returns 503.
3. Disable public billing entry points if any are enabled.

Stop subscription mutation only:

1. Unset `WIZUP_BILLING_SUBSCRIPTION_MUTATIONS_ENABLED`.
2. Leave webhook payment updates active if safe.
3. Continue audit-event collection.

Manual rollback:

1. Inspect target payment and subscription.
2. Use harness rollback preview.
3. Apply manual subscription correction only after verifying provider transaction state.
4. Add a billing audit event describing the manual correction.

## Deployment Readiness

Status: ready for production shadow mode, not ready for unattended live subscription mutation.

Production live mode requires:

- One provider-delivered production webhook verification.
- Confirmed production logging visibility.
- Confirmed rollback owner and procedure.
- Explicit human approval to enable `WIZUP_BILLING_SUBSCRIPTION_MUTATIONS_ENABLED`.
- A first-account-only activation window.

## Human Activation Checklist

- Confirm production env values are set and secrets are not empty.
- Confirm `WIZUP_BILLING_SUBSCRIPTION_MUTATIONS_ENABLED` is false/unset for first deploy.
- Confirm `WIZUP_BILLING_WEBHOOK_KILL_SWITCH` is false/unset before shadow test.
- Confirm public checkout UX remains hidden until explicitly approved.
- Deploy code only after review.
- Perform production shadow payment.
- Inspect payment row, webhook event, and `billing:` audit event.
- Replay duplicate callback and verify idempotency.
- Simulate refund/rollback and verify no entitlement grant.
- Enable live mutation only for the internal test account.
