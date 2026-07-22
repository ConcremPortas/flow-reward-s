import type { Cargo } from '@/hooks/useCargos';
import type { FuncionarioSensivel } from '@/hooks/useFuncionariosSensivel';
import type { Enquadramento } from '@/features/jobs-salaries/types/jobsSalaries.types';
import { derivarSituacao } from './jobStatus';
import type { JobRow } from '../types/job.types';

export interface OccupancyInfo {
  ocupantes: number;
  /** Ocupantes com salário conhecido fora da faixa (null = não autorizado ou sem faixa). */
  ocupantesForaDaFaixa: number | null;
}

/**
 * Ocupação por cargo, derivada do ENQUADRAMENTO (histórico de cargos) — nunca de
 * `funcao_id` (função ≠ cargo). Recebe os enquadramentos já derivados (uma
 * passada) e o salário por colaborador da view guardada. Sem N+1.
 */
export function calcularOcupacao(
  cargos: Cargo[],
  enquadramentos: Map<string, Enquadramento>,
  salarioPorFuncionario: Map<string, number | null>,
  autorizadoSalario: boolean,
): Map<string, OccupancyInfo> {
  const porCargo = new Map<string, { ocupantes: number; fora: number }>();
  for (const c of cargos) porCargo.set(c.id, { ocupantes: 0, fora: 0 });

  const faixaPorCargo = new Map(
    cargos.map((c) => [c.id, { min: c.salario_minimo, max: c.salario_maximo }]),
  );

  for (const e of enquadramentos.values()) {
    if (!e.cargoId) continue;
    const registro = porCargo.get(e.cargoId);
    if (!registro) continue;
    registro.ocupantes++;
    if (autorizadoSalario) {
      const faixa = faixaPorCargo.get(e.cargoId);
      const sal = salarioPorFuncionario.get(e.funcionarioId);
      if (faixa && typeof faixa.min === 'number' && typeof faixa.max === 'number' && typeof sal === 'number') {
        if (sal < faixa.min || sal > faixa.max) registro.fora++;
      }
    }
  }

  const resultado = new Map<string, OccupancyInfo>();
  for (const c of cargos) {
    const r = porCargo.get(c.id)!;
    const temFaixa = typeof c.salario_minimo === 'number' && typeof c.salario_maximo === 'number';
    resultado.set(c.id, {
      ocupantes: r.ocupantes,
      ocupantesForaDaFaixa: autorizadoSalario && temFaixa ? r.fora : null,
    });
  }
  return resultado;
}

/** Constrói as linhas enriquecidas da tabela (cargo + ocupação + situação). */
export function construirJobRows(cargos: Cargo[], ocupacao: Map<string, OccupancyInfo>): JobRow[] {
  return cargos.map((cargo) => {
    const occ = ocupacao.get(cargo.id) ?? { ocupantes: 0, ocupantesForaDaFaixa: null };
    const { situacao, lacunas } = derivarSituacao(cargo, occ.ocupantes, occ.ocupantesForaDaFaixa);
    return {
      cargo,
      ocupantes: occ.ocupantes,
      situacao,
      lacunas,
      temFaixa: typeof cargo.salario_minimo === 'number' && typeof cargo.salario_maximo === 'number',
      semSetor: !cargo.setor_id,
      semNivel: cargo.nivel_hierarquico == null,
      ocupantesForaDaFaixa: occ.ocupantesForaDaFaixa,
    };
  });
}

/** Mapa auxiliar salário por colaborador (da view guardada). */
export function salarioPorFuncionario(funcionarios: FuncionarioSensivel[]): Map<string, number | null> {
  return new Map(funcionarios.map((f) => [f.id, f.salario]));
}
