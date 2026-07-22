// Predicados de busca/filtro — funções puras.
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { AttendanceFilters, DssHistoryRow, HistoryFilters, PresenceMap } from '../types';

const norm = (v: string) => v.toLowerCase();

export function matchesAttendanceSearch(f: Funcionario, term: string): boolean {
  if (!term) return true;
  const t = norm(term);
  return norm(f.nome).includes(t) || norm(f.cpf || '').includes(t);
}

export function matchesAttendanceFilters(f: Funcionario, filters: AttendanceFilters, presencas: PresenceMap): boolean {
  if (!matchesAttendanceSearch(f, filters.search)) return false;
  if (filters.setorId !== 'todos' && f.setor_id !== filters.setorId) return false;
  const presente = presencas[f.id] ?? false;
  if (filters.presenca === 'presentes' && !presente) return false;
  if (filters.presenca === 'ausentes' && presente) return false;
  return true;
}

export function matchesHistoryRow(row: DssHistoryRow, filters: HistoryFilters): boolean {
  if (filters.search) {
    const t = norm(filters.search);
    if (!norm(row.titulo).includes(t) && !norm(row.localNome || '').includes(t)) return false;
  }
  if (filters.localId !== 'todos' && row.localId !== filters.localId) return false;
  const comp = row.data_realizacao.slice(0, 7);
  if (filters.competenciaInicial && comp < filters.competenciaInicial) return false;
  if (filters.competenciaFinal && comp > filters.competenciaFinal) return false;
  if (filters.participacao !== 'todos') {
    if (row.participacao == null) return false;
    if (filters.participacao === 'baixa' && row.participacao >= 70) return false;
    if (filters.participacao === 'alta' && row.participacao < 90) return false;
  }
  return true;
}
