# Fase 2 — Migração para Supabase Auth (PROPOSTAS — NÃO APLICAR)

Artefatos **propostos** (Etapa 8D). Nada aqui deve ser aplicado/implantado nesta etapa. Plano completo em [SECURITY_AUTH_MIGRATION_PLAN_V2.md](../../../SECURITY_AUTH_MIGRATION_PLAN_V2.md).

| Arquivo | O que é | Como aplicar (quando aprovado) |
|---------|---------|-------------------------------|
| `0001_auth_link_and_profile.sql` | FK `auth_user_id → auth.users`, índice único, RPC `get_my_profile()` | SQL Editor / migration (como `postgres`) |
| `link-migrate-users.mjs` | Cria auth users p/ cada `concremrh_usuarios` e grava `auth_user_id` | `node` com `SUPABASE_SERVICE_ROLE_KEY` no ambiente |
| `auth-bridge.function.ts` | Edge Function que migra a senha no 1º login (estratégia bridge) | `supabase functions deploy auth-bridge` |

## Ordem sugerida (Fase 2)
1. Aplicar `0001_auth_link_and_profile.sql` em **staging**.
2. Rodar `link-migrate-users.mjs --dry-run` e depois real (cria auth users + vincula).
3. Implantar `auth-bridge` (Edge Function).
4. Ativar o **feature flag** `VITE_AUTH_MODE=supabase` em staging; validar login (bridge migra a senha no 1º acesso).
5. Promover para produção; manter `custom` como fallback via flag.

## Regras de segurança
- **`service_role` é secreto** — só em variáveis de ambiente do servidor/Edge; nunca no frontend, nunca em commit.
- Nenhuma credencial/dado pessoal neste diretório.
- Tudo reversível — ver seções ROLLBACK no SQL e no plano.
