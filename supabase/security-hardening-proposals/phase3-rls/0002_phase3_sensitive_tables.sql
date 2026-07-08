-- ============================================================================
-- PROPOSTA (Fase 3 — RLS) LOTE 0002: TABELAS SENSÍVEIS (Grupo A) — NÃO APLICAR AINDA
-- Objetivo: bloquear ANON e restringir escrita por papel/seção nas tabelas com
-- PII/financeiro/disciplinar. Leitura mantida ampla onde módulos cruzam (ex.:
-- funcionarios), restrita onde é realmente sensível (usuarios, faltas, avaliacoes).
-- DEPENDE do lote 0001 (helpers) e da Fase 2 (auth.uid()). Reversivel pelo rollback.
--
-- Padrão por tabela: 1 policy de leitura (select) + 1 de escrita (all) — ambas
-- `to authenticated` (anon fica sem policy => negado). RLS já está habilitado.
-- ============================================================================

-- funcionarios: leitura por qualquer autenticado (dropdowns/participantes/cálculo);
-- escrita só RH/admin.  [ACHADO] salário/CPF ficam legíveis por qualquer autenticado
-- (RLS é por linha, não por coluna). Restringir colunas exige VIEW/coluna-grant (passo futuro).
drop policy if exists "allow_all_concremrh_funcionarios" on public.concremrh_funcionarios;
create policy "funcionarios_read"  on public.concremrh_funcionarios for select to authenticated using (true);
create policy "funcionarios_write" on public.concremrh_funcionarios for all    to authenticated using (public.has_secao('rh')) with check (public.has_secao('rh'));

-- resultados_premiacao: leitura/escrita apenas quem tem a seção 'premiacoes' (rh/admin).
drop policy if exists "allow_all_concremrh_resultados_premiacao" on public.concremrh_resultados_premiacao;
create policy "resultados_read"  on public.concremrh_resultados_premiacao for select to authenticated using (public.has_secao('premiacoes'));
create policy "resultados_write" on public.concremrh_resultados_premiacao for all    to authenticated using (public.has_secao('premiacoes')) with check (public.has_secao('premiacoes'));

-- faltas_advertencias: dado disciplinar — leitura/escrita RH/admin.
drop policy if exists "allow_all_concremrh_faltas_advertencias" on public.concremrh_faltas_advertencias;
create policy "faltas_read"  on public.concremrh_faltas_advertencias for select to authenticated using (public.has_secao('rh'));
create policy "faltas_write" on public.concremrh_faltas_advertencias for all    to authenticated using (public.has_secao('rh')) with check (public.has_secao('rh'));

-- avaliacoes_desempenho: módulo Cargos & Salários.
drop policy if exists "allow_all_concremrh_avaliacoes_desempenho" on public.concremrh_avaliacoes_desempenho;
create policy "avaliacoes_read"  on public.concremrh_avaliacoes_desempenho for select to authenticated using (public.has_secao('cargos_salarios'));
create policy "avaliacoes_write" on public.concremrh_avaliacoes_desempenho for all    to authenticated using (public.has_secao('cargos_salarios')) with check (public.has_secao('cargos_salarios'));

-- historico_cargos: módulo Cargos & Salários (histórico salarial/cargo).
drop policy if exists "allow_all_concremrh_historico_cargos" on public.concremrh_historico_cargos;
create policy "historico_read"  on public.concremrh_historico_cargos for select to authenticated using (public.has_secao('cargos_salarios'));
create policy "historico_write" on public.concremrh_historico_cargos for all    to authenticated using (public.has_secao('cargos_salarios')) with check (public.has_secao('cargos_salarios'));

-- usuarios: gestão apenas admin (login continua via RPC SECURITY DEFINER, que ignora RLS).
drop policy if exists "Admin gerencia usuarios" on public.concremrh_usuarios;
drop policy if exists "Autenticados podem ler"  on public.concremrh_usuarios;
create policy "usuarios_read"  on public.concremrh_usuarios for select to authenticated using (public.is_admin());
create policy "usuarios_write" on public.concremrh_usuarios for all    to authenticated using (public.is_admin()) with check (public.is_admin());
