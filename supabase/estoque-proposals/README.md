# Propostas de schema — módulo Controle de Estoque

Migrations **revisáveis e ainda NÃO aplicadas** do módulo Controle de Estoque
(Gestão de Fardamentos). Ficam **fora** de `supabase/migrations/` de propósito:
não entram no `supabase db push`/CI e devem ser aplicadas **manualmente**, por um
operador, no projeto real da aplicação, de forma deliberada.

## Arquivos
| Ordem | Arquivo | Conteúdo | Status |
|------|---------|----------|--------|
| 0001 | `0001_estoque_schema.sql` | 18 tabelas `concremrh_estoque_*` + constraints + índices + triggers `updated_at` + `ENABLE RLS` (deny-all) | **APLICADO** |
| 0002 | `0002_estoque_rpcs.sql` | Helpers de identidade/permissão + RPCs transacionais (`SECURITY DEFINER`): entrada(multi-item)/entrega/devolução/troca/ajuste/cancelar/estornar + idempotência (`operacao_id`) + guard atômico de saldo + grants | **Proposta** |
| 0003 | `0003_estoque_rls.sql` | Policies RLS: SELECT por acesso ao módulo; escrita direta só em cadastros; transacionais só via RPC | **Proposta** |
| 0004 | `0004_estoque_storage.sql` | Bucket privado `estoque-documentos` (PDF, 10MB) + policies (select/insert por acesso; sem público) + estratégia de órfãos | **Proposta** |

> **Ordem obrigatória:** 0001 → 0002 → 0003 → 0004. O 0002 depende das tabelas do 0001 e das funções de auth (`auth.uid()`, `concremrh_usuarios.auth_user_id`). O 0003 depende dos helpers do 0002 (`estoque_tem_acesso()`).

## Pré-requisitos ANTES de aplicar o 0001
1. **Gate de autenticação fechado**: `VITE_AUTH_MODE=supabase` efetivo no ambiente
   publicado e `auth-bridge` implantada no **mesmo** projeto da app
   (`ewfebwljhmcvuopopqpb`). As RPCs/RLS futuras dependem de `auth.uid()`.
2. Confirmar que o `config.toml` aponta para o projeto correto (hoje diverge:
   `wjwloskftqxudndzegrs` ≠ runtime `ewfebwljhmcvuopopqpb`).
3. Aplicar em **homologação** primeiro; validar; só então produção.

## Notas do 0001
- **Sem dados**: as tabelas nascem vazias (não há migração do SQLite legado).
- **Reuso corporativo por FK**: `concremrh_empresas`, `concremrh_setores`,
  `concremrh_funcionarios`, `concremrh_usuarios` (assumem PK `uuid`).
- **Timestamps** `created_at`/`updated_at` + trigger `update_updated_at_column`.
- **RLS habilitada sem policies** = deny-all (seguro; nada consome as tabelas ainda).
- **Saldo** só muda via RPC (0002). O CHECK `quantidade >= 0` é a rede de segurança.
- **Rollback** incluído (comentado) ao final do 0001.

Aplicar: `psql "$DATABASE_URL" -f 0001_estoque_schema.sql` (ou via editor SQL do
Supabase Studio), com credenciais de operador — **nunca** com service_role no front.
