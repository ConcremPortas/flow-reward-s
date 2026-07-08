# Plano de Reforma V2 — ConcremRH / Recompensa-Flow

**Versão:** 1.9 (Etapa 8C — Fase 1 de segurança: frontend pronto; SQL a aplicar)
**Data:** 2026-07-07
**Base de referência:** [SDD.md](SDD.md) · [MIGRATION_AUDIT_V2.md](MIGRATION_AUDIT_V2.md) · [MIGRATION_DATA_PLAN_V2.md](MIGRATION_DATA_PLAN_V2.md)
**Princípio norteador:** *reaproveitar o sistema existente e reformar de forma estrutural e segura, sem quebrar regra de negócio nem dados em produção.*

> **Progresso:** Etapas 0–4 concluídas (ver §1-A a §1-D) + **migração para o novo projeto Supabase concluída e validada em localhost** (ver §1-E).
>
> **⚠️ Mudança de rumo (2026-07-07):** a aplicação foi **migrada para um novo projeto Supabase**. O banco novo já está criado, com migrations aplicadas, dados migrados e login/telas validados localmente.
>
> **🚩 Publicação na Vercel = ÚLTIMA etapa.** O projeto será publicado em **outra conta da Vercel**, então a troca/publicação fica deliberadamente para o **final** — só depois de todo o restante estar validado. Nada de Vercel até lá.

---

## 1-A. Relatório de conclusão da Etapa 1 (2026-07-07)

*Escopo: preparação, tooling e correção cirúrgica de 2 erros de tipo. Nenhuma regra de cálculo, banco de dados ou tela foi alterada.*

### Status da Etapa 1 — ✅ concluída
| Item | Resultado |
|------|-----------|
| Script `typecheck` (`tsc --noEmit`) | ✅ Adicionado ao `package.json` e **passando (0 erros)** |
| `npm run build` | ✅ **Passa** (`✓ built in ~9s`) |
| Testes mínimos | ✅ Configurados e **passando (2/2)** |
| Vitest + Testing Library | ✅ Configurados ([vitest.config.ts](vitest.config.ts), [src/test/setup.ts](src/test/setup.ts), jsdom) |
| Bug real em [DSS.tsx](src/pages/DSS.tsx) | ✅ Corrigido com `import { format } from "date-fns"` (sem mudar comportamento) |
| Browserslist / caniuse-lite | ✅ Atualizado |
| ESLint | ⚠️ **109 problemas conhecidos** (70 erros / 39 avisos) — **sem regressão** (mesmo número de antes); correção adiada por decisão de escopo |

### Arquivos tocados na Etapa 1
- **Criados:** [vitest.config.ts](vitest.config.ts), [src/test/setup.ts](src/test/setup.ts), [src/test/sanity.test.tsx](src/test/sanity.test.tsx)
- **Alterados:** [package.json](package.json) (scripts `typecheck`/`test`/`test:watch` + devDeps), [src/pages/DSS.tsx](src/pages/DSS.tsx) (import), [src/hooks/useFormulasCalculo.ts](src/hooks/useFormulasCalculo.ts) (ajuste **type-only**)

### Achados críticos da Etapa 1
1. **O build (Vite/esbuild) não faz checagem de tipos.** Ele transpila sem `tsc`, então **escondia erros reais** — que só apareceram ao adicionar o script `typecheck`. Daí a importância de manter o `typecheck` no pipeline/CI.
2. **O erro em [DSS.tsx](src/pages/DSS.tsx) era um bug real de runtime** (`format` usado sem import) — causaria `ReferenceError` ao abrir o seletor de data do formulário DSS. Corrigido.
3. **O schema de `FormulaCalculo` está desalinhado com o que o motor de premiação espera.** A interface no código declara 11 pesos; o `types.ts` gerado do Supabase (`concremrh_formulas_calculo`) só tem **5** (`producao_setor, epi, faltas, advertencias, dss`).
4. **Os 6 pesos extras** usados para supervisor/encarregado (`faturamento, itens_nc, tratamento_nc, hora_maquina, operacao_segura, limpeza`) **não aparecem em nenhuma migration**. O motor os lê sob fallback (`peso || 0`); se as colunas não existirem no banco real, esses pesos resolvem para **0** — indicadores de supervisor podem estar **silenciosamente zerados**.
5. **Não existe migration criando a tabela `concremrh_formulas_calculo`.** Só há as gerações legadas `concrem_formulas_calculo` e `remuneracaoconrem_formulas_calculo` (ambas com 5 pesos).
6. **Parte do schema `concremrh_` parece ter sido criada fora do controle de migrations** (provavelmente via dashboard Supabase/Lovable), já que o código depende de tabelas/colunas que as migrations versionadas não criam.
7. **É necessário confirmar no banco de produção** se as 6 colunas de peso extras realmente existem em `concremrh_formulas_calculo` — isso define se o bônus de supervisores/encarregados está correto ou zerado.

> **Correção aplicada ao achado 3 (type-only):** em [useFormulasCalculo.ts](src/hooks/useFormulasCalculo.ts) os 5 pesos reais passaram a `number | null` (refletindo o `types.ts`) e os 6 extras + `multiplicador_kits` viraram opcionais (`?`). Alinha o tipo ao schema real e zera o erro de `tsc`, **sem alterar cálculo**. Uma eventual correção de schema (se as colunas faltarem) fica para a Etapa 6, via migration.

