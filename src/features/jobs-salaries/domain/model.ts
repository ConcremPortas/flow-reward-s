import type { JobsSalariesData, JobsSalariesFilters, Enquadramento } from '../types/jobsSalaries.types';
import { derivarEnquadramentos } from './enquadramento';
import {
  contarEstrutura,
  isModuloNaoImplantado,
  distribuicaoPorNivel,
  coberturaPorSetor,
  diagnosticoFuncaoCargo,
  type StructureCounts,
  type NivelDistribuicao,
  type SetorCobertura,
  type FuncaoCargoDiagnostico,
} from './structureAnalysis';
import { calcularMaturidade, type MaturidadeResultado } from './structureMaturity';
import {
  calcularRemuneracao,
  calcularPosicionamento,
  calcularCompressao,
  type CompensationMetrics,
  type PosicionamentoResultado,
  type CompressaoResultado,
} from './compensation';
import { construirPendencias, resumirAtencao, type GovernanceIssue, type AttentionSummary } from './governanceIssues';
import { filtrarCargos, filtrarColaboradores } from './filters';

export interface FilterOptions {
  setores: Array<{ id: string; nome: string }>;
  niveis: string[];
  cargos: Array<{ id: string; nome: string }>;
}

export interface JobsSalariesModel {
  naoImplantado: boolean;
  countsGlobais: StructureCounts;
  maturidade: MaturidadeResultado;
  enquadramentos: Map<string, Enquadramento>;
  // Derivados sobre o conjunto FILTRADO (exceto maturidade, que é global).
  countsFiltrados: StructureCounts;
  distribuicaoNivel: NivelDistribuicao[];
  coberturaSetor: SetorCobertura[];
  diagnostico: FuncaoCargoDiagnostico;
  remuneracao: CompensationMetrics;
  posicionamento: PosicionamentoResultado;
  compressao: CompressaoResultado;
  pendencias: GovernanceIssue[];
  atencao: AttentionSummary;
  filterOptions: FilterOptions;
  cargosFiltrados: number;
  colaboradoresFiltrados: number;
}

/**
 * Constrói todo o modelo do dashboard a partir dos dados brutos e dos filtros.
 * Puro e memoizável. A maturidade é sempre GLOBAL (mede implantação do módulo);
 * os demais recortes respeitam os filtros ativos. Nada aqui inventa dados nem
 * transforma ausência em zero — isso é responsabilidade do modelo Avail.
 */
export function buildJobsSalariesModel(data: JobsSalariesData, filtros: JobsSalariesFilters): JobsSalariesModel {
  const enquadramentos = derivarEnquadramentos(data.historico);

  const countsGlobais = contarEstrutura(data.cargos, data.setores, data.funcionarios, data.estrutura, enquadramentos);
  const maturidade = calcularMaturidade(data.cargos, countsGlobais);

  const cargosFiltrados = filtrarCargos(data.cargos, filtros);
  const colaboradoresFiltrados = filtrarColaboradores(data.funcionarios, filtros, enquadramentos);

  const countsFiltrados = contarEstrutura(cargosFiltrados, data.setores, colaboradoresFiltrados, data.estrutura, enquadramentos);
  const distribuicaoNivel = distribuicaoPorNivel(cargosFiltrados, enquadramentos);
  const coberturaSetor = coberturaPorSetor(cargosFiltrados, data.setores, colaboradoresFiltrados);
  const diagnostico = diagnosticoFuncaoCargo(cargosFiltrados, colaboradoresFiltrados, enquadramentos);

  const remuneracao = calcularRemuneracao(colaboradoresFiltrados, data.autorizadoRemuneracao);
  const posicionamento = calcularPosicionamento(cargosFiltrados, colaboradoresFiltrados, enquadramentos, data.autorizadoRemuneracao);
  const compressao = calcularCompressao(cargosFiltrados, data.autorizadoRemuneracao);

  const pendencias = construirPendencias(cargosFiltrados, colaboradoresFiltrados, countsFiltrados, diagnostico, data.autorizadoRemuneracao);
  const atencao = resumirAtencao(pendencias);

  const niveis = Array.from(
    new Set(
      data.cargos
        .map((c) => (c.nivel_hierarquico == null ? '' : String(c.nivel_hierarquico).trim()))
        .filter((n) => n !== ''),
    ),
  ).sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }));

  const filterOptions: FilterOptions = {
    setores: data.setores.map((s) => ({ id: s.id, nome: s.nome })),
    niveis,
    cargos: data.cargos.map((c) => ({ id: c.id, nome: c.nome })),
  };

  return {
    naoImplantado: isModuloNaoImplantado(countsGlobais),
    countsGlobais,
    maturidade,
    enquadramentos,
    countsFiltrados,
    distribuicaoNivel,
    coberturaSetor,
    diagnostico,
    remuneracao,
    posicionamento,
    compressao,
    pendencias,
    atencao,
    filterOptions,
    cargosFiltrados: cargosFiltrados.length,
    colaboradoresFiltrados: colaboradoresFiltrados.length,
  };
}
