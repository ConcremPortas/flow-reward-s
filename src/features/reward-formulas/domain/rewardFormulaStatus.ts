// Situação cadastral da fórmula — função PURA, fonte única.
import type { WeightValidation } from './rewardFormulaValidation';
import type { FormulaStatus, FormulaUsage } from '../types/reward-formula.types';

interface Input {
  validation: WeightValidation;
  usage: FormulaUsage;
  duplicado: boolean;
  temAplicacao: boolean; // categoria_id e base_premiacao_id definidos
}

export function getFormulaStatus({ validation, usage, duplicado, temAplicacao }: Input): FormulaStatus {
  const motivos: string[] = [];
  if (duplicado) motivos.push('Existe outra fórmula ativa para a mesma combinação de categoria e base (a primeira por nome prevalece no cálculo).');
  if (!validation.valid) motivos.push(...validation.errors);
  if (!temAplicacao) motivos.push('Categoria e/ou base não definidas — o motor só a encontra pelo nome (fallback).');

  let status: FormulaStatus['status'];
  let descricao: string;
  if (duplicado) {
    status = 'possivel_duplicidade';
    descricao = 'Possível duplicidade de aplicação (categoria × base).';
  } else if (!validation.valid) {
    status = 'incompleta';
    descricao = validation.excess > 0 ? 'A soma dos pesos excede 100%.' : 'A soma dos pesos não fecha 100%.';
  } else if (!temAplicacao) {
    status = 'revisar';
    descricao = 'Fórmula sem categoria/base definidas.';
  } else {
    status = 'regular';
    descricao = usage.emUso ? 'Fórmula regular e em uso.' : 'Fórmula regular.';
  }
  return { status, motivos, descricao };
}

export const FORMULA_STATUS_META: Record<FormulaStatus['status'], { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  regular: { label: 'Regular', variant: 'success' },
  incompleta: { label: 'Incompleta', variant: 'danger' },
  revisar: { label: 'Revisar', variant: 'warning' },
  possivel_duplicidade: { label: 'Possível duplicidade', variant: 'warning' },
};
