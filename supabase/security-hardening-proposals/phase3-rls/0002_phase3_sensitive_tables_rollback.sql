-- ROLLBACK LOTE 0002 — restaura allow_all (to public) das tabelas sensíveis.
-- ⚠️ reabre o acesso anon (C2) nessas tabelas.

drop policy if exists "funcionarios_read" on public.concremrh_funcionarios;
drop policy if exists "funcionarios_write" on public.concremrh_funcionarios;
create policy "allow_all_concremrh_funcionarios" on public.concremrh_funcionarios for all to public using (true) with check (true);

drop policy if exists "resultados_read" on public.concremrh_resultados_premiacao;
drop policy if exists "resultados_write" on public.concremrh_resultados_premiacao;
create policy "allow_all_concremrh_resultados_premiacao" on public.concremrh_resultados_premiacao for all to public using (true) with check (true);

drop policy if exists "faltas_read" on public.concremrh_faltas_advertencias;
drop policy if exists "faltas_write" on public.concremrh_faltas_advertencias;
create policy "allow_all_concremrh_faltas_advertencias" on public.concremrh_faltas_advertencias for all to public using (true) with check (true);

drop policy if exists "avaliacoes_read" on public.concremrh_avaliacoes_desempenho;
drop policy if exists "avaliacoes_write" on public.concremrh_avaliacoes_desempenho;
create policy "allow_all_concremrh_avaliacoes_desempenho" on public.concremrh_avaliacoes_desempenho for all to public using (true) with check (true);

drop policy if exists "historico_read" on public.concremrh_historico_cargos;
drop policy if exists "historico_write" on public.concremrh_historico_cargos;
create policy "allow_all_concremrh_historico_cargos" on public.concremrh_historico_cargos for all to public using (true) with check (true);

drop policy if exists "usuarios_read" on public.concremrh_usuarios;
drop policy if exists "usuarios_write" on public.concremrh_usuarios;
-- restaura as duas policies originais de usuarios (0009)
create policy "Admin gerencia usuarios" on public.concremrh_usuarios as permissive for all to authenticated using ((get_my_perfil() = 'admin'::text)) with check ((get_my_perfil() = 'admin'::text));
create policy "Autenticados podem ler" on public.concremrh_usuarios as permissive for select to authenticated using (true);
