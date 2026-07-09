# Fase 5A — Proteção de colunas sensíveis de `funcionarios` — Reforma V2

**Data:** 2026-07-09
**Natureza:** **proposta técnica** — nada aplicado (sem tocar banco/RLS/UI/hooks/Vercel). Scripts em [supabase/security-hardening-proposals/phase5a-funcionarios-columns/](supabase/security-hardening-proposals/phase5a-funcionarios-columns/).
**Base:** Fase 3 [SECURITY_RLS_PHASE3_PLAN_V2.md](SECURITY_RLS_PHASE3_PLAN_V2.md) (helpers `is_admin`/`has_secao`) · Fase 4 [SECURITY_PHASE4_RPC_REVOKE_PLAN_V2.md](SECURITY_PHASE4_RPC_REVOKE_PLAN_V2.md)

> **Objetivo:** fechar o resíduo do risco C2 — `salario` de `concremrh_funcionarios` é legível por **qualquer autenticado** (a RLS da Fase 3 é por linha, não por coluna). Restringir a leitura de colunas sensíveis **sem quebrar** as telas que dependem de funcionários.

---

## 0. Achado que redefine o escopo (LEIA PRIMEIRO)
A auditoria do frontend revelou dois pontos que corrigem a premissa inicial ("esconder CPF e salário"):

1. **`cpf` NÃO é um CPF real — é o "Código Funcionário".** A UI o rotula como "Código Funcionário"; ele é a **chave de junção** usada em: cálculo de premiação (`cod_funcionario`), import/export de Faltas e do cadastro. **Remover `cpf` quebraria premiação, Faltas e import/export.** → **Recomendação: MANTER `cpf`** na projeção operacional. (Se um dia entrar um CPF real como coluna nova, aí sim tratá-lo como sensível.)
2. **`salario` é o único campo financeiro sensível** e é lido por **apenas 2 telas** (módulo Cargos & Salários). `data_nascimento` e `telefone` existem na tabela mas **não são referenciados em nenhum lugar do frontend** → podem ser escondidos sem impacto.

**Alvo real da Fase 5A:** esconder **`salario`, `email`, `data_nascimento`, `telefone`** da leitura operacional/base, expondo `salario` e `email` por perfil via view guardada.

### Decisões de negócio (2026-07-09)
1. **Salário:** visível **apenas** para `admin` **ou** `has_secao('cargos_salarios')`. **RH não vê salário por padrão** — se um usuário de RH precisar, recebe a seção `cargos_salarios`.
2. **E-mail:** sai do acesso operacional/base. Visível **apenas** para `admin`, `rh` **ou** `cargos_salarios`. **SESMT e Produção não recebem e-mail** em views/resumos operacionais.
3. **Resumo operacional** não expõe: `salario`, `email`, `telefone`, `data_nascimento`.
4. **`cpf` mantido** no resumo (é o Código Funcionário, usado em import/export e identificação operacional).

---

