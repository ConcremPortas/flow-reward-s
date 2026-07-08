# Plano de Migração de Autenticação — Fase 2 (Supabase Auth) — Etapa 8D

**Data:** 2026-07-08
**Base:** [SECURITY_AUDIT_V2.md](SECURITY_AUDIT_V2.md) · [SECURITY_HARDENING_PLAN_V2.md](SECURITY_HARDENING_PLAN_V2.md)
**Natureza:** **proposta técnica** — nada aplicado. Propostas em [supabase/security-hardening-proposals/phase2-auth/](supabase/security-hardening-proposals/phase2-auth/).
**Pré-requisito:** Fase 1 concluída (RPCs de gestão de usuário exigem re-auth de admin — risco C1 fechado).

> **Objetivo:** migrar do auth custom (`localStorage`) para **Supabase Auth** de forma **gradual e reversível**, sem quebrar login e **sem** mexer ainda na RLS `allow_all`. Isso habilita, nas fases seguintes, corrigir C2 (RLS aberta), M1 (sessão forjável) e M4 (RLS de `usuarios` inócua).

---

## 1. Arquitetura alvo (com Supabase Auth)

```
Hoje (custom):
  Login -> RPC concremrh_verify_login (bcrypt) -> objeto { perfil, secoes } no localStorage
  Dados -> client anon -> RLS allow_all (aberta)
  auth.uid() = NULL  =>  get_my_perfil()/RLS por papel NÃO funcionam

Alvo (Supabase Auth):
  Login -> supabase.auth.signInWithPassword -> JWT gerenciado (expira, assinado)
  Perfil -> RPC get_my_profile() a partir de auth.uid() (sessão verificada)
  Vínculo -> concremrh_usuarios.auth_user_id = auth.users.id
  auth.uid() = id real  =>  get_my_perfil() funciona  =>  RLS por papel viável (Fase 3)
```

Peças:
- **`auth.users`** (schema `auth` do Supabase) passa a ser a fonte de verdade de credencial/sessão.
- **`concremrh_usuarios`** continua sendo a fonte de **perfil/seções** da app, **vinculada** por `auth_user_id`.
- **`get_my_profile()`** (nova RPC proposta) monta `{ id,email,nome,perfil,secoes }` a partir do `auth.uid()`.
- **Feature flag** decide, em runtime, se o app usa auth custom ou Supabase Auth durante a transição.

---

## 2. Estratégia de migração de usuários
1. Aplicar `0001_auth_link_and_profile.sql` (FK `auth_user_id → auth.users`, índice único, `get_my_profile()`).
2. Rodar `link-migrate-users.mjs` (service_role, server-side): para cada `concremrh_usuarios` sem `auth_user_id`, cria a conta em `auth.users` (senha aleatória temporária, `email_confirm: true`) e grava o `auth_user_id`. **Não** define a senha real (isso é o bridge).
3. Implantar a Edge Function `auth-bridge` para migrar a senha no 1º login.
4. Ativar o flag `VITE_AUTH_MODE=supabase` em **staging**, validar, e então produção.
> Base pequena (~5 usuários) → migração rápida e de baixo risco.

---

## 3. Estratégia de senha — comparação e recomendação

| Estratégia | Como funciona | Prós | Contras |
|-----------|---------------|------|---------|
| **A. Reset dirigido** | Cria auth users e força todos a definir nova senha (link/e-mail) | Mais simples de raciocinar; sem código de bridge | Exige **e-mail/SMTP configurado**; todos precisam agir; janela em que ninguém loga até resetar |
| **B. Bridge no 1º login** ⭐ | No 1º login, valida a senha contra o hash antigo (RPC) e **define a mesma senha** no Auth (Edge Function service_role); depois `signInWithPassword` | **Zero fricção** (ninguém percebe); **não** precisa de e-mail; migra sob demanda; casa com "gradual/sem quebrar" | Precisa de **Edge Function** com service_role; janela de bridge a manter |
| **C. Senha temporária** | Admin define senha temporária por usuário | Sem e-mail; controle manual | Ruim em escala; admin conhece a senha temporária (fraco); fricção |

