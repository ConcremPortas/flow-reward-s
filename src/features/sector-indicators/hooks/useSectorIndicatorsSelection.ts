import { useCallback, useMemo, useState } from 'react';

/**
 * Seleção de setores para ações em massa (aplicar metas/indicadores, marcar sem
 * medição). Mantém um conjunto de setorIds selecionados.
 */
export function useSectorIndicatorsSelection() {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = useCallback((setorId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(setorId)) next.delete(setorId);
      else next.add(setorId);
      return next;
    });
  }, []);

  const setMany = useCallback((setorIds: string[], value: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of setorIds) {
        if (value) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  const isSelected = useCallback((setorId: string) => selected.has(setorId), [selected]);

  const ids = useMemo(() => [...selected], [selected]);

  return { selected, ids, count: selected.size, toggle, setMany, clear, isSelected };
}

export type UseSectorIndicatorsSelectionReturn = ReturnType<typeof useSectorIndicatorsSelection>;
