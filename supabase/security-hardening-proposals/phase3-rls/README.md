# Fase 3 — Endurecimento de RLS (PROPOSTAS — NÃO APLICAR)

Scripts **propostos** (Etapa Fase 3) para substituir as policies `allow_all` (to public) por policies **por papel/seção**, bloqueando `anon`. Plano completo em [SECURITY_RLS_PHASE3_PLAN_V2.md](../../../SECURITY_RLS_PHASE3_PLAN_V2.md).

> 🔴 **Só aplicar depois da Fase 2 (Supabase Auth) 100% validada.** As policies visam o papel `authenticated` e usam `auth.uid()`/`get_my_perfil()`/`has_secao()`. Se aplicadas com o app ainda em modo `custom` (anon), **todas as telas quebram**.

## Ordem de aplicação (lote a lote, validando entre cada um)
1. `0001_phase3_helpers.sql` — helpers (`is_admin`, `has_perfil`, `has_secao`, `current_secoes`, `can_read/write_module`).
2. `0002_phase3_sensitive_tables.sql` — Grupo A (funcionarios, resultados, faltas, avaliacoes, historico, usuarios).
3. `0003_phase3_operational_tables.sql` — Grupo B (dss, epi, producao_setor, indicadores_gerais/setor).
4. `0004_phase3_config_tables.sql` — Grupo C (cadastros/config) + Grupo D (cargos/plano/estrutura).
5. `0005_phase3_user_roles_permissions.sql` — Grupo E (user_roles, user_application_permissions).

Cada lote tem um `_rollback.sql` que restaura o `allow_all` daquele grupo.
**Rollback total:** rodar 0005→0002 rollbacks e por último `0001_phase3_helpers_rollback.sql`.

## Padrão das policies
Por tabela: 1 policy de **leitura** (`for select to authenticated`) + 1 de **escrita** (`for all to authenticated`), ambas `to authenticated` (⇒ `anon` sem policy = negado). A escrita usa `has_secao('<módulo>')` (admin sempre passa via `is_admin()` embutido em `has_secao`).

## Validar (em staging, após aplicar)
Ver o checklist em [SECURITY_RLS_PHASE3_PLAN_V2.md](../../../SECURITY_RLS_PHASE3_PLAN_V2.md) §Checklist. Teste de RLS em SQL simulando um usuário:
```sql
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"<AUTH_USER_ID_DO_USUARIO>","role":"authenticated"}';
  select count(*) from public.concremrh_funcionarios;             -- leitura deve funcionar
  insert into public.concremrh_producao_setor(setor_id) values (null); -- deve FALHAR se não for produção/admin
rollback;
```
E o teste crítico: **chamada anon (sem JWT) deve retornar 0 linhas / ser negada** em todas as tabelas.
