# Migração de dados V2 — como executar

Copia os dados do banco **antigo** para o **novo** projeto Supabase (com as migrations `supabase/migrations-v2/` já aplicadas). Ver o plano completo em [../../MIGRATION_DATA_PLAN_V2.md](../../MIGRATION_DATA_PLAN_V2.md).

> 🔒 **Nunca** commite credenciais nem dados reais. As connection strings ficam só em variáveis de ambiente / `.env.migration` (git-ignored). O script **não grava dados em disco** — copia direto origem→destino.

## Pré-requisitos
- Node 18+.
- Pacote `pg` disponível. Se necessário: `npm install pg` (ou rode a partir de uma pasta que já o tenha).
- Migrations `0001`–`0010` **já aplicadas** no projeto novo.

## Passos

1. Configure as credenciais (uma das opções):

   **Opção A — arquivo git-ignored:**
   ```bash
   cp scripts/migration/env.migration.example scripts/migration/.env.migration
   # edite .env.migration com as connection strings (POOLER) do projeto antigo e do novo
   set -a && source scripts/migration/.env.migration && set +a
   ```

   **Opção B — inline (não fica salvo):**
   ```bash
   export SRC_DATABASE_URL="postgresql://postgres.<ref_antigo>:<senha%40enc>@aws-1-<regiao>.pooler.supabase.com:5432/postgres"
   export DST_DATABASE_URL="postgresql://postgres.<ref_novo>:<senha%40enc>@aws-1-<regiao>.pooler.supabase.com:5432/postgres"
   ```

2. **Simule primeiro** (não escreve nada — só conta linhas na origem):
   ```bash
   node scripts/migration/migrate-data.mjs --dry-run
   ```

3. **Migre** (ordem de FK e ciclo setores↔funcionarios tratados automaticamente):
   ```bash
   # padrao: org + transacional + pessoal; pula config ja seedada
   node scripts/migration/migrate-data.mjs
   ```

## Flags
| Flag | Efeito |
|------|--------|
| `--dry-run` | Só conta; não escreve. |
| `--include-seed` | Também copia as tabelas de config já cobertas pelo seed 0010 (por padrão são puladas). |
| `--skip-sensitive` | **Não** copia `funcionarios` e `usuarios` (dados pessoais). Útil para um staging sem PII. |
| `--only=a,b` | Só as tabelas listadas (nomes sem o prefixo `concremrh_`). |
| `--on-conflict=update` | Upsert (`DO UPDATE`) em vez de `DO NOTHING`. |

## Notas importantes
- **Idempotente:** `ON CONFLICT (id) DO NOTHING` por padrão — pode re-rodar sem duplicar.
- **`usuarios.senha_hash`** é copiado **como está** (bcrypt), preservando os logins.
- **Config seedada** (base_premiacao, categorias, formulas_calculo, etc.) é **pulada** por padrão para não conflitar com o seed 0010.
- **Ciclo setores↔funcionarios:** `setores` entra primeiro com `supervisor_id`/`encarregado_id` nulos; após `funcionarios`, o passo `@fix_setores` preenche esses campos.
- Tabelas vazias na origem são puladas automaticamente.

## Validação pós-migração
```sql
-- Comparar contagens origem vs destino (rodar em cada banco):
select 'funcionarios' t, count(*) from concremrh_funcionarios
union all select 'usuarios', count(*) from concremrh_usuarios
union all select 'resultados_premiacao', count(*) from concremrh_resultados_premiacao;
```
Depois teste **login**, geração de **premiações** e os relatórios no app apontando para o projeto novo.
