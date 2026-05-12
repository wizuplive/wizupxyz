create extension if not exists pgcrypto with schema extensions;

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  status text not null default 'draft',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint projects_name_not_blank check (length(btrim(name)) > 0),
  constraint projects_status_valid check (status in ('draft', 'active', 'archived'))
);

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  description text not null default '',
  ai_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint ideas_title_not_blank check (length(btrim(title)) > 0)
);

create table if not exists public.examples (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  content text not null,
  type text not null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint examples_content_not_blank check (length(btrim(content)) > 0),
  constraint examples_type_not_blank check (length(btrim(type)) > 0)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  content jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.sales_assets (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  asset_type text not null,
  content jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint sales_assets_asset_type_not_blank check (length(btrim(asset_type)) > 0)
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  content jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists projects_user_id_idx on public.projects (user_id);
create index if not exists ideas_project_id_idx on public.ideas (project_id);
create index if not exists examples_project_id_idx on public.examples (project_id);
create index if not exists products_project_id_idx on public.products (project_id);
create index if not exists sales_assets_project_id_idx on public.sales_assets (project_id);
create index if not exists stores_project_id_idx on public.stores (project_id);

create or replace function public.set_wizup_core_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row
execute function public.set_wizup_core_updated_at();

drop trigger if exists ideas_set_updated_at on public.ideas;
create trigger ideas_set_updated_at
before update on public.ideas
for each row
execute function public.set_wizup_core_updated_at();

drop trigger if exists examples_set_updated_at on public.examples;
create trigger examples_set_updated_at
before update on public.examples
for each row
execute function public.set_wizup_core_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row
execute function public.set_wizup_core_updated_at();

drop trigger if exists sales_assets_set_updated_at on public.sales_assets;
create trigger sales_assets_set_updated_at
before update on public.sales_assets
for each row
execute function public.set_wizup_core_updated_at();

drop trigger if exists stores_set_updated_at on public.stores;
create trigger stores_set_updated_at
before update on public.stores
for each row
execute function public.set_wizup_core_updated_at();

alter table public.projects enable row level security;
alter table public.projects force row level security;
alter table public.ideas enable row level security;
alter table public.ideas force row level security;
alter table public.examples enable row level security;
alter table public.examples force row level security;
alter table public.products enable row level security;
alter table public.products force row level security;
alter table public.sales_assets enable row level security;
alter table public.sales_assets force row level security;
alter table public.stores enable row level security;
alter table public.stores force row level security;

revoke all on public.projects from anon, authenticated;
revoke all on public.ideas from anon, authenticated;
revoke all on public.examples from anon, authenticated;
revoke all on public.products from anon, authenticated;
revoke all on public.sales_assets from anon, authenticated;
revoke all on public.stores from anon, authenticated;

grant select, insert, update, delete on public.projects to authenticated;
grant select, insert, update, delete on public.ideas to authenticated;
grant select, insert, update, delete on public.examples to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.sales_assets to authenticated;
grant select, insert, update, delete on public.stores to authenticated;

drop policy if exists "Projects are selectable by owner" on public.projects;
create policy "Projects are selectable by owner"
on public.projects
for select
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Projects are insertable by owner" on public.projects;
create policy "Projects are insertable by owner"
on public.projects
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Projects are updatable by owner" on public.projects;
create policy "Projects are updatable by owner"
on public.projects
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Projects are deletable by owner" on public.projects;
create policy "Projects are deletable by owner"
on public.projects
for delete
to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists "Ideas are selectable by project owner" on public.ideas;
create policy "Ideas are selectable by project owner"
on public.ideas
for select
to authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = ideas.project_id
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Ideas are insertable by project owner" on public.ideas;
create policy "Ideas are insertable by project owner"
on public.ideas
for insert
to authenticated
with check (
  exists (
    select 1
    from public.projects
    where projects.id = ideas.project_id
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Ideas are updatable by project owner" on public.ideas;
create policy "Ideas are updatable by project owner"
on public.ideas
for update
to authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = ideas.project_id
      and projects.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.projects
    where projects.id = ideas.project_id
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Ideas are deletable by project owner" on public.ideas;
create policy "Ideas are deletable by project owner"
on public.ideas
for delete
to authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = ideas.project_id
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Examples are selectable by project owner" on public.examples;
create policy "Examples are selectable by project owner"
on public.examples
for select
to authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = examples.project_id
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Examples are insertable by project owner" on public.examples;
create policy "Examples are insertable by project owner"
on public.examples
for insert
to authenticated
with check (
  exists (
    select 1
    from public.projects
    where projects.id = examples.project_id
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Examples are updatable by project owner" on public.examples;
create policy "Examples are updatable by project owner"
on public.examples
for update
to authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = examples.project_id
      and projects.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.projects
    where projects.id = examples.project_id
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Examples are deletable by project owner" on public.examples;
create policy "Examples are deletable by project owner"
on public.examples
for delete
to authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = examples.project_id
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Products are selectable by project owner" on public.products;
create policy "Products are selectable by project owner"
on public.products
for select
to authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = products.project_id
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Products are insertable by project owner" on public.products;
create policy "Products are insertable by project owner"
on public.products
for insert
to authenticated
with check (
  exists (
    select 1
    from public.projects
    where projects.id = products.project_id
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Products are updatable by project owner" on public.products;
create policy "Products are updatable by project owner"
on public.products
for update
to authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = products.project_id
      and projects.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.projects
    where projects.id = products.project_id
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Products are deletable by project owner" on public.products;
create policy "Products are deletable by project owner"
on public.products
for delete
to authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = products.project_id
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Sales assets are selectable by project owner" on public.sales_assets;
create policy "Sales assets are selectable by project owner"
on public.sales_assets
for select
to authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = sales_assets.project_id
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Sales assets are insertable by project owner" on public.sales_assets;
create policy "Sales assets are insertable by project owner"
on public.sales_assets
for insert
to authenticated
with check (
  exists (
    select 1
    from public.projects
    where projects.id = sales_assets.project_id
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Sales assets are updatable by project owner" on public.sales_assets;
create policy "Sales assets are updatable by project owner"
on public.sales_assets
for update
to authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = sales_assets.project_id
      and projects.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.projects
    where projects.id = sales_assets.project_id
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Sales assets are deletable by project owner" on public.sales_assets;
create policy "Sales assets are deletable by project owner"
on public.sales_assets
for delete
to authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = sales_assets.project_id
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Stores are selectable by project owner" on public.stores;
create policy "Stores are selectable by project owner"
on public.stores
for select
to authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = stores.project_id
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Stores are insertable by project owner" on public.stores;
create policy "Stores are insertable by project owner"
on public.stores
for insert
to authenticated
with check (
  exists (
    select 1
    from public.projects
    where projects.id = stores.project_id
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Stores are updatable by project owner" on public.stores;
create policy "Stores are updatable by project owner"
on public.stores
for update
to authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = stores.project_id
      and projects.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.projects
    where projects.id = stores.project_id
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "Stores are deletable by project owner" on public.stores;
create policy "Stores are deletable by project owner"
on public.stores
for delete
to authenticated
using (
  exists (
    select 1
    from public.projects
    where projects.id = stores.project_id
      and projects.user_id = (select auth.uid())
  )
);
