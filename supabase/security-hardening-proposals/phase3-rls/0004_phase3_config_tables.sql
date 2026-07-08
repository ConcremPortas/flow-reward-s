-- ============================================================================
-- PROPOSTA (Fase 3 — RLS) LOTE 0004: CADASTROS/CONFIG (Grupo C) + CARGOS (Grupo D)
-- NÃO APLICAR AINDA. Depende do lote 0001 + Fase 2.
--
-- Grupo C (referência/config): leitura por qualquer autenticado (dropdowns, nomes,
-- Hub), escrita restrita a quem tem a seção 'cadastros' (rh/admin). hr_applications
-- escrita só admin.
-- Grupo D (Cargos & Salários): leitura/escrita conforme a seção 'cargos_salarios'.
-- ============================================================================

-- ---------- Grupo C — cadastros/config ----------
-- setores
drop policy if exists "allow_all_concremrh_setores" on public.concremrh_setores;
create policy "setores_read"  on public.concremrh_setores for select to authenticated using (true);
create policy "setores_write" on public.concremrh_setores for all    to authenticated using (public.has_secao('cadastros')) with check (public.has_secao('cadastros'));

-- empresas
drop policy if exists "allow_all_concremrh_empresas" on public.concremrh_empresas;
create policy "empresas_read"  on public.concremrh_empresas for select to authenticated using (true);
create policy "empresas_write" on public.concremrh_empresas for all    to authenticated using (public.has_secao('cadastros')) with check (public.has_secao('cadastros'));

-- funcoes
drop policy if exists "allow_all_concremrh_funcoes" on public.concremrh_funcoes;
create policy "funcoes_read"  on public.concremrh_funcoes for select to authenticated using (true);
create policy "funcoes_write" on public.concremrh_funcoes for all    to authenticated using (public.has_secao('cadastros')) with check (public.has_secao('cadastros'));

-- categorias
drop policy if exists "allow_all_concremrh_categorias" on public.concremrh_categorias;
create policy "categorias_read"  on public.concremrh_categorias for select to authenticated using (true);
create policy "categorias_write" on public.concremrh_categorias for all    to authenticated using (public.has_secao('cadastros')) with check (public.has_secao('cadastros'));

-- faixas
drop policy if exists "allow_all_concremrh_faixas" on public.concremrh_faixas;
create policy "faixas_read"  on public.concremrh_faixas for select to authenticated using (true);
create policy "faixas_write" on public.concremrh_faixas for all    to authenticated using (public.has_secao('cadastros')) with check (public.has_secao('cadastros'));

-- base_premiacao
drop policy if exists "allow_all_concremrh_base_premiacao" on public.concremrh_base_premiacao;
create policy "base_premiacao_read"  on public.concremrh_base_premiacao for select to authenticated using (true);
create policy "base_premiacao_write" on public.concremrh_base_premiacao for all    to authenticated using (public.has_secao('cadastros')) with check (public.has_secao('cadastros'));

-- formulas_calculo
drop policy if exists "allow_all_concremrh_formulas_calculo" on public.concremrh_formulas_calculo;
create policy "formulas_read"  on public.concremrh_formulas_calculo for select to authenticated using (true);
create policy "formulas_write" on public.concremrh_formulas_calculo for all    to authenticated using (public.has_secao('cadastros')) with check (public.has_secao('cadastros'));

-- configuracoes_kits (policy original tem outro nome)
drop policy if exists "Acesso total para usuários autenticados" on public.concremrh_configuracoes_kits;
create policy "config_kits_read"  on public.concremrh_configuracoes_kits for select to authenticated using (true);
create policy "config_kits_write" on public.concremrh_configuracoes_kits for all    to authenticated using (public.has_secao('cadastros')) with check (public.has_secao('cadastros'));

-- tipos_indicadores
drop policy if exists "allow_all_concremrh_tipos_indicadores" on public.concremrh_tipos_indicadores;
create policy "tipos_ind_read"  on public.concremrh_tipos_indicadores for select to authenticated using (true);
create policy "tipos_ind_write" on public.concremrh_tipos_indicadores for all    to authenticated using (public.has_secao('cadastros')) with check (public.has_secao('cadastros'));

-- tipos_indicadores_gerais
drop policy if exists "allow_all_concremrh_tipos_indicadores_gerais" on public.concremrh_tipos_indicadores_gerais;
create policy "tipos_ind_ger_read"  on public.concremrh_tipos_indicadores_gerais for select to authenticated using (true);
create policy "tipos_ind_ger_write" on public.concremrh_tipos_indicadores_gerais for all    to authenticated using (public.has_secao('cadastros')) with check (public.has_secao('cadastros'));

-- locais_dss
drop policy if exists "allow_all_concremrh_locais_dss" on public.concremrh_locais_dss;
create policy "locais_dss_read"  on public.concremrh_locais_dss for select to authenticated using (true);
create policy "locais_dss_write" on public.concremrh_locais_dss for all    to authenticated using (public.has_secao('cadastros')) with check (public.has_secao('cadastros'));

-- hr_applications (catálogo do Hub) — leitura autenticado; escrita só admin
drop policy if exists "allow_all_concremrh_hr_applications" on public.concremrh_hr_applications;
create policy "hr_apps_read"  on public.concremrh_hr_applications for select to authenticated using (true);
create policy "hr_apps_write" on public.concremrh_hr_applications for all    to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- Grupo D — Cargos & Salários ----------
-- cargos
drop policy if exists "allow_all_concremrh_cargos" on public.concremrh_cargos;
create policy "cargos_read"  on public.concremrh_cargos for select to authenticated using (public.has_secao('cargos_salarios'));
create policy "cargos_write" on public.concremrh_cargos for all    to authenticated using (public.has_secao('cargos_salarios')) with check (public.has_secao('cargos_salarios'));

-- plano_carreira
drop policy if exists "allow_all_concremrh_plano_carreira" on public.concremrh_plano_carreira;
create policy "plano_read"  on public.concremrh_plano_carreira for select to authenticated using (public.has_secao('cargos_salarios'));
create policy "plano_write" on public.concremrh_plano_carreira for all    to authenticated using (public.has_secao('cargos_salarios')) with check (public.has_secao('cargos_salarios'));

-- estrutura_hierarquica
drop policy if exists "allow_all_concremrh_estrutura_hierarquica" on public.concremrh_estrutura_hierarquica;
create policy "estrutura_read"  on public.concremrh_estrutura_hierarquica for select to authenticated using (public.has_secao('cargos_salarios'));
create policy "estrutura_write" on public.concremrh_estrutura_hierarquica for all    to authenticated using (public.has_secao('cargos_salarios')) with check (public.has_secao('cargos_salarios'));
