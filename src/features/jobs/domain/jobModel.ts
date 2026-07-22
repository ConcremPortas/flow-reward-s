import type { Cargo } from '@/hooks/useCargos';
import type { Setor } from '@/hooks/useSetores';
import type { FuncionarioSensivel } from '@/hooks/useFuncionariosSensivel';
import type { Funcao } from '@/hooks/useFuncoes';
import type { HistoricoCargo } from '@/hooks/useHistoricoCargos';
import type { EstruturaHierarquica } from '@/hooks/useEstruturaHierarquica';
import type { Enquadramento } from '@/features/jobs-salaries/types/jobsSalaries.types';
import { derivarEnquadramentos } from '@/features/jobs-salaries/domain/enquadramento';
import { calcularOcupacao, construirJobRows, salarioPorFuncionario } from './jobOccupancy';
import { calcularContexto, type JobsContextMetrics } from './jobDataQuality';
import { analisarFuncoes, type FuncaoMappingResumo } from './jobFunctionMapping';
import type { JobRow } from '../types/job.types';

export interface JobsModelInput {
  cargos: Cargo[];
  setores: Setor[];
  funcionarios: FuncionarioSensivel[];
  funcoes: Funcao[];
  historico: HistoricoCargo[];
  estrutura: EstruturaHierarquica[];
  autorizadoSalario: boolean;
}

export interface JobsModel {
  rows: JobRow[];
  contexto: JobsContextMetrics;
  enquadramentos: Map<string, Enquadramento>;
  funcaoMapping: FuncaoMappingResumo;
  colaboradoresAtivos: number;
  setoresTotal: number;
  niveisDistintos: string[];
  naoImplantado: boolean;
}

/** Constrói o modelo completo (linhas enriquecidas + contexto + diagnóstico de
 * funções) numa única passada. Puro e memoizável. Sem N+1. */
export function buildJobsModel(input: JobsModelInput): JobsModel {
  const enquadramentos = derivarEnquadramentos(input.historico);
  const salarios = salarioPorFuncionario(input.funcionarios);
  const ocupacao = calcularOcupacao(input.cargos, enquadramentos, salarios, input.autorizadoSalario);
  const rows = construirJobRows(input.cargos, ocupacao);
  const contexto = calcularContexto(rows);
  const funcaoMapping = analisarFuncoes(input.funcoes, input.funcionarios, input.cargos);

  const niveisDistintos = Array.from(
    new Set(
      input.cargos
        .map((c) => (c.nivel_hierarquico == null ? '' : String(c.nivel_hierarquico).trim()))
        .filter((n) => n !== ''),
    ),
  ).sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }));

  return {
    rows,
    contexto,
    enquadramentos,
    funcaoMapping,
    colaboradoresAtivos: input.funcionarios.filter((f) => f.ativo !== false).length,
    setoresTotal: input.setores.length,
    niveisDistintos,
    naoImplantado: input.cargos.length === 0,
  };
}
