# Fase 4 — REVOKE de RPC para anon (PROPOSTA — aplicação assistida)

Remove `EXECUTE` do papel `anon` nas RPCs `SECURITY DEFINER` que o app só chama como `authenticated` no modo Supabase Auth. Fecha o vetor de RPCs que ignoram a RLS da Fase 3 (inclui o vazamento de `get_all_funcionario_setor_ids`). Plano completo em [SECURITY_PHASE4_RPC_REVOKE_PLAN_V2.md](../../../SECURITY_PHASE4_RPC_REVOKE_PLAN_V2.md).

> 🔴 **Aplicar só com o app em modo `supabase` (Fase 2 validada).** Em modo `custom`/anon, isto degrada gestão de usuários/setores (o login segue via `concremrh_verify_login`, mantida). Reversível pelo rollback.

## Arquivos
- `0001_phase4_revoke_anon_rpc.sql` — revoke public+anon / grant authenticated+service_role em 6 RPCs; mantém `verify_login` para anon.
- `0001_phase4_revoke_anon_rpc_rollback.sql` — re-concede EXECUTE a PUBLIC (⚠️ reabre para anon).

## Aplicar
SQL Editor → colar `0001_phase4_revoke_anon_rpc.sql` → Run. Depois validar (ver §7 do plano): REST anon deve **negar** as 6 RPCs e **manter** `verify_login`; autenticado deve continuar operando telas de Usuários/Funcionários/etc.

`verify_login`: mantida para anon (login/fallback) — decisão documentada no §5 do plano.
