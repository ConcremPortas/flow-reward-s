# Plano de Migração de Dados — Reforma V2

**Data:** 2026-07-07
**Contexto:** as migrations `supabase/migrations-v2/` (0001–0010) já foram aplicadas no **novo** projeto Supabase (schema + config seedada). Agora migramos os **dados** do banco antigo (`ctntlgvoefdbjxvfkahp`) para o novo, de forma controlada, respeitando FKs e sem commitar dados pessoais/credenciais.
**Referências:** [MIGRATION_AUDIT_V2.md](MIGRATION_AUDIT_V2.md) · [schema_atual.sql](schema_atual.sql) · [supabase/migrations-v2/](supabase/migrations-v2/) · script: [scripts/migration/migrate-data.mjs](scripts/migration/migrate-data.mjs)

> Contagens de linha abaixo são do banco antigo, lidas em 2026-07-07 (somente leitura).

---

## 1. Classificação das tabelas

### 1.1 Config / referência — **já no seed 0010** (NÃO re-migrar por padrão)
| Tabela | Linhas |
|--------|-------:|
| `concremrh_hr_applications` | 3 |
| `concremrh_tipos_indicadores` | 5 |
| `concremrh_tipos_indicadores_gerais` | 2 |
| `concremrh_configuracoes_kits` | 2 |
| `concremrh_categorias` | 5 |
| `concremrh_base_premiacao` | 7 |
| `concremrh_formulas_calculo` | 7 |

Já inseridas por [0010_seed_config.sql](supabase/migrations-v2/0010_seed_config.sql). O script **pula** essas tabelas por padrão (flag `--include-seed` força a cópia, sempre com `ON CONFLICT DO NOTHING` para não duplicar).

### 1.2 Organizacionais (migrar)
| Tabela | Linhas | Observação |
|--------|-------:|-----------|
| `concremrh_empresas` | 1 | contém CNPJ/e-mail (dado da empresa) |
| `concremrh_faixas` | 22 | — |
| `concremrh_funcoes` | 47 | — |
| `concremrh_locais_dss` | 3 | referência para funcionarios/dss |
| `concremrh_setores` | 42 | **ciclo de FK** com funcionarios (ver §3) |

### 1.3 Transacionais / histórico (migrar se quiser preservar histórico)
| Tabela | Linhas |
|--------|-------:|
| `concremrh_resultados_premiacao` | 918 |
| `concremrh_producao_setor` | 166 |
| `concremrh_indicadores_setor` | 124 |
| `concremrh_faltas_advertencias` | 63 |
| `concremrh_indicadores_gerais` | 8 |
| `concremrh_dss` | 3 |
| `concremrh_epi` | 2 |
| `concremrh_avaliacoes_desempenho` · `historico_cargos` · `cargos` · `plano_carreira` · `estrutura_hierarquica` | 0 (vazias — puladas) |

> `resultados_premiacao` (918) é o histórico de premiações já calculadas. Migrar se o histórico for necessário no app novo.

### 1.4 Sensíveis / pessoais (LGPD) — migrar com cuidado
| Tabela | Linhas | Conteúdo sensível |
|--------|-------:|-------------------|
| `concremrh_funcionarios` | 321 | CPF, salário, e-mail, datas |
| `concremrh_usuarios` | 5 | e-mail, **`senha_hash`** (bcrypt) |
| `concremrh_user_roles` · `user_application_permissions` | 0 (vazias) | — |

- **`usuarios.senha_hash` é copiado como está** (bcrypt `crypt/gen_salt('bf')`) → **preserva os logins**.
- `funcionarios`/`usuarios` são migrados por padrão (o app precisa deles), mas o script permite `--skip-sensitive` para popular um staging **sem PII**.

---

## 2. O que migrar × o que não migrar

- **NÃO migrar (já no seed):** hr_applications, tipos_indicadores, tipos_indicadores_gerais, configuracoes_kits, categorias, base_premiacao, formulas_calculo.
- **Migrar:** empresas, faixas, funcoes, locais_dss, setores, funcionarios, dss, epi, faltas_advertencias, indicadores_setor, indicadores_gerais, producao_setor, resultados_premiacao, usuarios.
- **Puladas automaticamente (0 linhas):** avaliacoes_desempenho, cargos, plano_carreira, historico_cargos, estrutura_hierarquica, funcionarios_setores, user_roles, user_application_permissions.

---

## 3. Ordem de migração (respeitando foreign keys)

Há um **ciclo de FK**: `setores.supervisor_id`/`encarregado_id → funcionarios` **e** `funcionarios.setor_id → setores`. Não existe ordem topológica pura. Solução em **duas passadas** (implementada no script):

