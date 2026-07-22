// Índice de Saúde do RH (0..100) — pesos centralizados e fórmula exposta.
import { METAS } from './metricDefinitions';
import type { HealthComponent, HealthIndex, MetricStatus } from './types';

export const HEALTH_WEIGHTS = {
  presenca: 25,       // presença / absenteísmo
  estabilidade: 20,   // turnover
  seguranca: 20,      // DSS + EPI
  desempenho: 20,     // produção
  premiacao: 15,      // elegibilidade / engajamento
} as const;

const clamp = (v: number, min = 0, max = 100) => Math.max(min, Math.min(max, v));

export interface HealthInput {
  absenteismo: number | null;
  turnover: number | null;
  dssPart: number | null;
  epiAbertas: number;
  producaoGlobal: number | null;
  elegibilidadePct: number | null;
}

export function computeHealthIndex(i: HealthInput): HealthIndex {
  const raw: Array<Omit<HealthComponent, 'weight'> & { baseWeight: number }> = [];

  // Presença (absenteísmo)
  raw.push({
    key: 'presenca',
    label: 'Presença & absenteísmo',
    baseWeight: HEALTH_WEIGHTS.presenca,
    available: i.absenteismo != null,
    score: i.absenteismo == null ? 0 : clamp(100 - Math.max(0, i.absenteismo - METAS.absenteismoMax) * 8),
    detail: i.absenteismo == null ? 'Sem dados de faltas' : `Índice ${i.absenteismo.toFixed(1)} (meta ≤ ${METAS.absenteismoMax})`,
  });

  // Estabilidade (turnover)
  raw.push({
    key: 'estabilidade',
    label: 'Estabilidade do quadro',
    baseWeight: HEALTH_WEIGHTS.estabilidade,
    available: i.turnover != null,
    score: i.turnover == null ? 0 : clamp(100 - Math.max(0, i.turnover - METAS.turnoverMax) * 20),
    detail: i.turnover == null ? 'Sem dados' : `Turnover ${i.turnover.toFixed(2)}% (meta ≤ ${METAS.turnoverMax}%)`,
  });

  // Segurança & conformidade (DSS + EPI)
  const temSeg = i.dssPart != null || i.epiAbertas >= 0;
  const dssScore = i.dssPart == null ? 70 : clamp((i.dssPart / METAS.dssMin) * 100);
  const epiPenalty = Math.min(i.epiAbertas * 8, 50);
  raw.push({
    key: 'seguranca',
    label: 'Segurança & conformidade',
    baseWeight: HEALTH_WEIGHTS.seguranca,
    available: temSeg,
    score: clamp(dssScore - epiPenalty),
    detail: `DSS ${i.dssPart == null ? 's/ dados' : i.dssPart.toFixed(0) + '%'} · EPI ${i.epiAbertas} pend.`,
  });

  // Desempenho operacional (produção)
  raw.push({
    key: 'desempenho',
    label: 'Desempenho operacional',
    baseWeight: HEALTH_WEIGHTS.desempenho,
    available: i.producaoGlobal != null,
    score: i.producaoGlobal == null ? 0 : clamp(i.producaoGlobal),
    detail: i.producaoGlobal == null ? 'Sem dados de produção' : `Atingimento ${i.producaoGlobal.toFixed(0)}%`,
  });

  // Premiação & engajamento (elegibilidade)
  raw.push({
    key: 'premiacao',
    label: 'Premiação & engajamento',
    baseWeight: HEALTH_WEIGHTS.premiacao,
    available: i.elegibilidadePct != null,
    score: i.elegibilidadePct == null ? 0 : clamp(i.elegibilidadePct),
    detail: i.elegibilidadePct == null ? 'Sem dados' : `Elegibilidade ${i.elegibilidadePct.toFixed(0)}%`,
  });

  // Redistribui peso dos componentes sem dados entre os disponíveis
  const totalBase = raw.reduce((a, c) => a + c.baseWeight, 0);
  const availBase = raw.filter(c => c.available).reduce((a, c) => a + c.baseWeight, 0);
  const partial = raw.some(c => !c.available);

  const components: HealthComponent[] = raw.map(c => ({
    key: c.key,
    label: c.label,
    score: c.score,
    available: c.available,
    detail: c.detail,
    weight: c.available && availBase > 0 ? (c.baseWeight / availBase) * 100 : 0,
  }));

  const score = availBase > 0
    ? Math.round(components.reduce((a, c) => a + (c.available ? c.score * (c.weight / 100) : 0), 0))
    : 0;

  const status: MetricStatus = score >= 80 ? 'positive' : score >= 60 ? 'info' : score >= 40 ? 'warning' : 'critical';

  // Mantém referência ao totalBase para docs (fórmula exposta)
  void totalBase;
  return { score, partial, status, components };
}
