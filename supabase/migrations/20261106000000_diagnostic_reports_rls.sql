-- Nexora · diagnostic_reports
-- Idempotente: se puede ejecutar sobre la tabla existente (id, user_id, created_at, ai_diagnosis).
-- Ejecútalo en Supabase → SQL Editor, o con `supabase db push`.

create table if not exists public.diagnostic_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  ai_diagnosis jsonb not null
);

create index if not exists diagnostic_reports_user_created_idx
  on public.diagnostic_reports (user_id, created_at desc);

-- Cada usuario solo puede crear y leer sus propios informes.
alter table public.diagnostic_reports enable row level security;

drop policy if exists "diagnostic_reports_insert_own" on public.diagnostic_reports;
create policy "diagnostic_reports_insert_own"
  on public.diagnostic_reports
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "diagnostic_reports_select_own" on public.diagnostic_reports;
create policy "diagnostic_reports_select_own"
  on public.diagnostic_reports
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "diagnostic_reports_delete_own" on public.diagnostic_reports;
create policy "diagnostic_reports_delete_own"
  on public.diagnostic_reports
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
