import { JobsSalariesShell } from '@/features/jobs-salaries/components/JobsSalariesShell';

/**
 * Rota /cargos-salarios — Central de Cargos e Remuneração. A orquestração vive
 * na feature `jobs-salaries` (4 visões via ?view=). Esta página apenas monta o
 * shell. Distingue módulo não implantado (0 cargos) de zeros reais, nunca
 * transforma ausência em zero, e guarda a remuneração por autorização. Não
 * altera banco/RLS nem o motor de premiação. As telas de Cargos e Funcionários
 * permanecem intactas.
 */
export default function CargosSalariosDashboard() {
  return <JobsSalariesShell />;
}
