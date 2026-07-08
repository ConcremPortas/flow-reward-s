# Plano de Endurecimento de Segurança — Reforma V2 (Etapa 8B)

**Data:** 2026-07-08
**Base:** [SECURITY_AUDIT_V2.md](SECURITY_AUDIT_V2.md)
**Natureza:** **proposta técnica** — nada é aplicado nesta etapa (sem alterar banco, RLS, auth, UI, Vercel). As migrations propostas estão em [supabase/security-hardening-proposals/](supabase/security-hardening-proposals/).

> **Objetivo imediato:** fechar o risco **crítico C1** (RPCs de gestão de usuário executáveis por anônimo, permitindo criar admin e resetar senha) **sem quebrar o app atual**, e traçar o caminho reversível até **auth real**.

---

## 1. Decisão recomendada de modelo de auth

**Destino recomendado: migrar para Supabase Auth** (JWT gerenciado + `auth.uid()` + RLS por papel), em fases, mantendo o login funcional na transição.

**Interim recomendado (Fase 1, aplicável já): re-autenticação de admin nas RPCs críticas.** Como o app hoje roda como `anon` (auth custom em `localStorage`), **não é possível** revogar EXECUTE do anon sem quebrar a gestão de usuário. A correção imediata de C1 é **autorização interna**: as RPCs `SECURITY DEFINER` passam a exigir e conferir a **senha de um admin** (bcrypt) antes de agir. Isso fecha C1 hoje e é 100% reversível.

Racional: a maior parte dos riscos (C1, C2, M1, M4) só se resolve **estruturalmente** com auth real. Mas C1 é explorável agora e tem correção barata e isolada (Fase 1). Fazemos o urgente já e o estrutural em seguida.

---

## 2. Custom auth vs Supabase Auth

| Critério | Manter auth custom (hardened) | Migrar para Supabase Auth |
|----------|-------------------------------|---------------------------|
| Esforço | Baixo (recria 2 RPCs + pequeno ajuste de tela) | Alto (vincular `auth.users`, migrar senhas, reescrever `AuthContext`, RLS) |
| Fecha C1 | ✅ (via re-auth) | ✅ (via authz por role) |
| Fecha C2 (RLS aberta) | ❌ (RLS só endurece de verdade com `auth.uid()`) | ✅ (habilita RLS por papel/dono) |
| Fecha M1 (sessão forjável) | ⚠️ parcial (sessão continua no `localStorage`) | ✅ (JWT assinado, expira) |
| Corrige M4 (`get_my_perfil`/`auth.uid()`) | ❌ | ✅ |
| Rate limit de login (M2) | ❌ (precisaria implementar) | ✅ (nativo) |
| Permite `REVOKE` das RPCs do anon | ❌ (app é anon) | ✅ (app vira `authenticated`) |
| Risco de quebrar o app | Baixo | Médio (transição de sessão/senhas) |
| Reversibilidade | Alta | Média (manter login antigo como fallback) |

**Conclusão:** custom-hardened como **degrau** (Fase 1), Supabase Auth como **destino** (Fases 2-4). Não é ou/ou; é uma sequência.

### Riscos de cada abordagem
- **Custom hardened:** re-auth pede a senha do admin a cada ação sensível (fricção); a sessão segue forjável (mas os dados sensíveis de gestão de usuário ficam protegidos pela re-auth). Não resolve C2.
- **Supabase Auth:** a migração de **senhas** é o ponto delicado — o Supabase Auth guarda hash próprio e não importamos bcrypt existente diretamente. Estratégias no §4 (Fase 2). Risco de lockout se mal executado → mitigado por fallback e reset dirigido.

---

## 3. Plano por fases

| Fase | Objetivo | Aplica no banco | Aplica no frontend | Reversível |
|------|----------|-----------------|--------------------|------------|
| **0** | Aprovar este plano + escolher destino (Supabase Auth) | — | — | — |
| **1** | Fechar C1 via re-auth de admin nas 2 RPCs | `0001_phase1_harden_user_rpcs.sql` | ajustar `useUsuarios` + diálogo de senha (proposto) | `0001_phase1_rollback.sql` + revert do commit de frontend |
| **2** | Adotar Supabase Auth; vincular `auth.users`↔`concremrh_usuarios`; login novo com fallback | criação/uso de `auth.users`; policies em `usuarios` | `AuthContext` usa `supabase.auth`; mantém RPC antiga como fallback | manter login antigo ativo; feature flag |
| **3** | Substituir `allow_all` por policies por papel (C2), começando pelas sensíveis | novas policies (`select`/escrita por perfil) | nenhum (se RLS espelhar o que o app já faz) | restaurar `allow_all` por tabela |
| **4** | `REVOKE` das RPCs do anon (defesa em profundidade) + rate limit (M2) | `revoke execute … from anon` | — | `grant execute … to anon` |
| **5** | Higiene: limpar config morta do client, gitignore de `settings.local.json`, rotação de chaves | — | pequeno | trivial |

