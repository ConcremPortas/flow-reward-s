-- ROLLBACK LOTE 0004 — restaura allow_all (to public). ⚠️ reabre acesso anon.
-- Grupo C
drop policy if exists "setores_read" on public.concremrh_setores;
drop policy if exists "setores_write" on public.concremrh_setores;
create policy "allow_all_concremrh_setores" on public.concremrh_setores for all to public using (true) with check (true);

drop policy if exists "empresas_read" on public.concremrh_empresas;
drop policy if exists "empresas_write" on public.concremrh_empresas;
create policy "allow_all_concremrh_empresas" on public.concremrh_empresas for all to public using (true) with check (true);

drop policy if exists "funcoes_read" on public.concremrh_funcoes;
drop policy if exists "funcoes_write" on public.concremrh_funcoes;
create policy "allow_all_concremrh_funcoes" on public.concremrh_funcoes for all to public using (true) with check (true);

drop policy if exists "categorias_read" on public.concremrh_categorias;
drop policy if exists "categorias_write" on public.concremrh_categorias;
create policy "allow_all_concremrh_categorias" on public.concremrh_categorias for all to public using (true) with check (true);

drop policy if exists "faixas_read" on public.concremrh_faixas;
drop policy if exists "faixas_write" on public.concremrh_faixas;
create policy "allow_all_concremrh_faixas" on public.concremrh_faixas for all to public using (true) with check (true);

drop policy if exists "base_premiacao_read" on public.concremrh_base_premiacao;
drop policy if exists "base_premiacao_write" on public.concremrh_base_premiacao;
create policy "allow_all_concremrh_base_premiacao" on public.concremrh_base_premiacao for all to public using (true) with check (true);

drop policy if exists "formulas_read" on public.concremrh_formulas_calculo;
drop policy if exists "formulas_write" on public.concremrh_formulas_calculo;
create policy "allow_all_concremrh_formulas_calculo" on public.concremrh_formulas_calculo for all to public using (true) with check (true);

drop policy if exists "config_kits_read" on public.concremrh_configuracoes_kits;
drop policy if exists "config_kits_write" on public.concremrh_configuracoes_kits;
create policy "Acesso total para usuários autenticados" on public.concremrh_configuracoes_kits for all to public using (true) with check (true);

drop policy if exists "tipos_ind_read" on public.concremrh_tipos_indicadores;
drop policy if exists "tipos_ind_write" on public.concremrh_tipos_indicadores;
create policy "allow_all_concremrh_tipos_indicadores" on public.concremrh_tipos_indicadores for all to public using (true) with check (true);

drop policy if exists "tipos_ind_ger_read" on public.concremrh_tipos_indicadores_gerais;
drop policy if exists "tipos_ind_ger_write" on public.concremrh_tipos_indicadores_gerais;
create policy "allow_all_concremrh_tipos_indicadores_gerais" on public.concremrh_tipos_indicadores_gerais for all to public using (true) with check (true);

drop policy if exists "locais_dss_read" on public.concremrh_locais_dss;
drop policy if exists "locais_dss_write" on public.concremrh_locais_dss;
create policy "allow_all_concremrh_locais_dss" on public.concremrh_locais_dss for all to public using (true) with check (true);

drop policy if exists "hr_apps_read" on public.concremrh_hr_applications;
drop policy if exists "hr_apps_write" on public.concremrh_hr_applications;
create policy "allow_all_concremrh_hr_applications" on public.concremrh_hr_applications for all to public using (true) with check (true);

-- Grupo D
drop policy if exists "cargos_read" on public.concremrh_cargos;
drop policy if exists "cargos_write" on public.concremrh_cargos;
create policy "allow_all_concremrh_cargos" on public.concremrh_cargos for all to public using (true) with check (true);

drop policy if exists "plano_read" on public.concremrh_plano_carreira;
drop policy if exists "plano_write" on public.concremrh_plano_carreira;
create policy "allow_all_concremrh_plano_carreira" on public.concremrh_plano_carreira for all to public using (true) with check (true);

drop policy if exists "estrutura_read" on public.concremrh_estrutura_hierarquica;
drop policy if exists "estrutura_write" on public.concremrh_estrutura_hierarquica;
create policy "allow_all_concremrh_estrutura_hierarquica" on public.concremrh_estrutura_hierarquica for all to public using (true) with check (true);
