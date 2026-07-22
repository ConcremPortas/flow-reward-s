import { useMemo } from 'react';
import { useSetores } from '@/hooks/useSetores';
import { useFuncionariosSensivel } from '@/hooks/useFuncionariosSensivel';
import { useFuncoes } from '@/hooks/useFuncoes';
import { useHistoricoCargos } from '@/hooks/useHistoricoCargos';
import { useEstruturaHierarquica } from '@/hooks/useEstruturaHierarquica';
import { useAuth } from '@/contexts/AuthContext';
import { useJobsCrud } from './useJobsCrud';
import { buildJobsModel, type JobsModel } from '../domain/jobModel';

/**
 * Orquestra as fontes de dados da tela de Cargos, em lote (sem N+1), e deriva o
 * modelo puro. Expõe também as mutações (create/update/inativar/excluir) e a
 * autorização salarial. As telas apenas consomem — nenhuma query ou regra vive
 * no componente.
 */
export function useJobsData() {
  const crud = useJobsCrud();
  const { setores } = useSetores();
  const { dados: funcionarios } = useFuncionariosSensivel();
  const { funcoes } = useFuncoes();
  const { historico } = useHistoricoCargos();
  const { estrutura } = useEstruturaHierarquica();
  const { canAccess } = useAuth();

  const autorizadoSalario = canAccess('cargos_salarios');

  const model: JobsModel = useMemo(
    () => buildJobsModel({ cargos: crud.cargos, setores, funcionarios, funcoes, historico, estrutura, autorizadoSalario }),
    [crud.cargos, setores, funcionarios, funcoes, historico, estrutura, autorizadoSalario],
  );

  return {
    model,
    setores,
    historico,
    estrutura,
    autorizadoSalario,
    loading: crud.loading,
    error: crud.error,
    saving: crud.saving,
    createCargo: crud.createCargo,
    updateCargo: crud.updateCargo,
    setAtivo: crud.setAtivo,
    deleteCargo: crud.deleteCargo,
    refetch: crud.refetch,
  };
}
