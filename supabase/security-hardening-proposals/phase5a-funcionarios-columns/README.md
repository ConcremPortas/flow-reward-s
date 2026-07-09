# Fase 5A — Proteção de colunas sensíveis de `funcionarios` (PROPOSTA — NÃO APLICAR)

Esconde `salario` e `email` (+ `data_nascimento`/`telefone`, não usados) da leitura operacional/base, expondo-os por perfil via **view guardada**. Plano completo em [SECURITY_PHASE5A_FUNCIONARIOS_COLUMNS_PLAN_V2.md](../../../SECURITY_PHASE5A_FUNCIONARIOS_COLUMNS_PLAN_V2.md).

> 🔑 **`cpf` é o "Código Funcionário"** (chave de premiação/Faltas/import) → **mantido** no resumo. Alvos: `salario`, `email`.

## Decisões (2026-07-09)
- **salário:** só `admin` **ou** `has_secao('cargos_salarios')`. RH **não** vê por padrão (precisa da seção cargos_salarios).
- **e-mail:** só `admin`, `rh` **ou** `cargos_salarios`. SESMT/Produção não recebem.
- **resumo operacional:** sem `salario`/`email`/`telefone`/`data_nascimento`; mantém `cpf`.

> ⚠️ **Aplicar junto com o ajuste de hooks (Fase 5B)**: `useFuncionarios` faz `select('*')`, que pode falhar no grant de coluna. Narrar o select antes/junto.

## Arquivos
- `0001_phase5a_funcionarios_column_security.sql` — grant por coluna (esconde salario/email/data_nascimento/telefone) + views `concremrh_funcionarios_sensivel` (guardada, gate por coluna) e `concremrh_funcionarios_resumo` (projeção operacional).
- `0001_phase5a_funcionarios_column_security_rollback.sql` — re-grant de tabela inteira + drop das views.

## Enforcement x conveniência
- **Enforcement real:** grant a nível de coluna na tabela base (papel `authenticated`).
- **Views:** projeção segura/guardada que as telas consomem. Diferenciação por perfil (rh/sesmt/cargos) só é possível na **view guardada** (`has_secao`/`is_admin`), porque todos os usuários compartilham o papel `authenticated`.

Validar pelo checklist §8 do plano após aplicar em staging.
