import { useFuncionarios } from '@/hooks/useFuncionarios';
import { useFaltasAdvertencias } from '@/hooks/useFaltasAdvertencias';
import { useSetores } from '@/hooks/useSetores';
import { useCategorias } from '@/hooks/useCategorias';

const isFuncionarioAtivo = (f: { status?: string }) => {
  const s = (f.status || '').toLowerCase();
  return s !== 'rescisao' && s !== 'rescisão';
};

/** Composição das fontes de dados da Central de Apuração — uma única leitura por fonte. */
export function useOccurrences() {
  const { funcionarios, loading: funcionariosLoading } = useFuncionarios();
  const {
    registros, loading: registrosLoading, salvarApuracaoMensal,
    deleteRegistrosPorCompetencia, updateRegistro, deleteRegistro, refetch,
  } = useFaltasAdvertencias();
  const { setores } = useSetores();
  const { categorias } = useCategorias();

  const funcionariosAtivos = funcionarios.filter(isFuncionarioAtivo).sort((a, b) => a.nome.localeCompare(b.nome));

  return {
    funcionarios, funcionariosAtivos,
    setores, categorias,
    registros, registrosLoading,
    loading: funcionariosLoading,
    salvarApuracaoMensal, deleteRegistrosPorCompetencia, updateRegistro, deleteRegistro, refetch,
  };
}

export type UseOccurrencesReturn = ReturnType<typeof useOccurrences>;
