// Reconstrução de auditorias de EPI a partir das linhas de `concremrh_epi` — puro.
//
// CONTEXTO (achado da auditoria, aprovado pelo usuário): a tela anterior salvava
// UMA única linha-resumo por auditoria (funcionario_id null), com o detalhe por
// funcionário embutido como texto livre em `observacoes`
// ("Nome: Conforme/Não conforme"). Isso deixava nota_epi (motor de premiação),
// epiPendencias (dashboard/matriz de setor) e o drawer do funcionário sempre
// neutros/zerados, pois todos filtram por `funcionario_id` real.
//
// A partir desta tela, cada auditoria grava 1 linha POR FUNCIONÁRIO auditado
// (funcionario_id real) + 1 linha-resumo (funcionario_id null, mantida para
// leitura rápida do título/contagens). As linhas da mesma auditoria são ligadas
// por uma tag JSON em `observacoes`: {"auditoria_id":"<uuid>"} — não é uma
// coluna nova, é apenas um formato mais robusto do MESMO campo de texto livre
// que já existia. Nenhuma coluna foi criada ou alterada.
//
// Auditorias já salvas antes desta correção (sem essa tag, sem funcionario_id)
// continuam sendo lidas: cada linha legada vira sua própria "auditoria" de 1
// registro, e o detalhe por funcionário é recuperado direto do texto
// ("Nome: Conforme/Não conforme"), sem depender de comparar contra a lista de
// funcionários ativos de hoje (a tela antiga fazia isso e perdia o funcionário
// caso ele já tivesse sido desligado — corrigido aqui).
import type { EPI } from '@/hooks/useEPI';
import type { Funcionario } from '@/hooks/useFuncionarios';
import { inCompetencia, lastCompetencias, competenciaLabel } from '@/features/dashboard/utils/dates';
import type { EpiAuditGroup, EpiAuditMember } from '../types/epi.types';

export const EPI_AUDIT_TIPO = 'Auditoria Geral de EPI';

interface AuditoriaTag {
  auditoriaId: string;
  isSummary: boolean;
}

/** Extrai a tag {"auditoria_id": "..."} do formato novo. Formato legado (texto livre) → null. */
export function parseAuditoriaTag(observacoes: string | null | undefined): AuditoriaTag | null {
  if (!observacoes) return null;
  try {
    const parsed = JSON.parse(observacoes);
    if (parsed && typeof parsed.auditoria_id === 'string' && parsed.auditoria_id) {
      return { auditoriaId: parsed.auditoria_id, isSummary: !!parsed.resumo };
    }
    return null;
  } catch {
    return null;
  }
}

const LEGACY_LINE = /^(.+): (Conforme|Não conforme)\s*$/gm;

/** Recupera pares (nome, conforme) do texto livre legado — não depende da lista de ativos de hoje. */
export function parseLegacyMembers(observacoes: string | null | undefined): EpiAuditMember[] {
  if (!observacoes) return [];
  const out: EpiAuditMember[] = [];
  for (const m of observacoes.matchAll(LEGACY_LINE)) {
    out.push({ funcionarioId: null, nome: m[1].trim(), conforme: m[2] === 'Conforme', recordId: null });
  }
  return out;
}

interface GroupExtra {
  empresaIds: Set<string>;
  setorIds: Set<string>;
}

export interface EpiAuditGroupEnriched extends EpiAuditGroup {
  empresaIds: Set<string>;
  setorIds: Set<string>;
}

