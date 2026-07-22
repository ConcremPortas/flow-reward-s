import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFuncionarios, type Funcionario } from '@/hooks/useFuncionarios';
import { useFardamentos } from './useFardamentos';
import { useEstoqueOps } from './useEstoqueOps';
import {
  getEntregas, getDevolucoesRecentes, getMovimentacoesDetalhadas,
  type DevolucaoDetalhe, type MovDetalhada,
} from '../services/inventoryApi';
import type { FardamentoRow, EntregaRow } from '../types/db.types';

const norm = (s: string) => (s ?? '').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/\p{Diacritic}/gu, '');
export const MOTIVO_MIN = 5;
export const MOTIVO_MAX = 500;

export type ElegCancel = 'ELEGIVEL' | 'BLOQUEADA_DEVOLUCAO';
export interface EntregaCancel { e: EntregaRow; funcionario: Funcionario | null; entregue: number; pecas: number; devolvidoAtivo: number; eleg: ElegCancel; motivoBloqueio?: string }
export type ElegEstorno = 'ELEGIVEL' | 'JA_ESTORNADA' | 'BLOQUEADA_SALDO';
export interface DevEstorno { d: DevolucaoDetalhe; saldoAtual: number; eleg: ElegEstorno; motivoBloqueio?: string }

export function useInventoryReversals() {
  const { fardamentos, unidades, refetch } = useFardamentos();
  const { funcionarios } = useFuncionarios();
  const ops = useEstoqueOps();
  const { profile } = useAuth();

  const [entregas, setEntregas] = useState<EntregaRow[]>([]);
  const [devolucoes, setDevolucoes] = useState<DevolucaoDetalhe[]>([]);
  const [estornos, setEstornos] = useState<MovDetalhada[]>([]);
  const [devPorRecibo, setDevPorRecibo] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [loadingHist, setLoadingHist] = useState(true);
  const [error, setError] = useState(false);
  const [atualizadoEm, setAtualizadoEm] = useState(() => new Date());
  const mounted = useRef(true);

  const [buscaEntregaRaw, setBuscaEntregaRaw] = useState(''); const [buscaEntrega, setBuscaEntrega] = useState('');
  const [buscaDevRaw, setBuscaDevRaw] = useState(''); const [buscaDev, setBuscaDev] = useState('');
  const [fUnidade, setFUnidade] = useState('');
  const [soElegiveis, setSoElegiveis] = useState(false);

  useEffect(() => { const t = setTimeout(() => setBuscaEntrega(buscaEntregaRaw), 300); return () => clearTimeout(t); }, [buscaEntregaRaw]);
  useEffect(() => { const t = setTimeout(() => setBuscaDev(buscaDevRaw), 300); return () => clearTimeout(t); }, [buscaDevRaw]);

  const carregar = useCallback(async () => {
    try {
      setLoading(true); setLoadingHist(true); setError(false);
      const [es, devs, movs] = await Promise.all([getEntregas(60), getDevolucoesRecentes(300), getMovimentacoesDetalhadas(300)]);
      if (!mounted.current) return;
      setEntregas(es); setDevolucoes(devs);
      const map = new Map<string, number>();
      for (const d of devs) if (d.status === 'ATIVA') map.set(d.recibo, (map.get(d.recibo) ?? 0) + d.quantidade);
      setDevPorRecibo(map);
      setEstornos(movs.filter((m) => m.tipo === 'ESTORNO_ENTREGA' || m.tipo === 'ESTORNO_DEVOLUCAO'));
      setAtualizadoEm(new Date());
    } catch (e) { console.error('Erro ao carregar estornos:', e); if (mounted.current) setError(true); }
    finally { if (mounted.current) { setLoading(false); setLoadingHist(false); } }
  }, []);
  useEffect(() => { mounted.current = true; carregar(); return () => { mounted.current = false; }; }, [carregar]);

  const funcPorId = useMemo(() => new Map(funcionarios.map((f) => [f.id, f])), [funcionarios]);
  const fardPorVar = useMemo(() => new Map(fardamentos.map((f) => [f.variante.id, f])), [fardamentos]);
  const unidadeNome = useMemo(() => new Map(unidades.map((u) => [u.id, u.nome])), [unidades]);
  const custoDe = useCallback((v: string) => fardPorVar.get(v)?.variante.custo_unitario ?? 0, [fardPorVar]);
  const saldoDe = useCallback((v: string, u: string) => fardPorVar.get(v)?.saldos.find((s) => s.unidadeId === u)?.quantidade ?? 0, [fardPorVar]);

  // Entregas para cancelamento (getEntregas já traz só CONFIRMADA).
  const entregasCancel = useMemo<EntregaCancel[]>(() => {
    const q = norm(buscaEntrega.trim());
    return entregas.map((e) => {
      const funcionario = funcPorId.get(e.funcionario_id) ?? null;
      const entregue = (e.itens ?? []).reduce((a, i) => a + i.quantidade, 0);
      const devolvidoAtivo = devPorRecibo.get(e.recibo) ?? 0;
      const bloqueada = devolvidoAtivo > 0;
      const eleg: ElegCancel = bloqueada ? 'BLOQUEADA_DEVOLUCAO' : 'ELEGIVEL';
      return { e, funcionario, entregue, pecas: entregue, devolvidoAtivo, eleg, motivoBloqueio: bloqueada ? 'Existe devolução ativa vinculada a esta entrega.' : undefined };
    }).filter((x) => {
      if (fUnidade && x.e.unidade_id !== fUnidade) return false;
      if (soElegiveis && x.eleg !== 'ELEGIVEL') return false;
      if (q) { const alvo = norm([x.e.recibo, x.funcionario?.nome ?? x.e.funcionario?.nome ?? '', x.funcionario?.setor?.nome ?? '', x.funcionario?.funcao?.nome ?? ''].join(' ')); if (!alvo.includes(q)) return false; }
      return true;
    }).slice(0, 40);
  }, [entregas, funcPorId, devPorRecibo, buscaEntrega, fUnidade, soElegiveis]);

  // Devoluções para estorno.
  const devsEstorno = useMemo<DevEstorno[]>(() => {
    const q = norm(buscaDev.trim());
    return devolucoes.map((d) => {
      const saldoAtual = saldoDe(d.varianteId, d.unidadeId);
      let eleg: ElegEstorno = 'ELEGIVEL'; let motivoBloqueio: string | undefined;
      if (d.status !== 'ATIVA') { eleg = 'JA_ESTORNADA'; motivoBloqueio = 'Esta devolução já foi estornada.'; }
      else if (d.reestocado && saldoAtual < d.quantidade) { eleg = 'BLOQUEADA_SALDO'; motivoBloqueio = `Reestocou ${d.quantidade}, mas o saldo atual (${saldoAtual}) não permite retirar novamente.`; }
      return { d, saldoAtual, eleg, motivoBloqueio };
    }).filter((x) => {
      if (fUnidade && x.d.unidadeId !== fUnidade) return false;
      if (soElegiveis && x.eleg !== 'ELEGIVEL') return false;
      if (q) { const alvo = norm([x.d.recibo, x.d.funcionarioNome, x.d.varianteNome, x.d.varianteCodigo].join(' ')); if (!alvo.includes(q)) return false; }
      return true;
    }).slice(0, 40);
  }, [devolucoes, saldoDe, buscaDev, fUnidade, soElegiveis]);

  const stats = useMemo(() => {
    const entElegiveis = entregasCancel.filter((x) => x.eleg === 'ELEGIVEL').length;
    const devElegiveis = devsEstorno.filter((x) => x.eleg === 'ELEGIVEL').length;
    const bloqueadas = entregasCancel.filter((x) => x.eleg !== 'ELEGIVEL').length + devsEstorno.filter((x) => x.eleg !== 'ELEGIVEL').length;
    let saldoRevertido = 0;
    for (const m of estornos) for (const it of m.itens) if (it.direcao === 'IN') saldoRevertido += it.quantidade;
    const ultima = estornos[0];
    return { entElegiveis, devElegiveis, bloqueadas, estornosPeriodo: estornos.length, saldoRevertido, ultima: ultima ? ultima.createdAt : null };
  }, [entregasCancel, devsEstorno, estornos]);

  const confirmarCancelamento = async (e: EntregaRow, motivo: string): Promise<boolean> => {
    const res = await ops.cancelarEntrega({ entregaId: e.id, motivo: motivo.trim() });
    if (!res) return false; refetch(); carregar(); return true;
  };
  const confirmarEstorno = async (d: DevolucaoDetalhe, motivo: string): Promise<boolean> => {
    const res = await ops.estornarDevolucao({ devolucaoId: d.id, unidadeId: d.unidadeId, motivo: motivo.trim() });
    if (!res) return false; refetch(); carregar(); return true;
  };

  return {
    loading, loadingHist, error, refetch: carregar, atualizadoEm, saving: ops.saving,
    unidades, unidadeNome, fardPorVar, custoDe, saldoDe,
    buscaEntregaRaw, setBuscaEntrega: setBuscaEntregaRaw, buscaDevRaw, setBuscaDev: setBuscaDevRaw, fUnidade, setFUnidade, soElegiveis, setSoElegiveis,
    entregasCancel, devsEstorno, estornos, stats,
    confirmarCancelamento, confirmarEstorno, usuario: profile?.nome ?? '—',
  };
}
