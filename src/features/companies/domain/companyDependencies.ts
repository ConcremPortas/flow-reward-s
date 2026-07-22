// Vínculos/estrutura das empresas — agregação EM LOTE (sem N+1). Puro.
//
// Relações diretas: setores.empresa_id, funcionarios.empresa_id. Resultados de
// premiação não têm empresa_id — são mapeados pela empresa do funcionário
// (funcionario_id → empresa_id), calculado em memória a partir dos dados já
// carregados. A exclusão é bloqueada com vínculos ativos (setores ou funcionários).
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { Setor } from '@/hooks/useSetores';
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
import type { Empresa } from '@/hooks/useEmpresas';
import type { CompanyUsage } from '../types/company.types';

export interface CompanyUsageMaps {
  setores: Map<string, number>;
  funcionarios: Map<string, number>;
  funcionariosAtivos: Map<string, number>;
  resultados: Map<string, number>;
}

export function buildCompanyUsageMaps(
  setores: Setor[],
  funcionarios: Funcionario[],
  resultados: ResultadoPremiacao[],
): CompanyUsageMaps {
  const setoresM = new Map<string, number>();
  for (const s of setores) {
    if (!s.empresa_id) continue;
    setoresM.set(s.empresa_id, (setoresM.get(s.empresa_id) ?? 0) + 1);
  }

  const funcionariosM = new Map<string, number>();
  const ativosM = new Map<string, number>();
  const funcEmpresa = new Map<string, string>(); // funcionario_id → empresa_id
  for (const f of funcionarios) {
    if (!f.empresa_id) continue;
    funcEmpresa.set(f.id, f.empresa_id);
    funcionariosM.set(f.empresa_id, (funcionariosM.get(f.empresa_id) ?? 0) + 1);
    if (f.ativo) ativosM.set(f.empresa_id, (ativosM.get(f.empresa_id) ?? 0) + 1);
  }

  const resultadosM = new Map<string, number>();
  for (const r of resultados) {
    const empId = r.funcionario_id ? funcEmpresa.get(r.funcionario_id) : undefined;
    if (!empId) continue;
    resultadosM.set(empId, (resultadosM.get(empId) ?? 0) + 1);
  }

  return { setores: setoresM, funcionarios: funcionariosM, funcionariosAtivos: ativosM, resultados: resultadosM };
}

export function usageFor(empresa: Empresa, maps: CompanyUsageMaps): CompanyUsage {
  const setores = maps.setores.get(empresa.id) ?? 0;
  const funcionarios = maps.funcionarios.get(empresa.id) ?? 0;
  return {
    setores,
    funcionarios,
    funcionariosAtivos: maps.funcionariosAtivos.get(empresa.id) ?? 0,
    resultadosHistoricos: maps.resultados.get(empresa.id) ?? 0,
    temVinculos: setores > 0 || funcionarios > 0,
  };
}

/** Exclusão bloqueada com vínculos ativos (setores ou funcionários). */
export function hasActiveLinks(usage: CompanyUsage): boolean {
  return usage.setores > 0 || usage.funcionarios > 0;
}
