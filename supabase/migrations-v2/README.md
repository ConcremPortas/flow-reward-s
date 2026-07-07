# Migrations V2 — recriação do schema no NOVO projeto Supabase

Conjunto de migrations **versionadas** para recriar o schema `concremrh_` em um **novo** projeto Supabase (Reforma V2). Geradas por introspecção direta do projeto atual `ctntlgvoefdbjxvfkahp` em 2026-07-07 (via `pg_get_functiondef`/`pg_get_constraintdef`/`pg_get_triggerdef`/`pg_policies`), portanto refletem o **schema real**, não as migrations antigas em `supabase/migrations/` (que são de uma geração anterior `concrem_*`/`remuneracaoconrem_*`).

> ⚠️ **NÃO aplicar no projeto antigo.** Estas migrations são para o **projeto novo**.

## Ordem de aplicação

| Arquivo | Conteúdo |
|---------|----------|
| `0001_extensions_enums_helpers.sql` | `pgcrypto`; enum `app_role`; função `update_updated_at_column()` |
| `0002_tables_core.sql` | empresas, setores, funcoes, categorias, faixas, base_premiacao, hr_applications, funcionarios, funcionarios_setores |
| `0003_tables_eventos.sql` | locais_dss, dss, epi, faltas_advertencias, producao_setor, tipos_indicadores(_gerais), indicadores_setor, indicadores_gerais |
| `0004_tables_premiacao.sql` | formulas_calculo (11 pesos + `multiplicador_kits`), configuracoes_kits (com `max_faixas`), resultados_premiacao |
| `0005_tables_cargos_rh.sql` | cargos, plano_carreira, historico_cargos, avaliacoes_desempenho, estrutura_hierarquica |
| `0006_tables_auth.sql` | usuarios (com `senha_hash` + `secoes jsonb`), user_roles, user_application_permissions |
| `0007_foreign_keys.sql` | **todas** as 38 foreign keys (após todas as tabelas existirem) |
| `0008_functions_rpc.sql` | RPCs: `concremrh_verify_login`, `concremrh_create_user`, `concremrh_update_user_password`, `update_funcionario_setor_ids`, `get_all_funcionario_setor_ids` |
| `0009_rls_and_triggers.sql` | `ENABLE ROW LEVEL SECURITY` + 30 policies + 26 triggers de `updated_at` |
| `0010_seed_config.sql` | Seed **apenas de config/referência** (hr_applications, tipos_indicadores(_gerais), configuracoes_kits, formulas_calculo) |

## Decisões de estruturação (vs. proposta original do audit)

- **FKs consolidadas em `0007`** (em vez de por grupo): há foreign keys que apontam "para frente" entre grupos (ex.: `funcionarios.local_dss_id → locais_dss`). Criar todas as FKs só depois de todas as tabelas garante execução sem erro de ordem.
- **RLS + triggers juntos em `0009`**: ambos dependem de todas as tabelas/funções já existirem; agrupá-los evita idas e vindas.
- **`0010` seed = só configuração/referência.** **NÃO** inclui dados pessoais/transacionais (funcionarios, usuarios, faltas, epi, dss, producao, indicadores, resultados). Esses devem vir de uma **migração de dados controlada** (`--data-only`) do projeto atual, com atenção a LGPD e à preservação dos `senha_hash` (bcrypt) para não invalidar logins.

## Pontos de atenção (achados fiéis ao banco real)

- **`usuarios.perfil` é `text`** com um `CHECK` que só permite `('admin','rh','sesmt','producao')` — **não inclui `custom`**, apesar de o tipo TS do app (`UserPerfil`) ter `custom`. Latente: inserir `perfil='custom'` violaria o constraint. Decidir se o app usa `custom` de fato antes de aplicar.
- **Senhas** usam **bcrypt** (`crypt(senha, gen_salt('bf'))` via `pgcrypto`). A migração de dados de `senha_hash` preserva os logins existentes.
- **Vínculo funcionário↔setor**: o real usa a coluna **`funcionarios.setor_ids uuid[]`** + as RPCs; a tabela `funcionarios_setores` (plural) existe mas está vazia.

## Validação recomendada antes de produção

Estas migrations foram geradas a partir de saídas autoritativas do próprio Postgres (`pg_get_*`) e revisadas, mas **ainda não foram aplicadas**. Validar assim:

```bash
# Em um projeto/instância NOVO ou staging:
supabase db reset            # aplica 0001..0010 em ordem
# ou aplicar manualmente cada arquivo via psql, na ordem numérica
```

Depois, validar ponta a ponta: **login**, permissões, geração de **premiações**, relatórios e cadastros.
