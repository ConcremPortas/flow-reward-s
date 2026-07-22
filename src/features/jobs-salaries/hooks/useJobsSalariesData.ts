import { useMemo } from 'react';
import { useCargos } from '@/hooks/useCargos';
import { useSetores } from '@/hooks/useSetores';
import { useFuncionariosSensivel } from '@/hooks/useFuncionariosSensivel';
import { useEstruturaHierarquica } from '@/hooks/useEstruturaHierarquica';
import { useHistoricoCargos } from '@/hooks/useHistoricoCargos';
import { useAuth } from '@/contexts/AuthContext';
import type { JobsSalariesData } from '../types/jobsSalaries.types';

/**
 * Consolida as fontes do módulo Cargos & Salários em UMA passada (sem N+1):
 * cargos, setores, colaboradores (view guardada), estrutura hierárquica e
 * histórico de cargos — os hooks existentes já trazem cada tabela em uma única
 * consulta. A autorização de remuneração vem do AuthContext (`cargos_salarios`
 * — admin tem acesso total). Nenhuma alteração em banco/RLS/motor.
 */
export function useJobsSalariesData(): JobsSalariesData {
  const { cargos, loading: loadingCargos } = useCargos();
  const { setores, loading: loadingSetores } = useSetores();
  const { dados: funcionarios, loading: loadingFuncionarios } = useFuncionariosSensivel();
  const { estrutura, loading: loadingEstrutura } = useEstruturaHierarquica();
  const { historico, loading: loadingHistorico } = useHistoricoCargos();
  const { canAccess } = useAuth();

  const autorizadoRemuneracao = canAccess('cargos_salarios');

  return useMemo<JobsSalariesData>(
    () => ({
      cargos,
      setores,
      funcionarios,
      estrutura,
      historico,
      autorizadoRemuneracao,
      load: {
        cargos: { loading: loadingCargos, error: false },
        setores: { loading: loadingSetores, error: false },
        funcionarios: { loading: loadingFuncionarios, error: false },
        estrutura: { loading: loadingEstrutura, error: false },
        historico: { loading: loadingHistorico, error: false },
      },
    }),
    [
      cargos,
      setores,
      funcionarios,
      estrutura,
      historico,
      autorizadoRemuneracao,
      loadingCargos,
      loadingSetores,
      loadingFuncionarios,
      loadingEstrutura,
      loadingHistorico,
    ],
  );
}