> **Regra de ouro:** cada fase é aplicada e **validada** (checklist §7 + plano de testes §8) antes da próxima. Fase 3 **nunca** antes da Fase 2 (senão o app anon quebra).

---

## 4. Detalhamento técnico

### Fase 1 — re-auth nas RPCs (proposto: `0001_phase1_harden_user_rpcs.sql`)
- Dropa as assinaturas antigas e recria `concremrh_create_user`/`concremrh_update_user_password` com parâmetros `p_admin_email`/`p_admin_password`.
- Dentro da função (SECURITY DEFINER): busca o admin por e-mail, confere `crypt(p_admin_password, senha_hash)` e `perfil='admin'` e `ativo`. Se falhar → `{ ok:false, error:'Não autorizado' }`, **sem** escrever.
- Fecha C1: anon sem senha de admin não cria admin nem reseta senha.

### Fase 2 — Supabase Auth (documentado; migration só após aprovação)
Passos propostos:
1. A coluna **`concremrh_usuarios.auth_user_id`** já existe → será o vínculo com `auth.users(id)`.
2. Criar usuários no Supabase Auth para cada `concremrh_usuarios` (via `supabase.auth.admin.createUser`, server-side com service_role — **fora** do frontend). Preencher `auth_user_id`.
3. **Senhas:** três estratégias (escolher):
   - (a) **Reset dirigido:** disparar "definir nova senha" para todos (mais seguro; exige comunicação aos usuários).
   - (b) **Bridge no primeiro login:** login novo tenta `supabase.auth.signInWithPassword`; se falhar e a senha bater no `senha_hash` antigo (via RPC de verificação), define a senha no Auth naquele momento e segue. Migra senhas sem lockout.
   - (c) **Senha temporária** por admin (pior UX).
   - **Recomendado:** (b) bridge, com (a) como alternativa para quem não logar em X dias.
4. `AuthContext` passa a usar `supabase.auth` (sessão gerenciada, expira) — mantendo `concremrh_verify_login` como **fallback** atrás de flag durante a transição.
5. Com `auth.uid()` válido: `get_my_perfil()` funciona; a policy `Admin gerencia usuarios` passa a valer de fato.

### Fase 3 — RLS por papel (C2)
- Para cada tabela sensível, trocar `allow_all` por: `select` conforme necessidade (ex.: autenticados) e **escrita restrita** a `rh/admin` (via `get_my_perfil()`), começando por `funcionarios`, `resultados_premiacao`, `faltas_advertencias`, `avaliacoes_desempenho`, `historico_cargos`. Espelhar exatamente o que o app já faz para não quebrar.

### Fase 4 — REVOKE + rate limit
- `revoke execute` das RPCs de gestão de usuário do `anon` (defesa em profundidade; a authz interna já protege).
- Rate limit de login (nativo do Supabase Auth após Fase 2).

---

## 5. Impacto no frontend (PROPOSTO — não aplicado nesta etapa)

### Fase 1 (mínimo, isolado)
- **[useUsuarios.ts](src/hooks/useUsuarios.ts)** — `createUsuario` e `updateSenha` passam a enviar as credenciais do admin logado:
  ```ts
  // createUsuario: adicionar p_admin_email / p_admin_password
  await supabase.rpc('concremrh_create_user', {
    p_admin_email: adminEmail,      // do AuthContext (profile.email)
    p_admin_password: adminPassword, // digitada num diálogo de confirmação
    p_nome, p_email, p_senha, p_perfil, p_secoes,
  });
  // updateSenha: idem
  await supabase.rpc('concremrh_update_user_password', {
    p_admin_email: adminEmail, p_admin_password: adminPassword, p_id: id, p_senha: senha,
  });
  ```
- **Tela de Usuários** ([Usuarios.tsx](src/pages/cadastros/Usuarios.tsx)) — adicionar um **diálogo "confirme sua senha"** antes de criar usuário / resetar senha; passar `profile.email` + a senha digitada aos hooks.
- **[AuthContext.tsx](src/contexts/AuthContext.tsx)** — já expõe `profile.email`; nada a mudar aqui na Fase 1.

### Fase 2
- **AuthContext** migra `signIn` para `supabase.auth.signInWithPassword` (com bridge de senha), `signOut` para `supabase.auth.signOut`, e a sessão passa a vir do Supabase Auth (não mais do objeto cru em `localStorage`).
- **ProtectedRoute** permanece igual na forma, mas o `profile` passa a derivar de uma sessão **verificável**.

