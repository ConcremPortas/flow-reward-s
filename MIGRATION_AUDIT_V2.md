# Auditoria de Schema e Proposta de Migrations — Reforma V2 (Etapa 4)

**Data:** 2026-07-07
**Objetivo:** transformar o schema real do Supabase atual em migrations confiáveis e versionadas para recriar o banco em um **novo projeto Supabase**, sem alterar o banco antigo e sem mexer em regra de negócio.
**Projeto atual (somente leitura):** `ctntlgvoefdbjxvfkahp`
**Método:** análise do código (`types.ts`, hooks, páginas, domínio) + leitura do banco real via API REST (chave **anon**, apenas `SELECT`/`limit=1`). **Nenhuma escrita, nenhum push, nenhuma migration aplicada.**

> ⚠️ **Limitação de acesso:** só há a chave **anon**. O endpoint OpenAPI (schema completo) e o `supabase gen types` exigem `service_role`/login — indisponíveis com segurança aqui. Portanto os tipos exatos, defaults, constraints, FKs, RLS e triggers **não puderam ser lidos diretamente**; foram inferidos de migrations + `types.ts` + amostras de linhas reais. **Antes de aplicar, o schema deve ser confirmado com um `pg_dump`/`supabase db dump` do projeto atual.**

---

## 1. Tabelas usadas pelo app (`concremrh_`) — 29

Todas referenciadas via `.from('concremrh_...')` em hooks/páginas.

| # | Tabela | Existe no banco? | Tem migration? | Em `types.ts`? |
|---|--------|:---:|:---:|:---:|
| 1 | concremrh_empresas | ✅ | ❌ | ✅ |
| 2 | concremrh_setores | ✅ | ❌ | ✅ |
| 3 | concremrh_funcoes | ✅ | ❌ | ✅ |
| 4 | concremrh_categorias | ✅ | ❌ | ✅ |
| 5 | concremrh_faixas | ✅ | ❌ | ✅ |
| 6 | concremrh_base_premiacao | ✅ | ❌ | ✅ |
| 7 | concremrh_funcionarios | ✅ | ❌ | ✅ |
| 8 | concremrh_funcionario_setores | ❌ **(não existe)** | ❌ | ✅ (nome errado) |
| 9 | concremrh_locais_dss | ✅ | ❌ | ✅ |
| 10 | concremrh_dss | ✅ | ❌ | ✅ |
| 11 | concremrh_epi | ✅ | ❌ | ✅ |
| 12 | concremrh_faltas_advertencias | ✅ | ❌ | ✅ |
| 13 | concremrh_producao_setor | ✅ | ❌ | ✅ |
| 14 | concremrh_tipos_indicadores | ✅ | ❌ | ✅ |
| 15 | concremrh_tipos_indicadores_gerais | ✅ | ❌ | ✅ |
| 16 | concremrh_indicadores_setor | ✅ | ❌ | ✅ |
| 17 | concremrh_indicadores_gerais | ✅ | ❌ | ✅ |
| 18 | concremrh_formulas_calculo | ✅ | ❌ | ⚠️ (faltam 7 colunas) |
| 19 | concremrh_configuracoes_kits | ✅ | ✅ (incompleta) | ❌ **(ausente)** |
| 20 | concremrh_resultados_premiacao | ✅ | ❌ | ✅ |
| 21 | concremrh_cargos | ✅ (vazia) | ❌ | ✅ |
| 22 | concremrh_plano_carreira | ✅ (vazia) | ❌ | ✅ |
| 23 | concremrh_historico_cargos | ✅ (vazia) | ❌ | ✅ |
| 24 | concremrh_avaliacoes_desempenho | ✅ (vazia) | ❌ | ✅ |
| 25 | concremrh_estrutura_hierarquica | ✅ (vazia) | ❌ | ✅ |
| 26 | concremrh_hr_applications | ✅ | ❌ | ✅ |
| 27 | concremrh_usuarios | ✅ (RLS bloqueia anon) | ❌ | ⚠️ (faltam colunas) |
| 28 | concremrh_user_roles | ✅ (RLS bloqueia anon) | ❌ | ✅ |
| 29 | concremrh_user_application_permissions | ✅ (RLS bloqueia anon) | ❌ | ✅ |

