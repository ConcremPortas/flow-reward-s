# Propostas de endurecimento de segurança — NÃO APLICAR AINDA

Migrations **propostas** (Etapa 8B da Reforma V2) para corrigir os riscos críticos do [SECURITY_AUDIT_V2.md](../../SECURITY_AUDIT_V2.md). **Nenhuma delas deve ser aplicada nesta etapa** — são para revisão/aprovação. Plano completo em [SECURITY_HARDENING_PLAN_V2.md](../../SECURITY_HARDENING_PLAN_V2.md).

> Esta pasta é **separada** de `supabase/migrations-v2/` de propósito: nada aqui roda automaticamente numa aplicação de migrations. Ao aprovar, mover/renumerar para o fluxo oficial.

## Arquivos

| Arquivo | O que faz | Reversível por |
|---------|-----------|----------------|
| `0001_phase1_harden_user_rpcs.sql` | **Fase 1** — recria `concremrh_create_user` e `concremrh_update_user_password` exigindo **re-autenticação de admin** (email+senha conferidos por bcrypt) antes de agir. Fecha o C1 sem depender de Supabase Auth. | `0001_phase1_rollback.sql` |
| `0001_phase1_rollback.sql` | Restaura as funções originais (sem authz) de `0008`. ⚠️ reabre o C1. | — |

## Por que re-autenticação (e não REVOKE) na Fase 1?
Hoje o app roda como `anon` (auth custom, sem `auth.uid()`). **Revogar EXECUTE do anon quebraria a gestão de usuário.** Por isso a Fase 1 mantém a função executável, mas **exige credencial de admin dentro dela** (SECURITY DEFINER). O `REVOKE` entra na **Fase 2**, depois da migração para Supabase Auth (quando o app chamar como `authenticated`).

## Dependência de frontend
A Fase 1 muda a **assinatura** das duas RPCs (passam a receber `p_admin_email`/`p_admin_password`). O frontend precisa passar essas credenciais — ver a mudança **proposta** (não aplicada) em [SECURITY_HARDENING_PLAN_V2.md](../../SECURITY_HARDENING_PLAN_V2.md) (§ Impacto no frontend). Aplicar o SQL e o frontend **juntos**.

## Como validar (resumo)
Após aplicar em um ambiente de teste, confirmar:
- Admin consegue criar usuário e resetar senha (com sua senha correta).
- Chamada **sem** credencial de admin (ou com senha errada) retorna `{ ok:false, error:'Não autorizado' }` e **não** escreve.
Detalhes no plano de testes do `SECURITY_HARDENING_PLAN_V2.md`.
