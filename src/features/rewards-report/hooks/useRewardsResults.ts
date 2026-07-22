import { useMemo, useState } from 'react';
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
import type { ResultView } from '../types/rewards-report.types';

/** Modo de visualização + paginação real (25/50/100) da tabela de resultados. */
export function useRewardsResults(rows: ResultadoPremiacao[]) {
  const [view, setView] = useState<ResultView>('resultado');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const paged = useMemo(() => rows.slice((clampedPage - 1) * pageSize, clampedPage * pageSize), [rows, clampedPage, pageSize]);

  return {
    view, setView, page: clampedPage, setPage, pageSize,
    setPageSize: (n: number) => { setPageSize(n); setPage(1); },
    totalPages, paged, total: rows.length,
  };
}