1. Referências independentes: `empresas`, `faixas`(→categorias), `funcoes`, `locais_dss` (+ config já seedada).
2. **`setores`** — inserido com `supervisor_id`/`encarregado_id` **NULOS** (quebra o ciclo).
3. **`funcionarios`** — agora resolve `setor_id` e demais FKs (empresas, categorias, base, faixas, funcoes, locais_dss).
4. **`@fix_setores`** — `UPDATE` de `setores.supervisor_id`/`encarregado_id` a partir da origem.
5. `funcionarios_setores` (0).
6. Transacionais: `epi`, `dss`, `faltas_advertencias`, `indicadores_setor`, `indicadores_gerais`, `producao_setor`, `resultados_premiacao`.
7. Auth: `usuarios`, `user_roles`, `user_application_permissions`.

A lista completa e ordenada está codificada em `ORDER` no [migrate-data.mjs](scripts/migration/migrate-data.mjs).

---

## 4. ⚠️ Verificação do `perfil` / `custom`

- O CHECK real de `concremrh_usuarios.perfil` aceita **apenas** `('admin','rh','sesmt','producao')` — **não** inclui `custom`.
- Os perfis existentes no banco antigo são: **`sesmt`, `producao`, `admin`, `rh`** — **nenhum `custom`**. ✅ Logo, a migração de `usuarios` **não** viola o constraint.
- **Porém:** o app (`UserPerfil`) tem `custom`. Se você pretende **criar** usuários `custom` no projeto novo, o `INSERT` falhará no mesmo CHECK. Para permitir, seria necessário (fora do escopo desta etapa):
  ```sql
  alter table public.concremrh_usuarios drop constraint concremrh_usuarios_perfil_check;
  alter table public.concremrh_usuarios add constraint concremrh_usuarios_perfil_check
    check (perfil = any (array['admin','rh','sesmt','producao','custom']));
  ```

---

## 5. Scripts criados
- [scripts/migration/migrate-data.mjs](scripts/migration/migrate-data.mjs) — copia origem→destino em ordem de FK, idempotente, sem credenciais embutidas, sem gravar dados em disco.
- [scripts/migration/env.migration.example](scripts/migration/env.migration.example) — template de variáveis (sem valores reais).
- [scripts/migration/README.md](scripts/migration/README.md) — instruções de execução.
- `.gitignore` atualizado para ignorar `.env.migration`, `*.data.sql`, `*.dump`, etc.

---

## 6. Como executar sem expor credenciais
As connection strings ficam **apenas** em variáveis de ambiente (ou em `.env.migration`, git-ignored):
```bash
cp scripts/migration/env.migration.example scripts/migration/.env.migration   # preencher (POOLER, senha URL-encoded)
set -a && source scripts/migration/.env.migration && set +a
node scripts/migration/migrate-data.mjs --dry-run     # simular
node scripts/migration/migrate-data.mjs               # migrar
```
O script lê `SRC_DATABASE_URL`/`DST_DATABASE_URL` do ambiente e **nunca** os grava. Detalhes e flags no [README](scripts/migration/README.md).

---

## 7. Riscos LGPD / dados sensíveis
- **PII:** `funcionarios` (CPF, salário) e `usuarios` (e-mail, hash) são dados pessoais. **Nunca** commitar dumps desses dados; o script foi desenhado para **não** materializá-los em arquivos.
- **Senhas:** migrar `senha_hash` (bcrypt) é seguro e necessário para manter login; **não** há senha em texto puro.
- **Staging:** para ambientes de teste, use `--skip-sensitive` (migra tudo menos funcionarios/usuarios) — evita expor PII fora de produção.
- **Minimização:** se o histórico de `resultados_premiacao`/eventos não for necessário no novo ambiente, considere não migrá-lo (`--only=...`) para reduzir superfície de dados.
- **Credenciais:** trocar a senha do banco antigo após a migração (foi usada em comandos). `.env`/service_role/senha **nunca** entram em commit (garantido pelo `.gitignore`).

---

## 8. Próximo passo recomendado
1. Rodar `--dry-run` e conferir as contagens origem×destino.
2. Migrar **organizacionais + transacionais** primeiro; validar cadastros e geração de premiações.
3. Migrar **sensíveis** (`funcionarios`, `usuarios`) e validar **login** (senha preservada) e permissões.
4. Conferência final de contagens e testes ponta a ponta no app apontando para o novo projeto.
5. Só então trocar `.env`/Vercel para o projeto novo (Etapa final da migração).
