-- ============================================================================
-- PROPOSTA (Fase 5A — protecao de colunas sensiveis de funcionarios) — NAO APLICAR
-- Objetivo: esconder `salario` e `email` (e PII nao usada: data_nascimento,
-- telefone) da leitura operacional/base, expondo-os por perfil via VIEW guardada:
--   - salario: apenas admin OU has_secao('cargos_salarios')
--   - email:   apenas admin OU has_secao('rh') OU has_secao('cargos_salarios')
-- `cpf` e MANTIDO: neste app ele e o "Codigo Funcionario" (chave de premiacao /
-- Faltas / import-export), nao um CPF real.
--
-- Decisao de negocio (2026-07-09): RH NAO ve salario por padrao; se precisar,
-- recebe a secao 'cargos_salarios'. SESMT/Producao nao recebem salario nem email.
--
-- IMPORTANTE (por que VIEW sozinha nao basta): uma view so nao adiciona seguranca
-- se a TABELA BASE continuar legivel pelo mesmo papel (`authenticated`). A
-- ENFORCEMENT real e o grant a NIVEL DE COLUNA na tabela base (Secao A). As views
-- (Secoes B/C) sao a projecao segura/guardada que as telas passam a consumir.
--
-- Papeis PostgREST: anon / authenticated / service_role. Todos os usuarios do app
-- compartilham `authenticated` — a diferenciacao por perfil/secao (rh, cargos,
-- sesmt) so e possivel na VIEW guardada (B), via has_secao()/is_admin()
-- (helpers da Fase 3, sobre auth.uid()).
--
-- Depende de: Fase 2 (auth.uid()) + Fase 3 (RLS/helpers). Reversivel (rollback).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- SECAO A — ENFORCEMENT: leitura por coluna na tabela base
-- Remove o SELECT de tabela inteira e reconcede SELECT em TODAS as colunas
-- EXCETO salario, email, data_nascimento, telefone. (INSERT/UPDATE/DELETE nao sao
-- tocados — a escrita continua governada pela RLS da Fase 3: has_secao('rh').)
-- ---------------------------------------------------------------------------
revoke select on public.concremrh_funcionarios from authenticated;

grant select (
  id, user_id, nome, cpf,
  data_admissao, data_demissao,
  empresa_id, setor_id, funcao_id, categoria_id,
  base_premiacao_id, faixa_id, local_dss_id,
  status, valor_fixo, ativo,
  created_at, updated_at, setor_ids
) on public.concremrh_funcionarios to authenticated;
-- Colunas OMITIDAS (sem SELECT p/ authenticated): salario, email, data_nascimento, telefone.
-- (anon ja nao tem acesso algum desde a Fase 3; service_role/owner mantem tudo.)

-- ---------------------------------------------------------------------------
-- SECAO B — VIEW GUARDADA de campos sensiveis (salario + email), por perfil.
-- security_invoker=false (roda como owner) para conseguir ler as colunas
-- protegidas; o gate por perfil e aplicado POR COLUNA via CASE, sobre o
-- auth.uid() do chamador (has_secao()/is_admin()):
--   - salario: admin OU cargos_salarios         -> senao NULL
--   - email:   admin OU rh OU cargos_salarios   -> senao NULL
-- Retorna id/nome (ja publicos ao authenticated) + as colunas gated.
-- ---------------------------------------------------------------------------
create or replace view public.concremrh_funcionarios_sensivel
  with (security_invoker = false)
as
  select
    f.id, f.nome, f.funcao_id, f.categoria_id, f.setor_id, f.ativo,
    case when public.is_admin() or public.has_secao('cargos_salarios')
         then f.salario end as salario,
    case when public.is_admin() or public.has_secao('rh') or public.has_secao('cargos_salarios')
         then f.email end as email
  from public.concremrh_funcionarios f;

grant select on public.concremrh_funcionarios_sensivel to authenticated;
revoke all on public.concremrh_funcionarios_sensivel from anon;

-- ---------------------------------------------------------------------------
-- SECAO C — VIEW "resumo" (projecao segura para telas operacionais)
-- NAO expõe salario, email, telefone nem data_nascimento. Mantém cpf (codigo).
-- security_invoker=true: a RLS da Fase 3 da tabela base continua valendo atraves
-- da view (Postgres 15+). Enforcement de coluna ja garantido pela Secao A.
-- ---------------------------------------------------------------------------
create or replace view public.concremrh_funcionarios_resumo
  with (security_invoker = true)
as
  select id, nome, cpf,
         empresa_id, setor_id, funcao_id, categoria_id,
         base_premiacao_id, faixa_id, local_dss_id,
         status, valor_fixo, ativo, setor_ids
  from public.concremrh_funcionarios;

grant select on public.concremrh_funcionarios_resumo to authenticated;
revoke all on public.concremrh_funcionarios_resumo from anon;

-- NOTA PostgREST: views em `public` sao expostas na API automaticamente; pode ser
-- necessario recarregar o schema cache (NOTIFY pgrst, 'reload schema';) apos criar.