**Recomendada: B — Bridge no primeiro login.** É a que melhor atende "migrar **gradualmente** sem **quebrar login**" e **não depende de SMTP** (que não está configurado). Para uma base de ~5 usuários, a Edge Function é o único componente extra e é isolada/reversível.
**Alternativa aceitável:** A (reset dirigido) **se** e-mail estiver configurado e preferir evitar a Edge Function — dado o número baixo de usuários, um reset único é viável. **C** só como último recurso.

---

## 4. Uso de `auth_user_id`
- Coluna **já existe** em `concremrh_usuarios` (nullable). Vira o **elo** com `auth.users(id)`.
- `0001_auth_link_and_profile.sql` adiciona FK (`on delete set null`) + índice único parcial.
- `get_my_perfil()` (já existente) e `get_my_profile()` (nova) usam `where auth_user_id = auth.uid()`.
- Preenchido pelo `link-migrate-users.mjs` (usuários existentes) e pelo `auth-bridge`/RPC de criação (novos).

---

## 5. Fluxo de login novo (modo `supabase`)
1. Usuário envia e-mail+senha.
2. App tenta `supabase.auth.signInWithPassword({ email, password })`.
3. **Se falhar por senha** (usuário ainda não migrou): chama a Edge Function `auth-bridge` → valida contra o hash antigo e define a senha no Auth → repete o `signInWithPassword` (agora sucede).
4. Com a sessão (JWT) ativa: chama `get_my_profile()` → recebe `{ perfil, secoes, … }` → popula o `profile` do AuthContext.
5. Sessão passa a ser gerenciada pelo Supabase (expira, renova, assinada).

## 6. Fluxo de fallback
- **Flag `VITE_AUTH_MODE=custom`** (default durante transição): mantém exatamente o fluxo atual (`concremrh_verify_login` + `localStorage`). Nada muda.
- Se o modo `supabase` apresentar problema em produção, **basta reverter a flag** para `custom` — o caminho antigo continua no código e funcional.
- `concremrh_verify_login` **permanece** (é usada tanto no fallback quanto pelo bridge).

## 7. Feature flag
- `VITE_AUTH_MODE`: `'custom'` (default) | `'supabase'` — lida no `AuthContext`.
- Vantagem: alterna sem redeploy de código (só variável de ambiente/rebuild) e permite validar em staging antes de produção.
- Rollback = trocar a flag. Nenhuma migração de dados é desfeita ao voltar para `custom` (auth.users criados ficam inertes).

---

## 8. Impactos (todos FUTUROS — não aplicados nesta etapa)

### 8.1 `AuthContext.tsx` — ✅ IMPLEMENTADO na Etapa 8E (atrás da flag, modo `supabase` inativo)
- `signIn`: ramifica pela flag. Modo `supabase`: `signInWithPassword` (+ bridge no catch de senha) e depois `get_my_profile()`.
- Restauração de sessão: usar `supabase.auth.getSession()` + `onAuthStateChange` em vez de ler `localStorage`.
- `signOut`: `supabase.auth.signOut()`.
- O objeto `profile` passa a derivar de **sessão verificada** (não mais de objeto cru forjável) — corrige **M1** no modo supabase.
- **Status:** o código dos dois modos já está em [AuthContext.tsx](src/contexts/AuthContext.tsx). O modo `supabase` só será **validável** após aplicar a infra (SQL `get_my_profile`, `link-migrate-users`, deploy da `auth-bridge`). Padrão continua `custom`.

### 8.2 `ProtectedRoute.tsx`
- Estrutura **inalterada** (mesma lógica `allowedPerfis`/`DEFAULT_ROUTE`), mas `profile`/`loading` passam a vir da sessão do Supabase Auth. Ganho de segurança sem reescrever a guarda.

### 8.3 Tabela `concremrh_usuarios`
- `auth_user_id` deixa de ser cosmética: vira FK + índice único. `senha_hash` **permanece** durante a transição (fallback/bridge); só considerar remoção após Auth 100% estável (fase posterior).

