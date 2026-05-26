create extension if not exists pgcrypto;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  provider_payment_id text,
  provider_order_id text,
  status text not null default 'pending',
  amount numeric(12,2) not null,
  currency text not null,
  description text not null,
  checkout_url text,
  idempotency_key text,
  raw_event jsonb,
  req_id text,
  pay_id text,
  auth_code text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table if exists public.payments
  add column if not exists provider_payment_id text,
  add column if not exists provider_order_id text,
  add column if not exists status text,
  add column if not exists amount numeric(12,2),
  add column if not exists currency text,
  add column if not exists description text,
  add column if not exists checkout_url text,
  add column if not exists idempotency_key text,
  add column if not exists raw_event jsonb,
  add column if not exists req_id text,
  add column if not exists pay_id text,
  add column if not exists auth_code text,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz;

alter table if exists public.payments
  alter column status set default 'pending',
  alter column created_at set default timezone('utc', now()),
  alter column updated_at set default timezone('utc', now());

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'inactive',
  plan_id text not null,
  provider text not null,
  provider_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table if exists public.subscriptions
  add column if not exists status text,
  add column if not exists plan_id text,
  add column if not exists provider text,
  add column if not exists provider_subscription_id text,
  add column if not exists current_period_start timestamptz,
  add column if not exists current_period_end timestamptz,
  add column if not exists cancel_at_period_end boolean,
  add column if not exists created_at timestamptz,
  add column if not exists updated_at timestamptz;

alter table if exists public.subscriptions
  alter column status set default 'inactive',
  alter column cancel_at_period_end set default false,
  alter column created_at set default timezone('utc', now()),
  alter column updated_at set default timezone('utc', now());

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  event_type text not null,
  payload jsonb not null,
  processed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

alter table if exists public.webhook_events
  add column if not exists provider text,
  add column if not exists event_id text,
  add column if not exists event_type text,
  add column if not exists payload jsonb,
  add column if not exists processed boolean,
  add column if not exists created_at timestamptz;

alter table if exists public.webhook_events
  alter column processed set default false,
  alter column created_at set default timezone('utc', now());

create index if not exists payments_user_id_idx
  on public.payments (user_id);

create index if not exists payments_idempotency_key_idx
  on public.payments (idempotency_key);

create index if not exists payments_req_id_idx
  on public.payments (req_id);

create index if not exists payments_pay_id_idx
  on public.payments (pay_id);

create index if not exists payments_provider_order_id_idx
  on public.payments (provider, provider_order_id);

create index if not exists subscriptions_user_id_idx
  on public.subscriptions (user_id);

create index if not exists webhook_events_event_id_idx
  on public.webhook_events (event_id);

create unique index if not exists webhook_events_provider_event_id_idx
  on public.webhook_events (provider, event_id);

alter table public.payments enable row level security;
alter table public.subscriptions enable row level security;
alter table public.webhook_events enable row level security;

do $$
begin
  create policy "users_can_view_own_payments"
    on public.payments
    for select
    to authenticated
    using (auth.uid() = user_id);
exception
  when duplicate_object then
    null;
end
$$;

do $$
begin
  create policy "users_can_insert_own_payments"
    on public.payments
    for insert
    to authenticated
    with check (auth.uid() = user_id);
exception
  when duplicate_object then
    null;
end
$$;

do $$
begin
  create policy "users_can_update_own_payments"
    on public.payments
    for update
    to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception
  when duplicate_object then
    null;
end
$$;

do $$
begin
  create policy "service_can_manage_payments"
    on public.payments
    for all
    to service_role
    using (true)
    with check (true);
exception
  when duplicate_object then
    null;
end
$$;

do $$
begin
  create policy "users_can_view_own_subscriptions"
    on public.subscriptions
    for select
    to authenticated
    using (auth.uid() = user_id);
exception
  when duplicate_object then
    null;
end
$$;

do $$
begin
  create policy "service_can_manage_subscriptions"
    on public.subscriptions
    for all
    to service_role
    using (true)
    with check (true);
exception
  when duplicate_object then
    null;
end
$$;

do $$
begin
  create policy "service_can_manage_webhook_events"
    on public.webhook_events
    for all
    to service_role
    using (true)
    with check (true);
exception
  when duplicate_object then
    null;
end
$$;
