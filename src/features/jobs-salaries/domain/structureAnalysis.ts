import type { Cargo } from '@/hooks/useCargos';
import type { Setor } from '@/hooks/useSetores';
import type { FuncionarioSensivel } from '@/hooks/useFuncionariosSensivel';
import type { EstruturaHierarquica } from '@/hooks/useEstruturaHierarquica';
import type { Enquadramento } from '../types/jobsSalaries.types';

/** Contagens básicas do módulo (fatos — 0 real é `zero`, não ausência). */
export interface StructureCounts {
  totalCargos: number;
  totalSetores: number;
  totalColaboradores: number;
  colaboradoresAtivos: number;
  totalNiveis: number;
  totalEnquadrados: number;
  colaboradoresSemCargo: number;
}

export function contarEstrutura(
  cargos: Cargo[],
  setores: Setor[],
  colaboradores: FuncionarioSensivel[],
  estrutura: EstruturaHierarquica[],
  enquadramentos: Map<string, Enquadramento>,
): StructureCounts {
  const ativos = colaboradores.filter((c) => c.ativo !== false);
  // Níveis: combina os declarados nos cargos com os da estrutura hierárquica.
  const niveis = new Set<string>();
  for (const c of cargos) {
    if (c.nivel_hierarquico != null && String(c.nivel_hierarquico).trim() !== '') {
      niveis.add(String(c.nivel_hierarquico).trim());
    }
  }
  for (const e of estrutura) {
    if (e.nivel_hierarquico != null) niveis.add(String(e.nivel_hierarquico));
  }
  let enquadrados = 0;
  for (const e of enquadramentos.values()) if (e.cargoId) enquadrados++;

  return {
    totalCargos: cargos.length,
    totalSetores: setores.length,
    totalColaboradores: colaboradores.length,
    colaboradoresAtivos: ativos.length,
    totalNiveis: niveis.size,
    totalEnquadrados: enquadrados,
    colaboradoresSemCargo: Math.max(0, ativos.length - enquadrados),
  };
}

/** True quando o módulo ainda não foi implantado (nenhum cargo cadastrado). */
export function isModuloNaoImplantado(counts: StructureCounts): boolean {
  return counts.totalCargos === 0;
}

export interface NivelDistribuicao {
  nivel: string;
  cargos: number;
  colaboradores: number;
}

/**
 * Distribuição de cargos e colaboradores enquadrados por nível hierárquico.
 * Usa o nível declarado no cargo. Cargos sem nível caem em "Sem nível".
 */
export function distribuicaoPorNivel(
  cargos: Cargo[],
  enquadramentos: Map<string, Enquadramento>,
): NivelDistribuicao[] {
  const cargoPorId = new Map(cargos.map((c) => [c.id, c]));
  const mapa = new Map<string, NivelDistribuicao>();

  const chaveNivel = (c: Cargo): string => {
    const n = c.nivel_hierarquico;
    return n != null && String(n).trim() !== '' ? String(n).trim() : 'Sem nível';
  };

  for (const c of cargos) {
    const k = chaveNivel(c);
    const item = mapa.get(k) ?? { nivel: k, cargos: 0, colaboradores: 0 };
    item.cargos++;
    mapa.set(k, item);
  }

  for (const e of enquadramentos.values()) {
    if (!e.cargoId) continue;
    const cargo = cargoPorId.get(e.cargoId);
    if (!cargo) continue;
    const k = chaveNivel(cargo);
    const item = mapa.get(k) ?? { nivel: k, cargos: 0, colaboradores: 0 };
    item.colaboradores++;
    mapa.set(k, item);
  }

  return Array.from(mapa.values()).sort((a, b) => {
    if (a.nivel === 'Sem nível') return 1;
    if (b.nivel === 'Sem nível') return -1;
    return a.nivel.localeCompare(b.nivel, 'pt-BR', { numeric: true });
  });
}

export interface SetorCobertura {
  setorId: string;
  setorNome: string;
  cargos: number;
  colaboradores: number;
}

/** Cobertura de cargos por setor + headcount por setor. */
export function coberturaPorSetor(
  cargos: Cargo[],
  setores: Setor[],
  colaboradores: FuncionarioSensivel[],
): SetorCobertura[] {
  const porSetor = new Map<string, SetorCobertura>();
  for (const s of setores) {
    porSetor.set(s.id, { setorId: s.id, setorNome: s.nome, cargos: 0, colaboradores: 0 });
  }
  for (const c of cargos) {
    if (c.setor_id && porSetor.has(c.setor_id)) porSetor.get(c.setor_id)!.cargos++;
  }
  for (const f of colaboradores) {
    if (f.ativo === false) continue;
    if (f.setor_id && porSetor.has(f.setor_id)) porSetor.get(f.setor_id)!.colaboradores++;
  }
  return Array.from(porSetor.values()).sort((a, b) => b.colaboradores - a.colaboradores);
}

export interface FuncaoCargoDiagnostico {
  colaboradoresComFuncao: number;
  colaboradoresComCargo: number;
  colaboradoresSemVinculoCargo: number;
  /** Cargos que não possuem nenhum colaborador enquadrado. */
  cargosSemOcupante: number;
}

/**
 * Diagnóstico honesto do descompasso FUNÇÃO × CARGO. Não converte função em
 * cargo automaticamente — apenas mede a distância entre o vínculo cadastral
 * (função) e o enquadramento formal (cargo).
 */
export function diagnosticoFuncaoCargo(
  cargos: Cargo[],
  colaboradores: FuncionarioSensivel[],
  enquadramentos: Map<string, Enquadramento>,
): FuncaoCargoDiagnostico {
  const ativos = colaboradores.filter((c) => c.ativo !== false);
  const comFuncao = ativos.filter((c) => c.funcao_id != null).length;
  const comCargo = ativos.filter((c) => {
    const e = enquadramentos.get(c.id);
    return !!e?.cargoId;
  }).length;
  const cargosComOcupante = new Set<string>();
  for (const e of enquadramentos.values()) if (e.cargoId) cargosComOcupante.add(e.cargoId);

  return {
    colaboradoresComFuncao: comFuncao,
    colaboradoresComCargo: comCargo,
    colaboradoresSemVinculoCargo: Math.max(0, ativos.length - comCargo),
    cargosSemOcupante: cargos.filter((c) => !cargosComOcupante.has(c.id)).length,
  };
}
