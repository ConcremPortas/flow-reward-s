-- ROLLBACK LOTE 0003 — restaura allow_all (to public). ⚠️ reabre acesso anon.
drop policy if exists "dss_read" on public.concremrh_dss;
drop policy if exists "dss_write" on public.concremrh_dss;
create policy "allow_all_concremrh_dss" on public.concremrh_dss for all to public using (true) with check (true);

drop policy if exists "epi_read" on public.concremrh_epi;
drop policy if exists "epi_write" on public.concremrh_epi;
create policy "allow_all_concremrh_epi" on public.concremrh_epi for all to public using (true) with check (true);

drop policy if exists "producao_setor_read" on public.concremrh_producao_setor;
drop policy if exists "producao_setor_write" on public.concremrh_producao_setor;
create policy "allow_all_concremrh_producao_setor" on public.concremrh_producao_setor for all to public using (true) with check (true);

drop policy if exists "indicadores_gerais_read" on public.concremrh_indicadores_gerais;
drop policy if exists "indicadores_gerais_write" on public.concremrh_indicadores_gerais;
create policy "allow_all_concremrh_indicadores_gerais" on public.concremrh_indicadores_gerais for all to public using (true) with check (true);

drop policy if exists "indicadores_setor_read" on public.concremrh_indicadores_setor;
drop policy if exists "indicadores_setor_write" on public.concremrh_indicadores_setor;
create policy "allow_all_concremrh_indicadores_setor" on public.concremrh_indicadores_setor for all to public using (true) with check (true);
