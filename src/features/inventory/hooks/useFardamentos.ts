import { useCallback, useEffect, useRef, useState } from 'react';
import { getUnidades, getVariantes, getSaldos } from '../services/inventoryApi';
import { construirFardamentos } from '../domain/fardamentos';
import type { FardamentoRow, UnidadeRow } from '../types/db.types';

interface UseFardamentos {
  fardamentos: FardamentoRow[];
  unidades: UnidadeRow[];
  loading: boolean;
  error: boolean;
  refetch: () => void;
}

/**
 * Carrega variantes + saldos + unidades em lote (3 consultas, sem N+1) e compõe
 * as linhas de Fardamentos via domínio puro. Mesmo padrão manual dos hooks do
 * projeto (useState/useEffect + supabase). Leitura respeita a RLS.
 */
export function useFardamentos(): UseFardamentos {
  const [fardamentos, setFardamentos] = useState<FardamentoRow[]>([]);
  const [unidades, setUnidades] = useState<UnidadeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const mounted = useRef(true);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const [uni, variantes, saldos] = await Promise.all([getUnidades(), getVariantes(), getSaldos()]);
      if (!mounted.current) return;
      setUnidades(uni);
      setFardamentos(construirFardamentos(variantes, saldos, uni));
    } catch (e) {
      console.error('Erro ao carregar fardamentos:', e);
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

  return { fardamentos, unidades, loading, error, refetch: fetchAll };
}
