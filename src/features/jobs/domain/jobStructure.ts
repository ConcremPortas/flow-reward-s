import type { Setor } from '@/hooks/useSetores';
import type { JobRow } from '../types/job.types';

const SEM_NIVEL = 'Sem nível';
const SEM_SETOR = 'Sem setor';

const nivelKey = (nivel: number | null | undefined): string =>
  nivel != null && String(nivel).trim() !== '' ? String(nivel).trim() : SEM_NIVEL;

export interface NivelLinha {
  nivel: string;
  cargos: number;
  ocupantes: number;
}

/** Distribuição de cargos e ocupantes por nível hierárquico. */
export function distribuicaoPorNivel(rows: JobRow[]): NivelLinha[] {
  const mapa = new Map<string, NivelLinha>();
  for (const r of rows) {
    const k = nivelKey(r.cargo.nivel_hierarquico);
    const item = mapa.get(k) ?? { nivel: k, cargos: 0, ocupantes: 0 };
    item.cargos++;
    item.ocupantes += r.ocupantes;
    mapa.set(k, item);
  }
  return ordenarNiveis(Array.from(mapa.values()), (x) => x.nivel);
}

export interface SetorLinha {
  setorId: string | null;
  setorNome: string;
  cargos: number;
  ocupantes: number;
  cobertura: 'estruturado' | 'parcial' | 'sem_cargos';
}

/** Cobertura de cargos por setor (inclui setores sem cargos). */
export function cargosPorSetor(rows: JobRow[], setores: Setor[]): SetorLinha[] {
  const mapa = new Map<string, SetorLinha>();
  for (const s of setores) {
    mapa.set(s.id, { setorId: s.id, setorNome: s.nome, cargos: 0, ocupantes: 0, cobertura: 'sem_cargos' });
  }
  let semSetor: SetorLinha | null = null;

  for (const r of rows) {
    const id = r.cargo.setor_id ?? null;
    if (id && mapa.has(id)) {
      const item = mapa.get(id)!;
      item.cargos++;
      item.ocupantes += r.ocupantes;
    } else {
      semSetor = semSetor ?? { setorId: null, setorNome: SEM_SETOR, cargos: 0, ocupantes: 0, cobertura: 'sem_cargos' };
      semSetor.cargos++;
      semSetor.ocupantes += r.ocupantes;
    }
  }

  const finalizar = (l: SetorLinha): SetorLinha => ({
    ...l,
    cobertura: l.cargos === 0 ? 'sem_cargos' : l.ocupantes === 0 ? 'parcial' : 'estruturado',
  });

  const lista = Array.from(mapa.values()).map(finalizar).sort((a, b) => b.cargos - a.cargos || a.setorNome.localeCompare(b.setorNome, 'pt-BR'));
  if (semSetor) lista.push(finalizar(semSetor));
  return lista;
}

export type MatrizEstado = 'estruturado' | 'parcial' | 'vazio';

export interface MatrizCelula {
  cargos: number;
  ocupantes: number;
  estado: MatrizEstado;
}

export interface MatrizEstrutura {
  niveis: string[];
  setores: Array<{ id: string | null; nome: string }>;
  /** Chave: `${setorKey}::${nivel}` → célula. setorKey = setorId ?? '__sem__'. */
  celulas: Map<string, MatrizCelula>;
}

const setorKeyOf = (id: string | null): string => id ?? '__sem__';

/** Matriz Setor × Nível. Só inclui os níveis e setores efetivamente presentes. */
export function matrizSetorNivel(rows: JobRow[], setores: Setor[]): MatrizEstrutura {
  const nivelSet = new Set<string>();
  const setorSet = new Map<string, string>(); // key -> nome
  const celulas = new Map<string, MatrizCelula>();
  const nomeSetor = new Map(setores.map((s) => [s.id, s.nome]));

  for (const r of rows) {
    const nk = nivelKey(r.cargo.nivel_hierarquico);
    const sid = r.cargo.setor_id ?? null;
    const sk = setorKeyOf(sid);
    const snome = sid ? (nomeSetor.get(sid) ?? 'Setor desconhecido') : SEM_SETOR;
    nivelSet.add(nk);
    setorSet.set(sk, snome);
    const ck = `${sk}::${nk}`;
    const cel = celulas.get(ck) ?? { cargos: 0, ocupantes: 0, estado: 'vazio' as MatrizEstado };
    cel.cargos++;
    cel.ocupantes += r.ocupantes;
    celulas.set(ck, cel);
  }

  for (const [k, cel] of celulas) {
    cel.estado = cel.cargos === 0 ? 'vazio' : cel.ocupantes === 0 ? 'parcial' : 'estruturado';
    celulas.set(k, cel);
  }

  const niveis = ordenarNiveisStr(Array.from(nivelSet));
  const setoresOrd = Array.from(setorSet.entries())
    .map(([key, nome]) => ({ id: key === '__sem__' ? null : key, nome }))
    .sort((a, b) => {
      if (a.nome === SEM_SETOR) return 1;
      if (b.nome === SEM_SETOR) return -1;
      return a.nome.localeCompare(b.nome, 'pt-BR');
    });

  return { niveis, setores: setoresOrd, celulas };
}

export const matrizCelulaKey = (setorId: string | null, nivel: string): string => `${setorKeyOf(setorId)}::${nivel}`;

function ordenarNiveisStr(niveis: string[]): string[] {
  return niveis.sort((a, b) => {
    if (a === SEM_NIVEL) return 1;
    if (b === SEM_NIVEL) return -1;
    return a.localeCompare(b, 'pt-BR', { numeric: true });
  });
}

function ordenarNiveis<T>(itens: T[], key: (x: T) => string): T[] {
  return itens.sort((a, b) => {
    const ka = key(a);
    const kb = key(b);
    if (ka === SEM_NIVEL) return 1;
    if (kb === SEM_NIVEL) return -1;
    return ka.localeCompare(kb, 'pt-BR', { numeric: true });
  });
}
