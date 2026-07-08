# Auditoria de Segurança — Reforma V2 (Etapa 8A)

**Data:** 2026-07-08
**Escopo:** RLS, RPCs, autenticação client-side, permissões e exposição de dados. **Somente auditoria** — nada de banco/RLS/policies/auth/UI/regra foi alterado.
**Fontes:** [supabase/migrations-v2/0008_functions_rpc.sql](supabase/migrations-v2/0008_functions_rpc.sql) · [0009_rls_and_triggers.sql](supabase/migrations-v2/0009_rls_and_triggers.sql) · [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx) · [src/components/ProtectedRoute.tsx](src/components/ProtectedRoute.tsx) · hooks em [src/hooks/](src/hooks/).

> **TL;DR:** o modelo de segurança é **aberto por padrão**. Todas as tabelas de dados têm RLS `USING(true) WITH CHECK(true)` para o papel `public` (anon), e a chave anon vai embutida no JS publicado. Duas RPCs `SECURITY DEFINER` de gestão de usuário são **chamáveis por qualquer um sem autorização**. Na prática: qualquer pessoa com a URL + anon key (que estão no bundle) pode **ler e escrever todos os dados** (incluindo CPF/salário/premiações), **criar um usuário admin** e **redefinir a senha de qualquer conta**. A autenticação é 100% client-side (localStorage forjável).

---

## 1. Riscos CRÍTICOS

### C1 — RPCs de gestão de usuário sem autorização (escalonamento de privilégio + tomada de conta)
[0008_functions_rpc.sql](supabase/migrations-v2/0008_functions_rpc.sql): `concremrh_create_user` e `concremrh_update_user_password` são `SECURITY DEFINER`, **sem nenhuma checagem de quem chama** e **sem `REVOKE`** — logo, executáveis pelo papel **anon** via PostgREST.
- `concremrh_create_user(nome,email,senha,perfil,secoes)` → qualquer um cria usuário com **`perfil='admin'`** e quaisquer `secoes`. **Criação de admin por anônimo.**
- `concremrh_update_user_password(id,senha)` → qualquer um redefine a senha de **qualquer** usuário informando o `id` (ids vazam por outras vias). **Tomada de conta.**
- **Impacto:** comprometimento total de contas/gestão de acesso. **Probabilidade alta** (endpoint público, sem rate limit).

### C2 — RLS aberta (`USING(true) WITH CHECK(true)`) para `public` em TODAS as tabelas de dados
[0009_rls_and_triggers.sql](supabase/migrations-v2/0009_rls_and_triggers.sql): 27 tabelas recebem policy `allow_all_* … for all to public using (true) with check (true)`. RLS está "habilitado", mas a policy **anula** qualquer proteção — anon **lê e escreve tudo**.
- A **anon key** é pública (vai no bundle do Vite). Um atacante nem precisa do app: fala direto com `…supabase.co/rest/v1/…`.
- **Impacto:** vazamento e adulteração de **todos** os dados — PII de funcionários (CPF, salário, e-mail), lançamentos e **resultados de premiação** (valores de bônus). Confidencialidade e integridade comprometidas. **Probabilidade alta.**

---

## 2. Riscos MÉDIOS

### M1 — Autenticação 100% client-side e forjável
[AuthContext.tsx](src/contexts/AuthContext.tsx): a sessão é um objeto **em texto** no `localStorage` (`concremrh_session`) com `{ perfil, secoes, … }`. Não há token assinado nem verificação server-side.
- Qualquer usuário edita o `localStorage` e vira `admin` na UI; `ProtectedRoute`/`canAccess`/`canAccessHub` são apenas verificações de tela. Como os dados já estão abertos (C2), o gate visual é cosmético.
- **Impacto:** bypass total de autorização no cliente. **Probabilidade alta**, porém o dano incremental é limitado porque C2 já expõe os dados.

### M2 — `concremrh_verify_login` sem rate limit
[0008](supabase/migrations-v2/0008_functions_rpc.sql): login via RPC pública sem limitação de tentativas → **força bruta** de senha viável. (Bom: retorna `ok:false` genérico, sem enumerar usuário; senha em **bcrypt**.)

### M3 — `update_funcionario_setor_ids` (SECURITY DEFINER, anon) permite escrita dirigida
Qualquer anônimo altera `setor_ids` de qualquer funcionário por `id` — afeta diretamente o cálculo de premiação (supervisor/setor).

### M4 — Modelo de auth incompatível com a RLS de `usuarios`
`usuarios` é a **única** tabela com RLS restritiva (`Admin gerencia usuarios` via `get_my_perfil()` e `Autenticados podem ler`, ambas `to authenticated`). Mas o app usa **auth custom** (anon, sem JWT do Supabase Auth) → `auth.uid()` é sempre `NULL` → `get_my_perfil()` retorna `NULL`. Consequências:
- A proteção "admin gerencia" **nunca se aplica** ao app; a gestão de usuário depende só das RPCs `SECURITY DEFINER` (que estão sem authz — C1).
- A tela de **Usuários** (listagem via `select` direto anon) tende a vir **vazia** (RLS bloqueia anon), então já não funciona como esperado sob o modelo atual.