### Pendências abertas pela Etapa 1 (encaminhadas às etapas seguintes)
- **Etapa 2:** criar testes de caracterização do motor de premiação (congelar comportamento atual antes de refatorar).
- **Etapa 6:** investigar o banco real — migrations ausentes da geração `concremrh_` e a existência (ou não) dos 6 pesos extras em `concremrh_formulas_calculo`.
- **Etapa futura (tooling/qualidade):** corrigir o lint **por categorias** (`no-explicit-any`, `exhaustive-deps`, `no-require-imports`), em PRs próprios, **sem misturar com mudança de regra de negócio**.

---

## 1-B. Relatório de conclusão da Etapa 2 (2026-07-07)

*Escopo: congelar o comportamento atual do motor de premiação com testes de caracterização, sem alterar cálculo, UI, banco ou persistência.*

### Status da Etapa 2 — ✅ concluída
| Item | Resultado |
|------|-----------|
| Módulo puro do cálculo | ✅ Criado — [src/domain/premiacao/calculoPremiacao.ts](src/domain/premiacao/calculoPremiacao.ts) |
| Testes de caracterização | ✅ Criados — [src/domain/premiacao/calculoPremiacao.test.ts](src/domain/premiacao/calculoPremiacao.test.ts) |
| Suíte | ✅ **32 testes passando** |
| [GerarPremiacoes.tsx](src/pages/GerarPremiacoes.tsx) | ✅ **Não alterado** |
| Regra de cálculo | ✅ **Não alterada** (transcrição verbatim) |
| Banco / UI / persistência | ✅ **Não alterados** |
| `typecheck` / `build` / `test` | ✅ Todos passando |

### Estratégia usada
- Como o cálculo estava **embutido** em [GerarPremiacoes.tsx](src/pages/GerarPremiacoes.tsx) (dentro do `.map()` da função `gerarPremiacoes`, com funções auxiliares não exportadas), foi criado um **módulo paralelo** com **transcrição fiel (verbatim)** da lógica atual — incluindo eventuais esquisitices — com referências de linha ao componente original.
- Esse módulo serve como **semente para a Etapa 3**.
- A **Etapa 3** deverá fazer [GerarPremiacoes.tsx](src/pages/GerarPremiacoes.tsx) **importar** este módulo, **removendo a duplicação**, rodando esta mesma suíte para garantir zero mudança de comportamento.

### Cenários cobertos
- operacional com produção 100%
- faltas
- advertências
- EPI sem auditoria
- EPI com não conformidade
- DSS sem registros
- DSS com presença parcial
- produção abaixo da meta
- produção acima da meta limitada a 1.0
- Kits 100%
- Kits 50%
- supervisor/encarregado com pesos extras ausentes
- valor_fixo
- comissão de kits abaixo / no / acima do mínimo
- fórmula ausente
- fallback de média aritmética em kits

### Achados registrados (congelados, **não corrigidos**)
- **🔴 ACHADO CRÍTICO:** supervisor/encarregado pode ter a **nota máxima limitada a ~0.53** quando só existem os 5 pesos-base na fórmula, pois os **6 pesos extras ficam zerados** — subpagamento silencioso mesmo com desempenho perfeito. (Depende de confirmação no banco real — Etapa 6.)
- **Produção acima da meta não aumenta a nota acima de 1.0** (`min(percentual, 1.0)`); o percentual real é preservado só para exibição.
- **Sem fórmula, a nota geral operacional fica 0** e o bônus alcançado vira **apenas o `valor_fixo`**.
- **Kits com pesos zerados** usam **média aritmética** dos 4 critérios (EPI, DSS, faltas, advertências).
- **EPI/DSS sem registros recebem nota 1.0** (ausência de dados → nota máxima).
- **Ainda não testados:** coleta/agregação de eventos por competência, seleção de fórmula (match categoria×base + fallbacks), agregação de setores supervisionados, persistência (`salvarResultados`) e leitura real dos indicadores (KITS/FAT). Exigem a extração da Etapa 3 ou testes de integração com Supabase mockado.

### Próximo passo
- **Etapa 3:** fazer [GerarPremiacoes.tsx](src/pages/GerarPremiacoes.tsx) usar o módulo puro [calculoPremiacao.ts](src/domain/premiacao/calculoPremiacao.ts) **sem alterar comportamento** (validado pela suíte de caracterização).
- **Etapa 6:** confirmar no banco real se as **6 colunas extras de peso existem** em `concremrh_formulas_calculo` (decide se supervisores estão sendo subpagos hoje).

---

## 1-C. Relatório de conclusão da Etapa 3 (2026-07-07)

*Escopo: fazer o componente usar o módulo puro, removendo a duplicação de cálculo, sem alterar comportamento. Inclui a investigação do banco real (achado crítico da Etapa 2).*