/** Agrupa as linhas cruas de concremrh_epi em auditorias (novas + legadas). */
export function groupEpiRecords(records: EPI[], funcionariosById: Map<string, Funcionario>): EpiAuditGroupEnriched[] {
  const byAuditoriaId = new Map<string, EPI[]>();
  const legacy: EPI[] = [];

  for (const r of records) {
    const tag = parseAuditoriaTag(r.observacoes);
    if (tag) {
      const list = byAuditoriaId.get(tag.auditoriaId) || [];
      list.push(r);
      byAuditoriaId.set(tag.auditoriaId, list);
    } else {
      legacy.push(r);
    }
  }

  const groups: EpiAuditGroupEnriched[] = [];

  for (const [auditoriaId, rows] of byAuditoriaId) {
    const summaryRecord = rows.find((r) => r.funcionario_id == null) || null;
    const detailRows = rows.filter((r) => r.funcionario_id != null);

    const membros: EpiAuditMember[] = detailRows.map((r) => ({
      funcionarioId: r.funcionario_id!,
      nome: funcionariosById.get(r.funcionario_id!)?.nome ?? '(funcionário removido)',
      conforme: r.status !== 'nao_conforme',
      recordId: r.id,
    }));

    const anchor = summaryRecord || detailRows[0];
    const conformes = membros.filter((m) => m.conforme).length;
    const naoConformes = membros.length - conformes;

    const { empresaIds, setorIds } = collectScopeIds(membros, funcionariosById);

    groups.push({
      auditoriaId,
      isLegacy: false,
      data: anchor?.data_entrega ?? '',
      titulo: anchor?.descricao || EPI_AUDIT_TIPO,
      createdAt: rows.reduce((min, r) => (r.created_at < min ? r.created_at : min), rows[0].created_at),
      totalAuditados: membros.length,
      conformes,
      naoConformes,
      taxaConformidade: membros.length > 0 ? Number(((conformes / membros.length) * 100).toFixed(1)) : null,
      membros,
      summaryRecordId: summaryRecord?.id ?? null,
      memberRecordIds: rows.map((r) => r.id),
      empresaIds,
      setorIds,
    });
  }

  for (const r of legacy) {
    const membros = parseLegacyMembers(r.observacoes);
    const conformes = membros.filter((m) => m.conforme).length;
    const naoConformes = membros.length - conformes;
    const { empresaIds, setorIds } = collectScopeIds(membros, funcionariosById);

    groups.push({
      auditoriaId: `legacy:${r.id}`,
      isLegacy: true,
      data: r.data_entrega,
      titulo: r.descricao || r.tipo_epi || EPI_AUDIT_TIPO,
      createdAt: r.created_at,
      totalAuditados: membros.length,
      conformes,
      naoConformes,
      taxaConformidade: membros.length > 0 ? Number(((conformes / membros.length) * 100).toFixed(1)) : null,
      membros,
      summaryRecordId: r.id,
      memberRecordIds: [r.id],
      empresaIds,
      setorIds,
    });
  }

  return groups.sort((a, b) => (a.data === b.data ? (a.createdAt < b.createdAt ? 1 : -1) : a.data < b.data ? 1 : -1));
}

function collectScopeIds(membros: EpiAuditMember[], funcionariosById: Map<string, Funcionario>): GroupExtra {
  const empresaIds = new Set<string>();
  const setorIds = new Set<string>();
  for (const m of membros) {
    if (!m.funcionarioId) continue;
    const f = funcionariosById.get(m.funcionarioId);
    if (f?.empresa_id) empresaIds.add(f.empresa_id);
    if (f?.setor_id) setorIds.add(f.setor_id);
  }
  return { empresaIds, setorIds };
}

export interface EpiMonthPoint {
  competencia: string;
  label: string;
  auditorias: number;
  auditados: number;
  conformes: number;
  naoConformes: number;
  taxaConformidade: number | null;
}

/** Evolução de N meses (default 12) terminando na competência informada. */
export function buildEpiMonthlyEvolution(groups: EpiAuditGroup[], competencia: string, months = 12): EpiMonthPoint[] {
  return lastCompetencias(competencia, months).map((c) => {
    const doMes = groups.filter((g) => inCompetencia(g.data, c));
    const auditados = doMes.reduce((a, g) => a + g.totalAuditados, 0);
    const conformes = doMes.reduce((a, g) => a + g.conformes, 0);
    const naoConformes = doMes.reduce((a, g) => a + g.naoConformes, 0);
    return {
      competencia: c,
      label: competenciaLabel(c),
      auditorias: doMes.length,
      auditados,
      conformes,
      naoConformes,
      taxaConformidade: auditados > 0 ? Number(((conformes / auditados) * 100).toFixed(1)) : null,
    };
  });
}

export interface SectorComplianceRow {
  setorId: string;
  setorNome: string;
  auditados: number;
  conformes: number;
  naoConformes: number;
  taxaConformidade: number | null;
  tendencia: 'subindo' | 'descendo' | 'estavel' | null;
}

/**
 * Comparação por setor na competência informada. Só considera membros do
 * formato novo (funcionario_id real) — membros legados não têm setor
 * recuperável e ficam de fora desta comparação (limitação documentada).
 */
export function buildSectorComparison(
  groups: EpiAuditGroup[],
  funcionariosById: Map<string, Funcionario>,
  setores: { id: string; nome: string }[],
  competencia: string,
): SectorComplianceRow[] {
  const anterior = lastCompetencias(competencia, 2)[0];
  const doMes = groups.filter((g) => inCompetencia(g.data, competencia));
  const doMesAnterior = groups.filter((g) => inCompetencia(g.data, anterior));

  const tally = (list: EpiAuditGroup[], setorId: string) => {
    let auditados = 0, conformes = 0;
    for (const g of list) {
      for (const m of g.membros) {
        if (!m.funcionarioId) continue;
        if (funcionariosById.get(m.funcionarioId)?.setor_id !== setorId) continue;
        auditados++;
        if (m.conforme) conformes++;
      }
    }
    return { auditados, conformes };
  };

  return setores.map((s) => {
    const atual = tally(doMes, s.id);
    const anteriorTally = tally(doMesAnterior, s.id);
    const taxaAtual = atual.auditados > 0 ? (atual.conformes / atual.auditados) * 100 : null;
    const taxaAnterior = anteriorTally.auditados > 0 ? (anteriorTally.conformes / anteriorTally.auditados) * 100 : null;

    let tendencia: SectorComplianceRow['tendencia'] = null;
    if (taxaAtual != null && taxaAnterior != null) {
      const delta = taxaAtual - taxaAnterior;
      tendencia = delta > 1 ? 'subindo' : delta < -1 ? 'descendo' : 'estavel';
    }

    return {
      setorId: s.id,
      setorNome: s.nome,
      auditados: atual.auditados,
      conformes: atual.conformes,
      naoConformes: atual.auditados - atual.conformes,
      taxaConformidade: taxaAtual != null ? Number(taxaAtual.toFixed(1)) : null,
      tendencia,
    };
  }).filter((r) => r.auditados > 0);
}

