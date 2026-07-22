// Formatação e parsing do parâmetro da base — pt-BR. Puro. Reutiliza os
// formatadores globais (não recria infraestrutura de locale/moeda).
import { formatCurrencyBRL, formatPercentBR } from '@/lib/formatters';
import type { RewardBaseTipo } from '../types/reward-base.types';

/** Formata o parâmetro conforme o tipo (percentual → "100,0%"; valor_fixo → "R$ ..."). */
export function formatParameter(tipo: RewardBaseTipo, valor: number): string {
  if (tipo === 'valor_fixo') return formatCurrencyBRL(valor);
  return formatPercentBR(valor, Number.isInteger(valor) ? 0 : 1);
}

/** Rótulo e unidade do campo de parâmetro conforme o tipo. */
export const TIPO_META: Record<RewardBaseTipo, { label: string; paramLabel: string; unidade: string; placeholder: string }> = {
  percentual: { label: 'Percentual', paramLabel: 'Percentual base', unidade: '%', placeholder: 'Ex: 100' },
  valor_fixo: { label: 'Valor fixo', paramLabel: 'Valor base', unidade: 'R$', placeholder: 'Ex: 1.500,00' },
};

/**
 * Parse pt-BR de número (aceita "1.250,50", "100", "100.5", "25,0"). Mesma
 * heurística de vírgula-decimal usada nas outras telas. Retorna null se inválido.
 */
export function parseNumberBR(input: string | null | undefined): number | null {
  if (input == null) return null;
  let s = String(input).trim().replace(/[R$%\s]/g, '');
  if (!s) return null;
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  if (hasComma && hasDot) s = s.replace(/\./g, '').replace(',', '.'); // 1.250,50
  else if (hasComma) s = s.replace(',', '.');                          // 100,5
  // só ponto ou só dígitos: já está no formato JS
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/** Máscara leve para entrada numérica (mantém dígitos, vírgula, ponto, sinal). */
export function maskNumberInput(input: string): string {
  return (input ?? '').replace(/[^\d.,-]/g, '');
}