### Status da Etapa 3 — ✅ concluída
| Item | Resultado |
|------|-----------|
| [GerarPremiacoes.tsx](src/pages/GerarPremiacoes.tsx) usa [calculoPremiacao.ts](src/domain/premiacao/calculoPremiacao.ts) | ✅ |
| Lógicas duplicadas de cálculo removidas do componente | ✅ (−110 / +55 linhas) |
| Busca por hooks, filtros, agregação, persistência, navegação, toasts e UI | ✅ **preservados** |
| Regra de cálculo | ✅ **não alterada** (extração 1:1 verbatim) |
| Banco | ✅ **não alterado** |
| Layout | ✅ **não alterado** |
| `typecheck` / `build` / `test` | ✅ Todos passando |
| Suíte de caracterização | ✅ **32 testes continuam passando** |

### Funções extraídas / passadas a serem usadas pelo componente
`calcularComissao` · `calcularNotaFaltas` · `calcularNotaAdvertencias` · `calcularNotaEpi` · `calcularNotaDss` · `calcularNotaProducao` · `calcularNotaGeral` · `calcularBonus` · `extractKitsMultiplier` · `isProducaoBase` · `isKitsBase` · `normalize`.

> Observação: `calcularMediaIndicador` foi **mantido inline** no componente de propósito — seu tratamento de `null` (`realizado/meta` → `NaN`) diverge do módulo (`(realizado||0)/meta` → `0`); extraí-lo mudaria comportamento. Fica para a reforma da regra (Etapa 8).

### 🔴→🟢 Achado crítico REBAIXADO (investigação no banco real via API REST)
- **Confirmado:** as **6 colunas extras de peso existem** no banco real (`concremrh_formulas_calculo`).
- As fórmulas **`SUPERVISÃO PRODUCAO`** e **`ENCARREGADO PRODUCAO`** têm os pesos preenchidos e **somam 100** (`prod 30 · fat 20 · epi 10 · falt 10 · dss 10 · i_nc 5 · adv 3 · t_nc 3 · h_maq 3 · op_seg 3 · limp 3`).
- **Conclusão:** o risco de subpagamento (~0.53) **por colunas inexistentes NÃO se materializa** no banco atual — supervisor/encarregado com desempenho perfeito atinge nota 1.0.

### 🟠 Novos achados (da investigação do banco)
1. **`types.ts` desatualizado** em relação ao banco real. O banco tem colunas que **não aparecem** no `types.ts` gerado: `peso_faturamento`, `peso_itens_nc`, `peso_tratamento_nc`, `peso_hora_maquina`, `peso_operacao_segura`, `peso_limpeza` e `multiplicador_kits`.
2. **Estruturas `concremrh_` no banco real não cobertas pelas migrations versionadas** (schema criado fora do controle de migrations — provavelmente via dashboard/Lovable).
3. **Possível descasamento de fórmula (a validar):** as fórmulas têm `categoria_id`/`base_premiacao_id` = `null`, então o match cai no **fallback por nome**. O banco usa `"SUPERVISÃO PRODUCAO"` / `"ENCARREGADO PRODUCAO"`, mas o componente tenta casar `"SUPERVISOR - PRODUÇÃO"` (`categoria - base` normalizado) — que **não bate**. Nesse caso o supervisor cairia nos **pesos-padrão hardcoded** (0.20/0.26/…) em vez dos pesos configurados no banco (0.30/0.20/…).
   - **Precisa ser validado com dados reais** de `concremrh_funcionarios`, `concremrh_categorias` e `concremrh_base_premiacao` antes de qualquer conclusão. **Nada foi alterado.**

### Mudança de prioridade
- A aplicação será **migrada para um novo projeto Supabase**. Por isso, a próxima etapa passa a ser **preparar schema/migrations completas** para recriar o banco no novo projeto (capturando inclusive as colunas/estruturas hoje fora das migrations).
- **Etapas visuais/UX ficam depois** da estabilização do schema.

---

## 1-E. Migração para o novo Supabase — concluída e validada em localhost (2026-07-07)

*Escopo: migração ponta a ponta para o novo projeto Supabase e validação em ambiente local. Sem alteração de código, regra, UI ou dados de produção antiga.*

### Status
| Etapa | Resultado |
|-------|-----------|
| **Novo projeto Supabase criado** | ✅ (`ewfebwljhmcvuopopqpb`, região sa-east-1) |
| **Migrations V2 aplicadas** | ✅ 0001–0010 (29 tabelas, 38 FKs, 30 policies, 26 triggers, 5 RPCs, seed de config) |
| **Dados migrados** | ✅ **1725 linhas** (org + transacional + pessoal), contagens origem×destino conferem 100% |
| **Login validado** | ✅ `concremrh_verify_login` no banco novo retorna perfil correto; senha errada → `ok:false`. `senha_hash` (bcrypt) preservado |
| **Telas validadas em localhost (Supabase novo)** | ✅ Todas as telas validadas apontando o ambiente local para o projeto novo (funcionários, DSS, EPI, produção, indicadores, gerar/relatório de premiação, exportação Excel/PDF, cargos & salários, usuários) |
| **`typecheck` / `build` / `test`** | ✅ Todos passando (0 erros / build OK / 32 testes) |

### Como o ambiente local aponta para o novo projeto
- Criado **`.env.local`** (git-ignored) com `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` do projeto novo. Nenhuma credencial commitada.
- Camada de dados validada com a **anon key nova** (login RPC + leituras RLS das tabelas do app com as contagens esperadas).

