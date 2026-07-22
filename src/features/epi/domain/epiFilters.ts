// Busca e filtros — puro. Nenhuma dependência de rede ou estado de UI.
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { EpiAuditGroupEnriched } from './epiCalculations';
import type {
  ComplianceFilters, ComplianceMap, EpiHistoryFilters, EpiNonConformityFilters, EpiNonConformityRow,
} from '../types/epi.types';

function matchesSearch(f: Funcionario, term: string): boolean {
  if (!term) return true;
  const t = term.toLowerCase();
  return (
    f.nome.toLowerCase().includes(t) ||
    (f.cpf || '').toLowerCase().includes(t) ||
    (f.setor?.nome || '').toLowerCase().includes(t) ||
    (f.funcao?.nome || '').toLowerCase().includes(t) ||
    (f.categoria?.nome || '').toLowerCase().includes(t)
  );
}

/** Filtros da tabela de Inspeção (Etapa 2). */
export function matchesComplianceFilters(
  f: Funcionario,
  filters: ComplianceFilters,
  draft: ComplianceMap,
  baseline: ComplianceMap,
): boolean {
  if (!matchesSearch(f, filters.search)) return false;
  if (filters.empresaId !== 'todos' && f.empresa_id !== filters.empresaId) return false;
  if (filters.setorId !== 'todos' && f.setor_id !== filters.setorId) return false;

  const conforme = draft[f.id] ?? true;
  if (filters.situacao === 'conformes' && !conforme) return false;
  if (filters.situacao === 'nao_conformes' && conforme) return false;

  if (filters.somenteAlterados) {
    const before = baseline[f.id] ?? true;
    if (before === conforme) return false;
  }

  return true;
}

/**
 * Filtros do Histórico. Como toda auditoria abrange 100% dos funcionários
 * ativos (sem escopo por empresa/setor), empresa/setor funcionam como filtro
 * de RELEVÂNCIA ("esta auditoria envolveu alguém desse escopo"), não como
 * recorte da taxa exibida — documentado no relatório final.
 */
export function matchesEpiHistoryRow(group: EpiAuditGroupEnriched, filters: EpiHistoryFilters): boolean {
  if (filters.search && !group.titulo.toLowerCase().includes(filters.search.toLowerCase())) return false;
  if (filters.dataInicial && group.data < filters.dataInicial) return false;
  if (filters.dataFinal && group.data > filters.dataFinal) return false;
  if (filters.empresaId !== 'todos' && !group.empresaIds.has(filters.empresaId)) return false;
  if (filters.setorId !== 'todos' && !group.setorIds.has(filters.setorId)) return false;
  if (filters.taxaMinima && (group.taxaConformidade == null || group.taxaConformidade < Number(filters.taxaMinima))) return false;
  if (filters.somenteComNaoConformidades && group.naoConformes === 0) return false;
  return true;
}

/** Filtros da Visão "Não Conformidades". */
export function matchesNonConformityRow(row: EpiNonConformityRow, filters: EpiNonConformityFilters): boolean {
  if (filters.search && !row.nome.toLowerCase().includes(filters.search.toLowerCase())) return false;
  if (filters.empresaId !== 'todos' && row.empresaId !== filters.empresaId) return false;
  if (filters.setorId !== 'todos' && row.setorId !== filters.setorId) return false;
  if (filters.funcionarioId !== 'todos' && row.funcionarioId !== filters.funcionarioId) return false;
  if (filters.somenteReincidentes && !row.reincidente) return false;

  if (filters.dataInicial || filters.dataFinal) {
    const algumaNoPeriodo = row.ocorrenciasDatas.some((d) => {
      if (filters.dataInicial && d < filters.dataInicial) return false;
      if (filters.dataFinal && d > filters.dataFinal) return false;
      return true;
    });
    if (!algumaNoPeriodo) return false;
  }

  return true;
}
