// Regra de elegibilidade para premiação — centralizada e explícita.
// Espelha o filtro real usado em src/pages/GerarPremiacoes.tsx:
//   funcionariosAtivos = funcionarios.filter(f => f.ativo && f.base_premiacao_id === baseId && ...)
// e o lookup de fórmula, que depende de categoria_id + base_premiacao_id + faixa.
// Não recalcula nem duplica o motor de premiação — apenas classifica o cadastro.
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { EligibilityStatus } from '../types';

const isInactiveStatus = (status?: string) => {
  const s = (status || '').toLowerCase();
  return s === 'rescisão' || s === 'rescisao';
};

export function getEmployeeEligibility(f: Funcionario): EligibilityStatus {
  if (!f.ativo || isInactiveStatus(f.status)) return 'fora_premiacao';
  if (!f.base_premiacao_id) return 'nao_elegivel';
  if (!f.categoria_id || !f.faixa_id) return 'pendente';
  return 'elegivel';
}

export const ELIGIBILITY_LABEL: Record<EligibilityStatus, string> = {
  elegivel: 'Elegível',
  pendente: 'Pendente',
  nao_elegivel: 'Não elegível',
  fora_premiacao: 'Fora da premiação',
};
