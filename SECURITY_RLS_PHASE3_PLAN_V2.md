# Plano de Endurecimento de RLS — Fase 3 — Reforma V2

**Data:** 2026-07-08
**Natureza:** **proposta técnica** — nada aplicado (sem tocar banco/RLS/AuthContext/hooks/UI/Vercel/regra). Scripts em [supabase/security-hardening-proposals/phase3-rls/](supabase/security-hardening-proposals/phase3-rls/).
**Base:** [SECURITY_AUDIT_V2.md](SECURITY_AUDIT_V2.md) · [SECURITY_HARDENING_PLAN_V2.md](SECURITY_HARDENING_PLAN_V2.md) · [SECURITY_AUTH_MIGRATION_PLAN_V2.md](SECURITY_AUTH_MIGRATION_PLAN_V2.md) · [0009_rls_and_triggers.sql](supabase/migrations-v2/0009_rls_and_triggers.sql)

> **Objetivo:** fechar o risco **C2** — substituir as 27 policies `allow_all` (para `public`/anon) por policies **por papel/seção**, começando pelas tabelas sensíveis, em lotes reversíveis.

---

## 1. ⚠️ Dependência da Fase 2 (bloqueante)
Estas policies visam o papel **`authenticated`** e decidem acesso por `auth.uid()` → `get_my_perfil()`/`has_secao()`. **Só funcionam com o app rodando em Supabase Auth** (Fase 2 validada, `VITE_AUTH_MODE=supabase`, usuários vinculados via `auth_user_id`, `get_my_profile` OK).
**Se aplicadas com o app em modo `custom` (anon), TODAS as telas quebram** (anon perde acesso). Por isso: **não aplicar antes da Fase 2 100% validada.**

## 2. Estratégia
1. **Bloquear anon** em tudo (policies `to authenticated`; `anon` fica sem policy ⇒ negado). Este é o maior ganho: a anon key do bundle deixa de ler/escrever dados.
2. **Escrita por papel/seção** — espelha o `canAccess` do frontend via `has_secao('<módulo>')` (admin sempre passa).
3. **Leitura ampla onde os módulos cruzam** (dropdowns, nomes, cálculo de premiação) e **restrita** onde é realmente sensível (usuarios→admin, faltas→rh, avaliacoes/historico→cargos_salarios, resultados→premiacoes).
4. **Lotes reversíveis**, aplicados e validados um a um.

### Modelo de papéis/seções (do AuthContext)
- **admin**: acesso total (`is_admin()` embutido em `has_secao`).
- **rh**: possui todas as seções (`ALL_SECTIONS`) → lê/escreve RH, premiações, cadastros, cargos_salarios.
- **sesmt**: seção `sesmt` → escreve DSS/EPI; lê o necessário.
- **producao**: seção `producao` → escreve produção/indicadores; lê o necessário.
- **custom**: conforme `secoes` (mesmo mecanismo `has_secao`).

## 3. Helpers (lote 0001)
`is_admin()`, `has_perfil(variadic)`, `current_secoes()`, `has_secao(secao)` (= admin OR seção presente), e aliases `can_read_module`/`can_write_module`. Todos `stable security definer set search_path = public`, sobre `auth.uid()`.

## 4. Grupos de tabelas e policies propostas

### Grupo A — Sensíveis (lote 0002)
| Tabela | Leitura | Escrita | Risco de tela |
|--------|---------|---------|---------------|
| funcionarios | authenticated (todos) | `has_secao('rh')` | baixo (leitura ampla; escrita na tela de RH) |
| resultados_premiacao | `has_secao('premiacoes')` | `has_secao('premiacoes')` | baixo (Relatório/Dashboard são rota admin/rh) |
| faltas_advertencias | `has_secao('rh')` | `has_secao('rh')` | baixo (rota admin/rh) |
| avaliacoes_desempenho | `has_secao('cargos_salarios')` | idem | baixo (vazia; módulo C&S) |
| historico_cargos | `has_secao('cargos_salarios')` | idem | baixo (vazia) |
| usuarios | `is_admin()` | `is_admin()` | baixo (tela Usuários é admin; login via RPC ignora RLS) |

> [ACHADO] `funcionarios` tem salário/CPF e a leitura é por **linha** (não coluna): qualquer autenticado consegue lê-los via REST. Restringir **colunas** (esconder salário de sesmt/producao) exige VIEW ou grants de coluna — **passo futuro**, fora deste lote.

### Grupo B — Operacionais (lote 0003)
| Tabela | Leitura | Escrita |
|--------|---------|---------|
| dss, epi | authenticated | `has_secao('sesmt')` |
| producao_setor, indicadores_gerais, indicadores_setor | authenticated | `has_secao('producao')` |

Garante "SESMT não altera produção" e "Produção não altera DSS/EPI"; leitura ampla porque o cálculo (rota rh/admin) e as telas cruzam esses dados.