---

## 3. Riscos BAIXOS

- **B1 — `get_all_funcionario_setor_ids` (SECURITY DEFINER, anon):** expõe o mapa funcionário→setores. Baixa sensibilidade isolada.
- **B2 — Config "morta" do client:** [client.ts](src/integrations/supabase/client.ts) usa `persistSession/autoRefreshToken` do Supabase Auth, que **não é usado** (auth é custom). Sem risco direto, mas confunde e mascara o modelo real.
- **B3 — Chave anon antiga versionada:** a anon key do projeto **antigo** aparece em `.claude/settings.local.json` (rastreado). É publishable (baixa sensibilidade) e o projeto antigo será aposentado; ainda assim, recomendável parar de versionar esse arquivo.
- **B4 — Banco compartilhado com outros apps:** o projeto Supabase original tinha funções de outros sistemas (orçamento/pedido/produtos). As migrations-v2 trouxeram **apenas** o concremrh, mas convém confirmar o isolamento no projeto novo.

---

## 4. Mapeamentos solicitados

### 4.1 Tabelas com RLS ABERTA (`allow_all` — `to public using(true) with check(true)`) — 27
`avaliacoes_desempenho`, `base_premiacao`, `cargos`, `categorias`, `configuracoes_kits`, `dss`, `empresas`, `epi`, `estrutura_hierarquica`, `faixas`, `faltas_advertencias`, `formulas_calculo`, `funcionarios`, `funcionarios_setores`, `funcoes`, `historico_cargos`, `hr_applications`, `indicadores_gerais`, `indicadores_setor`, `locais_dss`, `plano_carreira`, `producao_setor`, `resultados_premiacao`, `setores`, `tipos_indicadores`, `tipos_indicadores_gerais`, `user_application_permissions`, `user_roles`.

> **Exceção:** `concremrh_usuarios` — única com policies restritivas (`to authenticated`), mas inócuas sob auth custom (M4).

### 4.2 Tabelas SENSÍVEIS (PII / financeiro / disciplinar) e exposição atual
| Tabela | Conteúdo sensível | Exposição hoje |
|--------|-------------------|----------------|
| `funcionarios` | CPF, salário, e-mail, datas | 🔴 leitura+escrita anon (allow_all) |
| `usuarios` | e-mail, `senha_hash` | 🟠 leitura direta bloqueada (RLS authenticated); **gestão via RPC sem authz** (C1) |
| `resultados_premiacao` | valores de bônus por pessoa | 🔴 leitura+escrita anon |
| `faltas_advertencias` | dados disciplinares | 🔴 leitura+escrita anon |
| `avaliacoes_desempenho` | avaliações (vazia hoje) | 🔴 leitura+escrita anon |
| `historico_cargos` | histórico salarial/cargo (vazia hoje) | 🔴 leitura+escrita anon |

### 4.3 Telas que dependem de acesso anon direto
**Todas.** Os 28 hooks importam o **mesmo client anon** e fazem `select/insert/update/delete` diretos. Domínios: Funcionários, DSS, EPI, Faltas/Advertências, Produção, Indicadores (setor/gerais), Cadastros (setores, faixas, funções, categorias, empresas, base, fórmulas, kits, tipos, locais), Gerar/Relatório de Premiação, Cargos & Salários. Gestão de **Usuários** e **Login** usam RPCs (`(supabase as any).rpc`). Nenhum uso de `service_role` no `src` (verificado).

### 4.4 RPCs `SECURITY DEFINER` e riscos
| RPC | Papel efetivo | Authz interna | Risco |
|-----|---------------|---------------|-------|
| `concremrh_create_user` | anon | ❌ nenhuma | 🔴 **C1** — cria admin |
| `concremrh_update_user_password` | anon | ❌ nenhuma | 🔴 **C1** — reset de senha de qualquer conta |
| `concremrh_verify_login` | anon | n/a (login) | 🟠 **M2** — brute-force sem rate limit |
| `update_funcionario_setor_ids` | anon | ❌ nenhuma | 🟠 **M3** — escrita dirigida |
| `get_all_funcionario_setor_ids` | anon | ❌ nenhuma | 🟢 **B1** — exposição de mapa |
| `get_my_perfil` | anon/auth | usa `auth.uid()` | 🟠 **M4** — inócua sob auth custom |

