-- Nexora · report_messages
-- Conversaciones con la IA sobre cada informe guardado. Idempotente.
-- Ejecútalo en Supabase → SQL Editor, o con `supabase db push`.

-- report_id usa el mismo tipo que diagnostic_reports.id (uuid en tablas nuevas,
-- puede ser otro en tablas antiguas), por eso la tabla se crea dinámicamente.
do $$
declare
  report_id_type text;
begin
  select format_type(attribute.atttypid, attribute.atttypmod)
    into report_id_type
  from pg_attribute attribute
  where attribute.attrelid = 'public.diagnostic_reports'::regclass
    and attribute.attname = 'id'
    and not attribute.attisdropped;

  execute format(
    'create table if not exists public.report_messages (
       id uuid primary key default gen_random_uuid(),
       report_id %s not null references public.diagnostic_reports (id) on delete cascade,
       user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
       role text not null check (role in (''user'', ''assistant'')),
       content text not null check (char_length(content) between 1 and 4000),
       created_at timestamptz not null default now()
     )',
    report_id_type
  );
end
$$;

create index if not exists report_messages_report_created_idx
  on public.report_messages (report_id, created_at);

alter table public.report_messages enable row level security;

-- Cada usuario lee y borra solo sus mensajes.
drop policy if exists "report_messages_select_own" on public.report_messages;
create policy "report_messages_select_own"
  on public.report_messages
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Y solo puede escribir en conversaciones de sus propios informes.
drop policy if exists "report_messages_insert_own" on public.report_messages;
create policy "report_messages_insert_own"
  on public.report_messages
  for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.diagnostic_reports report
      where report.id = report_id
        and report.user_id = (select auth.uid())
    )
  );

drop policy if exists "report_messages_delete_own" on public.report_messages;
create policy "report_messages_delete_own"
  on public.report_messages
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);
