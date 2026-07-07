-- 0001_extensions_enums_helpers.sql
-- Extensoes, enums e funcao helper de updated_at
-- Projeto NOVO Supabase (Reforma V2). Gerado por introspeccao em 2026-07-07 do projeto ctntlgvoefdbjxvfkahp.
-- Revisar antes de aplicar. Aplicar em ordem 0001..0010.

set check_function_bodies = off;
create extension if not exists pgcrypto;

-- Enums
do $$ begin
  create type public.app_role as enum ('admin', 'rh_manager', 'user');
exception when duplicate_object then null; end $$;

-- Helper: trigger de updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;
