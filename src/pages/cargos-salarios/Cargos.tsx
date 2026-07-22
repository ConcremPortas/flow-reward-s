import { JobsShell } from '@/features/jobs/components/JobsShell';

/**
 * Rota /cargos-salarios/cargos — Central de Estrutura de Cargos. A orquestração
 * vive na feature `jobs` (2 visões via ?view=lista|estrutura). Esta página apenas
 * monta o shell. Distingue módulo não implantado (0 cargos), deriva situação e
 * ocupação (via enquadramento, nunca funcao_id), guarda a faixa por autorização,
 * investiga dependências antes de inativar/excluir e não altera banco/RLS nem o
 * motor de premiação.
 */
export default function Cargos() {
  return <JobsShell />;
}
