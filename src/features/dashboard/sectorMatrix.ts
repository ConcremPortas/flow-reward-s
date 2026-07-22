// Monta a matriz de performance por setor + pontos do gráfico Pessoas × Resultado.
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { Setor } from '@/hooks/useSetores';
import type { FaltaAdvertencia } from '@/hooks/useFaltasAdvertencias';
import type { DSS } from '@/hooks/useDSS';
import type { EPI } from '@/hooks/useEPI';
import type { ProducaoSetor } from '@/hooks/useProducaoSetor';
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
import type { SectorRow, ScatterPoint } from './types';
import { computeSectorRisk } from './riskRules';
import { producaoPorSetor } from './utils/producao';
import { totalFaltas, totalAdvertencias, absenteismoIndex } from './utils/absenteeism';
import { epiResumo } from './utils/epi';
import { participacaoPorLocal, dssParticipacaoSetor } from './utils/dss';
import { resultadosDaCompetencia } from './utils/rewards';

export interface SectorDatasets {
  setores: Setor[];
  funcionarios: Funcionario[];
  faltas: FaltaAdvertencia[];
  dss: DSS[];
  epi: EPI[];
  producao: ProducaoSetor[];
  resultados: ResultadoPremiacao[];
}

const elegivel = (f: Funcionario) =>
  f.ativo && !!f.base_premiacao_id && !!f.categoria_id && !!f.faixa_id;

export function buildSectorMatrix(
  ds: SectorDatasets,
  comp: string,
  setorIds?: Set<string>,
): SectorRow[] {
  const prodMap = producaoPorSetor(ds.producao, comp, setorIds);
  const localPart = participacaoPorLocal(ds.dss, ds.funcionarios, comp);

  // Premiação média por setor (nome)
  const resComp = resultadosDaCompetencia(ds.resultados, comp);
  const premBySetor = new Map<string, { soma: number; n: number }>();
  resComp.forEach(r => {
    if (!r.setor) return;
    const cur = premBySetor.get(r.setor) || { soma: 0, n: 0 };
    cur.soma += r.bonus_alcancado || 0; cur.n += 1;
    premBySetor.set(r.setor, cur);
  });

  const setores = setorIds ? ds.setores.filter(s => setorIds.has(s.id)) : ds.setores;

  return setores.map(s => {
    const funcs = ds.funcionarios.filter(f => f.setor_id === s.id);
    const ativos = funcs.filter(f => f.ativo);
    const headcount = ativos.length;
    const ids = new Set(ativos.map(f => f.id));

    const faltas = totalFaltas(ds.faltas, comp, ids);
    const absenteismo = absenteismoIndex(faltas, headcount);
    const advert = totalAdvertencias(ds.faltas, comp, ids);
    const producaoPct = prodMap.get(s.id) ?? null;
    const dssPct = dssParticipacaoSetor(localPart, ativos);
    const epiPend = epiResumo(ds.epi, comp, ids).abertas;
    const eleg = ativos.filter(elegivel).length;
    const prem = premBySetor.get(s.nome);
    const premiacaoMedia = prem && prem.n > 0 ? prem.soma / prem.n : null;

    const risco = computeSectorRisk({ producaoPct, absenteismo, dssPct, epiPendencias: epiPend });

    return {
      setorId: s.id,
      setor: s.nome,
      unidade: s.empresa?.nome ?? null,
      gestor: s.supervisor?.nome ?? s.encarregado?.nome ?? null,
      headcount,
      producaoPct,
      absenteismo,
      dssPct,
      epiPendencias: epiPend,
      horasExtras: null,
      premiacaoMedia,
      elegibilidadePct: headcount > 0 ? Number(((eleg / headcount) * 100).toFixed(0)) : null,
      advertencias: advert,
      risco,
    };
  });
}

export function toScatter(rows: SectorRow[]): ScatterPoint[] {
  return rows
    .filter(r => r.headcount > 0 && r.producaoPct != null)
    .map(r => ({
      setorId: r.setorId,
      setor: r.setor,
      headcount: r.headcount,
      producaoPct: r.producaoPct as number,
      premiacaoMedia: r.premiacaoMedia ?? 0,
      risco: r.risco.level,
      absenteismo: r.absenteismo,
      dssPct: r.dssPct,
      epiPendencias: r.epiPendencias,
    }));
}