**+1 tabela real não referenciada pelo nome certo no app:** `concremrh_funcionarios_setores` (plural) — existe, vazia. Ver §9, achado A.

---

## 2. Tabelas `concremrh_` SEM migration correspondente — 28 de 29

**Achado central:** as migrations do repositório criam uma geração **anterior** (`concrem_*` e `remuneracaoconrem_*`), **não** as tabelas `concremrh_*` que o app realmente usa. A única exceção é `concremrh_configuracoes_kits` (migration [20260624000000_configuracoes_kits.sql](supabase/migrations/20260624000000_configuracoes_kits.sql)) — e mesmo essa está **incompleta** (falta a coluna `max_faixas`, presente no banco real).

➡️ **Conclusão:** para migrar ao novo projeto, é preciso **escrever do zero** um conjunto completo de migrations para as 29 tabelas `concremrh_`, pois o schema atual foi criado majoritariamente **fora do controle de versão** (dashboard/Lovable).

---

## 3. Colunas extras detectadas no banco real (drift vs `types.ts`)

Colunas que **existem no banco** mas **faltam** ou divergem no `types.ts`:

### `concremrh_formulas_calculo` — 7 colunas ausentes no `types.ts`
`peso_faturamento`, `peso_itens_nc`, `peso_tratamento_nc`, `peso_hora_maquina`, `peso_operacao_segura`, `peso_limpeza`, `multiplicador_kits`
→ o motor de premiação **usa** essas colunas (supervisor/encarregado). Confirmado que existem e estão preenchidas (ver §1-C do PLANO).

### `concremrh_configuracoes_kits` — tabela inteira ausente no `types.ts`; migration incompleta
Banco real: `id, vigencia_inicio, minimo_kits, incremento_faixa, `**`max_faixas`**`, bonus_base, bonus_por_faixa, ativo, created_at, updated_at`
→ `max_faixas` **não** está na migration nem no `types.ts`.

### `concremrh_usuarios` — colunas ausentes no `types.ts`
`types.ts` mostra: `id, auth_user_id, email, nome, perfil, ativo, created_at, updated_at`.
Mas o app faz `select('id, email, nome, perfil, `**`secoes`**`, ativo, created_at')` → a coluna **`secoes`** existe no banco e falta no `types.ts`. Além disso há coluna de **senha/hash** (usada pelos RPCs `SECURITY DEFINER`) não refletida.

### `concremrh_funcionarios_setores` (plural)
Não existe no `types.ts` (que só tem a variante **singular** `concremrh_funcionario_setores`, inexistente no banco).

> **Colunas reais capturadas** (tabelas com dados) estão no Apêndice A — servem de base para a proposta de migrations.

---

## 4. RPCs usadas pelo app — 5 (3 ausentes do `types.ts`)

| RPC | Onde é usada | Em `types.ts`? | Observação |
|-----|--------------|:---:|-----------|
| `concremrh_verify_login` | [AuthContext.tsx](src/contexts/AuthContext.tsx) | ❌ | login (SECURITY DEFINER); lê senha/hash |
| `concremrh_create_user` | [useUsuarios.ts](src/hooks/useUsuarios.ts) | ❌ | cria usuário com senha |
| `concremrh_update_user_password` | [useUsuarios.ts](src/hooks/useUsuarios.ts) | ❌ | troca senha |
| `update_funcionario_setor_ids` | [Funcionarios.tsx](src/pages/Funcionarios.tsx) | ✅ | grava `setor_ids` |
| `get_all_funcionario_setor_ids` | [useFuncionarios.ts](src/hooks/useFuncionarios.ts) | ✅ | retorna `{funcionario_id, setor_ids}` |

Adicionalmente, `types.ts` declara `has_role` e `has_app_permission` (usadas dentro de RLS/migrations, não chamadas diretamente pelo app).

