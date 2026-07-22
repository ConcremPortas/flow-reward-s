import { useMemo } from 'react';
import { useBasePremiacao } from '@/hooks/useBasePremiacao';
import { useFuncionarios } from '@/hooks/useFuncionarios';
import { useFormulasCalculo } from '@/hooks/useFormulasCalculo';
import { useResultadosPremiacao } from '@/hooks/useResultadosPremiacao';
import { useFaltasAdvertencias } from '@/hooks/useFaltasAdvertencias';
import { useEPI } from '@/hooks/useEPI';
import { useDSS } from '@/hooks/useDSS';
import { useProducaoSetor } from '@/hooks/useProducaoSetor';
import { useCategorias } from '@/hooks/useCategorias';
import { useSetores } from '@/hooks/useSetores';
import { useIndicadoresSetor } from '@/hooks/useIndicadoresSetor';
import { useIndicadoresGerais } from '@/hooks/useIndicadoresGerais';
import { useConfiguracoesKits } from '@/hooks/useConfiguracoesKits';
import type { RewardsPreviewInputs } from '../domain/rewardsPreview';

/** Categorias elegíveis à premiação (mesmo conjunto usado no seletor legado). */
const CATEGORIAS_PREMIAVEIS = ['AUXILIAR', 'SUPERVISOR', 'ENCARREGADO'];

/**
 * Composição de TODAS as fontes usadas pelo processamento de premiações — uma
 * leitura por fonte. Fornece `previewInputs` (para o motor de orquestração puro)
 * e reexpõe as ações de persistência EXISTENTES, sem alterá-las.
 */
export function useRewardsProcessing() {
  const { bases, loading: basesLoading } = useBasePremiacao();
  const { funcionarios, loading: funcLoading } = useFuncionarios();
  const { formulas } = useFormulasCalculo();
  const { resultados, loading: resLoading, salvarResultados, verificarResultadosExistentes, excluirResultados, refetch } = useResultadosPremiacao();
  const { registros: faltasAdvertencias } = useFaltasAdvertencias();
  const { epiRecords } = useEPI();
  const { dssRecords } = useDSS();
  const { registros: producaoSetor } = useProducaoSetor();
  const { categorias, loading: catLoading } = useCategorias();
  const { setores } = useSetores();
  const { indicadores: indicadoresSetor } = useIndicadoresSetor();
  const { indicadores: indicadoresGerais } = useIndicadoresGerais();
  const { getConfigParaCompetencia } = useConfiguracoesKits();

  const categoriasPremiaveis = useMemo(
    () => categorias.filter(c => CATEGORIAS_PREMIAVEIS.includes(c.nome.toUpperCase())),
    [categorias],
  );

  const previewInputs = useMemo<RewardsPreviewInputs>(() => ({
    funcionarios, formulas, bases, setores,
    faltasAdvertencias, epiRecords, dssRecords, producaoSetor,
    indicadoresSetor, indicadoresGerais,
    getConfigKits: getConfigParaCompetencia,
  }), [funcionarios, formulas, bases, setores, faltasAdvertencias, epiRecords, dssRecords, producaoSetor, indicadoresSetor, indicadoresGerais, getConfigParaCompetencia]);

  return {
    bases, funcionarios, formulas, categorias, categoriasPremiaveis, setores,
    resultados, previewInputs,
    salvarResultados, verificarResultadosExistentes, excluirResultados, refetch,
    loading: basesLoading || funcLoading || resLoading || catLoading,
  };
}

export type UseRewardsProcessingReturn = ReturnType<typeof useRewardsProcessing>;
