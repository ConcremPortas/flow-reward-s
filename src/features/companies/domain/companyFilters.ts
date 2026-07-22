// Filtros e resumo da gestão de empresas — puros.
import { normalizeName, cnpjKey } from './companyValidation';
import { onlyDigits } from './cnpjFormatting';
import type { CompanyFilters, CompanyRow } from '../types/company.types';

export function matchesCompanyFilters(row: CompanyRow, f: CompanyFilters): boolean {
  if (f.search) {
    const term = f.search.trim();
    const termDigits = onlyDigits(term);
    const nomeMatch = normalizeName(row.nome).includes(normalizeName(term));
    const cnpjMatch = termDigits.length > 0 && cnpjKey(row.cnpj).includes(termDigits);
    if (!nomeMatch && !cnpjMatch) return false;
  }
  if (f.situacao !== 'todos' && row.status.status !== f.situacao) return false;
  return true;
}

export function countActiveCompanyFilters(f: CompanyFilters): number {
  return [f.situacao !== 'todos'].filter(Boolean).length;
}

export interface CompanySummaryCounts {
  total: number;
  ativas: number;
  aRevisar: number;
  setoresVinculados: number;
  funcionariosVinculados: number;
}

export function computeCompanySummary(rows: CompanyRow[]): CompanySummaryCounts {
  return {
    total: rows.length,
    ativas: rows.filter(r => r.ativo).length,
    aRevisar: rows.filter(r => r.status.status === 'revisar').length,
    setoresVinculados: rows.reduce((s, r) => s + r.usage.setores, 0),
    funcionariosVinculados: rows.reduce((s, r) => s + r.usage.funcionarios, 0),
  };
}