### Detalhes da migração de dados
- Script idempotente [scripts/migration/migrate-data.mjs](scripts/migration/migrate-data.mjs), ordem por FK, ciclo `setores↔funcionarios` resolvido em duas passadas. Config seedada não duplicada. Ver [MIGRATION_DATA_PLAN_V2.md](MIGRATION_DATA_PLAN_V2.md).
- Perfis reais: `admin/rh/sesmt/producao` (nenhum `custom`) → migração de `usuarios` não violou o CHECK.

### 🚩 Publicação na Vercel — ÚLTIMA etapa (deliberado)
- O projeto será publicado em **outra conta da Vercel**. Por isso a **troca/publicação na Vercel fica para o final**, só após todo o restante estar validado.
- Até lá: **não** alterar env vars da Vercel nem fazer deploy. O switch de produção (env vars + redeploy) é o último passo do roadmap.

### Próximo passo técnico
- **Etapa 7 — alinhamento do `types.ts`** (executada em 2026-07-07, ver §1-F): drift principal fechado manualmente com base no `schema_atual.sql`. Regeneração **completa** via Supabase CLI segue pendente para ambiente com Docker/podman.

---

## 1-F. Etapa 7 — alinhamento do `types.ts` ao schema do Supabase novo (2026-07-07)

*Escopo: fechar o drift de tipos entre `src/integrations/supabase/types.ts` e o banco novo, sem alterar regra, banco, UI ou Vercel.*

### Status — ✅ **concluída operacionalmente** (regeneração completa via CLI pendente)
Como o ambiente **não tem Docker/podman**, o `supabase gen types` não pôde rodar. O drift **principal** foi fechado **manualmente e de forma fiel** ao schema real ([schema_atual.sql](schema_atual.sql)); a regeneração completa via CLI fica documentada e pendente.

### O que foi feito
- **`types.ts` atualizado manualmente** com base no schema real:
  - Adicionada a tabela **`concremrh_configuracoes_kits`** (incluindo `max_faixas`).
  - Adicionadas as **7 colunas extras** em `concremrh_formulas_calculo`: `peso_faturamento`, `peso_itens_nc`, `peso_tratamento_nc`, `peso_hora_maquina`, `peso_operacao_segura`, `peso_limpeza`, `multiplicador_kits`.
  - Adicionados **`senha_hash`** e **`secoes`** em `concremrh_usuarios`.
  - Cabeçalho do `types.ts` documenta o **comando de regeneração** (para quando houver Docker).
- **`useFormulasCalculo.ts` revisado** — removido o **patch provisório da Etapa 1**: os 6 pesos extras + `multiplicador_kits`, antes opcionais (contorno pela ausência no `types.ts`), agora são `number | null` obrigatórios, alinhados ao `types.ts`. A nulabilidade foi mantida por ser fiel ao schema (colunas nullable).
- `typecheck` (0 erros), `test` (32/32) e `build` (OK) passando.

### Pendências (para a regeneração completa via CLI, com Docker/podman)
- **RPCs no bloco `Functions`** do `types.ts` ainda não incluídas (`concremrh_verify_login`, `concremrh_create_user`, `concremrh_update_user_password`). Não bloqueiam: hoje o app chama algumas via `(supabase as any).rpc(...)`.
- Regeneração completa também traria `Relationships`/`Functions` 100% e permitiria remover estas edições manuais.
- Comando: `npx supabase gen types typescript --project-id ewfebwljhmcvuopopqpb > src/integrations/supabase/types.ts` (requer Docker).

---

## 1-D. Relatório de conclusão da Etapa 4 (2026-07-07)

*Escopo: auditar schema/migrations e preparar a proposta de migrations para o novo projeto Supabase, sem alterar banco, migrations, regra ou UI. Relatório completo em [MIGRATION_AUDIT_V2.md](MIGRATION_AUDIT_V2.md).*

### Status da Etapa 4 — ✅ concluída
| Item | Resultado |
|------|-----------|
| Auditoria de schema/migrations | ✅ concluída |
| Documento de auditoria | ✅ criado — [MIGRATION_AUDIT_V2.md](MIGRATION_AUDIT_V2.md) |
| Tabelas `concremrh_` mapeadas (usadas pelo app) | ✅ **29** |
| Tabelas `concremrh_` **sem** migration | ⚠️ **28 de 29** |
| Única com migration | `concremrh_configuracoes_kits` — **incompleta** (falta `max_faixas`) |
| Origem do schema | ⚠️ criado **majoritariamente fora do versionamento** (dashboard/Lovable) |
| `typecheck` / `build` / `test` | ✅ Todos passando (nenhum código alterado) |