➡️ As 3 RPCs `concremrh_*` de autenticação **não têm migration** e **não estão no `types.ts`** — precisam ser recriadas no novo projeto (críticas para login).

---

## 5. Policies/RLS/Triggers a migrar

Não é possível **ler** RLS/triggers via anon; abaixo o que é **necessário** (inferido do comportamento + migrations antigas):

### Triggers
- Função `update_updated_at_column()` (já existe nas migrations antigas) + trigger `BEFORE UPDATE` de `updated_at` em **todas** as 29 tabelas.

### RLS (a recriar por tabela)
- **Tabelas de dados** (empresas, setores, funcionarios, dss, epi, premiação, etc.): as migrations antigas usam `FOR ALL USING (true) WITH CHECK (true)` (abertas). O comportamento atual do app depende disso com a chave anon. **Recomendação:** recriar como estão para paridade funcional, mas **endurecer na Etapa 5** (segurança).
- **Tabelas de auth** (`usuarios`, `user_roles`, `user_application_permissions`): o banco real **bloqueia** `SELECT` anônimo (retornaram vazio apesar de terem dados) → têm RLS restritiva. Recriar políticas equivalentes (provavelmente baseadas em `has_role`/`auth.uid()` das migrations `20251120130201`).

### Funções auxiliares de RLS
- `has_role(_user_id, _role)` e `has_app_permission(_user_id, _app_code)` — já definidas em [20251120130201](supabase/migrations/20251120130201_d7ad1ee5-0fb8-4255-bce9-81e0f934f197.sql) (mas sobre tabelas `concrem_`, precisam ser reapontadas para `concremrh_`).

### Enums
- `app_role` (`admin | rh_manager | user`) e `user_perfil` (`admin | rh | sesmt | producao`) — do `types.ts`. Recriar antes das tabelas que os usam.
- ⚠️ O código ([AuthContext.tsx](src/contexts/AuthContext.tsx)) usa `perfil: 'custom'` além dos do enum — **verificar** se o enum real inclui `custom` ou se a coluna é texto livre.

---

## 6. `types.ts` foi regenerado?

**NÃO.** Não há acesso seguro (`service_role`/login) neste ambiente — apenas a chave anon. Regenerar exigiria um destes comandos, a serem executados **por quem tiver credenciais**:

```bash
# Opção A — via projeto (requer `supabase login` / SUPABASE_ACCESS_TOKEN):
npx supabase gen types typescript --project-id ctntlgvoefdbjxvfkahp > src/integrations/supabase/types.ts

# Opção B — via conexão direta (requer a senha do banco):
npx supabase gen types typescript --db-url "postgresql://postgres:[SENHA]@db.ctntlgvoefdbjxvfkahp.supabase.co:5432/postgres" > src/integrations/supabase/types.ts
```

Como o `types.ts` **não** foi alterado, a validação apenas confirma o estado verde atual.

---

## 7. Validação (nenhum código alterado nesta etapa)
- `npm run typecheck` → ✅ **0 erros**
- `npm test` → ✅ **32/32**
- `npm run build` → ✅ **build OK**

---

## 8. Proposta de arquivos de migration para o NOVO projeto

> **NÃO CRIADOS AINDA** — proposta para aprovação. Prefixo padronizado `concremrh_`. Ordem por dependência (FKs). Cada tabela recebe RLS + trigger de `updated_at`.

