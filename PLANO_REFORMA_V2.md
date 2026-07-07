# Plano de Reforma V2 — ConcremRH / Recompensa-Flow

**Versão:** 1.2 (Etapa 2 concluída — testes de caracterização do motor)
**Data:** 2026-07-07
**Base de referência:** [SDD.md](SDD.md)
**Princípio norteador:** *reaproveitar o sistema existente e reformar de forma estrutural e segura, sem quebrar regra de negócio nem dados em produção.*

> **Progresso:** Etapas 0 (diagnóstico), **1 (rede de segurança e tooling)** e **2 (testes de caracterização) concluídas**. Ver §1-A (Etapa 1) e §1-B (Etapa 2) para os relatórios de conclusão.

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

### Etapa 3 — Extrair o motor de cálculo para um módulo puro e testável
*Objetivo: separar regra de negócio da UI, sem alterar resultados.*
- [ ] Mover a lógica de [GerarPremiacoes.tsx](src/pages/GerarPremiacoes.tsx) (funções `calcularComissao`, `calcularNotaFaltas`, cálculo de nota geral, bônus) para `src/domain/premiacao/` como funções puras.
- [ ] A página passa a **orquestrar** (buscar dados + chamar o domínio + salvar), sem lógica de cálculo embutida.
- [ ] Garantir que os testes da Etapa 2 continuam **idênticos** (refator sem mudança de comportamento).
- [ ] Extrair regras hoje acopladas a strings (`startsWith('KIT')`, regex de `%`) para funções nomeadas isoladas — **mantendo o comportamento**, apenas isolando para reforma futura.
- **Critério de saída:** UI e domínio separados; testes verdes; zero mudança de resultado.

---

### Etapa 4 — Consolidação de tipos e camada de dados
*Objetivo: eliminar `any` e unificar acesso a dados.*
- [ ] Regenerar/validar `types.ts` contra o schema real do Supabase.
- [ ] Substituir `any` por tipos concretos, começando pelos hooks do domínio de premiação.
- [ ] Padronizar hooks sobre **React Query** (já é dependência) para cache/refetch consistentes.
- [ ] Zerar os avisos `exhaustive-deps` (risco real de dados desatualizados no cálculo).
- **Critério de saída:** lint sem erros de `no-explicit-any` nos módulos de premiação; typecheck verde.

---

### Etapa 5 — Segurança (autenticação e autorização)
*Objetivo: endurecer o modelo hoje frágil (ver §11 do SDD). Ainda sem mudar telas.*
- [ ] Revisar RLS: substituir políticas `USING (true)` por políticas efetivas.
- [ ] Avaliar migração da autenticação client-side (`localStorage`) para Supabase Auth ou tokens assinados.
- [ ] Mover validações sensíveis (ex.: recálculo de premiação) para o servidor (Edge Function/RPC) — decisão a detalhar.
- **Critério de saída:** plano de segurança aprovado + RLS endurecido em ambiente de teste. **Migrações reversíveis.**

---

### Etapa 6 — Banco de dados: consolidação de schema
*Objetivo: resolver a dupla nomenclatura e o legado órfão.*
- [ ] Confirmar (já verificado no código) que a aplicação usa **exclusivamente** tabelas `concremrh_*`; as `concrem_*` são **legado das migrações antigas, sem referência no app**.
- [ ] Alinhar `supabase/config.toml` (`project_id`) ao projeto ativo do `.env`.
- [ ] Planejar depreciação/arquivamento das tabelas `concrem_*` órfãs — via migração, com backup.
- **Critério de saída:** schema consolidado e documentado, sem tabelas fantasma referenciadas.

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
