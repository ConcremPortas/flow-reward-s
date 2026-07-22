// Predicados de busca/filtro/abas — funções puras.
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { EmployeeFilters, EmployeeTab } from '../types';
import { checkEmployeeCompletion } from './employeeCompletion';
import { getEmployeeEligibility } from './employeeEligibility';

const norm = (v: string) => v.toLowerCase();

export function matchesSearch(f: Funcionario, term: string): boolean {
  if (!term) return true;
  const t = norm(term);
  return (
    norm(f.nome).includes(t) ||
    norm(f.cpf || '').includes(t) ||
    norm(f.setor?.nome || '').includes(t) ||
    norm(f.funcao?.nome || '').includes(t) ||
    norm(f.categoria?.nome || '').includes(t) ||
    norm(f.empresa?.nome || '').includes(t)
  );
}

export function matchesFilters(f: Funcionario, filters: EmployeeFilters): boolean {
  if (!matchesSearch(f, filters.search)) return false;
  if (filters.empresaId !== 'todos' && f.empresa_id !== filters.empresaId) return false;
  if (filters.setorId !== 'todos') {
    if (filters.setorId === '__sem_setor__') {
      if (f.setor_id || (f.setor_ids && f.setor_ids.length > 0)) return false;
    } else if (f.setor_id !== filters.setorId) return false;
  }
  if (filters.funcaoId !== 'todos' && f.funcao_id !== filters.funcaoId) return false;
  if (filters.categoriaId !== 'todos' && f.categoria_id !== filters.categoriaId) return false;
  if (filters.localDssId !== 'todos') {
    if (filters.localDssId === '__sem_local__') {
      if (f.local_dss_id) return false;
    } else if (f.local_dss_id !== filters.localDssId) return false;
  }
  if (filters.status !== 'todos' && (f.status || 'Ativo') !== filters.status) return false;
  if (filters.eligibility !== 'todos' && getEmployeeEligibility(f) !== filters.eligibility) return false;
  return true;
}

export function matchesTab(f: Funcionario, tab: EmployeeTab): boolean {
  switch (tab) {
    case 'ativos': return !!f.ativo;
    case 'inativos': return !f.ativo;
    case 'pendencias': return !checkEmployeeCompletion(f).complete;
    case 'elegibilidade': return getEmployeeEligibility(f) !== 'fora_premiacao';
    default: return true;
  }
}

export function tabCounts(list: Funcionario[]): Record<EmployeeTab, number> {
  return {
    todos: list.length,
    ativos: list.filter((f) => f.ativo).length,
    inativos: list.filter((f) => !f.ativo).length,
    pendencias: list.filter((f) => !checkEmployeeCompletion(f).complete).length,
    elegibilidade: list.filter((f) => getEmployeeEligibility(f) !== 'fora_premiacao').length,
  };
}
