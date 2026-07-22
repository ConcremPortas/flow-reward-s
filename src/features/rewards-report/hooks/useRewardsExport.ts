import { useCallback, useState } from 'react';
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
import { exportDetalhado, exportRH, type ExportContext } from '../domain/rewardsExport';

export type ExportKind = 'detalhado-excel' | 'detalhado-pdf' | 'rh-excel' | 'rh-pdf';

/**
 * Dispara as exportações EXISTENTES sobre o dataset FILTRADO. Bloqueia disparo
 * concorrente e expõe qual exportação está em execução.
 */
export function useRewardsExport(rows: ResultadoPremiacao[], ctx: ExportContext) {
  const [running, setRunning] = useState<ExportKind | null>(null);

  const run = useCallback(async (kind: ExportKind) => {
    if (running) return;
    setRunning(kind);
    try {
      if (kind === 'detalhado-excel') await exportDetalhado(rows, ctx, 'excel');
      else if (kind === 'detalhado-pdf') await exportDetalhado(rows, ctx, 'pdf');
      else if (kind === 'rh-excel') await exportRH(rows, ctx, 'excel');
      else if (kind === 'rh-pdf') await exportRH(rows, ctx, 'pdf');
    } finally {
      setRunning(null);
    }
  }, [rows, ctx, running]);

  return { run, running };
}
