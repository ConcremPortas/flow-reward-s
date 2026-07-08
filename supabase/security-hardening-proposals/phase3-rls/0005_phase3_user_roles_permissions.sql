-- ============================================================================
-- PROPOSTA (Fase 3 — RLS) LOTE 0005: PERMISSÕES (Grupo E) — NÃO APLICAR AINDA
-- user_roles e user_application_permissions: leitura/escrita apenas admin.
-- (Tabelas hoje vazias; o modelo de acesso efetivo do app é perfil+secoes em
-- concremrh_usuarios. useUserPermissions lê estas tabelas — sob admin retorna o
-- esperado; para não-admin retorna vazio, sem impacto pois estão vazias.)
-- Depende do lote 0001 + Fase 2.
-- ============================================================================

drop policy if exists "allow_all_concremrh_user_roles" on public.concremrh_user_roles;
create policy "user_roles_read"  on public.concremrh_user_roles for select to authenticated using (public.is_admin());
create policy "user_roles_write" on public.concremrh_user_roles for all    to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "allow_all_concremrh_user_application_permissions" on public.concremrh_user_application_permissions;
create policy "user_app_perms_read"  on public.concremrh_user_application_permissions for select to authenticated using (public.is_admin());
create policy "user_app_perms_write" on public.concremrh_user_application_permissions for all    to authenticated using (public.is_admin()) with check (public.is_admin());
