// Geração de insights gerenciais — puro. Ordena por severidade.
import type { Insight, MetricStatus } from '../types';
import { METAS } from '../metricDefinitions';
import { fmtInt, fmtCurrency, fmtDeltaPct } from './format';

export interface InsightInput {
  headcountDelta: number;
  desligamentos: number;
  desligamentosPrev: number;
  turnover: number | null;
  absenteismo: number | null;
  absenteismoPrev: number | null;
  premiacao: number;
  premiacaoDeltaPct: number | null;
  producaoGlobal: number | null;
  setoresAbaixo: number;
  epiAbertas: number;
  dssPart: number | null;
}

const SEV_RANK: Record<MetricStatus, number> = { critical: 0, warning: 1, positive: 2, info: 3, neutral: 4 };

const ROTAS = {
  faltas: '/premiacoes/faltas-advertencias',
  funcionarios: '/premiacoes/funcionarios',
  producao: '/premiacoes/producao-setor',
  epi: '/premiacoes/epi',
  dss: '/premiacoes/dss',
  premiacao: '/premiacoes/relatorio-premiacoes',
};

export function buildInsights(i: InsightInput): Insight[] {
  const out: Insight[] = [];
  const add = (severity: MetricStatus, title: string, detail: string, module: string) =>
    out.push({ id: String(out.length), severity, title, detail, module });

  // Absenteísmo
  if (i.absenteismo != null) {
    const varTxt = i.absenteismoPrev != null
      ? ` (${i.absenteismo > i.absenteismoPrev ? 'alta' : i.absenteismo < i.absenteismoPrev ? 'queda' : 'estável'} vs. período anterior)`
      : '';
    if (i.absenteismo > METAS.absenteismoMax * 2) {
      add('critical', 'Absenteísmo crítico', `Índice de ${i.absenteismo.toFixed(1)} — acima do dobro da meta (${METAS.absenteismoMax})${varTxt}.`, ROTAS.faltas);
    } else if (i.absenteismo > METAS.absenteismoMax) {
      add('warning', 'Absenteísmo acima da meta', `Índice de ${i.absenteismo.toFixed(1)} — meta de referência ≤ ${METAS.absenteismoMax}${varTxt}.`, ROTAS.faltas);
    } else if (i.absenteismoPrev != null && i.absenteismo < i.absenteismoPrev) {
      add('positive', 'Absenteísmo em queda', `Redução para ${i.absenteismo.toFixed(1)}, dentro da meta de referência.`, ROTAS.faltas);
    }
  }

  // Turnover
  if (i.turnover != null && i.turnover > METAS.turnoverMax) {
    add(i.turnover > METAS.turnoverMax * 2 ? 'critical' : 'warning', 'Turnover acima da meta',
      `Turnover de ${i.turnover.toFixed(2)}% no período — meta de referência ≤ ${METAS.turnoverMax}%.`, ROTAS.funcionarios);
  }

  // Desligamentos
  if (i.desligamentos > 0 && i.desligamentos > i.desligamentosPrev) {
    add('warning', 'Aumento de desligamentos',
      `${fmtInt(i.desligamentos)} desligamento(s) no período (ante ${fmtInt(i.desligamentosPrev)} no anterior).`, ROTAS.funcionarios);
  }

  // Quadro
  if (i.headcountDelta > 0) {
    add('info', 'Crescimento do quadro', `+${fmtInt(i.headcountDelta)} colaborador(es) ativo(s) vs. período anterior.`, ROTAS.funcionarios);
  } else if (i.headcountDelta < 0) {
    add('warning', 'Redução do quadro', `${fmtInt(i.headcountDelta)} colaborador(es) ativo(s) vs. período anterior.`, ROTAS.funcionarios);
  }

  // Produção
  if (i.setoresAbaixo > 0) {
    add('warning', 'Setores abaixo da meta de produção',
      `${fmtInt(i.setoresAbaixo)} setor(es) com atingimento < 100%${i.producaoGlobal != null ? ` — média global ${i.producaoGlobal.toFixed(0)}%` : ''}.`, ROTAS.producao);
  } else if (i.producaoGlobal != null && i.producaoGlobal >= METAS.producaoMeta) {
    add('positive', 'Produção dentro da meta', `Atingimento global de ${i.producaoGlobal.toFixed(0)}% no período.`, ROTAS.producao);
  }

  // EPI
  if (i.epiAbertas > 0) {
    add(i.epiAbertas >= 5 ? 'critical' : 'warning', 'Pendências de EPI',
      `${fmtInt(i.epiAbertas)} não conformidade(s) de EPI registrada(s) no período.`, ROTAS.epi);
  }

  // DSS
  if (i.dssPart != null) {
    if (i.dssPart < METAS.dssMin) {
      add('warning', 'Participação em DSS abaixo do limite', `Participação média de ${i.dssPart.toFixed(0)}% — meta de referência ≥ ${METAS.dssMin}%.`, ROTAS.dss);
    } else {
      add('positive', 'Boa participação em DSS', `Participação média de ${i.dssPart.toFixed(0)}% no período.`, ROTAS.dss);
    }
  }

  // Premiação
  if (i.premiacaoDeltaPct != null && Math.abs(i.premiacaoDeltaPct) >= 5) {
    const subiu = i.premiacaoDeltaPct > 0;
    add(subiu ? 'info' : 'warning', subiu ? 'Alta na premiação projetada' : 'Queda na premiação projetada',
      `${fmtCurrency(i.premiacao)} projetado — ${fmtDeltaPct(i.premiacaoDeltaPct)} vs. período anterior.`, ROTAS.premiacao);
  }

  return out.sort((a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity]);
}
