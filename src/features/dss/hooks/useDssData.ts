import { useFuncionarios } from '@/hooks/useFuncionarios';
import { useDSS } from '@/hooks/useDSS';
import { useLocaisDSS } from '@/hooks/useLocaisDSS';
import { useSetores } from '@/hooks/useSetores';

/** Composição das fontes de dados da Central de Gestão de DSS — uma leitura por fonte. */
export function useDssData() {
  const { funcionarios, loading: funcionariosLoading } = useFuncionarios();
  const { dssRecords, loading: dssLoading, createDSS, updateDSS, deleteDSS, refetch } = useDSS();
  const { locais: locaisDSS, loading: locaisLoading } = useLocaisDSS();
  const { setores } = useSetores();

  return {
    funcionarios, funcionariosLoading,
    dssRecords, dssLoading, createDSS, updateDSS, deleteDSS, refetch,
    locaisDSS, locaisLoading,
    setores,
    loading: funcionariosLoading || locaisLoading,
  };
}

export type UseDssDataReturn = ReturnType<typeof useDssData>;
