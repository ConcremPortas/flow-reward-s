import { useEffect, useRef, useState } from 'react';
import {
  getMovimentacoesPorVariante, getEntregasPorVariante, getDevolucoesPorVariante,
  type MovVariante, type EntregaVariante, type DevolucaoVariante,
} from '../services/inventoryApi';

export interface FardamentoDetalhe {
  movs: MovVariante[];
  entregas: EntregaVariante[];
  devolucoes: DevolucaoVariante[];
  loading: boolean;
  error: boolean;
}

/** Carrega o detalhamento de UMA variante (drawer). Recarrega ao trocar de variante. */
export function useFardamentoDetalhe(varianteId: string | null): FardamentoDetalhe {
  const [movs, setMovs] = useState<MovVariante[]>([]);
  const [entregas, setEntregas] = useState<EntregaVariante[]>([]);
  const [devolucoes, setDevolucoes] = useState<DevolucaoVariante[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    if (!varianteId) { setMovs([]); setEntregas([]); setDevolucoes([]); setError(false); return () => { mounted.current = false; }; }
    (async () => {
      try {
        setLoading(true); setError(false);
        const [m, e, d] = await Promise.all([
          getMovimentacoesPorVariante(varianteId), getEntregasPorVariante(varianteId), getDevolucoesPorVariante(varianteId),
        ]);
        if (!mounted.current) return;
        setMovs(m); setEntregas(e); setDevolucoes(d);
      } catch (err) {
        console.error('Erro ao carregar detalhe do fardamento:', err);
        if (mounted.current) setError(true);
      } finally {
        if (mounted.current) setLoading(false);
      }
    })();
    return () => { mounted.current = false; };
  }, [varianteId]);

  return { movs, entregas, devolucoes, loading, error };
}