> Nenhuma dessas mudanças foi aplicada — são o "contrato" para as etapas 8C+.

---

## 6. Impacto no banco
- **Fase 1:** só recria 2 funções (nenhuma tabela/policy tocada). Requer `pgcrypto` (já presente).
- **Fase 2:** usa `auth.users` (schema `auth` do Supabase) + preenche `auth_user_id`; ajusta policies de `usuarios`.
- **Fase 3:** substitui policies `allow_all` por policies por papel (tabela a tabela).
- **Fase 4:** `REVOKE`/`GRANT` de EXECUTE.
- **Nada** disso é aplicado agora.

---

## 7. Plano de rollback
- **Fase 1:** rodar [0001_phase1_rollback.sql](supabase/security-hardening-proposals/0001_phase1_rollback.sql) (restaura as funções originais) **e** reverter o commit de frontend. App volta ao estado atual. ⚠️ reabre C1 — usar só se necessário.
- **Fase 2:** manter `concremrh_verify_login` e o fluxo antigo atrás de **feature flag**; em problema, alternar a flag de volta para o login custom. Não remover a coluna `senha_hash` até a Fase 2 estar estável.
- **Fase 3:** cada tabela guarda o `allow_all` como script de restauração; reverter é recriar a policy aberta daquela tabela.
- **Fase 4:** `grant execute … to anon` restaura o acesso.
- **Princípio:** toda fase tem script de reversão e é aplicada primeiro em **staging**.

---

## 8. Plano de testes (por fase)

### Após Fase 1 (foco em C1)
| # | Cenário | Esperado |
|---|---------|----------|
| 1 | Login **admin** (kaiomelo) | entra; Hub abre |
| 2 | Login **RH** (rh@concrem.com.br) | entra; seções de RH |
| 3 | Login **SESMT** (sesmt@concrem.com.br) | entra; rota default SESMT |
| 4 | Login **produção** (producao@concrem.com.br) | entra; rota default produção |
| 5 | **Criar usuário SEM ser admin** (chamar RPC com credencial não-admin ou senha errada) | `{ ok:false, error:'Não autorizado' }`; **nada criado** |
| 6 | **Resetar senha SEM ser admin** | `{ ok:false, error:'Não autorizado' }`; senha **inalterada** |
| 7 | **Admin cria usuário** (com sua senha correta) | `{ ok:true }`; usuário criado |
| 8 | **Admin reseta senha** de outro usuário | `{ ok:true }`; login do alvo passa a usar a nova senha |
| 9 | **Tela de Usuários** | admin consegue operar create/reset via diálogo de senha |
| 10 | **Rotas protegidas** | perfil sem acesso → redireciona (comportamento atual mantido) |
| 11 | **Leitura das telas principais** | Funcionários/DSS/EPI/Produção/Indicadores/Gerar-Relatório de premiação/Cargos carregam normalmente |

> Teste-chave de segurança (#5, #6): confirmar via chamada **direta** à RPC (sem passar pelo app) que um não-admin recebe "Não autorizado" e o banco **não** muda.

### Após Fase 2+ (adicionais)
- Sessão expira (Supabase Auth); `localStorage` cru não promove mais a admin.
- Bridge de senha: primeiro login pós-migração define a senha no Auth e funciona.
- `auth.uid()` presente → `get_my_perfil()` retorna o perfil correto.

---

## 9. Riscos restantes após Fase 1 (ainda abertos até Fases 2-4)
- **C2** — RLS `allow_all`: dados ainda world-read/write via anon key. **Só a Fase 3 resolve.**
- **M1** — sessão `localStorage` forjável: gate visual continua contornável até a Fase 2.
- **M2** — login sem rate limit até a Fase 2.
- **M3** — `update_funcionario_setor_ids` anon até Fase 3/4.
- Portanto, **a Fase 1 não é suficiente sozinha** — ela remove o pior vetor (criar admin / resetar senha), mas o endurecimento completo exige as fases seguintes.

---

## 10. O que NÃO fazer nesta etapa
- Não aplicar nenhuma das migrations propostas.
- Não dar `REVOKE` real (quebraria o app anon).
- Não mexer nas policies `allow_all` ainda.
- Não alterar `AuthContext`/`useUsuarios`/UI de forma funcional (apenas documentar o contrato).
- Não tocar em Vercel, `.env`, regra de premiação.

## 11. Próximo passo
Aprovar o destino (Supabase Auth) e a **Fase 1**. Em seguida (Etapa 8C): aplicar `0001_phase1_harden_user_rpcs.sql` em **staging** + a mudança de frontend proposta, rodar o plano de testes §8 (Fase 1), e só então promover.
