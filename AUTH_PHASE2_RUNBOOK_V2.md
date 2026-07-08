# Runbook — Fase 2 (Supabase Auth) — Etapa 8F

**Data:** 2026-07-08
**Objetivo:** aplicar a infra da Fase 2 no **Supabase novo/staging** e validar o login com `VITE_AUTH_MODE=supabase`, de forma segura e **reversível**. Nada aqui foi executado — é um guia operacional.
**Base:** [SECURITY_AUTH_MIGRATION_PLAN_V2.md](SECURITY_AUTH_MIGRATION_PLAN_V2.md) · propostas em [supabase/security-hardening-proposals/phase2-auth/](supabase/security-hardening-proposals/phase2-auth/) · código já pronto em [AuthContext.tsx](src/contexts/AuthContext.tsx) (Etapa 8E).

> ⚠️ **Fazer primeiro em staging/local, nunca direto em produção.** O modo padrão continua `custom`; só ative `supabase` no `.env.local` depois de aplicar a infra.

---

## 1. Pré-requisitos
- Projeto Supabase novo acessível (dashboard + banco).
- **Supabase CLI** instalado e logado (`npx supabase login`) — necessário só para o deploy da Edge Function.
- Node 18+ (já usado no projeto).
- `@supabase/supabase-js` (já é dependência).
- Etapa 8E já mergeada (AuthContext dual-mode) — ✅ feito.
- Acesso ao **service_role key** e à **senha do banco** do projeto novo (Dashboard → Project Settings → API / Database). **Não** compartilhar nem commitar.

## 2. Variáveis necessárias
| Variável | Onde | Sensível? | Uso |
|----------|------|:---:|-----|
| `SUPABASE_URL` | dashboard (API) | não | URL do projeto |
| `SUPABASE_SERVICE_ROLE_KEY` | dashboard (API) | 🔴 **SIM** | `link-migrate-users.mjs` e secret da Edge Function |
| Senha do banco (URI pooler) | dashboard (Database) | 🔴 **SIM** | aplicar SQL via SQL Editor/psql |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` | `.env.local` (já existem) | anon = não | client do frontend |
| `VITE_AUTH_MODE` | `.env.local` | não | alterna `custom`/`supabase` |

### 2.1 O que é SENSÍVEL e onde **NÃO** colocar
- **`service_role`**: NUNCA no frontend, NUNCA em `.env`/`.env.local` do Vite (tudo com prefixo `VITE_` vai para o bundle público!), NUNCA em commit. Só em: (a) ambiente do terminal ao rodar `link-migrate-users.mjs`, e (b) **secret** da Edge Function (server-side).
- **Senha do banco**: só no SQL Editor do dashboard ou em terminal local efêmero; nunca em arquivo versionado.
- Nada de `service_role`/senha/token/dumps/PII entra em nenhum arquivo deste repo.

---

## 3. Ordem de execução (staging)
```
1) SQL      -> 0001_auth_link_and_profile.sql   (vínculo + get_my_profile)
2) Migração -> link-migrate-users.mjs            (cria auth.users + preenche auth_user_id)
3) Edge     -> deploy auth-bridge + secrets       (bridge de senha no 1º login)
4) Flag     -> VITE_AUTH_MODE=supabase no .env.local (só local)
5) Validar  -> checklist §9
```

### 3.1 Aplicar `0001_auth_link_and_profile.sql`
Dashboard → **SQL Editor** → colar o conteúdo de [supabase/security-hardening-proposals/phase2-auth/0001_auth_link_and_profile.sql](supabase/security-hardening-proposals/phase2-auth/0001_auth_link_and_profile.sql) → **Run**. Cria a FK `auth_user_id→auth.users`, o índice único e a RPC `get_my_profile()`.
Conferência rápida (SQL Editor):
```sql
select proname from pg_proc where proname = 'get_my_profile';           -- deve retornar 1 linha
select conname from pg_constraint where conname = 'concremrh_usuarios_auth_user_fk';  -- 1 linha
```

### 3.2 Executar `link-migrate-users.mjs` (local, terminal efêmero)
Cria um usuário no Supabase Auth para cada `concremrh_usuarios` e grava o `auth_user_id`. Usa `service_role` **apenas** via variável de ambiente do terminal.
```bash
# 1) dry-run (não escreve nada — só lista)
SUPABASE_URL="https://<ref-novo>.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="<service_role_secreto>" \
node supabase/security-hardening-proposals/phase2-auth/link-migrate-users.mjs --dry-run

# 2) execução real
SUPABASE_URL="https://<ref-novo>.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="<service_role_secreto>" \
node supabase/security-hardening-proposals/phase2-auth/link-migrate-users.mjs
```
Conferência: o script imprime `criados=N pulados=M`. Confirmar (SQL Editor, como postgres): `select count(*) from concremrh_usuarios where auth_user_id is not null;`
> Requer `@supabase/supabase-js` disponível — já é dependência do projeto (rode a partir da raiz do repo).

### 3.3 Deploy da Edge Function `auth-bridge`
O esqueleto está em [.../auth-bridge.function.ts](supabase/security-hardening-proposals/phase2-auth/auth-bridge.function.ts). Para deployar, criar a estrutura esperada pelo CLI e publicar:
```bash
# estrutura esperada pelo CLI:  supabase/functions/auth-bridge/index.ts
mkdir -p supabase/functions/auth-bridge
cp supabase/security-hardening-proposals/phase2-auth/auth-bridge.function.ts supabase/functions/auth-bridge/index.ts

