-- ============================================================================
-- PROPOSTA (Fase 3 — RLS) LOTE 0003: TABELAS OPERACIONAIS (Grupo B) — NÃO APLICAR AINDA
-- Objetivo: bloquear anon; leitura ampla (o cálculo de premiação e telas cruzam
-- módulos), escrita restrita ao domínio (SESMT em DSS/EPI; Produção em produção/indicadores).
-- Garante: "SESMT não altera produção" e "Produção não altera DSS/EPI".
-- Depende do lote 0001 + Fase 2.
-- ============================================================================

-- DSS — escrita SESMT/admin; leitura autenticado (usada por SESMT e pelo cálculo).
drop policy if exists "allow_all_concremrh_dss" on public.concremrh_dss;
create policy "dss_read"  on public.concremrh_dss for select to authenticated using (true);
create policy "dss_write" on public.concremrh_dss for all    to authenticated using (public.has_secao('sesmt')) with check (public.has_secao('sesmt'));

-- EPI — escrita SESMT/admin.
drop policy if exists "allow_all_concremrh_epi" on public.concremrh_epi;
create policy "epi_read"  on public.concremrh_epi for select to authenticated using (true);
create policy "epi_write" on public.concremrh_epi for all    to authenticated using (public.has_secao('sesmt')) with check (public.has_secao('sesmt'));

-- Produção por setor — escrita Produção/admin.
drop policy if exists "allow_all_concremrh_producao_setor" on public.concremrh_producao_setor;
create policy "producao_setor_read"  on public.concremrh_producao_setor for select to authenticated using (true);
create policy "producao_setor_write" on public.concremrh_producao_setor for all    to authenticated using (public.has_secao('producao')) with check (public.has_secao('producao'));

-- Indicadores gerais — escrita Produção/admin.
drop policy if exists "allow_all_concremrh_indicadores_gerais" on public.concremrh_indicadores_gerais;
create policy "indicadores_gerais_read"  on public.concremrh_indicadores_gerais for select to authenticated using (true);
create policy "indicadores_gerais_write" on public.concremrh_indicadores_gerais for all    to authenticated using (public.has_secao('producao')) with check (public.has_secao('producao'));

-- Indicadores por setor — escrita Produção/admin.
drop policy if exists "allow_all_concremrh_indicadores_setor" on public.concremrh_indicadores_setor;
create policy "indicadores_setor_read"  on public.concremrh_indicadores_setor for select to authenticated using (true);
create policy "indicadores_setor_write" on public.concremrh_indicadores_setor for all    to authenticated using (public.has_secao('producao')) with check (public.has_secao('producao'));
