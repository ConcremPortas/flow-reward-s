// Agregações de faltas/advertências — funções puras.
// Reutiliza (sem duplicar) as fórmulas reais do motor de premiação para expor
// o "impacto na premiação" de uma quantidade de ocorrências.
import { calcularNotaFaltas, calcularNotaAdvertencias } from '@/domain/premiacao/calculoPremiacao';
import { lastCompetencias, competenciaLabel } from '@/features/dashboard/utils/dates';
import type { OccurrenceHistoryRow, OccurrenceMonthPoint } from '../types';

export { calcularNotaFaltas, calcularNotaAdvertencias };

export interface PeriodTotals {
  totalFaltas: number;
  totalAdvertencias: number;
  pessoasComOcorrencia: number;
}

/** Registros de uma tabela (funcionario_id, tipo, quantidade, data_ocorrencia) filtrados por competência 'YYYY-MM'. */
export interface OccurrenceRecordLike {
  funcionario_id?: string;
  tipo: string;
  quantidade?: number;
  data_ocorrencia: string;
}

export const inCompetencia = (dataOcorrencia: string, competencia: string): boolean =>
  dataOcorrencia?.slice(0, 7) === competencia;

export function computePeriodTotals(registros: OccurrenceRecordLike[], competencia: string): PeriodTotals {
  const doMes = registros.filter((r) => inCompetencia(r.data_ocorrencia, competencia));
  const pessoas = new Set<string>();
  let totalFaltas = 0;
  let totalAdvertencias = 0;
  doMes.forEach((r) => {
    const qtd = r.quantidade || 1;
    if (r.tipo === 'falta') totalFaltas += qtd;
    if (r.tipo === 'advertencia') totalAdvertencias += qtd;
    if (r.funcionario_id) pessoas.add(r.funcionario_id);
  });
  return { totalFaltas, totalAdvertencias, pessoasComOcorrencia: pessoas.size };
}

/** Evolução de N meses (default 12) terminando na competência informada. */
export function buildMonthlyEvolution(registros: OccurrenceRecordLike[], competencia: string, months = 12): OccurrenceMonthPoint[] {
  return lastCompetencias(competencia, months).map((c) => {
    const t = computePeriodTotals(registros, c);
    return { competencia: c, label: competenciaLabel(c), totalFaltas: t.totalFaltas, totalAdvertencias: t.totalAdvertencias, pessoasComOcorrencia: t.pessoasComOcorrencia };
  });
}

/** Nota resultante (mesma fórmula do motor) para uma quantidade de faltas/advertências. */
export function computeImpactoPremiacao(faltas: number, advertencias: number) {
  return {
    notaFaltas: calcularNotaFaltas(faltas),
    notaAdvertencias: calcularNotaAdvertencias(advertencias),
  };
}

export interface SetorAgg {
  setor: string;
  faltas: number;
  advertencias: number;
  pessoas: number;
}

/** Agregação por setor na competência (precisa do mapa funcionarioId -> setorNome). */
export function aggregateBySetor(
  registros: OccurrenceRecordLike[],
  competencia: string,
  setorPorFuncionario: Map<string, string | null>,
): SetorAgg[] {
  const doMes = registros.filter((r) => inCompetencia(r.data_ocorrencia, competencia));
  const map = new Map<string, { faltas: number; advertencias: number; pessoas: Set<string> }>();
  doMes.forEach((r) => {
    const setor = (r.funcionario_id ? setorPorFuncionario.get(r.funcionario_id) : null) || 'Sem setor';
    const cur = map.get(setor) || { faltas: 0, advertencias: 0, pessoas: new Set<string>() };
    const qtd = r.quantidade || 1;
    if (r.tipo === 'falta') cur.faltas += qtd;
    if (r.tipo === 'advertencia') cur.advertencias += qtd;
    if (r.funcionario_id) cur.pessoas.add(r.funcionario_id);
    map.set(setor, cur);
  });
  return [...map.entries()]
    .map(([setor, v]) => ({ setor, faltas: v.faltas, advertencias: v.advertencias, pessoas: v.pessoas.size }))
    .sort((a, b) => (b.faltas + b.advertencias) - (a.faltas + a.advertencias));
}

export interface ConcentracaoItem {
  funcionarioId: string;
  total: number;
}

/** Concentração: funcionários com maior número de ocorrências na competência. */
export function computeConcentracao(registros: OccurrenceRecordLike[], competencia: string, top = 10): ConcentracaoItem[] {
  const doMes = registros.filter((r) => inCompetencia(r.data_ocorrencia, competencia));
  const map = new Map<string, number>();
  doMes.forEach((r) => {
    if (!r.funcionario_id) return;
    map.set(r.funcionario_id, (map.get(r.funcionario_id) || 0) + (r.quantidade || 1));
  });
  return [...map.entries()]
    .map(([funcionarioId, total]) => ({ funcionarioId, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, top);
}

export interface HistoryFuncionarioInfo {
  id: string;
  nome: string;
  cod: string;
  setor: string | null;
}

/**
 * Uma linha por (funcionário, competência) com ocorrência no intervalo informado.
 * `variacao` compara o total da competência com a competência anterior IMEDIATA
 * do mesmo funcionário (independente de estar ou não dentro do intervalo filtrado).
 */
export function buildHistoryRows(
  registros: OccurrenceRecordLike[],
  funcionarios: HistoryFuncionarioInfo[],
  competenciaInicial: string,
  competenciaFinal: string,
): OccurrenceHistoryRow[] {
  const funcById = new Map(funcionarios.map((f) => [f.id, f]));
  // total por (funcionario, competencia) — sem filtro de intervalo, para permitir o cálculo de variação.
  const totals = new Map<string, { faltas: number; advertencias: number }>();
  registros.forEach((r) => {
    if (!r.funcionario_id) return;
    const comp = r.data_ocorrencia.slice(0, 7);
    const key = `${r.funcionario_id}|${comp}`;
    const cur = totals.get(key) || { faltas: 0, advertencias: 0 };
    const qtd = r.quantidade || 1;
    if (r.tipo === 'falta') cur.faltas += qtd;
    if (r.tipo === 'advertencia') cur.advertencias += qtd;
    totals.set(key, cur);
  });

  const rows: OccurrenceHistoryRow[] = [];
  for (const [key, val] of totals) {
    const [funcionarioId, competencia] = key.split('|');
    if (competencia < competenciaInicial || competencia > competenciaFinal) continue;
    const info = funcById.get(funcionarioId);
    if (!info) continue;

    const prevComp = shiftCompYYYYMM(competencia, -1);
    const prevVal = totals.get(`${funcionarioId}|${prevComp}`);
    const total = val.faltas + val.advertencias;
    const prevTotal = prevVal ? prevVal.faltas + prevVal.advertencias : null;

    rows.push({
      funcionarioId, nome: info.nome, cod: info.cod, setor: info.setor,
      competencia, faltas: val.faltas, advertencias: val.advertencias, total,
      variacao: prevTotal == null ? null : total - prevTotal,
    });
  }

  return rows.sort((a, b) => (a.competencia < b.competencia ? 1 : a.competencia > b.competencia ? -1 : a.nome.localeCompare(b.nome)));
}

function shiftCompYYYYMM(comp: string, months: number): string {
  const [y, m] = comp.split('-').map(Number);
  const d = new Date(y, m - 1 + months, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
