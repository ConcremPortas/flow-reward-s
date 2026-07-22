// Análise OBSERVACIONAL do nome × parâmetro cadastrado. Pura. NÃO altera dados,
// NÃO recalcula premiação, NÃO bloqueia edição.
//
// Para bases percentuais com "%" no nome (KIT 25%, KIT 200%): extrai o percentual
// do nome e compara com o `valor_base`. A diferença pode ser intencional — no
// motor, o percentual do NOME é o multiplicador dos kits, enquanto `valor_base` é
// um campo separado (decorativo para o cálculo). Por isso é "possível diferença",
// nunca "erro".
import type { RewardBaseNameAnalysis, RewardBaseTipo } from '../types/reward-base.types';

const PERCENT_RE = /(\d+(?:[.,]\d+)?)\s*%/;
const HAS_PERCENT_HINT = /%/;

/** Extrai o percentual do nome (primeira ocorrência), ou null. */
export function parsePercentFromName(nome: string): number | null {
  const m = (nome ?? '').match(PERCENT_RE);
  if (!m) return null;
  const n = Number(m[1].replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

const EPS = 0.001;

/**
 * Analisa o nome vs. o parâmetro. Só faz sentido para tipo percentual (comparar
 * "%") — para valor_fixo, um "%" no nome é apenas texto (sem_percentual).
 */
export function analyzeName(nome: string, tipo: RewardBaseTipo, valorBase: number): RewardBaseNameAnalysis {
  const hint = HAS_PERCENT_HINT.test(nome ?? '');
  const pct = parsePercentFromName(nome);

  if (!hint && pct == null) return { state: 'sem_percentual', percentualNoNome: null, temPercentualNoNome: false };
  if (pct == null) return { state: 'nao_interpretavel', percentualNoNome: null, temPercentualNoNome: true };
  // Percentual no nome, mas base não é percentual → apenas sinaliza a presença.
  if (tipo !== 'percentual') return { state: 'diferente', percentualNoNome: pct, temPercentualNoNome: true };
  const igual = Math.abs(pct - (valorBase ?? 0)) <= EPS;
  return { state: igual ? 'igual' : 'diferente', percentualNoNome: pct, temPercentualNoNome: true };
}
