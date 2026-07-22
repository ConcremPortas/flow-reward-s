import { useCallback, useEffect, useRef, useState } from 'react';
import { getUnidades, getVariantes } from '../services/inventoryApi';
import type { UnidadeRow, VarianteRow } from '../types/db.types';

/**
 * Referências comuns aos formulários operacionais (unidades + variantes ativas).
 * Carregamento em lote; reutilizável por Entradas/Entregas/Ajuste/etc.
 */
export function useInventoryRefs() {
  const [unidades, setUnidades] = useState<UnidadeRow[]>([]);
  const [variantes, setVariantes] = useState<VarianteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const mounted = useRef(true);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const [uni, varr] = await Promise.all([getUnidades(), getVariantes()]);
      if (!mounted.current) return;
      setUnidades(uni);
      setVariantes(varr);
    } catch (e) {
      console.error('Erro ao carregar referências do estoque:', e);
      if (mounted.current) setError(true);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    fetchAll();
    return () => { mounted.current = false; };
  }, [fetchAll]);

  return { unidades, variantes, loading, error, refetch: fetchAll };
}
