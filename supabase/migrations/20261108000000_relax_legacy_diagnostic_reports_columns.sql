-- Nexora · diagnostic_reports
-- La app guarda cada informe en ai_diagnosis. Las columnas antiguas obligatorias
-- (p. ej. system_metrics) impedían insertar (23502); pasan a ser opcionales.
-- No borra columnas ni datos. Idempotente.

do $$
declare
  legacy record;
begin
  for legacy in
    select column_name
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'diagnostic_reports'
      and is_nullable = 'NO'
      and column_default is null
      and is_identity = 'NO'
      and is_generated = 'NEVER'
      and column_name not in ('id', 'user_id', 'created_at', 'ai_diagnosis')
  loop
    execute format('alter table public.diagnostic_reports alter column %I drop not null', legacy.column_name);
  end loop;
end
$$;
