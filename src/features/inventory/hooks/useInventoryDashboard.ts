import { useEffect, useMemo, useState } from 'react';
import { useInventoryScreen } from './useInventoryScreen';
import { derivarDashboard, DASH_FILTROS_VAZIO, type DashFiltros, type DashboardData } from '../components/dashboard/derive';

export interface InventoryDashboard {
  screen: ReturnType<typeof useInventoryScreen>;
  filtros: DashFiltros;
  setFiltro: <K extends keyof DashFiltros>(k: K, v: DashFiltros[K]) => void;
  limpar: () => void;
  data: DashboardData;
  atualizadoEm: Date;
}

/**
 * Dashboard do estoque. Reaproveita `useInventoryScreen` (uma única carga de dados
 * reais) e deriva todos os blocos client-side conforme os filtros globais — os
 * filtros NÃO disparam novas consultas (troca instantânea, sem custo de rede).
 */
export function useInventoryDashboard(): InventoryDashboard {
  const screen = useInventoryScreen();
  const [filtros, setFiltros] = useState<DashFiltros>(DASH_FILTROS_VAZIO);
  const [atualizadoEm, setAtualizadoEm] = useState(() => new Date());

  // Marca o horário de referência sempre que os dados são (re)carregados.
  useEffect(() => { if (!screen.loading) setAtualizadoEm(new Date()); }, [screen.loading, screen.movimentacoes]);

  const data = useMemo(
    () => derivarDashboard(screen.fardamentos, screen.movimentacoes, filtros, atualizadoEm),
    [screen.fardamentos, screen.movimentacoes, filtros, atualizadoEm],
  );

  const setFiltro = <K extends keyof DashFiltros>(k: K, v: DashFiltros[K]) => setFiltros((p) => ({ ...p, [k]: v }));
  const limpar = () => setFiltros(DASH_FILTROS_VAZIO);

  return { screen, filtros, setFiltro, limpar, data, atualizadoEm };
}
