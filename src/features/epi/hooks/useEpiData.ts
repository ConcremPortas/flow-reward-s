import { useMemo } from 'react';
import { useFuncionarios } from '@/hooks/useFuncionarios';
import { useEPI } from '@/hooks/useEPI';
import { useEmpresas } from '@/hooks/useEmpresas';
import { useSetores } from '@/hooks/useSetores';
import { groupEpiRecords } from '../domain/epiCalculations';

/** Composição das fontes de dados da Central de Auditoria de EPI — uma leitura por fonte. */
export function useEpiData() {
  const { funcionarios, loading: funcionariosLoading } = useFuncionarios();
  const { epiRecords, loading: epiLoading, saveAuditoria, deleteManyEPI, refetch } = useEPI();
  const { empresas } = useEmpresas();
  const { setores } = useSetores();

  const funcionariosById = useMemo(() => new Map(funcionarios.map((f) => [f.id, f])), [funcionarios]);
  const auditGroups = useMemo(() => groupEpiRecords(epiRecords, funcionariosById), [epiRecords, funcionariosById]);

  return {
    funcionarios, funcionariosById, funcionariosLoading,
    epiRecords, epiLoading, saveAuditoria, deleteManyEPI, refetch,
    empresas, setores,
    auditGroups,
    loading: funcionariosLoading,
  };
}

export type UseEpiDataReturn = ReturnType<typeof useEpiData>;
