// Regras de risco por setor — CENTRALIZADAS (não espalhar pelo JSX).
import { METAS } from './metricDefinitions';
import type { SectorRiskInput, SectorRiskResult, RiskLevel } from './types';

/**
 * Calcula o nível de risco de um setor a partir de regras explícitas e
 * ponderadas. Retorna nível, score e as razões que o justificam.
 */
export function computeSectorRisk(input: SectorRiskInput): SectorRiskResult {
  const reasons: string[] = [];
  let score = 0;

  // Produção abaixo da meta
  if (input.producaoPct != null) {
    if (input.producaoPct < 80) {
      score += 3;
      reasons.push(`Produção crítica (${input.producaoPct.toFixed(0)}%)`);
    } else if (input.producaoPct < METAS.producaoMeta) {
      score += 1;
      reasons.push(`Produção abaixo da meta (${input.producaoPct.toFixed(0)}%)`);
    }
  }

  // Absenteísmo elevado
  if (input.absenteismo != null && input.absenteismo > METAS.absenteismoMax) {
    score += input.absenteismo > METAS.absenteismoMax * 2 ? 3 : 1;
    reasons.push(`Absenteísmo elevado (${input.absenteismo.toFixed(1)})`);
  }

  // Participação em DSS abaixo do limite
  if (input.dssPct != null && input.dssPct < METAS.dssMin) {
    score += input.dssPct < METAS.dssMin - 15 ? 3 : 1;
    reasons.push(`Participação em DSS baixa (${input.dssPct.toFixed(0)}%)`);
  }

  // Pendências de EPI
  if (input.epiPendencias > 0) {
    score += input.epiPendencias >= 3 ? 2 : 1;
    reasons.push(`${input.epiPendencias} pendência(s) de EPI`);
  }

  const level: RiskLevel = score >= 5 ? 'alto' : score >= 2 ? 'medio' : 'baixo';
  return { level, score, reasons };
}
