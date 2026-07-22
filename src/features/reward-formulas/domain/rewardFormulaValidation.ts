// Validação dos pesos — PURA e testável. Não altera pesos, não arredonda em
// silêncio, não recalcula premiação.
//
// Regra (auditada, preservada do cadastro legado): a soma dos 11 pesos deve ser
// 100%. Como os pesos podem ser decimais, usamos uma TOLERÂNCIA pequena para
// evitar comparação frágil de ponto flutuante (não afeta o motor — é gate de
// salvamento no frontend).
import { CRITERIOS } from './rewardFormulaDefinitions';
import { sumWeights, activeCriteria, type WeightMap } from './rewardFormulaWeights';

export const WEIGHT_TOLERANCE = 0.05; // pontos percentuais

export interface WeightValidation {
  total: number;
  missing: number;   // quanto falta para 100 (0 se completo/excede)
  excess: number;    // quanto excede 100 (0 se completo/falta)
  valid: boolean;    // |total-100| <= tolerância
  activeCriteria: number;
  errors: string[];
  warnings: string[];
}

export function validateFormulaWeights(w: WeightMap): WeightValidation {
  const total = Math.round(sumWeights(w) * 100) / 100;
  const diff = total - 100;
  const missing = diff < -WEIGHT_TOLERANCE ? Math.round(-diff * 100) / 100 : 0;
  const excess = diff > WEIGHT_TOLERANCE ? Math.round(diff * 100) / 100 : 0;
  const ativos = activeCriteria(w).length;
  const valid = Math.abs(diff) <= WEIGHT_TOLERANCE;

  const errors: string[] = [];
  const warnings: string[] = [];
  if (missing > 0) errors.push(`Faltam ${formatPct(missing)} para completar 100%.`);
  if (excess > 0) errors.push(`Excede 100% em ${formatPct(excess)}.`);
  for (const c of CRITERIOS) {
    const v = w[c.key] || 0;
    if (v < 0) errors.push(`O peso de ${c.label} não pode ser negativo.`);
    if (v > 100) warnings.push(`O peso de ${c.label} está acima de 100%.`);
  }
  if (ativos === 0) errors.push('Nenhum critério com peso definido.');

  return { total, missing, excess, valid: valid && errors.length === 0, activeCriteria: ativos, errors, warnings };
}

function formatPct(n: number): string {
  return `${n.toLocaleString('pt-BR', { minimumFractionDigits: Number.isInteger(n) ? 0 : 1, maximumFractionDigits: 1 })}%`;
}

export function isValidFormulaName(nome: string): boolean {
  return (nome ?? '').trim().length > 0;
}
