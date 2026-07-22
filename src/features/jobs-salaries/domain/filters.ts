import type { Cargo } from '@/hooks/useCargos';
import type { FuncionarioSensivel } from '@/hooks/useFuncionariosSensivel';
import type { JobsSalariesFilters, Enquadramento } from '../types/jobsSalaries.types';

const normalizar = (s: string | null | undefined): string =>
  (s ?? '').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').trim();

/** Aplica os filtros globais aos cargos (setor, nível, cargo, busca). */
export function filtrarCargos(cargos: Cargo[], filtros: JobsSalariesFilters): Cargo[] {
  const busca = normalizar(filtros.busca);
  return cargos.filter((c) => {
    if (filtros.setorId && c.setor_id !== filtros.setorId) return false;
    if (filtros.cargoId && c.id !== filtros.cargoId) return false;
    if (filtros.nivel && String(c.nivel_hierarquico ?? '').trim() !== filtros.nivel) return false;
    if (busca && !normalizar(c.nome).includes(busca)) return false;
    return true;
  });
}

/**
 * Aplica os filtros globais aos colaboradores. O filtro por cargo usa o
 * enquadramento (função ≠ cargo). O filtro de status usa o campo `ativo`.
 */
export function filtrarColaboradores(
  colaboradores: FuncionarioSensivel[],
  filtros: JobsSalariesFilters,
  enquadramentos: Map<string, Enquadramento>,
): FuncionarioSensivel[] {
  const busca = normalizar(filtros.busca);
  return colaboradores.filter((c) => {
    if (filtros.status === 'ativos' && c.ativo === false) return false;
    if (filtros.status === 'inativos' && c.ativo !== false) return false;
    if (filtros.setorId && c.setor_id !== filtros.setorId) return false;
    if (filtros.cargoId) {
      const e = enquadramentos.get(c.id);
      if (e?.cargoId !== filtros.cargoId) return false;
    }
    if (busca && !normalizar(c.nome).includes(busca)) return false;
    return true;
  });
}

/** Conta filtros ativos (para o rótulo "N filtros" e o botão limpar). */
export function contarFiltrosAtivos(filtros: JobsSalariesFilters): number {
  let n = 0;
  if (filtros.setorId) n++;
  if (filtros.nivel) n++;
  if (filtros.cargoId) n++;
  if (filtros.status !== 'ativos') n++;
  if (filtros.busca.trim() !== '') n++;
  return n;
}
