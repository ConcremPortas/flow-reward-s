import { situacaoDaLinha, type Situacao } from './situacao';
import type { FardamentoRow } from '../../types/db.types';

export interface Filtros {
  busca: string;
  categoria: string;   // categoriaNome
  modelo: string;      // modeloNome
  tamanho: string;     // tamanhoRotulo
  unidadeId: string;   // id do local
  situacao: Situacao | '';
  incluirInativos: boolean;
}

export const FILTROS_VAZIO: Filtros = {
  busca: '', categoria: '', modelo: '', tamanho: '', unidadeId: '', situacao: '', incluirInativos: false,
};

const norm = (s: string) => (s ?? '').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/\p{Diacritic}/gu, '');

export function aplicarFiltros(rows: FardamentoRow[], f: Filtros): FardamentoRow[] {
  const q = norm(f.busca.trim());
  return rows.filter((r) => {
    const sit = situacaoDaLinha(r);
    if (!f.incluirInativos && f.situacao !== 'INATIVO' && sit === 'INATIVO') return false;
    if (f.situacao && sit !== f.situacao) return false;
    if (f.categoria && r.categoriaNome !== f.categoria) return false;
    if (f.modelo && r.modeloNome !== f.modelo) return false;
    if (f.tamanho && r.tamanhoRotulo !== f.tamanho) return false;
    if (f.unidadeId && !r.saldos.some((s) => s.unidadeId === f.unidadeId && s.quantidade > 0)) return false;
    if (q) {
      const alvo = norm([r.variante.nome, r.variante.codigo_interno, r.categoriaNome ?? '', r.modeloNome ?? '', r.tamanhoRotulo ?? ''].join(' '));
      if (!alvo.includes(q)) return false;
    }
    return true;
  });
}

/** Quantos filtros (além da busca) estão ativos — usado no contador/badge. */
export function contarFiltrosAtivos(f: Filtros): number {
  let n = 0;
  if (f.categoria) n++;
  if (f.modelo) n++;
  if (f.tamanho) n++;
  if (f.unidadeId) n++;
  if (f.situacao) n++;
  if (f.incluirInativos) n++;
  return n;
}