| Arquivo | Conteúdo |
|---------|----------|
| `0001_extensions_enums_helpers.sql` | `pgcrypto` (gen_random_uuid/crypt); enums `app_role`, `user_perfil`; função `update_updated_at_column()`; funções `has_role`/`has_app_permission` |
| `0002_core_organizacao.sql` | `empresas`, `setores`, `funcoes`, `categorias`, `faixas`, `base_premiacao`, `funcionarios`, **`funcionarios_setores`** (plural), `hr_applications` |
| `0003_eventos.sql` | `locais_dss`, `dss`, `epi`, `faltas_advertencias`, `producao_setor`, `tipos_indicadores`, `tipos_indicadores_gerais`, `indicadores_setor`, `indicadores_gerais` |
| `0004_premiacao.sql` | `formulas_calculo` (**11 pesos + `multiplicador_kits`**), `configuracoes_kits` (**com `max_faixas`**), `resultados_premiacao` |
| `0005_cargos_rh.sql` | `cargos`, `plano_carreira`, `historico_cargos`, `avaliacoes_desempenho`, `estrutura_hierarquica` |
| `0006_auth.sql` | `usuarios` (**com `secoes` + coluna de senha/hash**), `user_roles`, `user_application_permissions` |
| `0007_rpc.sql` | `concremrh_verify_login`, `concremrh_create_user`, `concremrh_update_user_password`, `update_funcionario_setor_ids`, `get_all_funcionario_setor_ids` |
| `0008_rls_policies.sql` | RLS `ENABLE` + políticas por tabela (dados: paridade atual; auth: restritivas) |
| `0009_triggers.sql` | Triggers `updated_at` em todas as tabelas |
| `0010_seed.sql` | Seeds: `hr_applications`, `configuracoes_kits` default, `tipos_indicadores` (`FAT`, `KITS`), `formulas_calculo` |

**Fontes de verdade para montar cada `CREATE TABLE`:** Apêndice A (colunas reais) + `types.ts` (tabelas vazias) + migrations antigas (estrutura/FKs de referência). **Toda tabela vazia/RLS-bloqueada precisa de confirmação por dump antes de aplicar.**

---

## 9. Riscos encontrados

- **A. `funcionario_setores` (singular) não existe no banco.** O hook [useFuncionarioSetores.ts](src/hooks/useFuncionarioSetores.ts) e o `types.ts` usam o nome singular; o banco tem `concremrh_funcionarios_setores` (**plural**), vazio. O vínculo funcionário↔setor de fato usa a coluna array **`setor_ids`** em `funcionarios` + os RPCs. ➡️ O hook singular provavelmente é **código morto/quebrado**. Decidir no novo schema qual modelo manter (array `setor_ids` **ou** join table) — sem misturar.
- **B. `types.ts` significativamente defasado** — múltiplas tabelas (formulas_calculo, configuracoes_kits, usuarios) divergem do banco. Regenerar é pré-requisito da Etapa que consolidar tipos.
- **C. Schema fora de versionamento** — 28/29 tabelas sem migration; risco de recriar o banco novo **incompleto**. Mitigar com `pg_dump`/`db dump` autoritativo antes de finalizar as migrations.
- **D. Enum `user_perfil` vs valor `custom`** — o app usa `custom`, não presente no enum do `types.ts`. Pode quebrar `INSERT`/login no novo projeto se o enum não incluir `custom`. **Verificar.**
- **E. RLS aberta em tabelas de dados** — recriar "como está" mantém a exposição atual; endurecer na Etapa 5.
- **F. Segredos** — os RPCs de auth lidam com senha/hash. A recriação precisa preservar o **mesmo algoritmo de hash** (provável `crypt()`/`pgcrypto`) para as senhas existentes continuarem válidas — a confirmar no dump das funções.

---

## 10. Próximo passo recomendado

1. **Obter um dump autoritativo** do projeto atual (quem tiver credenciais):
   ```bash
   supabase db dump --db-url "postgresql://postgres:[SENHA]@db.ctntlgvoefdbjxvfkahp.supabase.co:5432/postgres" -f schema_atual.sql        # schema + funções + policies + triggers
   ```
   Isso resolve todas as incógnitas (tabelas vazias, RLS, triggers, RPCs, tipos exatos, algoritmo de senha).
2. **Regenerar `types.ts`** (comando na §6) e rodar `typecheck/build/test`.
3. **Escrever as migrations** `0001`–`0010` (§8) a partir do dump, revisar e só então aplicar no **novo** projeto.
4. Decidir o modelo de `funcionario↔setor` (achado A) e o enum `custom` (achado D) **antes** de finalizar `0002`/`0006`.