export interface EpiInsightsInput {
  auditoriasRealizadas: number;
  taxaConformidade: number | null;
  variacaoTaxa: number | null;
  reincidentes: number;
  setoresAbaixoReferencia: number;
}

/** Insights gerenciais — regras determinísticas, sem geração de texto livre. */
export function computeEpiInsights(input: EpiInsightsInput): string[] {
  const insights: string[] = [];

  if (input.auditoriasRealizadas === 0) {
    insights.push('Nenhuma auditoria de EPI foi realizada neste período.');
    return insights;
  }
  if (input.taxaConformidade != null && input.taxaConformidade < 80) {
    insights.push(`Taxa de conformidade abaixo de 80% neste período (${input.taxaConformidade.toFixed(1)}%).`);
  }
  if (input.variacaoTaxa != null && input.variacaoTaxa <= -5) {
    insights.push(`Queda de ${Math.abs(input.variacaoTaxa).toFixed(0)}% na conformidade em relação ao período anterior.`);
  }
  if (input.variacaoTaxa != null && input.variacaoTaxa >= 5) {
    insights.push(`Conformidade subiu ${input.variacaoTaxa.toFixed(0)}% em relação ao período anterior.`);
  }
  if (input.reincidentes > 0) {
    insights.push(`${input.reincidentes} funcionário(s) reincidente(s) em não conformidade (2+ ocorrências nas últimas 3 auditorias).`);
  }
  if (input.setoresAbaixoReferencia > 0) {
    insights.push(`${input.setoresAbaixoReferencia} setor(es) abaixo da referência de 90% de conformidade.`);
  }
  if (insights.length === 0) {
    insights.push('Conformidade dentro da referência, sem reincidências neste período.');
  }
  return insights;
}

export interface NonConformitySummary {
  auditados: number;
  naoConformes: number;
  taxaNaoConformidade: number | null;
  /** vs. janela imediatamente anterior de mesma duração — null sem período definido. */
  variacao: number | null;
}

function sumWindow(groups: EpiAuditGroup[], inicio: string, fim: string) {
  const doPeriodo = groups.filter((g) => g.data >= inicio && g.data <= fim);
  const auditados = doPeriodo.reduce((a, g) => a + g.totalAuditados, 0);
  const naoConformes = doPeriodo.reduce((a, g) => a + g.naoConformes, 0);
  return { auditados, naoConformes };
}

/**
 * Resumo de não conformidades no período filtrado. `variacao` só é calculada
 * quando ambas as datas do período são informadas — compara contra a janela
 * imediatamente anterior de mesma duração (sem período, não há baseline
 * comparável e o valor fica null, sem inventar uma comparação arbitrária).
 */
export function computeNonConformitySummary(groups: EpiAuditGroup[], dataInicial: string, dataFinal: string): NonConformitySummary {
  const inicio = dataInicial || '0000-01-01';
  const fim = dataFinal || '9999-12-31';
  const atual = sumWindow(groups, inicio, fim);
  const taxaNaoConformidade = atual.auditados > 0 ? Number(((atual.naoConformes / atual.auditados) * 100).toFixed(1)) : null;

  let variacao: number | null = null;
  if (dataInicial && dataFinal) {
    const durationMs = new Date(dataFinal).getTime() - new Date(dataInicial).getTime();
    const prevFim = new Date(new Date(dataInicial).getTime() - 24 * 60 * 60 * 1000);
    const prevInicio = new Date(prevFim.getTime() - durationMs);
    const anterior = sumWindow(groups, prevInicio.toISOString().slice(0, 10), prevFim.toISOString().slice(0, 10));
    const taxaAnterior = anterior.auditados > 0 ? (anterior.naoConformes / anterior.auditados) * 100 : null;
    if (taxaNaoConformidade != null && taxaAnterior != null) {
      variacao = Number((taxaNaoConformidade - taxaAnterior).toFixed(1));
    }
  }

  return { auditados: atual.auditados, naoConformes: atual.naoConformes, taxaNaoConformidade, variacao };
}
