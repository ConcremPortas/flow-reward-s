import { JobEmployeesShell } from '@/features/job-employees/components/JobEmployeesShell';

/**
 * Rota /cargos-salarios/funcionarios — Central de Enquadramento de Colaboradores.
 * A orquestração vive na feature `job-employees` (2 visões via ?view=
 * colaboradores|pendencias). Esta página apenas monta o shell.
 *
 * Fonte de verdade dos colaboradores = tabela mestre do RH (concremrh_funcionarios,
 * via useFuncionarios) — este módulo NÃO cria cadastro próprio; ele apenas
 * ENQUADRA (vínculo com cargo via concremrh_historico_cargos). Distingue função
 * (RH) de cargo (estrutura), nunca converte função em cargo automaticamente,
 * guarda salário por autorização e não altera banco/RLS nem o motor de premiação.
 */
export default function FuncionariosCargosSalarios() {
  return <JobEmployeesShell />;
}
