import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useFuncionarios, type Funcionario } from '@/hooks/useFuncionarios';
import { useFardamentos } from './useFardamentos';
import { useEstoqueOps } from './useEstoqueOps';
import {
  getEntregas, getEntregaRecibo, getMedidasFuncionario, getEntregasPorFuncionario,
  type ReciboEntrega, type MedidasFuncionario, type EntregaFuncionario,
} from '../services/inventoryApi';
import { STATUS_BLOQUEIA_ENTREGA } from '../domain/domainConstants';
import { statusEstoque } from '../domain/stockStatus';
import type { FardamentoRow, ItemInput, EntregaRow } from '../types/db.types';
import type { StockStatus } from '../types/inventory.types';

const OBS_MAX = 500;
const MAX_QTD = 1_000_000;

export interface DeliveryItemRow {
  varianteId: string; f: FardamentoRow; quantidadeRaw: string; quantidade: number;
  saldo: number; saldoFinal: number; minimo: number; custo: number; impacto: number | null;
  valida: boolean; excede: boolean; statusDepois: StockStatus;
  tamanhoSugerido: string | null; compat: boolean;
}
export interface DeliveryAviso { tipo: 'info' | 'warn' | 'danger'; texto: string }

export function useStockDelivery() {
  const { fardamentos, unidades, loading, error, refetch } = useFardamentos();
  const { funcionarios, loading: loadingFunc } = useFuncionarios();
  const ops = useEstoqueOps();
  const { profile } = useAuth();
  const { toast } = useToast();

  const [unidadeId, setUnidadeId] = useState('');
  const [tipo, setTipo] = useState('ADMISSAO');
  const [valorCompra, setValorCompra] = useState('');
  const [funcionarioId, setFuncionarioId] = useState('');
  const [itens, setItens] = useState<{ varianteId: string; quantidadeRaw: string }[]>([]);
  const [observacao, setObservacao] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<ReciboEntrega | null>(null);

  const [medidas, setMedidas] = useState<MedidasFuncionario | null>(null);
  const [loadingMedidas, setLoadingMedidas] = useState(false);
  const [historico, setHistorico] = useState<EntregaFuncionario[]>([]);
  const [loadingHist, setLoadingHist] = useState(false);
  const [recentes, setRecentes] = useState<EntregaRow[]>([]);
  const [loadingRecentes, setLoadingRecentes] = useState(true);
  const mounted = useRef(true);

  const unidadeUnica = unidades.length === 1;
  useEffect(() => { if (unidadeUnica && !unidadeId) setUnidadeId(unidades[0].id); }, [unidadeUnica, unidadeId, unidades]);

  const carregarRecentes = useCallback(async () => {
    try { setLoadingRecentes(true); const r = await getEntregas(15); if (mounted.current) setRecentes(r); }
    catch { /* auxiliar */ } finally { if (mounted.current) setLoadingRecentes(false); }
  }, []);
  useEffect(() => { mounted.current = true; carregarRecentes(); return () => { mounted.current = false; }; }, [carregarRecentes]);

  // Perfil/medidas/histórico do colaborador selecionado.
  useEffect(() => {
    if (!funcionarioId) { setMedidas(null); setHistorico([]); return; }
    let vivo = true;
    (async () => {
      try {
        setLoadingMedidas(true); setLoadingHist(true);
        const [m, h] = await Promise.all([getMedidasFuncionario(funcionarioId).catch(() => null), getEntregasPorFuncionario(funcionarioId).catch(() => [])]);
        if (!vivo) return; setMedidas(m); setHistorico(h);
      } finally { if (vivo) { setLoadingMedidas(false); setLoadingHist(false); } }
    })();
    return () => { vivo = false; };
  }, [funcionarioId]);

  const funcionario = useMemo<Funcionario | null>(() => funcionarios.find((f) => f.id === funcionarioId) ?? null, [funcionarios, funcionarioId]);
  const unidade = useMemo(() => unidades.find((u) => u.id === unidadeId) ?? null, [unidades, unidadeId]);
  const empresaDivergente = !!(funcionario?.empresa_id && unidade?.empresa_id && funcionario.empresa_id !== unidade.empresa_id);

  // Colaboradores elegíveis (ativos e não desligados) — o servidor revalida.
  const elegiveis = useMemo(() => funcionarios.filter((f) => f.ativo !== false && !STATUS_BLOQUEIA_ENTREGA.has((f.status ?? '').trim().toUpperCase())), [funcionarios]);

  const fardPorVar = useMemo(() => new Map(fardamentos.map((f) => [f.variante.id, f])), [fardamentos]);
  const jaAdicionados = useMemo(() => new Set(itens.map((i) => i.varianteId)), [itens]);

  const tamanhoSugerido = useCallback((f: FardamentoRow): string | null => {
    if (!medidas) return null;
    const tipoT = f.variante.tamanho?.tipo;
    if (tipoT === 'CALCADO') return medidas.calcado;
    return medidas.camisa ?? medidas.calca;
  }, [medidas]);

  const rows = useMemo<DeliveryItemRow[]>(() => itens.map((it) => {
    const f = fardPorVar.get(it.varianteId)!;
    const saldoU = f?.saldos.find((s) => s.unidadeId === unidadeId);
    const saldo = saldoU?.quantidade ?? 0;
    const minimo = saldoU ? saldoU.minimoEfetivo : (f?.variante.estoque_minimo_padrao ?? 0);
    const n = Number(it.quantidadeRaw);
    const int = Number.isInteger(n) && n > 0 && n <= MAX_QTD;
    const excede = int && n > saldo;
    const q = int ? n : 0;
    const custo = f?.variante.custo_unitario ?? 0;
    const sug = tamanhoSugerido(f);
    return {
      varianteId: it.varianteId, f, quantidadeRaw: it.quantidadeRaw, quantidade: q, saldo, saldoFinal: saldo - q, minimo,
      custo, impacto: custo > 0 ? q * custo : null, valida: int && !excede, excede,
      statusDepois: statusEstoque(saldo - q, minimo), tamanhoSugerido: sug, compat: !!sug && sug === f.tamanhoRotulo,
    };
  }).filter((r) => r.f), [itens, fardPorVar, unidadeId, tamanhoSugerido]);

  const totais = useMemo(() => {
    let pecas = 0, valor = 0, semCusto = 0;
    for (const r of rows) { pecas += r.quantidade; if (r.custo > 0) valor += r.quantidade * r.custo; else semCusto++; }
    return { distintos: rows.length, pecas, valor, semCusto };
  }, [rows]);

  const avisos = useMemo<DeliveryAviso[]>(() => {
    const out: DeliveryAviso[] = [];
    if (empresaDivergente) out.push({ tipo: 'danger', texto: 'Colaborador pertence a empresa diferente da unidade — a entrega será bloqueada.' });
    for (const r of rows) {
      if (r.excede) out.push({ tipo: 'danger', texto: `Saldo insuficiente de ${r.f.variante.nome}: disponível ${r.saldo}.` });
      else if (r.valida && r.statusDepois === 'SEM_ESTOQUE') out.push({ tipo: 'warn', texto: `${r.f.variante.nome} ficará SEM estoque nesta unidade após a entrega.` });
      else if (r.valida && r.statusDepois === 'ALERTA') out.push({ tipo: 'warn', texto: `${r.f.variante.nome} ficará abaixo do mínimo após a entrega.` });
      if (r.valida && r.tamanhoSugerido && !r.compat) out.push({ tipo: 'info', texto: `${r.f.variante.nome}: tamanho ${r.f.tamanhoRotulo} difere do cadastrado do colaborador (${r.tamanhoSugerido}).` });
    }
    if (funcionario && !medidas && !loadingMedidas) out.push({ tipo: 'info', texto: 'Colaborador sem medidas cadastradas — sem sugestão de tamanho.' });
    return out;
  }, [rows, empresaDivergente, funcionario, medidas, loadingMedidas]);

  const compraOk = tipo !== 'COMPRA' || (valorCompra.trim() !== '' && Number(valorCompra) > 0);
  const itensValidos = rows.length > 0 && rows.every((r) => r.valida);
  const funcElegivel = !!funcionario && funcionario.ativo !== false && !STATUS_BLOQUEIA_ENTREGA.has((funcionario.status ?? '').trim().toUpperCase());
  const podeRevisar = !!unidadeId && funcElegivel && !empresaDivergente && itensValidos && compraOk && !ops.saving;

  const addItem = (varianteId: string) => {
    if (jaAdicionados.has(varianteId)) { toast({ title: 'Item já adicionado', description: 'Ajuste a quantidade na lista.' }); return; }
    setItens((p) => [...p, { varianteId, quantidadeRaw: '1' }]); setErro(null);
  };
  const setQtd = (varianteId: string, v: string) => setItens((p) => p.map((i) => (i.varianteId === varianteId ? { ...i, quantidadeRaw: v } : i)));
  const removeItem = (varianteId: string) => setItens((p) => p.filter((i) => i.varianteId !== varianteId));

  const confirmar = async (): Promise<boolean> => {
    setErro(null);
    if (!podeRevisar) { setErro('Revise os dados da entrega.'); return false; }
    const payload: ItemInput[] = rows.map((r) => ({ variante_id: r.varianteId, quantidade: r.quantidade }));
    const res = await ops.registrarEntrega({ funcionarioId, unidadeId, tipo, itens: payload, motivo: observacao.trim(), valorCompra: tipo === 'COMPRA' ? Number(valorCompra) : null });
    if (!res) return false;
    const entregaId = (res as { entrega_id?: string }).entrega_id;
    if (entregaId) { try { const recibo = await getEntregaRecibo(entregaId); setSucesso(recibo); } catch { /* recibo indisponível */ } }
    setItens([]); setObservacao(''); setValorCompra(''); setFuncionarioId('');
    refetch(); carregarRecentes();
    return true;
  };

  const reset = () => { setItens([]); setObservacao(''); setValorCompra(''); setFuncionarioId(''); setErro(null); setSucesso(null); };

  return {
    loading, loadingFunc, error, refetch, saving: ops.saving,
    fardamentos, unidades, unidadeUnica, funcionarios: elegiveis,
    unidadeId, tipo, valorCompra, funcionarioId, itens, observacao, erro, sucesso,
    setUnidadeId, setTipo, setValorCompra, setFuncionarioId, setObservacao, addItem, setQtd, removeItem, reset, confirmar, setSucesso,
    funcionario, unidade, empresaDivergente, funcElegivel,
    medidas, loadingMedidas, historico, loadingHist,
    rows, totais, avisos, jaAdicionados, tamanhoSugerido,
    recentes, loadingRecentes,
    compraOk, itensValidos, podeRevisar,
    usuario: profile?.nome ?? '—', OBS_MAX,
  };
}
