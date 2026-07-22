import { useSetores } from '@/hooks/useSetores';
import { useProducaoSetor } from '@/hooks/useProducaoSetor';
import { useEmpresas } from '@/hooks/useEmpresas';

/**
 * Composição das fontes da Central de Apuração de Produção — uma leitura por fonte.
 *
 * LIMITAÇÃO DOCUMENTADA (setores previstos): não existe no banco um campo que
 * marque quais setores "devem" ter produção. A relação disponível mais clara é
 * o conjunto de setores ATIVOS (mesma base usada pelo template de importação).
 * Por isso "setores previstos" = setores ativos; um setor ativo sem registro na
 * competência é considerado "pendente". Setores inativos não entram na previsão.
 */
export function useProductionEntry() {
  const { setores, loading: setoresLoading } = useSetores();
  const {
    registros, loading: registrosLoading, createRegistro, updateRegistro, deleteRegistro, saveApuracao, refetch,
  } = useProducaoSetor();
  const { empresas } = useEmpresas();

  const setoresPrevistos = setores
    .filter((s) => s.ativo)
    .sort((a, b) => a.nome.localeCompare(b.nome));

  return {
    setores, setoresPrevistos, empresas,
    registros, registrosLoading,
    createRegistro, updateRegistro, deleteRegistro, saveApuracao, refetch,
    loading: setoresLoading,
  };
}

export type UseProductionEntryReturn = ReturnType<typeof useProductionEntry>;