## 1. Onde `funcionarios` é usado hoje
Ponto único de exposição: **`useFuncionarios` faz `select('*')`** ([src/hooks/useFuncionarios.ts:46-58](src/hooks/useFuncionarios.ts#L46-L58)) → todo consumidor recebe `salario`/`data_nascimento`/`telefone` mesmo sem usar.

| Arquivo | Como busca | Campos realmente usados | Precisa salário? | Categoria |
|---------|-----------|-------------------------|:---:|:---:|
| [useFuncionarios.ts](src/hooks/useFuncionarios.ts) | `select('*')` + joins | (retorna tudo) | — | fonte (super-busca) |
| [pages/Funcionarios.tsx](src/pages/Funcionarios.tsx) | `useFuncionarios` + `select("cpf")` p/ dedup import | `nome, cpf(código), valor_fixo, data_admissao, status, ativo`, relações; edita cpf/valor_fixo | **Não** | A (cpf/valor_fixo) |
| [pages/GerarPremiacoes.tsx](src/pages/GerarPremiacoes.tsx) | `useFuncionarios` | `id, ativo, *_id, categoria/setor/funcao/faixa.nome, faixa.valor, valor_fixo, setor_ids, cpf` (como cod_funcionario) | **Não** | C (cálculo) |
| [pages/DSS.tsx](src/pages/DSS.tsx) | `useFuncionarios` | `id, nome, ativo, local_dss_id, setor.nome, empresa.nome` | Não | B |
| [pages/EPI.tsx](src/pages/EPI.tsx) | `useFuncionarios` | `id, nome, status, setor/empresa/categoria.nome`; cpf só no filtro de busca | Não | B |
| [pages/FaltasAdvertencias.tsx](src/pages/FaltasAdvertencias.tsx) | `useFuncionarios` | `id, nome, ativo, status, setor/categoria.nome`; **cpf como chave de import/export** | Não | B (depende do cpf-chave) |
| [pages/cargos-salarios/Funcionarios.tsx](src/pages/cargos-salarios/Funcionarios.tsx) | `useFuncionarios` | `nome, status, funcao/setor/categoria.nome, email`, **`salario` renderizado**; cpf só busca | **SIM (render)** | A |
| [pages/cargos-salarios/Dashboard.tsx](src/pages/cargos-salarios/Dashboard.tsx) | `useFuncionarios` | `ativo, funcao_id`, **`salario` agregado** (média salarial) | **SIM (agregado)** | A |
| [pages/cadastros/Setores.tsx](src/pages/cadastros/Setores.tsx) | `useFuncionarios` | `id, nome, categoria.nome` (pickers) | Não | B |
| [hooks/useSetores.ts](src/hooks/useSetores.ts), [useHistoricoCargos.ts](src/hooks/useHistoricoCargos.ts), [useAvaliacoesDesempenho.ts](src/hooks/useAvaliacoesDesempenho.ts), [useCargos.ts](src/hooks/useCargos.ts) | joins diretos | só `id`/`nome` (ou `id`) | Não | B (seguros como estão) |

**Engine de premiação** ([src/domain/premiacao/calculoPremiacao.ts](src/domain/premiacao/calculoPremiacao.ts)): **não referencia `cpf` nem `salario`** — opera sobre `valorFixo`, `valorFaixa`, notas e pesos. Confirma que premiação **não** precisa de salário.

## 2. Quais campos cada tela realmente precisa
- **Precisam de `salario`:** só `cargos-salarios/Funcionarios.tsx` e `cargos-salarios/Dashboard.tsx`.
- **Precisam de `cpf` (código):** `Funcionarios.tsx` (ver/editar), `GerarPremiacoes.tsx` (cod_funcionario), `FaltasAdvertencias.tsx` (import/export). EPI e cargos/Funcionarios usam cpf só na busca (descartável).
- **Precisam só de básicos** (`id, nome, setor, funcao, categoria, status, ativo`): DSS, EPI, Faltas, Setores, e os 4 hooks de join.
- **Nunca usados no frontend:** `data_nascimento`, `telefone`.

## 3. Proposta de VIEW
Duas views (script [0001_phase5a_...sql](supabase/security-hardening-proposals/phase5a-funcionarios-columns/0001_phase5a_funcionarios_column_security.sql)):

- **`concremrh_funcionarios_sensivel`** (guardada, `security_invoker=false`): expõe os campos protegidos **por coluna**, com gate diferente por perfil (via `CASE`, senão `NULL`):
  - `salario` → `is_admin() OR has_secao('cargos_salarios')`
  - `email`   → `is_admin() OR has_secao('rh') OR has_secao('cargos_salarios')`
  É o canal do módulo Cargos & Salários (salário) e de quem pode ver e-mail. SESMT/Produção recebem `NULL` em ambos.
- **`concremrh_funcionarios_resumo`** (`security_invoker=true`): projeção segura **sem** `salario`/`email`/`telefone`/`data_nascimento` (mantém `cpf`=código) para telas operacionais. Conveniência — a RLS da Fase 3 continua valendo através dela.

> ⚠️ **View sozinha não é enforcement.** Enquanto a tabela base for legível pelo mesmo papel, qualquer um consultaria `salario` direto via PostgREST. A proteção real é o **grant a nível de coluna** (§4).

## 4. Proposta de RLS/grants (enforcement)
Papéis PostgREST são `anon`/`authenticated`/`service_role`; **todos os usuários do app são `authenticated`** — então grant de coluna **não** diferencia rh de sesmt. A estratégia:

1. **Coluna (tabela base):** `revoke select on concremrh_funcionarios from authenticated` e reconceder `select` em **todas as colunas exceto** `salario, email, data_nascimento, telefone`. Isso esconde essas 4 de **todo** autenticado (inclusive rh/admin) na tabela base. `INSERT/UPDATE/DELETE` não são tocados → escrita segue governada pela RLS da Fase 3 (`has_secao('rh')`).
2. **Salário/e-mail por perfil:** quem precisa lê pela **view guardada** `concremrh_funcionarios_sensivel`, com gate **por coluna**: salário → `admin`/`cargos_salarios`; e-mail → `admin`/`rh`/`cargos_salarios`. Como a diferenciação por perfil não é possível por grant (papel único `authenticated`), a view guardada é o mecanismo correto.
3. **Por perfil:**
   - **admin:** vê salário e e-mail (view guardada) + tudo o mais.
   - **RH:** opera a tabela (escrita `has_secao('rh')`); vê **e-mail** pela view guardada; **NÃO vê salário por padrão** (decisão §Decisões-1) — se precisar, recebe a seção `cargos_salarios`.
   - **cargos_salarios:** vê salário e e-mail.
   - **SESMT/Produção:** só básicos (resumo); salário e e-mail retornam `NULL` na view guardada.

## 5. Decisão sobre `email` (DECIDIDA)
`email` **sai do acesso operacional/base** — removido do grant de coluna da tabela base e **não** exposto no resumo. Passa a ser visível só via view guardada, para `admin`/`rh`/`cargos_salarios`. SESMT/Produção não recebem e-mail. (Auditoria: `email` é lido apenas por `cargos-salarios/Funcionarios.tsx`; o CRUD principal `Funcionarios.tsx` não o exibe → seguro remover do base.)

## 6. Scripts propostos
| Arquivo | Papel |
|---------|-------|
| [0001_phase5a_funcionarios_column_security.sql](supabase/security-hardening-proposals/phase5a-funcionarios-columns/0001_phase5a_funcionarios_column_security.sql) | grants por coluna + 2 views |
| [0001_..._rollback.sql](supabase/security-hardening-proposals/phase5a-funcionarios-columns/0001_phase5a_funcionarios_column_security_rollback.sql) | restaura select de tabela + dropa views |

Plano de migração reversível: aplicar em staging → validar telas (§8) → produção. Rollback em 1 passo (re-grant + drop views). Reversível sem perda de dados (nenhuma coluna é removida).

## 7. Impacto nos hooks (plano — Fase 5B, NÃO implementar agora)
1. **`useFuncionarios`**: trocar `select('*')` por lista explícita de colunas **sem** `salario`/`data_nascimento`/`telefone` (idealmente apontar para a view `concremrh_funcionarios_resumo`). Isso é obrigatório: com o grant de coluna, um `select('*')` pode falhar/retornar erro de permissão na coluna `salario`. O tipo `Funcionario` mantém `salario?` opcional (fica indefinido nas telas operacionais).
2. **Novo hook `useFuncionariosSensivel`** (ou similar): consulta `concremrh_funcionarios_sensivel` (salário + e-mail gated por coluna). Consumido por `cargos-salarios/Funcionarios.tsx` (render salário+e-mail) e `cargos-salarios/Dashboard.tsx` (média salarial). Faz o *merge* sobre a lista básica por `id`. Para perfis sem permissão, `salario`/`email` vêm `NULL`.
3. **Demais telas/hooks**: sem mudança (nenhuma lê salário; e-mail só era lido pelo módulo Cargos & Salários). `GerarPremiacoes`/`Faltas` seguem usando `cpf` (mantido).
4. **`get_all_funcionario_setor_ids`** (RPC, Fase 4): inalterado; continua servindo `setor_ids` ao authenticated.

## 8. Checklist de validação das telas (após aplicar em staging)
- [ ] **Funcionários** (admin/RH): lista carrega; criar/editar (código/valor_fixo/datas/status) OK; import/export por código OK. Salário **não** aparece (esperado — não é tela de salário).
- [ ] **DSS** (SESMT): seleção de funcionário por nome/setor OK.
- [ ] **EPI** (SESMT): lista/busca OK (busca por código ainda funciona; se removida, sem impacto).
- [ ] **Produção / Indicadores**: não dependem de funcionários — smoke test.
- [ ] **Gerar premiação** (admin/RH): participantes carregam, `cod_funcionario`/`valor_fixo`/faixa presentes, **cálculo confere** (engine não usa salário).
- [ ] **Relatório/exportações de premiação**: geram normalmente.
- [ ] **Cargos & Salários → Funcionários**: **salário e e-mail voltam a aparecer** (via `concremrh_funcionarios_sensivel`) para admin/cargos_salarios.
- [ ] **Cargos & Salários → Dashboard**: **média salarial** calcula (via view guardada).
- [ ] **Teste negativo (REST) — SESMT/Produção autenticado:** `concremrh_funcionarios?select=salario` e `?select=email` → **erro de permissão** de coluna; `concremrh_funcionarios_sensivel` → `salario`=**null** e `email`=**null**. `select=*` na tabela base **não** retorna salario/email.
- [ ] **Teste RH autenticado:** `concremrh_funcionarios_sensivel` → `email` **preenchido**, `salario`=**null** (RH sem seção cargos_salarios).
- [ ] **Teste admin/cargos_salarios:** `concremrh_funcionarios_sensivel` → `salario` **e** `email` preenchidos.
- [ ] **anon**: continua 0 linhas em tudo (Fase 3).

## 9. Riscos de quebra
- **`select('*')` no hook**: com grant de coluna, `*` pode retornar erro de permissão em `salario`. **Mitigação:** narrar o select (Fase 5B) **antes** de aplicar o SQL, ou aplicar SQL e ajustar o hook na mesma janela. Recomendo: implementar 5B (hooks) e aplicar o SQL juntos em staging.
- **RH não vê salário (decidido, esperado):** RH que precise de salário deve receber a seção `cargos_salarios`. Se a auditoria de campo revelar um fluxo de RH que dependa de salário (não encontrado), tratar concedendo a seção — **não** afrouxar a view.
- **PostgREST schema cache**: após criar views, pode precisar `NOTIFY pgrst, 'reload schema';`.
- **Escrita de salário**: fora de escopo (a Fase 5A trata leitura). A escrita segue pela RLS `has_secao('rh')` da Fase 3; se o módulo Cargos precisar gravar salário e seus usuários não tiverem `rh`, tratar em fase posterior.

## 10. O que NÃO fazer nesta fase
Não aplicar SQL, não alterar banco/RLS/UI/hooks/Vercel/regra de premiação. Não versionar `.env`/`service_role`/dumps/PII.

## 11. Próximo passo recomendado
1. **Fase 5B:** implementar o ajuste dos hooks (§7 — narrar `useFuncionarios`, criar `useFuncionariosSensivel`) e aplicar o SQL **juntos** em staging; rodar o checklist §8. (As decisões de salário/e-mail já estão fechadas — ver §Decisões.)
2. Depois: Etapa 9 (Vercel).
