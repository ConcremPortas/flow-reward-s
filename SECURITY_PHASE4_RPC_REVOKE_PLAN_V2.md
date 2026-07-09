# Fase 4 — REVOKE de RPC para anon + Rate limit de login — Reforma V2

**Data:** 2026-07-09
**Natureza:** proposta técnica + guia de aplicação assistida. Script em [supabase/security-hardening-proposals/phase4-rpc-revoke/](supabase/security-hardening-proposals/phase4-rpc-revoke/).
**Base:** [SECURITY_AUDIT_V2.md](SECURITY_AUDIT_V2.md) · [SECURITY_HARDENING_PLAN_V2.md](SECURITY_HARDENING_PLAN_V2.md) · Fase 1 [0001_phase1_harden_user_rpcs.sql](supabase/security-hardening-proposals/0001_phase1_harden_user_rpcs.sql) · Fase 3 [SECURITY_RLS_PHASE3_PLAN_V2.md](SECURITY_RLS_PHASE3_PLAN_V2.md)

> **Objetivo:** defesa em profundidade — remover `EXECUTE` do papel **`anon`** das RPCs `SECURITY DEFINER` que o app só chama como `authenticated` no modo Supabase Auth (Fase 2). Fecha o vetor de RPCs que **ignoram a RLS** da Fase 3, e documenta o rate limit de login.

## 1. Contexto e pré-requisitos
- **Fase 1** validada: `create_user`/`update_user_password` exigem re-autenticação de admin *dentro* da função.
- **Fase 2** validada: app em `VITE_AUTH_MODE=supabase` → chamadas ao PostgREST vão como **`authenticated`** (sessão do Supabase Auth).
- **Fase 3** validada: RLS `allow_all` removida; anon bloqueado em 28 tabelas.
- **Lacuna que a Fase 4 fecha:** funções `SECURITY DEFINER` rodam como *owner* e **ignoram RLS**; se `anon` pode executá-las, contorna a Fase 3. Confirmado empiricamente (§5, baseline).

## 2. RPCs avaliadas (assinaturas reais no banco)
| RPC | Assinatura | `SECURITY DEFINER` | Quem chama no modo supabase |
|-----|-----------|:---:|-----|
| `concremrh_create_user` | `(text,text,text,text,text,text,jsonb)` (Fase 1) | sim | tela Usuários (admin **authenticated**) |
| `concremrh_update_user_password` | `(text,text,uuid,text)` (Fase 1) | sim | tela Usuários (admin **authenticated**) |
| `update_funcionario_setor_ids` | `(uuid,text)` | sim | tela Funcionários (**authenticated**) |
| `get_all_funcionario_setor_ids` | `()` | sim | tela Funcionários (**authenticated**) |
| `get_my_perfil` | `()` | sim | **interno** da RLS (helpers) / `auth.uid()` |
| `get_my_profile` | `()` | sim | AuthContext após login (**authenticated**) |
| `concremrh_verify_login` | `(text,text)` | sim | **anon** (login custom/fallback) + `auth-bridge` (service_role) |

## 3. Permissões atuais (baseline, medido via REST anon)
Todas as 7 RPCs estão **executáveis por `anon`** (grant default a `PUBLIC` na criação):
- `get_my_perfil` → HTTP 200 (retorna vazio: `auth.uid()` nulo para anon).
- `get_my_profile` → HTTP 200 `{"ok":false}` (inócuo, mas desnecessário para anon).
- `get_all_funcionario_setor_ids` → **HTTP 200 + DADOS** 🔴 vaza `funcionario_id`/`setor_ids` (SECURITY DEFINER fura a RLS).
- `concremrh_verify_login` → HTTP 200 (esperado — é o login).
- `concremrh_create_user` / `concremrh_update_user_password` → executáveis por anon, mas **já bloqueadas logicamente** pela re-auth de admin da Fase 1 (retornam "Não autorizado").
- `update_funcionario_setor_ids` → executável por anon (escrita SECURITY DEFINER).

## 4. Permissões propostas
| RPC | anon | authenticated | service_role | Ação |
|-----|:---:|:---:|:---:|------|
| `concremrh_create_user` | ❌ revoke | ✅ grant | ✅ grant | revoke public+anon |
| `concremrh_update_user_password` | ❌ revoke | ✅ grant | ✅ grant | revoke public+anon |
| `update_funcionario_setor_ids` | ❌ revoke | ✅ grant | ✅ grant | revoke public+anon |
| `get_all_funcionario_setor_ids` | ❌ revoke | ✅ grant | ✅ grant | revoke public+anon (fecha vazamento) |
| `get_my_perfil` | ❌ revoke | ✅ grant | ✅ grant | revoke public+anon |
| `get_my_profile` | ❌ revoke | ✅ grant | ✅ grant | revoke public+anon |
| `concremrh_verify_login` | ✅ **mantida** | ✅ | ✅ | grants explícitos; sem revoke |

> Padrão: `revoke ... from public` **e** `from anon` (o grant default vem de `PUBLIC`; revogar só de `anon` seria no-op), depois `grant ... to authenticated, service_role`.

