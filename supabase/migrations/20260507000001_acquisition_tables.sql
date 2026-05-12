
create table if not exists public.market_scans (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  query text not null,
  provider text not null,
  raw_results jsonb not null default '[]'::jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.source_documents (
  id uuid primary key default gen_random_uuid(),
  scan_id uuid references public.market_scans(id) on delete cascade,
  url text not null,
  content text not null,
  metadata jsonb not null default '{}'::jsonb,
  score numeric(5,2),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.integration_runs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  endpoint text not null,
  payload jsonb not null default '{}'::jsonb,
  response jsonb,
  error text,
  duration_ms integer,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists market_scans_project_id_idx on public.market_scans (project_id);
create index if not exists source_documents_scan_id_idx on public.source_documents (scan_id);
create index if not exists source_documents_url_idx on public.source_documents (url);
create index if not exists integration_runs_provider_created_at_idx on public.integration_runs (provider, created_at desc);

alter table public.market_scans enable row level security;
alter table public.source_documents enable row level security;
alter table public.integration_runs enable row level security;

grant select, insert, update, delete on public.market_scans to authenticated;
grant select, insert, update, delete on public.source_documents to authenticated;
grant insert on public.integration_runs to authenticated;

drop policy if exists "Market scans are selectable by project owner" on public.market_scans;
create policy "Market scans are selectable by project owner"
on public.market_scans for select to authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = market_scans.project_id
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Market scans are insertable by project owner" on public.market_scans;
create policy "Market scans are insertable by project owner"
on public.market_scans for insert to authenticated
with check (
  exists (
    select 1
    from public.projects
    where projects.id = market_scans.project_id
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Market scans are updatable by project owner" on public.market_scans;
create policy "Market scans are updatable by project owner"
on public.market_scans for update to authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = market_scans.project_id
      and projects.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.projects
    where projects.id = market_scans.project_id
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Market scans are deletable by project owner" on public.market_scans;
create policy "Market scans are deletable by project owner"
on public.market_scans for delete to authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = market_scans.project_id
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Source documents are selectable by project owner" on public.source_documents;
create policy "Source documents are selectable by project owner"
on public.source_documents for select to authenticated
using (
  exists (
    select 1
    from public.market_scans
    join public.projects on projects.id = market_scans.project_id
    where market_scans.id = source_documents.scan_id
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Source documents are insertable by project owner" on public.source_documents;
create policy "Source documents are insertable by project owner"
on public.source_documents for insert to authenticated
with check (
  exists (
    select 1
    from public.market_scans
    join public.projects on projects.id = market_scans.project_id
    where market_scans.id = source_documents.scan_id
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Source documents are updatable by project owner" on public.source_documents;
create policy "Source documents are updatable by project owner"
on public.source_documents for update to authenticated
using (
  exists (
    select 1
    from public.market_scans
    join public.projects on projects.id = market_scans.project_id
    where market_scans.id = source_documents.scan_id
      and projects.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.market_scans
    join public.projects on projects.id = market_scans.project_id
    where market_scans.id = source_documents.scan_id
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Source documents are deletable by project owner" on public.source_documents;
create policy "Source documents are deletable by project owner"
on public.source_documents for delete to authenticated
using (
  exists (
    select 1
    from public.market_scans
    join public.projects on projects.id = market_scans.project_id
    where market_scans.id = source_documents.scan_id
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Integration runs are insertable by authenticated users" on public.integration_runs;
create policy "Integration runs are insertable by authenticated users"
on public.integration_runs for insert to authenticated
with check (true);
