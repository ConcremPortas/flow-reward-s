-- ============================================================================
-- PROPOSTA (Fase 3 — RLS) LOTE 0001: HELPERS — NÃO APLICAR AINDA
-- Funcoes de autorizacao baseadas em auth.uid(), espelhando o canAccess do
-- frontend (perfil + secoes). DEPENDE da Fase 2 (Supabase Auth) estar validada:
-- sem auth.uid()/get_my_perfil funcionando, estas funcoes retornam NULL/false
-- e as policies dos lotes seguintes bloqueiam o app.
--
-- Requer: get_my_perfil() (0008) e o vinculo auth_user_id (phase2 0001).
-- Reversivel: 0001_phase3_helpers_rollback.sql
-- ============================================================================

-- Seções do usuário logado (jsonb array, ex.: ["rh","sesmt"]).
create or replace function public.current_secoes()
  returns jsonb language sql stable security definer set search_path = public
as $$
  select coalesce(u.secoes, '[]'::jsonb)
  from concremrh_usuarios u
  where u.auth_user_id = auth.uid() and u.ativo = true
  limit 1;
$$;

-- É admin?  (admin tem acesso total)
create or replace function public.is_admin()
  returns boolean language sql stable security definer set search_path = public
as $$ select public.get_my_perfil() = 'admin'; $$;

-- Perfil do usuário está entre os informados?
create or replace function public.has_perfil(variadic p_perfis text[])
  returns boolean language sql stable security definer set search_path = public
as $$ select public.get_my_perfil() = any(p_perfis); $$;

-- Usuário tem a seção (ou é admin)? Espelha AuthContext.canAccess.
-- `?` testa existência do elemento no array jsonb (secoes = ["rh",...]).
create or replace function public.has_secao(p_secao text)
  returns boolean language sql stable security definer set search_path = public
as $$ select public.is_admin() or (public.current_secoes() ? p_secao); $$;

-- Aliases de leitura/escrita por módulo (módulo == seção neste sistema).
create or replace function public.can_read_module(p_modulo text)
  returns boolean language sql stable security definer set search_path = public
as $$ select public.has_secao(p_modulo); $$;

create or replace function public.can_write_module(p_modulo text)
  returns boolean language sql stable security definer set search_path = public
as $$ select public.has_secao(p_modulo); $$;