## 5. Decisão `concremrh_verify_login` (documentada antes de revogar)
**Decisão: MANTER `anon`.** Justificativa:
- É o **ponto de entrada de autenticação** do modo `custom`/fallback (chamado por usuário **não autenticado**, antes de existir sessão). Revogar quebraria o fallback documentado no [runbook da Fase 2](AUTH_PHASE2_RUNBOOK_V2.md).
- No modo `supabase`, o **frontend não a chama**; quem a usa é a Edge `auth-bridge`, que roda com **service_role** (não afetada por grants de anon). Ou seja, revogar de anon **não** é necessário para o funcionamento do modo supabase, e **não** quebraria a `auth-bridge`.
- É **auto-protegida**: sem a senha correta (bcrypt) retorna `{"ok":false}`; não expõe dados.
- **Risco residual:** força-bruta de senha via a RPC não passa pelo rate limit do GoTrue. Mitigação em §8 (rate limit) e recomendação de **revogar no futuro**, quando o fallback custom for aposentado (pós-estabilização em produção). Snippet opcional para esse momento:
  ```sql
  -- APENAS quando o modo custom for aposentado (login 100% via Supabase Auth):
  revoke execute on function public.concremrh_verify_login(text,text) from public, anon;
  grant  execute on function public.concremrh_verify_login(text,text) to service_role; -- auth-bridge
  ```

## 6. Impacto no app
- **Modo supabase (atual):** **nenhum impacto** — admin/usuários operam autenticados; `authenticated` mantém o `EXECUTE`. `get_my_profile`/RLS seguem funcionando (helpers chamam `get_my_perfil` como *owner*).
- **Modo custom/fallback (anon):** **degrada** a gestão de usuários (criar/resetar), a edição de setores em Funcionários e o `get_all_funcionario_setor_ids`. O **login continua** (verify_login mantida). Aceitável: o custom é modo de emergência temporário; se precisar operá-lo plenamente, rodar o rollback.
- **auth-bridge:** não afetada (service_role).
- **Regra de premiação / UI / RLS de tabelas:** não tocadas.

## 7. Testes
### 7.1 REST anon (devem NEGAR após aplicar) — sem service_role
```
POST /rest/v1/rpc/concremrh_create_user            -> 401/403 (nao executa)
POST /rest/v1/rpc/concremrh_update_user_password   -> 401/403
POST /rest/v1/rpc/update_funcionario_setor_ids     -> 401/403
POST /rest/v1/rpc/get_all_funcionario_setor_ids    -> 401/403 (vazamento fechado)
POST /rest/v1/rpc/get_my_perfil                    -> 401/403
POST /rest/v1/rpc/get_my_profile                   -> 401/403
POST /rest/v1/rpc/concremrh_verify_login           -> 200 (MANTIDA)
```
> No PostgREST, execução negada por falta de `EXECUTE` retorna **HTTP 404** (`PGRST202`, "function not found in schema cache for role") ou **403**. O essencial: **não executa** e não retorna dados.

### 7.2 Authenticated (devem CONTINUAR funcionando)
- Login Supabase Auth (admin/rh/sesmt/producao) OK.
- Tela de **Usuários**: criar/resetar senha com **reauth de admin** (Fase 1) OK.
- **Funcionários**: `get_all_funcionario_setor_ids` e `update_funcionario_setor_ids` OK (authenticated).
- **DSS/EPI/Produção/Indicadores/Gerar/Relatório** OK.
- `get_my_profile()` retorna perfil correto (menus coerentes).

## 8. Rate limit de login (configuração no Dashboard — NÃO em código)
O rate limit do Supabase Auth (GoTrue) é configurado **no Dashboard**, não versionável aqui. Como validar/ajustar:
1. **Dashboard → Authentication → Rate Limits** (ou *Auth → Policies/Attack Protection*, conforme versão do painel).
2. Conferir/ajustar principalmente:
   - **Sign in / Sign up** (tentativas por IP por hora) — protege `signInWithPassword`.
   - **Token refresh** e **Token verification**.
   - **OTP / Email** (se e-mail for habilitado — **não** mexer em SMTP sem confirmação).
3. **Attack Protection** (se disponível): habilitar proteção a credential-stuffing / captcha (hCaptcha/Turnstile) na tela de login.
4. **Cobertura:** o rate limit do GoTrue cobre `signInWithPassword` (modo supabase). **Não** cobre a RPC `concremrh_verify_login` nem a Edge `auth-bridge` (surface do fallback) — ver §5. Recomendação: manter o fallback custom desabilitado em produção (flag ausente ⇒ supabase) e revogar `verify_login` de anon quando o fallback for aposentado.
5. **Sem secrets:** nada de service_role/chaves neste ajuste; é só configuração de UI.

## 9. Pontos que dependem do Dashboard Supabase
- Rate limits e Attack Protection (§8) — configuração manual, não há SQL.
- (Opcional futuro) hCaptcha/Turnstile no login — requer chaves do provedor no Dashboard (não versionar).

## 10. Rollback
`0001_phase4_revoke_anon_rpc_rollback.sql` — re-concede `EXECUTE` a `PUBLIC` nas 6 RPCs revogadas (⚠️ reabre para anon). `verify_login` não é alterada pela Fase 4.

## 11. O que NÃO fazer nesta fase
Não alterar RLS de tabelas, regra de premiação, UI ou Vercel. Não mexer em SMTP sem confirmação. Não versionar `.env`/`service_role`/dumps/PII.

## 12. Próximo passo
Aplicar `0001_phase4_revoke_anon_rpc.sql` no SQL Editor → rodar testes §7.1 (anon negado) e §7.2 (authenticated OK) → validar §8 no Dashboard. Depois: restrição a nível de coluna em `funcionarios` (salário/CPF) e Etapa 9 (Vercel).