---

## Apêndice A — Colunas reais capturadas do banco (tabelas com dados)

```
base_premiacao        : id, nome, descricao, valor_base, tipo, ativo, created_at, updated_at
categorias            : id, nome, descricao, cor, ativo, created_at, updated_at
configuracoes_kits    : id, vigencia_inicio, minimo_kits, incremento_faixa, max_faixas, bonus_base, bonus_por_faixa, ativo, created_at, updated_at
dss                   : id, titulo, descricao, data_realizacao, setor_id, responsavel_id, participantes_ids, topics, observacoes, local_dss_id, created_at, updated_at
empresas              : id, nome, cnpj, email, telefone, endereco, ativo, created_at, updated_at
epi                   : id, funcionario_id, tipo_epi, descricao, numero_ca, data_entrega, data_vencimento, status, observacoes, created_at, updated_at
faixas                : id, nome, valor, categoria_id, ativo, created_at, updated_at
faltas_advertencias   : id, funcionario_id, tipo, motivo, descricao, data_ocorrencia, quantidade, gravidade, aplicado_por, observacoes, created_at, updated_at
formulas_calculo      : id, categoria_id, base_premiacao_id, nome, descricao, peso_producao_setor, peso_epi, peso_faltas, peso_advertencias, peso_dss, ativo, created_at, updated_at, peso_faturamento, peso_itens_nc, peso_tratamento_nc, peso_hora_maquina, peso_operacao_segura, peso_limpeza, multiplicador_kits
funcionarios          : id, user_id, nome, cpf, email, telefone, data_nascimento, data_admissao, data_demissao, salario, empresa_id, setor_id, funcao_id, categoria_id, base_premiacao_id, faixa_id, local_dss_id, status, valor_fixo, ativo, created_at, updated_at, setor_ids
funcoes               : id, nome, descricao, nivel_hierarquico, ativo, created_at, updated_at
hr_applications       : id, code, name, description, icon, color, route, is_active, display_order, created_at, updated_at
indicadores_gerais    : id, tipo_indicador_id, competencia, meta, realizado, percentual, created_at, updated_at
indicadores_setor     : id, setor_id, competencia, hora_maquina_meta, hora_maquina_realizado, hora_maquina_percentual, identificacao_nc_meta, identificacao_nc_realizado, identificacao_nc_percentual, limpeza_meta, limpeza_realizado, limpeza_percentual, tratamento_nc_meta, tratamento_nc_realizado, tratamento_nc_percentual, operacao_segura_meta, operacao_segura_realizado, operacao_segura_percentual, created_at, updated_at
locais_dss            : id, nome, descricao, ativo, created_at, updated_at
producao_setor        : id, setor_id, data_producao, meta_diaria, producao_realizada, unidade_medida, observacoes, created_at, updated_at
resultados_premiacao  : id, mes_competencia, base_premiacao_id, funcionario_id, cod_funcionario, nome, setor, funcao, categoria, faixa, valor_faixa, percentual_producao, nota_producao, nota_epi, nota_faltas, nota_advertencias, nota_dss, nota_faturamento, nota_itens_nc, nota_tratamento_nc, nota_hora_maquina, nota_operacao_segura, nota_limpeza, valor_kits, nota_geral, bonus_possivel, bonus_alcancado, valor_fixo, valor_ajustado, observacao_ajuste, created_at, updated_at
setores               : id, nome, descricao, empresa_id, supervisor_id, encarregado_id, ativo, created_at, updated_at
tipos_indicadores     : id, codigo, nome, descricao, ativo, created_at, updated_at
tipos_indicadores_gerais : id, nome, codigo, descricao, ativo, created_at, updated_at
```

**Tabelas sem dados/RLS-bloqueadas (colunas a confirmar por dump):** `avaliacoes_desempenho`, `cargos`, `estrutura_hierarquica`, `historico_cargos`, `plano_carreira`, `funcionarios_setores`, `usuarios`, `user_roles`, `user_application_permissions`.