npx supabase functions deploy auth-bridge --project-ref <ref-novo>
```

### 3.4 Configurar secrets da Edge Function
A função lê `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` do ambiente da Edge (server-side, **não** do frontend):
```bash
npx supabase secrets set --project-ref <ref-novo> \
  SUPABASE_URL="https://<ref-novo>.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="<service_role_secreto>"
```
> Em muitos projetos, `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` já são injetados automaticamente nas Functions — conferir no dashboard antes de duplicar.

### 3.5 Ativar `VITE_AUTH_MODE=supabase` **apenas** no `.env.local`
No `.env.local` (git-ignored — **não** commitar), adicionar:
```
VITE_AUTH_MODE=supabase
```
Reiniciar o dev server (`npm run dev`) para o Vite recarregar as envs. **Não** setar isso em `.env` (que pode ir para outros ambientes) nem na Vercel nesta etapa.

---

## 4. Como validar o login no modo Supabase Auth
1. `npm run dev` com `VITE_AUTH_MODE=supabase` no `.env.local`.
2. **1º login** de um usuário (ex.: admin): a senha atual (bcrypt antiga) ainda não existe no Auth → o AuthContext chama a Edge `auth-bridge`, que define a senha no Auth → repete o `signInWithPassword` → entra. (bridge no 1º login.)
3. **2º login** do mesmo usuário: agora `signInWithPassword` sucede **direto** (sem bridge).
4. Perfil/seções vêm de `get_my_profile()` (sessão verificada) — confira que o Hub/menus refletem o perfil correto.
5. **Logout**: `supabase.auth.signOut()` limpa a sessão; recarregar a página cai no `/login`.

---

## 5. Como voltar para `custom` (fallback imediato)
Se algo falhar no modo supabase:
1. Remover (ou trocar para `custom`) a linha `VITE_AUTH_MODE` do `.env.local`.
2. Reiniciar `npm run dev`.
3. O app volta ao login antigo (`concremrh_verify_login` + `localStorage`) **imediatamente** — nenhum dado de auth precisa ser desfeito. O código dos dois modos coexiste.

---

## 6. Checklist de testes (rodar no modo `supabase`, exceto o #18)
- [ ] 1. Login **admin** entra.
- [ ] 2. Login **RH** entra.
- [ ] 3. Login **SESMT** entra.
- [ ] 4. Login **produção** entra.
- [ ] 5. **1º login** de um usuário não migrado → bridge define a senha no Auth e o login sucede.
- [ ] 6. **2º login** do mesmo usuário → `signInWithPassword` direto (sem bridge).
- [ ] 7. `get_my_profile()` retorna **perfil e seções corretos** (menus/rotas coerentes).
- [ ] 8. **Logout** limpa a sessão Supabase (recarregar → `/login`).
- [ ] 9. **ProtectedRoute** respeita perfil/seções (perfil sem acesso é redirecionado ao `DEFAULT_ROUTE`).
- [ ] 10. **Funcionários** carrega.
- [ ] 11. **DSS** carrega.
- [ ] 12. **EPI** carrega.
- [ ] 13. **Produção** carrega.
- [ ] 14. **Indicadores** (setor/gerais) carregam.
- [ ] 15. **Gerar premiação** abre.
- [ ] 16. **Relatório** de premiação abre.
- [ ] 17. **Tela de Usuários**: criar usuário / resetar senha continuam exigindo **reauth de admin** (Fase 1) e funcionam.
- [ ] 18. Com `VITE_AUTH_MODE=custom` (ou ausente): **comportamento antigo** continua funcionando (login/logout/rotas/telas).

> Observação sobre RLS: nesta fase a RLS ainda é `allow_all` (C2). Os testes acima validam **login/sessão/perfil**; o endurecimento de RLS por papel é a **Fase 3** (agora viável porque `auth.uid()` passa a funcionar).

---

## 7. Plano de rollback
| Camada | Reverter |
|--------|----------|
| **Flag** | remover `VITE_AUTH_MODE` do `.env.local` → volta a `custom` na hora |
| **Edge Function** | `npx supabase functions delete auth-bridge --project-ref <ref>` |
| **Migração de usuários** | os `auth.users` criados ficam **inertes** no modo custom; se quiser remover: `auth.admin.deleteUser` (script reverso) + `update concremrh_usuarios set auth_user_id = null` |
| **SQL** | seção ROLLBACK no `0001_auth_link_and_profile.sql`: `drop function get_my_profile; drop index ...; alter table ... drop constraint ...` |
| **senha_hash** | **não remover** — garante retorno ao custom sem perda de login |

Regra: validar em staging antes de qualquer coisa em produção. `senha_hash` permanece até o Auth estar 100% estável.

---

## 8. O que NÃO fazer nesta etapa
Não aplicar SQL, não rodar `link-migrate-users.mjs`, não deployar a Edge Function, não alterar `.env`/`.env.local`/Vercel/RLS/regra de premiação. Não versionar `service_role`/senha/token/dumps/PII.

## 9. Próximo passo
Executar este runbook em **staging/local** (você — exige DB/deploy/secret). Ao passar o checklist §6, considerar a **Fase 3** (endurecer RLS C2) e, por fim, a publicação na **Vercel** (Etapa 9), onde `VITE_AUTH_MODE=supabase` seria definido nas env vars de produção.