### Achados principais
- **`types.ts` defasado** em relação ao banco real (múltiplas tabelas).
- **`concremrh_formulas_calculo`** tem colunas reais ausentes no `types.ts` (`peso_faturamento`, `peso_itens_nc`, `peso_tratamento_nc`, `peso_hora_maquina`, `peso_operacao_segura`, `peso_limpeza`, `multiplicador_kits`).
- **`concremrh_configuracoes_kits`** ausente do `types.ts` e com **`max_faixas`** fora da migration.
- **`concremrh_usuarios`** tem campos usados pelo app (**`secoes`** e a coluna de **senha/hash**) não refletidos corretamente no `types.ts`.
- **RPCs críticas fora do `types.ts`:** `concremrh_verify_login`, `concremrh_create_user`, `concremrh_update_user_password`.
- **`update_funcionario_setor_ids`** e **`get_all_funcionario_setor_ids`** também precisam ser preservadas.
- **RLS, triggers, enums, helpers e policies** precisam ser recriados no novo projeto (enums `app_role`/`user_perfil`; helpers `has_role`/`has_app_permission`; trigger `update_updated_at_column`).
- **Risco de inconsistência em `funcionario_setores`:** o código cita o nome **singular** (inexistente no banco); o banco real usa **`concremrh_funcionarios_setores` (plural)**, vazio, e o vínculo real parece estar em **`setor_ids` + RPCs**.

### Impacto da migração para o novo Supabase
- Antes de criar telas novas ou mudar regras, é necessário **obter um dump autoritativo** do banco atual.
- As **migrations antigas do repositório não são suficientes** para recriar o banco no novo projeto.
- O **novo Supabase deve nascer a partir de migrations completas e versionadas**.
- **Não alterar o `.env`** para o novo projeto até o schema estar validado.

### Próximo passo
1. Obter **dump completo/autoritativo** do banco atual (credenciais adequadas).
2. **Regenerar `types.ts`** a partir do banco real.
3. Criar as **migrations `0001`–`0010`** (ver §8 do [MIGRATION_AUDIT_V2.md](MIGRATION_AUDIT_V2.md)) para recriar o schema no novo Supabase.
4. Aplicar as migrations primeiro em **ambiente novo/staging**.
5. **Validar login, permissões, premiações, relatórios e cadastros** antes de trocar a Vercel para o novo projeto.

---

## 1. Diagnóstico do estado atual (executado em 2026-07-07)

### 1.1 Build de produção — ✅ **PASSA**
```
npm run build  →  ✓ built in ~10s
```
- 3.085 módulos transformados, `dist/` gerado com sucesso.
- **Avisos (não bloqueantes):**
  - `Browserslist: caniuse-lite is 13 months old` → rodar `npx update-browserslist-db@latest`.
  - Chunk principal **`index.js` = 2.75 MB** (gzip 811 kB) e `background-hub.png` = 3 MB. Sem code-splitting → carga inicial pesada.

