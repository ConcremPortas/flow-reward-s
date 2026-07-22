// Agregações de DSS — funções puras.
// Reutiliza (sem duplicar) as fórmulas já existentes no domínio do dashboard:
// dssParticipacaoMedia / participacaoPorLocal (competência-escopadas) e os
// helpers de competência (lastCompetencias/competenciaLabel/shiftCompetencia).
import type { DSS } from '@/hooks/useDSS';
import type { Funcionario } from '@/hooks/useFuncionarios';
import { dssParticipacaoMedia, participacaoPorLocal } from '@/features/dashboard/utils/dss';
import { lastCompetencias, competenciaLabel, inCompetencia } from '@/features/dashboard/utils/dates';
import { linkedActiveFuncionarios } from './dssValidation';
import type { DssHistoryRow, LocationSummary } from '../types';

export { dssParticipacaoMedia, participacaoPorLocal };

const DIAS_RECENTES = 90;

/** Resumo do local para a Etapa 1 — só dados realmente disponíveis. */
export function buildLocationSummary(dssRecords: DSS[], funcionarios: Funcionario[], localDssId: string, now: Date): LocationSummary {
  const doLocal = dssRecords.filter((d) => d.local_dss_id === localDssId);
  const vinculados = linkedActiveFuncionarios(funcionarios, localDssId).length;

  const ordenados = [...doLocal].sort((a, b) => (a.data_realizacao < b.data_realizacao ? 1 : -1));
  const ultimo = ordenados[0];
  const ultimoDss = ultimo ? { data: ultimo.data_realizacao, tema: ultimo.titulo } : null;

  const limite = new Date(now);
  limite.setDate(limite.getDate() - DIAS_RECENTES);
  const limiteStr = limite.toISOString().slice(0, 10);
  const dssRecentes = doLocal.filter((d) => d.data_realizacao >= limiteStr).length;

  let participacaoMedia: number | null = null;
  if (vinculados > 0 && doLocal.length > 0) {
    const taxas = doLocal.map((d) => Math.min((d.participantes_ids || []).length / vinculados, 1));
    participacaoMedia = Number(((taxas.reduce((a, b) => a + b, 0) / taxas.length) * 100).toFixed(1));
  }

  return { vinculados, ultimoDss, dssRecentes, participacaoMedia };
}

/**
 * Linhas do histórico. `totalVinculado` usa o vínculo ATUAL do funcionário ao
 * local (não há histórico de mudança de local) — limitação real, documentada
 * na UI, nunca apresentada como precisão exata do momento do DSS.
 */
export function buildHistoryRows(dssRecords: DSS[], funcionarios: Funcionario[]): DssHistoryRow[] {
  return dssRecords.map((d) => {
    const totalVinculado = d.local_dss_id ? linkedActiveFuncionarios(funcionarios, d.local_dss_id).length : null;
    const presentes = (d.participantes_ids || []).length;
    return {
      id: d.id,
      titulo: d.titulo,
      data_realizacao: d.data_realizacao,
      localNome: d.local_dss?.nome ?? null,
      localId: d.local_dss_id ?? null,
      presentes,
      totalVinculado: totalVinculado && totalVinculado > 0 ? totalVinculado : null,
      participacao: totalVinculado && totalVinculado > 0 ? Number(((presentes / totalVinculado) * 100).toFixed(1)) : null,
    };
  });
}

export interface DssMonthPoint {
  competencia: string;
  label: string;
  quantidade: number;
  participacaoMedia: number | null;
  presentes: number;
  ausentes: number;
}

/** Evolução de N meses (default 12) terminando na competência informada. */
export function buildDssMonthlyEvolution(dssRecords: DSS[], funcionarios: Funcionario[], competencia: string, months = 12): DssMonthPoint[] {
  return lastCompetencias(competencia, months).map((c) => {
    const doMes = dssRecords.filter((d) => inCompetencia(d.data_realizacao, c));
    const presentes = doMes.reduce((a, d) => a + (d.participantes_ids || []).length, 0);
    const ausentes = doMes.reduce((a, d) => {
      const vinc = d.local_dss_id ? linkedActiveFuncionarios(funcionarios, d.local_dss_id).length : 0;
      return a + Math.max(0, vinc - (d.participantes_ids || []).length);
    }, 0);
    return {
      competencia: c,
      label: competenciaLabel(c),
      quantidade: doMes.length,
      participacaoMedia: dssParticipacaoMedia(dssRecords, funcionarios, c),
      presentes,
      ausentes,
    };
  });
}

export interface LowParticipationRow {
  funcionarioId: string;
  nome: string;
  localNome: string | null;
  dssEsperados: number;
  presencas: number;
  taxa: number; // %
}

/**
 * Funcionários com baixa participação. Taxa = presenças ÷ DSS nos quais o
 * funcionário estava vinculado. Exclui eventos anteriores à admissão (campo
 * real `data_admissao`). LIMITAÇÃO REAL: assume que o `local_dss_id` atual do
 * funcionário já era o seu vínculo em todos os eventos passados — não há
 * histórico de mudança de local para reconstruir isso com exatidão.
 */
export function computeLowParticipation(dssRecords: DSS[], funcionarios: Funcionario[], localDssId?: string): LowParticipationRow[] {
  const alvo = localDssId ? funcionarios.filter((f) => f.local_dss_id === localDssId && f.ativo) : funcionarios.filter((f) => f.ativo && f.local_dss_id);

  const rows: LowParticipationRow[] = [];
  for (const f of alvo) {
    const doLocal = dssRecords.filter((d) => d.local_dss_id === f.local_dss_id);
    const vinculados = f.data_admissao ? doLocal.filter((d) => d.data_realizacao >= f.data_admissao!) : doLocal;
    if (vinculados.length === 0) continue;
    const presencas = vinculados.filter((d) => (d.participantes_ids || []).includes(f.id)).length;
    rows.push({
      funcionarioId: f.id,
      nome: f.nome,
      localNome: f.setor?.nome ?? null,
      dssEsperados: vinculados.length,
      presencas,
      taxa: Number(((presencas / vinculados.length) * 100).toFixed(1)),
    });
  }
  return rows.sort((a, b) => a.taxa - b.taxa);
}

export interface TemaDistributionItem { tema: string; quantidade: number }

/** Distribuição de temas — agrupa pelo título do DSS (mesmo campo usado como tema no cadastro). */
export function computeTemaDistribution(dssRecords: DSS[]): TemaDistributionItem[] {
  const map = new Map<string, number>();
  dssRecords.forEach((d) => {
    const key = (d.titulo || '').trim() || 'Sem tema';
    map.set(key, (map.get(key) || 0) + 1);
  });
  return [...map.entries()].map(([tema, quantidade]) => ({ tema, quantidade })).sort((a, b) => b.quantidade - a.quantidade);
}

/** Locais com participação abaixo da referência na competência (reusa participacaoPorLocal). */
export function computeLocaisAbaixoReferencia(dssRecords: DSS[], funcionarios: Funcionario[], competencia: string, threshold = 90): { localId: string; participacao: number }[] {
  const map = participacaoPorLocal(dssRecords, funcionarios, competencia);
  return [...map.entries()]
    .map(([localId, taxa]) => ({ localId, participacao: Number((taxa * 100).toFixed(1)) }))
    .filter((x) => x.participacao < threshold)
    .sort((a, b) => a.participacao - b.participacao);
}