### Grupo C — Cadastros/Config (lote 0004)
`setores, empresas, funcoes, categorias, faixas, base_premiacao, formulas_calculo, configuracoes_kits, tipos_indicadores, tipos_indicadores_gerais, locais_dss` → **leitura authenticated** (dropdowns/nomes em toda a app); **escrita `has_secao('cadastros')`** (rh/admin). `hr_applications` → leitura authenticated; **escrita `is_admin()`**.

### Grupo D — Cargos & Salários (lote 0004)
`cargos, plano_carreira, estrutura_hierarquica` → leitura/escrita `has_secao('cargos_salarios')`.
> Incluído no lote 0004 (o escopo pediu 5 arquivos; Grupo D acompanha a config por afinidade e baixo risco — tabelas vazias).

### Grupo E — Permissões (lote 0005)
`user_roles, user_application_permissions` → leitura/escrita `is_admin()`. (Vazias; o acesso efetivo do app é perfil+secoes em `usuarios`.)

## 5. Scripts propostos e rollbacks
| Lote | Script | Rollback |
|------|--------|----------|
| Helpers | `0001_phase3_helpers.sql` | `0001_phase3_helpers_rollback.sql` |
| Grupo A | `0002_phase3_sensitive_tables.sql` | `0002_..._rollback.sql` |
| Grupo B | `0003_phase3_operational_tables.sql` | `0003_..._rollback.sql` |
| Grupos C+D | `0004_phase3_config_tables.sql` | `0004_..._rollback.sql` |
| Grupo E | `0005_phase3_user_roles_permissions.sql` | `0005_..._rollback.sql` |

Cada rollback **restaura o `allow_all` (to public)** daquele grupo (⚠️ reabre o acesso anon). Rollback total: 0005→0002, depois `0001_helpers_rollback` por último.

## 6. Testes SQL de permissão (por lote)
Simular um usuário autenticado no SQL Editor e verificar allow/deny:
```sql
begin;
  set local role authenticated;
  set local request.jwt.claims = '{"sub":"<AUTH_USER_ID>","role":"authenticated"}';
  -- leitura esperada OK:
  select count(*) from public.concremrh_funcionarios;
  -- escrita fora do papel deve FALHAR (ex.: SESMT tentando produção):
  insert into public.concremrh_producao_setor (setor_id) values (null);
rollback;
```
Teste crítico anon (sem `set role`/JWT): toda tabela deve retornar **0 linhas**/negar.

## 7. Checklist de validação (staging, modo supabase)
- [ ] Login **admin** / **RH** / **SESMT** / **produção** entram.
- [ ] Cada tela principal carrega para o papel correspondente (Funcionários, DSS, EPI, Produção, Indicadores, Gerar/Relatório de premiação, Cargos).
- [ ] **Chamada anon via REST** (só com a anon key, sem sessão) é **bloqueada** (0 linhas) em todas as tabelas.
- [ ] Usuário **produção** NÃO acessa/edita cadastros restritos (escrita negada).
- [ ] Usuário **SESMT** NÃO altera produção (write em producao_setor negado).
- [ ] Usuário **RH** acessa premiações (lê/gera/relata).
- [ ] **admin** acessa tudo.
- [ ] Tela de **Usuários** continua com reauth de admin (Fase 1) e leitura só admin.

## 8. Riscos de quebra de tela
- **Alto se aplicado antes da Fase 2** (app anon perde acesso) — mitigação: **não aplicar** antes da Fase 2 validada.
- **`secoes` mal preenchidas** → usuário não lê o módulo (tela vazia). Mitigação: conferir `get_my_profile()` retornando as seções corretas (Fase 2) antes.
- **Leitura restrita nos sensíveis** (resultados/faltas/avaliacoes/historico/usuarios): se algum fluxo inesperado ler essas tabelas com papel sem a seção, virá vazio. Mitigação: rodar lote a lote com o checklist; começar por 0002 e observar.
- **Coluna-nível** (salário/CPF em funcionarios) permanece legível por autenticado — tratar depois com VIEW/coluna-grant.

## 9. O que depende da validação da Fase 2
Tudo. Aplicar a Fase 3 exige: `VITE_AUTH_MODE=supabase` validado, usuários com `auth_user_id`, `get_my_perfil`/`get_my_profile`/`current_secoes` retornando corretamente. Sem isso, **não aplicar**.

## 10. O que NÃO fazer nesta etapa
Não aplicar SQL, não alterar banco/RLS/AuthContext/hooks/UI/Vercel/regra, não versionar `service_role`/dumps/PII.

## 11. Próximo passo
Validar a Fase 2 em staging (runbook [AUTH_PHASE2_RUNBOOK_V2.md](AUTH_PHASE2_RUNBOOK_V2.md)); depois aplicar os lotes 0001→0005 **um a um** em staging, rodando o checklist §7 entre cada. Só então produção. Por fim, publicação na **Vercel** (Etapa 9).
