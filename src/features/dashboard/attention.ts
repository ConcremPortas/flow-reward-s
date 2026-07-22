// Central de Atenção — fila priorizada derivada da matriz de setores.
import type { AttentionItem, MetricStatus, SectorRow } from './types';
import { METAS } from './metricDefinitions';

const SEV_RANK: Record<MetricStatus, number> = { critical: 0, warning: 1, positive: 2, info: 3, neutral: 4 };
const ROTAS = {
  producao: '/premiacoes/producao-setor',
  faltas: '/premiacoes/faltas-advertencias',
  epi: '/premiacoes/epi',
  dss: '/premiacoes/dss',
};

export function buildAttention(rows: SectorRow[]): AttentionItem[] {
  const items: AttentionItem[] = [];
  const push = (
    severity: MetricStatus, situacao: string, setor: string | null,
    impacto: string, responsavel: string | null, module: string,
  ) => items.push({ id: String(items.length), severity, situacao, setor, impacto, responsavel, prazo: null, module });

  rows.forEach(r => {
    if (r.producaoPct != null && r.producaoPct < METAS.producaoMeta) {
      push(r.producaoPct < 80 ? 'critical' : 'warning', 'Produção abaixo da meta', r.setor,
        `${r.producaoPct.toFixed(0)}% de atingimento · ${r.headcount} pessoas`, r.gestor, ROTAS.producao);
    }
    if (r.absenteismo != null && r.absenteismo > METAS.absenteismoMax) {
      push(r.absenteismo > METAS.absenteismoMax * 2 ? 'critical' : 'warning', 'Absenteísmo elevado', r.setor,
        `Índice ${r.absenteismo.toFixed(1)} · ${r.headcount} pessoas`, r.gestor, ROTAS.faltas);
    }
    if (r.epiPendencias > 0) {
      push(r.epiPendencias >= 3 ? 'critical' : 'warning', 'Pendências de EPI', r.setor,
        `${r.epiPendencias} não conformidade(s)`, r.gestor, ROTAS.epi);
    }
    if (r.dssPct != null && r.dssPct < METAS.dssMin) {
      push('warning', 'Participação em DSS baixa', r.setor,
        `${r.dssPct.toFixed(0)}% (meta ≥ ${METAS.dssMin}%)`, r.gestor, ROTAS.dss);
    }
    if (r.advertencias >= 3) {
      push('warning', 'Concentração de advertências', r.setor,
        `${r.advertencias} advertência(s) no período`, r.gestor, ROTAS.faltas);
    }
  });

  return items.sort((a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity]);
}
