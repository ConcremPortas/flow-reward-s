import { useMemo } from 'react';
import { useFuncionarios } from '@/hooks/useFuncionarios';
import { useFuncionariosSensivel } from '@/hooks/useFuncionariosSensivel';
import { useCargos } from '@/hooks/useCargos';
import { useFuncoes } from '@/hooks/useFuncoes';
import { useHistoricoCargos } from '@/hooks/useHistoricoCargos';
import { useAuth } from '@/contexts/AuthContext';
import { buildEmployeeRows, calcularContexto, type EmployeeContextMetrics } from '../domain/employeeJobModel';
import type { JobEmployeeRow } from '../types/job-employee.types';

export interface JobEmployeesData {
  rows: JobEmployeeRow[];
  contexto: EmployeeContextMetrics;
  autorizadoSalario: boolean;
  temCargos: boolean;
  loading: boolean;
  error: boolean;
  // Fontes brutas para filtros/opções e enquadramento.
  empresas: Array<{ id: string; nome: string }>;
  setores: Array<{ id: string; nome: string }>;
  funcoesOptions: Array<{ id: string; nome: string }>;
  cargosOptions: Array<{ id: string; nome: string }>;
  funcoes: ReturnType<typeof useFuncoes>['funcoes'];
  cargos: ReturnType<typeof useCargos>['cargos'];
  historico: ReturnType<typeof useHistoricoCargos>['historico'];
  criarEnquadramento: ReturnType<typeof useHistoricoCargos>['createHistorico'];
  refetch: () => void;
}

/**
 * Orquestra as fontes do enquadramento em lote (sem N+1): colaboradores (tabela
 * mestre do RH), dados sensíveis (view guardada), cargos, funções e histórico.
 * Deriva o modelo puro. A criação de vínculo usa o mecanismo existente
 * (`createHistorico` → concremrh_historico_cargos). Salário só quando autorizado.
 */
export function useJobEmployeesData(): JobEmployeesData {
  const { funcionarios, loading: loadingFunc, refetch } = useFuncionarios();
  const { porId: sensiveisPorId } = useFuncionariosSensivel();
  const { cargos, loading: loadingCargos } = useCargos();
  const { funcoes } = useFuncoes();
  const { historico, createHistorico } = useHistoricoCargos();
  const { canAccess } = useAuth();

  const autorizadoSalario = canAccess('cargos_salarios');

  const rows = useMemo(
    () => buildEmployeeRows({ funcionarios, cargos, sensiveisPorId, historico, autorizadoSalario }),
    [funcionarios, cargos, sensiveisPorId, historico, autorizadoSalario],
  );
  const contexto = useMemo(() => calcularContexto(rows), [rows]);

  // Opções de filtro derivadas dos próprios colaboradores (nomes reais).
  const { empresas, setores, funcoesOptions } = useMemo(() => {
    const emp = new Map<string, string>();
    const set = new Map<string, string>();
    const fun = new Map<string, string>();
    for (const f of funcionarios) {
      if (f.empresa_id && f.empresa?.nome) emp.set(f.empresa_id, f.empresa.nome);
      if (f.setor_id && f.setor?.nome) set.set(f.setor_id, f.setor.nome);
      if (f.funcao_id && f.funcao?.nome) fun.set(f.funcao_id, f.funcao.nome);
    }
    const toOpts = (m: Map<string, string>) =>
      Array.from(m.entries()).map(([id, nome]) => ({ id, nome })).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    return { empresas: toOpts(emp), setores: toOpts(set), funcoesOptions: toOpts(fun) };
  }, [funcionarios]);

  const cargosOptions = useMemo(
    () => cargos.map((c) => ({ id: c.id, nome: c.nome })).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [cargos],
  );

  return {
    rows,
    contexto,
    autorizadoSalario,
    temCargos: cargos.length > 0,
    loading: loadingFunc || loadingCargos,
    error: false,
    empresas,
    setores,
    funcoesOptions,
    cargosOptions,
    funcoes,
    cargos,
    historico,
    criarEnquadramento: createHistorico,
    refetch,
  };
}
