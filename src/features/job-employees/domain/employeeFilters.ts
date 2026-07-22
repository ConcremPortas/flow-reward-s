import type { JobEmployeeRow, JobEmployeeFilters, SortState } from '../types/job-employee.types';

const normalizar = (s: string | null | undefined): string =>
  (s ?? '').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').trim();

/** Aplica os filtros às linhas enriquecidas. */
export function filtrarColaboradores(rows: JobEmployeeRow[], f: JobEmployeeFilters): JobEmployeeRow[] {
  const busca = normalizar(f.busca);
  return rows.filter((r) => {
    const fn = r.funcionario;
    if (f.status === 'ativos' && !r.ativo) return false;
    if (f.status === 'inativos' && r.ativo) return false;
    if (f.empresaId && fn.empresa_id !== f.empresaId) return false;
    if (f.setorId && fn.setor_id !== f.setorId) return false;
    if (f.funcaoId && fn.funcao_id !== f.funcaoId) return false;
    if (f.cargoId && r.cargo?.id !== f.cargoId) return false;
    if (f.enquadramento === 'enquadrados' && r.cargo == null) return false;
    if (f.enquadramento === 'sem_cargo' && r.cargo != null) return false;
    if (f.enquadramento === 'pendentes' && r.situacao === 'regular') return false;
    if (f.faixa === 'dentro' && r.posicaoSalarial !== 'dentro') return false;
    if (f.faixa === 'abaixo' && r.posicaoSalarial !== 'abaixo') return false;
    if (f.faixa === 'acima' && r.posicaoSalarial !== 'acima') return false;
    if (f.faixa === 'sem_salario' && r.posicaoSalarial !== 'sem_salario') return false;
    if (busca) {
      const alvo = [fn.nome, fn.cpf, r.funcaoNome, r.cargo?.nome, r.setorNome].map(normalizar).join(' ');
      if (!alvo.includes(busca)) return false;
    }
    return true;
  });
}

/** Ordena as linhas (estável) segundo o estado de ordenação. */
export function ordenarColaboradores(rows: JobEmployeeRow[], sort: SortState): JobEmployeeRow[] {
  const val = (r: JobEmployeeRow): string => {
    switch (sort.key) {
      case 'funcao': return r.funcaoNome ?? '';
      case 'cargo': return r.cargo?.nome ?? '';
      case 'setor': return r.setorNome ?? '';
      case 'enquadramento': return r.situacao;
      default: return r.funcionario.nome ?? '';
    }
  };
  const fator = sort.dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => val(a).localeCompare(val(b), 'pt-BR', { numeric: true }) * fator);
}

/** Fatia a página atual. Página é 1-indexada. */
export function paginar<T>(rows: T[], pagina: number, porPagina: number): T[] {
  const inicio = (pagina - 1) * porPagina;
  return rows.slice(inicio, inicio + porPagina);
}

export function totalPaginas(total: number, porPagina: number): number {
  return Math.max(1, Math.ceil(total / porPagina));
}

export function contarFiltrosAtivos(f: JobEmployeeFilters): number {
  let n = 0;
  if (f.busca.trim() !== '') n++;
  if (f.empresaId) n++;
  if (f.setorId) n++;
  if (f.funcaoId) n++;
  if (f.cargoId) n++;
  if (f.status !== 'ativos') n++;
  if (f.enquadramento !== 'todos') n++;
  if (f.faixa !== 'todas') n++;
  return n;
}