### 4.5 Permissões do frontend (todas client-side)
- **Perfis** (`UserPerfil`): `admin`, `rh`, `sesmt`, `producao`, `custom`. *(Obs.: o CHECK do banco em `usuarios.perfil` não aceita `custom`.)*
- **Seções** (`SectionKey`): `dashboard`, `rh`, `sesmt`, `producao`, `premiacoes`, `cadastros`, `cargos_salarios`.
- **`ProtectedRoute`**: checa `allowedPerfis.includes(profile.perfil)` — só no cliente; sem `profile` → `/login`.
- **`canAccess(section)`**: `admin` bypassa; senão `profile.secoes.includes(section)`.
- **`canAccessHub(appCode)`**: `admin` bypassa; senão mapeia via `HUB_MODULE_SECTIONS`.
- Fonte do `profile`: `localStorage['concremrh_session']` (objeto em texto, **forjável** — M1).

---

## 5. Diagnóstico — AuthContext / localStorage
- Login: `supabase.rpc('concremrh_verify_login', {email, password})`; em sucesso, grava o perfil retornado em `localStorage`. **Não há** token assinado, expiração server-side, nem verificação subsequente.
- A sessão persiste indefinidamente no `localStorage` (sem expiração). Logout apenas remove a chave local.
- Qualquer alteração do objeto `concremrh_session` é aceita pela app na próxima leitura → **auto-promoção a admin** trivial no cliente.
- `client.ts` liga `persistSession/autoRefreshToken` do Supabase Auth, **não utilizados** — ruído que mascara o modelo real.

## 6. Diagnóstico — ProtectedRoute / perfis / seções
- Guarda puramente visual: sem `profile` → `/login`; com perfil fora de `allowedPerfis` → redireciona para `DEFAULT_ROUTE`.
- Não há **nenhuma** verificação de autorização no servidor. Como a RLS é aberta (C2), contornar o `ProtectedRoute` (ou ir direto na REST API) dá acesso pleno aos dados independentemente de perfil/seção.

---

## 7. Proposta de endurecimento por fases *(NÃO executar nesta etapa)*

> Ordem por **maior redução de risco × menor quebra do app**. Cada fase precisa de validação antes da seguinte.

**Fase 0 — Decisão de modelo de auth (pré-requisito).** Escolher entre (a) **Supabase Auth** (recomendado — habilita `auth.uid()`/roles e RLS real) ou (b) sessão server-side assinada (Edge Function emitindo JWT). Sem isso, endurecer RLS quebra o app (tudo é anon hoje).

**Fase 1 — Cortar os vetores críticos de gestão de usuário (C1).**
- `REVOKE EXECUTE` de `concremrh_create_user` e `concremrh_update_user_password` do papel `anon`/`public`.
- Reintroduzir gestão de usuário **atrás de auth**: authz interna nas RPCs (apenas admin) via `auth.uid()`+roles, **ou** Edge Function com `service_role`.
- **Depende da Fase 0** e exige adaptar a tela de Usuários.

**Fase 2 — Adotar auth real e sessão verificável (M1).** Migrar o login para Supabase Auth (mantendo `senha_hash` bcrypt via um provider custom ou migração de senhas), substituindo o `localStorage` cru por sessão gerenciada. Habilita `get_my_perfil()`/roles de fato (corrige M4).

**Fase 3 — Substituir `allow_all` por policies por papel/propriedade (C2).** Table a table, começando pelas **sensíveis** (`funcionarios`, `resultados_premiacao`, `faltas_advertencias`, `avaliacoes_desempenho`, `historico_cargos`): separar `select` de escrita, restringir escrita a `rh/admin`, leitura conforme seção. `usuarios` já está restrita (revisar após Fase 2).

**Fase 4 — Integridade de escrita privilegiada (M3) e rate limit (M2).** Mover operações sensíveis (ex.: `update_funcionario_setor_ids`, geração/gravação de premiação) para caminho autenticado/servidor; adicionar rate limit no login (Supabase Auth já oferece; ou proxy/Edge).

**Fase 5 — Higiene.** Remover config morta do `client.ts`; `.gitignore` do `settings.local.json`; confirmar isolamento do projeto novo; considerar rotacionar a anon key se necessário.

---

## 8. O que NÃO deve ser alterado ainda
- **Não** endurecer RLS/policies antes da Fase 0/2 — quebraria **todas** as telas (acesso é anon).
- **Não** dar `REVOKE`/alterar as RPCs antes de existir um caminho autenticado para gestão de usuário.
- **Não** mexer no motor de cálculo, na UI nem na Vercel.
- **Não** trocar o modelo de auth "no susto": exige plano de migração de sessão/senhas e teste ponta a ponta.
- Manter esta etapa como **diagnóstico**; correções entram em etapas próprias (8B+), cada uma validada.

---

## 9. Nota de método
Auditoria feita sobre as **migrations-v2** (fonte versionada aplicada ao projeto novo) e o código do frontend. O acesso direto ao banco não foi usado (credenciais rotacionadas). Recomenda-se, na fase de correção, confirmar no banco novo que não há `GRANT`/policy adicional divergente das migrations.