### 8.4 RPCs atuais
- `concremrh_verify_login`: **mantida** (fallback + bridge).
- `get_my_perfil()`: passa a **funcionar de fato** (auth.uid() válido).
- `get_my_profile()`: **nova** (monta o perfil para o login novo).
- `concremrh_create_user`/`concremrh_update_user_password` (Fase 1, re-auth de admin): **mantidas**. Numa iteração seguinte, a criação de usuário deve **também** criar o `auth.users` correspondente (via Edge/admin) e o gate de admin pode migrar de "re-auth por senha" para "`get_my_perfil()='admin'` via `auth.uid()`" — mais limpo. `update_funcionario_setor_ids` e RLS entram nas Fases 3/4.
- `client.ts`: remover a config morta (`persistSession/autoRefreshToken` passam a ser **usados** de verdade).

---

## 9. Plano de rollback
- **Flag:** `VITE_AUTH_MODE=custom` restaura o login antigo imediatamente (código de ambos os modos coexiste).
- **SQL:** seção ROLLBACK em `0001_auth_link_and_profile.sql` (drop da FK/índice/RPC).
- **auth.users criados:** ficam inertes no modo custom; podem ser removidos via `auth.admin.deleteUser` se necessário (script reverso).
- **Edge Function:** `supabase functions delete auth-bridge`.
- **`senha_hash`:** não remover até o Auth estar estável → garante retorno ao custom sem perda.
- **Regra:** aplicar tudo primeiro em **staging**; produção só após validação.

---

## 10. Checklist de validação (Fase 2, em staging)
- [ ] `0001_auth_link_and_profile.sql` aplicado; `get_my_profile()` responde para um usuário vinculado.
- [ ] `link-migrate-users.mjs --dry-run` lista os 5 usuários; execução real cria auth users e preenche `auth_user_id` (conferir contagem).
- [ ] `auth-bridge` implantada; 1º login de um usuário **não migrado** define a senha no Auth e sucede.
- [ ] Login (modo supabase): admin, RH, SESMT, produção — todos entram; `get_my_profile()` retorna perfil/seções corretos.
- [ ] Sessão expira/renova conforme configurado; recarregar a página mantém login via `getSession()`.
- [ ] `ProtectedRoute`: perfil sem acesso é redirecionado (comportamento atual mantido).
- [ ] Telas principais carregam (Funcionários, DSS, EPI, Produção, Indicadores, Gerar/Relatório de premiação, Cargos).
- [ ] Fallback: `VITE_AUTH_MODE=custom` volta ao login antigo sem erro.
- [ ] **Segurança:** manipular `localStorage` **não** promove a admin no modo supabase (perfil vem de `get_my_profile()` sob sessão assinada).
- [ ] Gestão de usuário (Fase 1) continua exigindo re-auth de admin.

---

## 11. Riscos restantes após a Fase 2
- **C2 — RLS `allow_all`** ainda aberta: só a **Fase 3** troca por policies por papel (agora **viável** porque `auth.uid()` funciona).
- **M3 — `update_funcionario_setor_ids` anon**: Fase 3/4.
- **M2 — rate limit de login**: melhora com Supabase Auth (nativo), confirmar configuração.
- **REVOKE das RPCs do anon** (defesa em profundidade): Fase 4, após o app chamar como `authenticated`.
- Janela de **coexistência** custom/supabase exige disciplina (flag + testes) para não divergir.

---

## 12. O que NÃO fazer nesta etapa
- Não aplicar migrations, não criar usuários no Auth, não implantar a Edge Function.
- Não alterar `AuthContext`/`ProtectedRoute` funcionalmente.
- Não mexer em RLS `allow_all`, Vercel, `.env`, regra de premiação.
- Não commitar `service_role`, dumps ou dados pessoais.

## 13. Próximo passo
Aprovar a **estratégia de senha (B — bridge)** e a arquitetura. Em seguida (Etapa 8E): aplicar `0001_auth_link_and_profile.sql` + rodar `link-migrate-users.mjs` + implantar `auth-bridge` em **staging**, com a flag `VITE_AUTH_MODE=supabase`, e executar o checklist §10. Só então implementar as mudanças de `AuthContext` atrás da flag.
