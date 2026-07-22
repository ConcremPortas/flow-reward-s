import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  getVariantesTodas, getSaldos, getUnidades, getMovimentacoesDetalhadas, contarMovimentacoesMes,
  type MovDetalhada,
} from '../services/inventoryApi';
import { construirFardamentos } from '../domain/fardamentos';
import { situacaoDaLinha } from '../components/fardamentos/situacao';
import type { FardamentoRow, UnidadeRow } from '../types/db.types';

export interface UltimaMov { numero: string; tipo: string; createdAt: string; quantidade: number; direcao: 'IN' | 'OUT'; operadorNome: string }
export interface OpcaoFiltro { id: string; nome: string }
export interface UnidadeResumo { unidadeId: string; nome: string; itens: number; saldo: number; emAlerta: number }

export interface InventoryScreen {
  fardamentos: FardamentoRow[];
  unidades: UnidadeRow[];
  movimentacoes: MovDetalhada[];
  ultimaMovPorVariante: Map<string, UltimaMov>;
  stats: { itens: number; saldoTotal: number; emAlerta: number; semEstoque: number; unidadesComSaldo: number; movMes: number };
  opcoes: { categorias: OpcaoFiltro[]; modelos: OpcaoFiltro[]; tamanhos: OpcaoFiltro[]; unidades: OpcaoFiltro[] };
  porUnidade: UnidadeResumo[];
  loading: boolean;
  loadingMov: boolean;
  error: boolean;
  refetch: () => void;
}

/** Carrega e deriva tudo que a tela de Fardamentos precisa (dados reais; sem N+1). */
export function useInventoryScreen(): InventoryScreen {
  const [fardamentos, setFardamentos] = useState<FardamentoRow[]>([]);
  const [unidades, setUnidades] = useState<UnidadeRow[]>([]);
  const [movimentacoes, setMovimentacoes] = useState<MovDetalhada[]>([]);
  const [movMes, setMovMes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMov, setLoadingMov] = useState(true);
  const [error, setError] = useState(false);
  const mounted = useRef(true);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true); setLoadingMov(true); setError(false);
      const [variantes, saldos, uni] = await Promise.all([getVariantesTodas(), getSaldos(), getUnidades()]);
      if (!mounted.current) return;
      setUnidades(uni);
      setFardamentos(construirFardamentos(variantes, saldos, uni));
      setLoading(false);
      // Movimentações carregam em paralelo, sem bloquear a grade.
      try {
        const [movs, mes] = await Promise.all([getMovimentacoesDetalhadas(300), contarMovimentacoesMes()]);
        if (!mounted.current) return;
        setMovimentacoes(movs); setMovMes(mes);
      } catch { /* seção auxiliar */ }
      finally { if (mounted.current) setLoadingMov(false); }
    } catch (e) {
      console.error('Erro ao carregar tela de fardamentos:', e);
      if (mounted.current) { setError(true); setLoading(false); setLoadingMov(false); }
    }
  }, []);

  useEffect(() => { mounted.current = true; fetchAll(); return () => { mounted.current = false; }; }, [fetchAll]);

  const ultimaMovPorVariante = useMemo(() => {
    const map = new Map<string, UltimaMov>();
    // movimentacoes já vêm ordenadas por created_at desc → o primeiro visto por variante é o mais recente.
    for (const m of movimentacoes) {
      for (const it of m.itens) {
        if (map.has(it.varianteId)) continue;
        map.set(it.varianteId, { numero: m.numero, tipo: m.tipo, createdAt: m.createdAt, quantidade: it.quantidade, direcao: it.direcao, operadorNome: m.operadorNome });
      }
    }
    return map;
  }, [movimentacoes]);

  const stats = useMemo(() => {
    let saldoTotal = 0, emAlerta = 0, semEstoque = 0;
    const comSaldo = new Set<string>();
    for (const f of fardamentos) {
      saldoTotal += f.saldoTotal;
      const s = situacaoDaLinha(f);
      if (s === 'SEM_ESTOQUE') semEstoque += 1;
      else if (s === 'ATENCAO' || s === 'CRITICO') emAlerta += 1;
      f.saldos.forEach((x) => { if (x.quantidade > 0) comSaldo.add(x.unidadeId); });
    }
    return { itens: fardamentos.length, saldoTotal, emAlerta, semEstoque, unidadesComSaldo: comSaldo.size, movMes };
  }, [fardamentos, movMes]);

  const opcoes = useMemo(() => {
    const cat = new Map<string, string>(), mod = new Map<string, string>(), tam = new Map<string, string>();
    for (const f of fardamentos) {
      if (f.categoriaNome) cat.set(f.categoriaNome, f.categoriaNome);
      if (f.modeloNome) mod.set(f.modeloNome, f.modeloNome);
      if (f.tamanhoRotulo) tam.set(f.tamanhoRotulo, f.tamanhoRotulo);
    }
    const ord = (m: Map<string, string>) => [...m.values()].sort((a, b) => a.localeCompare(b, 'pt-BR')).map((v) => ({ id: v, nome: v }));
    return { categorias: ord(cat), modelos: ord(mod), tamanhos: ord(tam), unidades: unidades.map((u) => ({ id: u.id, nome: u.nome })) };
  }, [fardamentos, unidades]);

  const porUnidade = useMemo<UnidadeResumo[]>(() => {
    const acc = new Map<string, UnidadeResumo>();
    for (const u of unidades) acc.set(u.id, { unidadeId: u.id, nome: u.nome, itens: 0, saldo: 0, emAlerta: 0 });
    for (const f of fardamentos) for (const s of f.saldos) {
      const r = acc.get(s.unidadeId); if (!r) continue;
      if (s.quantidade > 0) r.itens += 1;
      r.saldo += s.quantidade;
      if (s.status !== 'NORMAL') r.emAlerta += 1;
    }
    return [...acc.values()].filter((r) => r.saldo > 0 || r.emAlerta > 0).sort((a, b) => b.saldo - a.saldo);
  }, [fardamentos, unidades]);

  return { fardamentos, unidades, movimentacoes, ultimaMovPorVariante, stats, opcoes, porUnidade, loading, loadingMov, error, refetch: fetchAll };
}
