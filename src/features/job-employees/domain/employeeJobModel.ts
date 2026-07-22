import type { Funcionario } from '@/hooks/useFuncionarios';
import type { Cargo } from '@/hooks/useCargos';
import type { FuncionarioSensivel } from '@/hooks/useFuncionariosSensivel';
import type { HistoricoCargo } from '@/hooks/useHistoricoCargos';
import { derivarEnquadramentos } from '@/features/jobs-salaries/domain/enquadramento';
import { calcularPosicaoSalarial } from './employeeSalaryPosition';
import { derivarEnquadramento } from './employeeJobStatus';
import type { JobEmployeeRow } from '../types/job-employee.types';

export interface EmployeeModelInput {
  funcionarios: Funcionario[];
  cargos: Cargo[];
  sensiveisPorId: Record<string, FuncionarioSensivel>;
  historico: HistoricoCargo[];
  autorizadoSalario: boolean;
}

const isAtivo = (f: Funcionario): boolean => {
  if (f.ativo === false) return false;
  const status = (f.status || '').toLowerCase();
  return status !== 'rescisao' && status !== 'rescisão';
};

/**
 * Constrói as linhas enriquecidas dos colaboradores em UMA passada (sem N+1):
 * cargo estruturado via enquadramento (histórico), salário da view guardada
 * (apenas se autorizado), posição salarial e situação de enquadramento. Puro.
 */
export function buildEmployeeRows(input: EmployeeModelInput): JobEmployeeRow[] {
  const enquadramentos = derivarEnquadramentos(input.historico);
  const cargoPorId = new Map(input.cargos.map((c) => [c.id, c]));

  return input.funcionarios.map((f) => {
    const enq = enquadramentos.get(f.id);
    const cargo = enq?.cargoId ? cargoPorId.get(enq.cargoId) ?? null : null;
    const sens = input.sensiveisPorId[f.id];
    const salario = input.autorizadoSalario ? (sens?.salario ?? null) : null;
    const posicao = calcularPosicaoSalarial(cargo, salario, input.autorizadoSalario);
    const { situacao, pendencias } = derivarEnquadramento(!!f.funcao_id, cargo, posicao);

    return {
      funcionario: f,
      funcaoNome: f.funcao?.nome ?? null,
      setorNome: f.setor?.nome ?? null,
      empresaNome: f.empresa?.nome ?? null,
      cargo,
      situacao,
      pendencias,
      salario,
      posicaoSalarial: posicao,
      ativo: isAtivo(f),
    };
  });
}

export interface EmployeeContextMetrics {
  totalAtivos: number;
  enquadrados: number;
  semCargo: number;
  funcoesDistintas: number;
  setoresDistintos: number;
  pendentes: number;
  coberturaEnquadramento: number; // 0..100
}

/** Métricas da faixa de contexto (derivadas das linhas). */
export function calcularContexto(rows: JobEmployeeRow[]): EmployeeContextMetrics {
  const ativos = rows.filter((r) => r.ativo);
  const enquadrados = ativos.filter((r) => r.cargo != null).length;
  const funcoes = new Set<string>();
  const setores = new Set<string>();
  let pendentes = 0;
  for (const r of ativos) {
    if (r.funcionario.funcao_id) funcoes.add(r.funcionario.funcao_id);
    if (r.funcionario.setor_id) setores.add(r.funcionario.setor_id);
    if (r.situacao !== 'regular') pendentes++;
  }
  return {
    totalAtivos: ativos.length,
    enquadrados,
    semCargo: ativos.length - enquadrados,
    funcoesDistintas: funcoes.size,
    setoresDistintos: setores.size,
    pendentes,
    coberturaEnquadramento: ativos.length > 0 ? Math.round((enquadrados / ativos.length) * 100) : 0,
  };
}
