alter table public.profiles
add column if not exists onboarding_preferences jsonb not null default '{}'::jsonb;
