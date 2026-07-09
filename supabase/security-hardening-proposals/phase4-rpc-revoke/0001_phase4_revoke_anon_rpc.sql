-- ============================================================================
-- PROPOSTA (Fase 4 — REVOKE de RPC para anon) LOTE 0001 — NÃO APLICAR AINDA
-- Defesa em profundidade sobre as RPCs SECURITY DEFINER: remove o EXECUTE do
-- papel `anon` nas funcoes que o app so chama como `authenticated` no modo
-- Supabase Auth (Fase 2). Fecha o vetor de RPCs que ignoram a RLS da Fase 3.
--
-- DEPENDE de: Fase 2 validada (app chama como `authenticated`) e Fase 3 (RLS).
-- Se o app voltar ao modo `custom` (anon), a gestao de usuario / setores destas
-- telas para de funcionar (o LOGIN continua via concremrh_verify_login, mantida).
--
-- Nuance importante: no Postgres, EXECUTE e concedido a PUBLIC por padrao ao criar
-- a funcao. `REVOKE ... FROM anon` sozinho e no-op se o grant veio de PUBLIC.
-- Por isso revogamos de PUBLIC e de anon, e concedemos explicitamente a
-- `authenticated` e `service_role` (que o app e os processos server-side usam).
--
-- concremrh_verify_login: MANTIDA para anon (ponto de entrada do login + fallback
-- custom). Ver SECURITY_PHASE4_RPC_REVOKE_PLAN_V2.md §"Decisão verify_login".
-- Reversivel: 0001_phase4_revoke_anon_rpc_rollback.sql
-- ============================================================================

-- 1) concremrh_create_user (assinatura da Fase 1: admin_email/admin_password + dados)
revoke execute on function public.concremrh_create_user(text,text,text,text,text,text,jsonb) from public;
revoke execute on function public.concremrh_create_user(text,text,text,text,text,text,jsonb) from anon;
grant  execute on function public.concremrh_create_user(text,text,text,text,text,text,jsonb) to authenticated;
grant  execute on function public.concremrh_create_user(text,text,text,text,text,text,jsonb) to service_role;

-- 2) concremrh_update_user_password (assinatura da Fase 1)
revoke execute on function public.concremrh_update_user_password(text,text,uuid,text) from public;
revoke execute on function public.concremrh_update_user_password(text,text,uuid,text) from anon;
grant  execute on function public.concremrh_update_user_password(text,text,uuid,text) to authenticated;
grant  execute on function public.concremrh_update_user_password(text,text,uuid,text) to service_role;

-- 3) update_funcionario_setor_ids — escrita usada pela tela de Funcionarios (authenticated)
revoke execute on function public.update_funcionario_setor_ids(uuid,text) from public;
revoke execute on function public.update_funcionario_setor_ids(uuid,text) from anon;
grant  execute on function public.update_funcionario_setor_ids(uuid,text) to authenticated;
grant  execute on function public.update_funcionario_setor_ids(uuid,text) to service_role;

-- 4) get_all_funcionario_setor_ids — [ACHADO] vazava funcionario_id/setor_ids p/ anon
--    (SECURITY DEFINER ignora a RLS da Fase 3). Fechado aqui.
revoke execute on function public.get_all_funcionario_setor_ids() from public;
revoke execute on function public.get_all_funcionario_setor_ids() from anon;
grant  execute on function public.get_all_funcionario_setor_ids() to authenticated;
grant  execute on function public.get_all_funcionario_setor_ids() to service_role;

-- 5) get_my_perfil — so faz sentido para sessao autenticada (auth.uid()).
--    Chamada internamente pelos helpers SECURITY DEFINER da RLS (rodam como owner),
--    entao revogar de anon NAO afeta a avaliacao das policies.
revoke execute on function public.get_my_perfil() from public;
revoke execute on function public.get_my_perfil() from anon;
grant  execute on function public.get_my_perfil() to authenticated;
grant  execute on function public.get_my_perfil() to service_role;

-- 6) get_my_profile — montado pelo AuthContext apos a sessao (authenticated).
revoke execute on function public.get_my_profile() from public;
revoke execute on function public.get_my_profile() from anon;
grant  execute on function public.get_my_profile() to authenticated;
grant  execute on function public.get_my_profile() to service_role;

-- 7) concremrh_verify_login — MANTIDA acessivel (login/fallback). Grants explicitos
--    (idempotente) para deixar claro quem pode chamar. NAO revogar de anon.
grant execute on function public.concremrh_verify_login(text,text) to anon;
grant execute on function public.concremrh_verify_login(text,text) to authenticated;
grant execute on function public.concremrh_verify_login(text,text) to service_role;
