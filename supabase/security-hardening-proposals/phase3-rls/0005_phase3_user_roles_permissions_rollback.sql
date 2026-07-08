-- ROLLBACK LOTE 0005 — restaura allow_all (to public). ⚠️ reabre acesso anon.
drop policy if exists "user_roles_read" on public.concremrh_user_roles;
drop policy if exists "user_roles_write" on public.concremrh_user_roles;
create policy "allow_all_concremrh_user_roles" on public.concremrh_user_roles for all to public using (true) with check (true);

drop policy if exists "user_app_perms_read" on public.concremrh_user_application_permissions;
drop policy if exists "user_app_perms_write" on public.concremrh_user_application_permissions;
create policy "allow_all_concremrh_user_application_permissions" on public.concremrh_user_application_permissions for all to public using (true) with check (true);
