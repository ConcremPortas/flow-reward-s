import { useMemo, useState } from 'react';

/** Seleção em massa (por id) — sobrevive à paginação/filtro. */
export function useEmployeeSelection() {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const toggleAll = (ids: string[]) =>
    setSelected((prev) => {
      const allSelected = ids.length > 0 && ids.every((id) => prev.has(id));
      if (allSelected) {
        const n = new Set(prev);
        ids.forEach((id) => n.delete(id));
        return n;
      }
      const n = new Set(prev);
      ids.forEach((id) => n.add(id));
      return n;
    });

  const clear = () => setSelected(new Set());
  const count = selected.size;
  const isSelected = (id: string) => selected.has(id);

  return useMemo(
    () => ({ selected, toggle, toggleAll, clear, count, isSelected }),
    [selected, count],
  );
}
