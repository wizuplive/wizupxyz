create table if not exists public.source_signals (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references public.source_documents(id) on delete cascade,
  signal_type text,
  content jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.integration_errors (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.integration_runs(id) on delete cascade,
  error_message text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.source_signals enable row level security;
alter table public.integration_errors enable row level security;

grant select, insert, update, delete on public.source_signals to authenticated;
grant insert on public.integration_errors to authenticated;

drop policy if exists "Source signals are selectable by project owner" on public.source_signals;
create policy "Source signals are selectable by project owner"
on public.source_signals for select to authenticated
using (
  exists (
    select 1
    from public.source_documents
    join public.market_scans on market_scans.id = source_documents.scan_id
    join public.projects on projects.id = market_scans.project_id
    where source_documents.id = source_signals.document_id
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Source signals are insertable by project owner" on public.source_signals;
create policy "Source signals are insertable by project owner"
on public.source_signals for insert to authenticated
with check (
  exists (
    select 1
    from public.source_documents
    join public.market_scans on market_scans.id = source_documents.scan_id
    join public.projects on projects.id = market_scans.project_id
    where source_documents.id = source_signals.document_id
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Source signals are updatable by project owner" on public.source_signals;
create policy "Source signals are updatable by project owner"
on public.source_signals for update to authenticated
using (
  exists (
    select 1
    from public.source_documents
    join public.market_scans on market_scans.id = source_documents.scan_id
    join public.projects on projects.id = market_scans.project_id
    where source_documents.id = source_signals.document_id
      and projects.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.source_documents
    join public.market_scans on market_scans.id = source_documents.scan_id
    join public.projects on projects.id = market_scans.project_id
    where source_documents.id = source_signals.document_id
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Source signals are deletable by project owner" on public.source_signals;
create policy "Source signals are deletable by project owner"
on public.source_signals for delete to authenticated
using (
  exists (
    select 1
    from public.source_documents
    join public.market_scans on market_scans.id = source_documents.scan_id
    join public.projects on projects.id = market_scans.project_id
    where source_documents.id = source_signals.document_id
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Integration errors are insertable by authenticated users" on public.integration_errors;
create policy "Integration errors are insertable by authenticated users"
on public.integration_errors for insert to authenticated
with check (true);