### 1.2 ESLint — ⚠️ **109 problemas (70 erros, 39 avisos)**
`npm run lint` retorna exit 1. Natureza dos problemas (nenhum bloqueia o build atual):
| Tipo | Qtd aprox. | Observação |
|------|-----------|------------|
| `@typescript-eslint/no-explicit-any` | ~65 erros | Uso disseminado de `any` em hooks e páginas |
| `react-hooks/exhaustive-deps` | ~39 avisos | Dependências faltando em `useEffect` (risco de dados desatualizados) |
| `@typescript-eslint/no-require-imports` | 1 erro | `require()` em [tailwind.config.ts:103](tailwind.config.ts#L103) |

### 1.3 TypeScript (`tsc --noEmit`) — ❌ **FALHA (exit 2) — 2 erros reais**
> O build usa esbuild (transpila **sem** checagem de tipos), por isso esses erros passam despercebidos. São dívidas reais.

1. **Schema drift no motor de cálculo** — [src/hooks/useFormulasCalculo.ts:49](src/hooks/useFormulasCalculo.ts#L49)
   `error TS2345` — a interface `FormulaCalculo` exige 6 pesos (`peso_faturamento`, `peso_itens_nc`, `peso_tratamento_nc`, `peso_hora_maquina`, `peso_operacao_segura`, `peso_limpeza`) que **não existem** no tipo da linha do banco em [types.ts](src/integrations/supabase/types.ts). O motor de premiação ([GerarPremiacoes.tsx](src/pages/GerarPremiacoes.tsx)) **lê esses campos** — ou seja, o tipo gerado do banco está **desatualizado** em relação ao schema real (ou os campos vêm com fallback). **Ponto crítico para a reforma do motor.**

2. **Bug latente de runtime** — [src/pages/DSS.tsx:198](src/pages/DSS.tsx#L198)
   `error TS2552: Cannot find name 'format'` — a função `format` do `date-fns` é usada no seletor de data mas **não foi importada**. Quando o popover de data do formulário DSS renderiza, ocorre `ReferenceError`. O build não detecta; o usuário sim.

### 1.4 Resumo executivo do diagnóstico
| Item | Resultado |
|------|-----------|
| Build (`npm run build`) | ✅ Passa |
| Lint (`npm run lint`) | ⚠️ 70 erros / 39 avisos (não bloqueiam build) |
| Typecheck (`tsc --noEmit`) | ❌ 2 erros reais (1 schema drift, 1 bug de runtime) |
| Testes automatizados | ❌ Inexistentes |
| Type-check no pipeline | ❌ Não existe script/CI de `tsc` |

**Conclusão:** o sistema é reaproveitável e compila, mas opera sem redes de segurança (sem testes, sem type-check no pipeline) e carrega dívidas que precisam ser tratadas **antes** de mexer no motor de cálculo.

---

## 2. Princípios e guard-rails da Reforma V2

1. **Não quebrar o que funciona.** Toda mudança estrutural entra atrás de uma rede de segurança (testes de caracterização + type-check verde).
2. **Regra de negócio é intocável até ter teste.** O motor de premiação só será refatorado *depois* de congelado por testes que reproduzem o resultado atual.
3. **Banco por último e com migração reversível.** Nenhuma alteração de schema/RLS antes das etapas de dados; sempre via migração versionada.
4. **Refatorar em fatias verticais pequenas e reversíveis.** Nada de "big bang".
5. **Cada etapa termina com:** build ✅, `tsc` ✅, lint sem novos erros, testes ✅.

---

## 3. Plano por etapas

### Etapa 0 — Diagnóstico e documentação ✅ (esta etapa, concluída)
- [x] Executar build, lint e typecheck; registrar resultados (§1).
- [x] Produzir [SDD.md](SDD.md) (desenho atual do sistema).
- [x] Produzir este `PLANO_REFORMA_V2.md`.
- **Entregável:** diagnóstico + plano. **Sem alteração de código.**

---

### Etapa 1 — Rede de segurança e higienização de tooling — ✅ **CONCLUÍDA (2026-07-07)**
*Objetivo: tornar o pipeline capaz de detectar regressões antes de qualquer refatoração. Ver relatório completo em §1-A.*
- [x] Adicionar script `typecheck` (`tsc --noEmit -p tsconfig.app.json`) ao `package.json`. — **passando (0 erros)**
- [x] Introduzir framework de testes (**Vitest** — integra nativamente com Vite) + `@testing-library/react`. — **configurado + teste de sanidade passando**
- [ ] Configurar CI (GitHub Actions/Vercel) rodando `build + typecheck + lint + test` em cada push. — *pendente (fora do escopo executado; próximo item de tooling)*
- [x] Corrigir os **2 erros de `tsc`** de forma cirúrgica (sem mudar lógica):
  - [x] Import faltante de `format` em [DSS.tsx](src/pages/DSS.tsx) — **bug real corrigido**.
  - [x] Alinhar `FormulaCalculo` ao schema real — **ajuste type-only** (5 pesos → `number | null`; 6 extras → opcionais). Sem mudar cálculo.
- [x] `npx update-browserslist-db@latest`. — feito via atualização direta do `caniuse-lite` (o utilitário tentava invocar `bun`, ausente no ambiente).
- **Critério de saída:** `build ✅`, `typecheck ✅ (0 erros)`, testes ✅. **Nenhuma regra de negócio alterada.** — *atingido; resta apenas ativar o CI.*

---

### Etapa 2 — Congelar o motor de premiação com testes de caracterização — ✅ **CONCLUÍDA (2026-07-07)**
*Objetivo: capturar o comportamento atual do cálculo como "verdade" antes de tocá-lo. Ver relatório completo em §1-B.*
- [x] Levantar cenários reais (produção normal, supervisor/encarregado, kits 100%/50%, faltas/advertências, sem eventos → notas 1.0). — **16 cenários cobertos**
- [x] Escrever testes que reproduzam, para entradas fixas, os `bonus_possivel`/`bonus_alcancado`/notas atuais exatos. — **32 testes passando**
- [x] **Não** corrigir eventuais "esquisitices" ainda — o objetivo é *documentar o comportamento vigente*, mesmo que imperfeito. — **achados congelados, não corrigidos** (ver §1-B)
- **Critério de saída:** suíte cobrindo os caminhos do §8 do SDD, toda verde contra o código atual. — *atingido*.

---

### Etapa 3 — Extrair o motor de cálculo para um módulo puro e testável — ✅ **CONCLUÍDA (2026-07-07)**
*Objetivo: separar regra de negócio da UI, sem alterar resultados. Ver relatório completo em §1-C.*
- [x] Mover a lógica de [GerarPremiacoes.tsx](src/pages/GerarPremiacoes.tsx) (funções `calcularComissao`, `calcularNotaFaltas`, cálculo de nota geral, bônus) para `src/domain/premiacao/` como funções puras. — **componente passou a importar do módulo**
- [x] A página passa a **orquestrar** (buscar dados + chamar o domínio + salvar), sem lógica de cálculo embutida. — **atingido** (exceto `calcularMediaIndicador`, mantido inline por divergência com `null`)
- [x] Garantir que os testes da Etapa 2 continuam **idênticos** (refator sem mudança de comportamento). — **32 testes verdes**
- [x] Extrair regras hoje acopladas a strings (`startsWith('KIT')`, regex de `%`) para funções nomeadas isoladas — **mantendo o comportamento**, apenas isolando para reforma futura. — **`isProducaoBase`/`isKitsBase`/`extractKitsMultiplier`**
- **Critério de saída:** UI e domínio separados; testes verdes; zero mudança de resultado. — *atingido*.

---

### Etapa 4 / 7 — Consolidação de tipos e camada de dados
*Objetivo: eliminar `any` e unificar acesso a dados.*
- [~] Regenerar/validar `types.ts` contra o schema real do Supabase. — **drift principal fechado manualmente na Etapa 7 (ver §1-F); regeneração completa via CLI pendente (Docker).**
- [ ] Substituir `any` por tipos concretos, começando pelos hooks do domínio de premiação.
- [ ] Padronizar hooks sobre **React Query** (já é dependência) para cache/refetch consistentes.
- [ ] Zerar os avisos `exhaustive-deps` (risco real de dados desatualizados no cálculo).
- **Critério de saída:** lint sem erros de `no-explicit-any` nos módulos de premiação; typecheck verde.

---

### Etapa 5 / 8A — Segurança (autenticação e autorização)
*Objetivo: endurecer o modelo hoje frágil (ver §11 do SDD). Ainda sem mudar telas.*
- [x] **Etapa 8A — Auditoria de segurança concluída (2026-07-08).** Relatório em [SECURITY_AUDIT_V2.md](SECURITY_AUDIT_V2.md). Achados: 2 críticos (RPCs de gestão de usuário sem authz; RLS `allow_all` para anon em 27 tabelas), 4 médios (auth client-side forjável, brute-force de login, escrita anon dirigida, RLS de `usuarios` inócua sob auth custom), 4 baixos. Proposta de correção em 6 fases (Fase 0 = decidir modelo de auth). **Nada alterado.**
- [x] **Etapa 8B — Plano de endurecimento proposto (2026-07-08).** [SECURITY_HARDENING_PLAN_V2.md](SECURITY_HARDENING_PLAN_V2.md) + migrations **propostas** (não aplicadas) em [supabase/security-hardening-proposals/](supabase/security-hardening-proposals/). Destino recomendado: **Supabase Auth**; interim Fase 1 fecha o C1 via **re-autenticação de admin** nas RPCs (sem quebrar o app anon). Inclui comparação custom×Supabase Auth, impacto frontend/banco, rollback e plano de testes. **Nada aplicado.**
- [~] **Etapa 8C — Fase 1 (branch `security/phase1-user-rpcs`, 2026-07-08).**
  - **Frontend adaptado** (feito): [useUsuarios.ts](src/hooks/useUsuarios.ts) envia `p_admin_email`/`p_admin_password` para `concremrh_create_user` e `concremrh_update_user_password`; [Usuarios.tsx](src/pages/cadastros/Usuarios.tsx) pede a **senha do admin logado** (via `profile.email`) antes de criar usuário e de resetar senha, com toast amigável para "Não autorizado" e limpeza do campo. `typecheck/test/build` verdes.
  - **SQL da Fase 1 — PENDENTE de aplicação** ([0001_phase1_harden_user_rpcs.sql](supabase/security-hardening-proposals/0001_phase1_harden_user_rpcs.sql)): não aplicado por mim (senha do banco foi rotacionada). Aplicar no Supabase novo via **SQL Editor** (dashboard) ou connection string. **Frontend + SQL devem ir juntos** — enquanto o SQL não estiver aplicado, criar/resetar usuário falha (assinatura antiga da RPC). Por isso está numa **branch**, não em `main`.
  - **RLS aberta (C2)** e **Supabase Auth (M1/M4)** seguem **pendentes** para as Fases 2/3. **Nada de RLS/policies/AuthContext foi tocado.**
- [ ] Revisar RLS: substituir políticas `USING (true)` por políticas efetivas. — *plano nas Fases 3-4 do audit*
- [ ] Avaliar migração da autenticação client-side (`localStorage`) para Supabase Auth ou tokens assinados. — *Fases 0/2 do audit*
- [ ] Cortar vetores críticos das RPCs de gestão de usuário (revoke/authz). — *Fase 1 do audit*
- [ ] Mover validações sensíveis (ex.: recálculo de premiação) para o servidor (Edge Function/RPC) — decisão a detalhar.
- **Critério de saída:** plano de segurança aprovado + RLS endurecido em ambiente de teste. **Migrações reversíveis.**

---

### Etapa 6 — Banco de dados: consolidação de schema — 🟡 **EM ANDAMENTO** (auditoria feita na Etapa 4)
*Objetivo: resolver a dupla nomenclatura e o legado órfão + recriar o schema `concremrh_` versionado no novo projeto.*
- [x] Confirmar que a aplicação usa **exclusivamente** tabelas `concremrh_*`; as `concrem_*` são **legado das migrações antigas, sem referência no app**. — **confirmado (Etapa 4)**
- [x] Auditar cobertura de migrations e drift de `types.ts`. — **feito, ver [MIGRATION_AUDIT_V2.md](MIGRATION_AUDIT_V2.md)**
- [x] Obter **dump autoritativo** do banco atual. — **feito via introspecção `pg` (pooler sa-east-1); gerado [schema_atual.sql](schema_atual.sql)**
- [x] Escrever as migrations `0001`–`0010` para recriar o schema no novo projeto. — **feito em [supabase/migrations-v2/](supabase/migrations-v2/) (29 tabelas, 38 FKs, 30 policies, 26 triggers, 5 RPCs, seed de config)**
- [ ] Regenerar `types.ts` a partir do banco real. — **bloqueado: `supabase gen types` exige Docker/podman (indisponível). Fazer em ambiente com container.**
- [x] Aplicar no **novo projeto**, migrar dados e validar em localhost. — **feito (ver §1-E): migrations 0001–0010 aplicadas, 1725 linhas migradas, login e telas validados apontando o local para o Supabase novo.**
- [ ] Apontar `.env`/Vercel de **produção** — **adiado para a ÚLTIMA etapa** (publicação em outra conta da Vercel). Localmente já aponta para o novo via `.env.local`.
- [ ] Alinhar `supabase/config.toml` (`project_id`) ao projeto ativo.
- [ ] Planejar depreciação/arquivamento das tabelas `concrem_*` órfãs — via migração, com backup.
- **Critério de saída:** schema `concremrh_` recriado por migrations versionadas no novo projeto, validado ponta a ponta. — **atingido em localhost.**

---

### Etapa 7 — Reforma das telas e UX
*Objetivo: modernizar UI e performance, já sobre base segura.*
- [ ] Code-splitting/lazy-loading de rotas (reduzir o chunk de 2.75 MB).
- [ ] Otimizar assets (`background-hub.png` de 3 MB).
- [ ] Padronizar componentes e estados de loading/erro.
- [ ] Refatorar telas grandes ([Funcionarios.tsx](src/pages/Funcionarios.tsx) tem ~520 linhas e muitos `any`).
- **Critério de saída:** telas refatoradas incrementalmente, cada uma com testes de fumaça.

---

### Etapa 8 — Reforma da regra de negócio do motor (V2 propriamente dita)
*Objetivo: só aqui alteramos comportamento — de forma deliberada, versionada e testada.*
- [ ] Com o motor já isolado (Etapa 3) e coberto por testes (Etapa 2), aplicar mudanças de regra desejadas.
- [ ] Cada mudança de regra atualiza os testes de forma explícita (o "antes/depois" fica documentado).
- [ ] Considerar versionamento das fórmulas/configs para não afetar competências passadas (padrão já existente em `concremrh_configuracoes_kits`).
- **Critério de saída:** V2 do motor com comportamento novo, auditável e testado.

---

### Etapa 9 — Publicação em produção (nova conta Vercel) — 🚩 **ÚLTIMA ETAPA**
*Objetivo: só aqui a produção passa a apontar para o novo Supabase. Deliberadamente por último — o projeto será publicado em **outra conta da Vercel**.*
- [ ] Configurar o projeto na **nova conta da Vercel** (import do repositório, build Vite).
- [ ] Definir as env vars de produção (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`) apontando para o projeto novo.
- [ ] **Redeploy** (as env do Vite entram no build → precisa rebuildar).
- [ ] Validar em produção: login, gerar premiação, relatórios, exportações.
- [ ] Manter o projeto/deploy antigo intacto por alguns dias como rollback.
- **Critério de saída:** produção rodando na nova conta Vercel contra o novo Supabase, validada ponta a ponta. **Não iniciar sem confirmação explícita.**

---

## 3-A. Reordenação de prioridades (2026-07-07)

Com a decisão de **migrar a aplicação para um novo projeto Supabase**, a ordem prática das próximas etapas muda:

1. **Prioridade imediata — Schema/migrations completas (adianta a Etapa 6):** capturar o schema real do projeto atual (incluindo colunas e estruturas `concremrh_` hoje **fora** das migrations versionadas — ver §1-C) e produzir um conjunto de migrations que **recrie o banco do zero** no novo projeto. Inclui regenerar o `types.ts` a partir do schema real.
2. Em seguida, **Etapa 4 (tipos/dados)** já sobre o `types.ts` regenerado.
3. **Etapa 5 (segurança/RLS)** sobre o novo projeto.
4. **Etapas visuais/UX (Etapa 7)** ficam **depois** da estabilização do schema.

> As Etapas 4-8 abaixo permanecem válidas; muda apenas a **ordem de ataque**: schema primeiro, visual por último.

---

## 4. Sequenciamento e dependências

```
Etapa 0 (feito)
  └─> Etapa 1 (rede de segurança / tooling)
        └─> Etapa 2 (testes de caracterização do motor)
              └─> Etapa 3 (extrair motor puro)
                    ├─> Etapa 4 (tipos / dados)
                    ├─> Etapa 5 (segurança)   ── podem correr em paralelo
                    └─> Etapa 6 (banco)
                          └─> Etapa 7 (telas)
                                └─> Etapa 8 (reforma da regra de negócio)
```
**Regra de ouro:** não avançar para a Etapa 8 (mudança de regra) sem as Etapas 1–3 concluídas.

---

## 5. Riscos e mitigação
| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Refatorar cálculo sem cobertura | Bônus incorretos em produção | Etapa 2 obrigatória antes da 3/8 |
| `types.ts` divergir do banco | Erros silenciosos de tipo | Regenerar tipos + typecheck no CI (Etapa 1/4) |
| RLS aberta (`USING (true)`) | Exposição de dados | Etapa 5 |
| Bug de runtime já presente (DSS `format`) | Tela quebra em uso | Corrigir na Etapa 1 |
| Big-bang refactor | Regressão ampla | Fatias verticais pequenas e reversíveis |

---

## 6. Próximo passo imediato
Iniciar a **Etapa 1**: adicionar script `typecheck`, configurar Vitest + CI e corrigir cirurgicamente os 2 erros de `tsc` (import do `format` em DSS e alinhamento de tipo de `FormulaCalculo`) — **sem tocar em regra de negócio, banco ou telas**. Isso estabelece a rede de segurança que habilita todas as etapas seguintes.
