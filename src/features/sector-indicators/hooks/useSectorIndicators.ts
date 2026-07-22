import { useSetores } from '@/hooks/useSetores';
import { useIndicadoresSetor } from '@/hooks/useIndicadoresSetor';
import { useEmpresas } from '@/hooks/useEmpresas';

/**
 * Composição das fontes da Central de Apuração dos Indicadores por Setor — uma
 * leitura por fonte.
 *
 * LIMITAÇÃO DOCUMENTADA (setores previstos): não existe no banco um campo que
 * marque quais setores "devem" ter indicadores. A relação disponível mais clara
 * é o conjunto de setores ATIVOS. Por isso "setores previstos" = setores ativos;
 * um setor ativo sem registro na competência é "pendente". Setores inativos não
 * entram na previsão.
 */
export function useSectorIndicators() {
  const { setores, loading: setoresLoading } = useSetores();
  const {
    indicadores, loading: indicadoresLoading, saveApuracaoIndicadores, deleteIndicador, refetch,
  } = useIndicadoresSetor();
  const { empresas } = useEmpresas();

  const setoresPrevistos = setores
    .filter((s) => s.ativo)
    .sort((a, b) => a.nome.localeCompare(b.nome));

  return {
    setores, setoresPrevistos, empresas,
    indicadores, indicadoresLoading,
    saveApuracaoIndicadores, deleteIndicador, refetch,
    loading: setoresLoading,
  };
}

export type UseSectorIndicatorsReturn = ReturnType<typeof useSectorIndicators>;
