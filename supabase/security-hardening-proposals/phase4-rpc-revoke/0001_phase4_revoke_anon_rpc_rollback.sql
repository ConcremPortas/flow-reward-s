-- ============================================================================
-- ROLLBACK LOTE 0001 (Fase 4) — restaura o EXECUTE original (default: PUBLIC).
-- ⚠️ Reabre a execucao dessas RPCs para o papel `anon`. Use apenas se a Fase 4
-- quebrar a gestao de usuario/setores (ex.: app voltou ao modo custom/anon).
-- ============================================================================

grant execute on function public.concremrh_create_user(text,text,text,text,text,text,jsonb) to public;
grant execute on function public.concremrh_update_user_password(text,text,uuid,text)          to public;
grant execute on function public.update_funcionario_setor_ids(uuid,text)                       to public;
grant execute on function public.get_all_funcionario_setor_ids()                               to public;
grant execute on function public.get_my_perfil()                                               to public;
grant execute on function public.get_my_profile()                                              to public;

-- concremrh_verify_login nao foi alterada na Fase 4 (segue acessivel a anon);
-- nada a reverter para ela.
