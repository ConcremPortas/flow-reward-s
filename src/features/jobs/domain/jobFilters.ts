import type { JobRow, JobFilters } from '../types/job.types';

const normalizar = (s: string | null | undefined): string =>
  (s ?? '').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').trim();

/** Aplica os filtros às linhas já enriquecidas. */
export function filtrarJobRows(rows: JobRow[], filtros: JobFilters): JobRow[] {
  const busca = normalizar(filtros.busca);
  return rows.filter((r) => {
    const c = r.cargo;
    if (filtros.status === 'ativos' && !c.ativo) return false;
    if (filtros.status === 'inativos' && c.ativo) return false;
    if (filtros.setorId && c.setor_id !== filtros.setorId) return false;
    if (filtros.nivel && String(c.nivel_hierarquico ?? '').trim() !== filtros.nivel) return false;
    if (filtros.ocupacao === 'ocupados' && r.ocupantes === 0) return false;
    if (filtros.ocupacao === 'sem_ocupantes' && r.ocupantes > 0) return false;
    if (filtros.faixa === 'com_faixa' && !r.temFaixa) return false;
    if (filtros.faixa === 'sem_faixa' && r.temFaixa) return false;
    if (filtros.situacao === 'regular' && r.situacao !== 'regular') return false;
    if (filtros.situacao === 'incompleta' && r.situacao === 'regular') return false;
    if (busca) {
      const alvo = [c.nome, c.concremrh_setores?.nome, c.missao, r.cargo.nivel_hierarquico != null ? `nivel ${c.nivel_hierarquico}` : '']
        .map(normalizar)
        .join(' ');
      if (!alvo.includes(busca)) return false;
    }
    return true;
  });
}

/** Conta filtros ativos (o status padrão 'ativos' não conta). */
export function contarFiltrosAtivos(f: JobFilters): number {
  let n = 0;
  if (f.busca.trim() !== '') n++;
  if (f.setorId) n++;
  if (f.nivel) n++;
  if (f.status !== 'ativos') n++;
  if (f.ocupacao !== 'todas') n++;
  if (f.situacao !== 'todas') n++;
  if (f.faixa !== 'todas') n++;
  return n;
}
