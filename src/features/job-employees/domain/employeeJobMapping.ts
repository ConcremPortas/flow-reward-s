import type { Cargo } from '@/hooks/useCargos';
import type { Funcao } from '@/hooks/useFuncoes';
import type { JobEmployeeRow } from '../types/job-employee.types';

const normalizar = (s: string | null | undefined): string =>
  (s ?? '').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').trim();

export interface FunctionMappingRow {
  funcaoId: string;
  funcaoNome: string;
  colaboradores: number;
  jaEnquadrados: number;
  setores: string[];
  /** Cargo de nome equivalente (sugestão observacional). Nunca aplicado sozinho. */
  cargoSugeridoId: string | null;
  cargoSugeridoNome: string | null;
  /** Conflito: colaboradores desta função já em cargos distintos. */
  conflito: boolean;
}

/**
 * Mapeia FUNÇÃO → CARGO para apoiar o enquadramento. Sugere cargo por igualdade
 * de nome (observacional) e sinaliza conflitos. NUNCA converte ou aplica
 * automaticamente; a função operacional é preservada.
 */
export function mapearFuncoes(funcoes: Funcao[], rows: JobEmployeeRow[], cargos: Cargo[]): FunctionMappingRow[] {
  const cargoPorNome = new Map(cargos.map((c) => [normalizar(c.nome), c]));
  const porFuncao = new Map<string, { total: number; enq: number; setores: Set<string>; cargos: Set<string> }>();

  for (const r of rows) {
    if (!r.ativo) continue;
    const fid = r.funcionario.funcao_id;
    if (!fid) continue;
    const item = porFuncao.get(fid) ?? { total: 0, enq: 0, setores: new Set<string>(), cargos: new Set<string>() };
    item.total++;
    if (r.cargo) { item.enq++; item.cargos.add(r.cargo.id); }
    if (r.setorNome) item.setores.add(r.setorNome);
    porFuncao.set(fid, item);
  }

  return funcoes
    .map((f) => {
      const agg = porFuncao.get(f.id) ?? { total: 0, enq: 0, setores: new Set<string>(), cargos: new Set<string>() };
      const sugerido = cargoPorNome.get(normalizar(f.nome)) ?? null;
      return {
        funcaoId: f.id,
        funcaoNome: f.nome,
        colaboradores: agg.total,
        jaEnquadrados: agg.enq,
        setores: Array.from(agg.setores).sort((a, b) => a.localeCompare(b, 'pt-BR')),
        cargoSugeridoId: sugerido?.id ?? null,
        cargoSugeridoNome: sugerido?.nome ?? null,
        conflito: agg.cargos.size > 1,
      };
    })
    .sort((a, b) => b.colaboradores - a.colaboradores || a.funcaoNome.localeCompare(b.funcaoNome, 'pt-BR'));
}
