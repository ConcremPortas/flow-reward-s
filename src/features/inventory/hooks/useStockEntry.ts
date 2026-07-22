import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useFardamentos } from './useFardamentos';
import { useEstoqueOps } from './useEstoqueOps';
import { getMovimentacoesDetalhadas, uploadNotaFiscal, type DocumentoEntrada, type MovDetalhada } from '../services/inventoryApi';
import { statusEstoque } from '../domain/stockStatus';
import type { FardamentoRow, ItemInput } from '../types/db.types';
import type { StockStatus } from '../types/inventory.types';

const hojeSP = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Sao_Paulo' });
const MAX_QTD = 1_000_000;
const OBS_MAX = 500;

export interface EntradaItemRow {
  varianteId: string; f: FardamentoRow; quantidadeRaw: string; quantidade: number; valida: boolean;
  saldoAtual: number; saldoFinal: number; minimo: number; custo: number; impacto: number | null;
  statusAntes: StockStatus; statusDepois: StockStatus;
}
export interface EntradaSucesso { itens: number; pecas: number; comNf: boolean }

export function useStockEntry() {
  const { fardamentos, unidades, loading, error, refetch } = useFardamentos();
  const ops = useEstoqueOps();
  const { profile } = useAuth();
  const { toast } = useToast();

  const [unidadeId, setUnidadeId] = useState('');
  const [data, setData] = useState(hojeSP());
  const [observacao, setObservacao] = useState('');
  const [itens, setItens] = useState<{ varianteId: string; quantidadeRaw: string }[]>([]);
  const [nf, setNf] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<EntradaSucesso | null>(null);
  const [recentes, setRecentes] = useState<MovDetalhada[]>([]);
  const [loadingRecentes, setLoadingRecentes] = useState(true);
  const mounted = useRef(true);

  const unidadeUnica = unidades.length === 1;
  useEffect(() => { if (unidadeUnica && !unidadeId) setUnidadeId(unidades[0].id); }, [unidadeUnica, unidadeId, unidades]);

  const carregarRecentes = useCallback(async () => {
    try { setLoadingRecentes(true); const rows = await getMovimentacoesDetalhadas(200); if (mounted.current) setRecentes(rows.filter((m) => m.tipo === 'ENTRADA').slice(0, 8)); }
    catch { /* auxiliar */ } finally { if (mounted.current) setLoadingRecentes(false); }
  }, []);
  useEffect(() => { mounted.current = true; carregarRecentes(); return () => { mounted.current = false; }; }, [carregarRecentes]);

  const fardPorVar = useMemo(() => new Map(fardamentos.map((f) => [f.variante.id, f])), [fardamentos]);
  const jaAdicionados = useMemo(() => new Set(itens.map((i) => i.varianteId)), [itens]);

  const rows = useMemo<EntradaItemRow[]>(() => itens.map((it) => {
    const f = fardPorVar.get(it.varianteId)!;
    const saldoU = f?.saldos.find((s) => s.unidadeId === unidadeId);
    const saldoAtual = saldoU?.quantidade ?? 0;
    const minimo = saldoU ? saldoU.minimoEfetivo : (f?.variante.estoque_minimo_padrao ?? 0);
    const n = Number(it.quantidadeRaw);
    const valida = Number.isInteger(n) && n > 0 && n <= MAX_QTD;
    const q = valida ? n : 0;
    const custo = f?.variante.custo_unitario ?? 0;
    return {
      varianteId: it.varianteId, f, quantidadeRaw: it.quantidadeRaw, quantidade: q, valida,
      saldoAtual, saldoFinal: saldoAtual + q, minimo, custo, impacto: custo > 0 ? q * custo : null,
      statusAntes: statusEstoque(saldoAtual, minimo), statusDepois: statusEstoque(saldoAtual + q, minimo),
    };
  }).filter((r) => r.f), [itens, fardPorVar, unidadeId]);

  const totais = useMemo(() => {
    let pecas = 0, valor = 0, semCusto = 0, abaixoAntes = 0, normalizados = 0;
    for (const r of rows) {
      pecas += r.quantidade; if (r.custo > 0) valor += r.quantidade * r.custo; else semCusto++;
      if (r.statusAntes !== 'NORMAL') abaixoAntes++;
      if (r.statusAntes !== 'NORMAL' && r.statusDepois === 'NORMAL') normalizados++;
    }
    return { distintos: rows.length, pecas, valor, semCusto, abaixoAntes, normalizados };
  }, [rows]);

  const dataFutura = data > hojeSP();
  const itensValidos = rows.length > 0 && rows.every((r) => r.valida);
  const podeRevisar = !!unidadeId && !!data && !dataFutura && itensValidos && !uploading;

  const addItem = (varianteId: string) => {
    if (jaAdicionados.has(varianteId)) { toast({ title: 'Item já adicionado', description: 'Ajuste a quantidade na lista.' }); return; }
    setItens((p) => [...p, { varianteId, quantidadeRaw: '1' }]); setErro(null);
  };
  const setQtd = (varianteId: string, v: string) => setItens((p) => p.map((i) => (i.varianteId === varianteId ? { ...i, quantidadeRaw: v } : i)));
  const removeItem = (varianteId: string) => setItens((p) => p.filter((i) => i.varianteId !== varianteId));

  const selecionarNf = async (file: File | null) => {
    setErro(null);
    if (!file) { setNf(null); return true; }
    const { validarPdf } = await import('../services/pdf');
    const v = await validarPdf(file);
    if (!v.ok) { toast({ title: 'PDF inválido', description: v.erro, variant: 'destructive' }); return false; }
    setNf(file); return true;
  };

  const unidadeNome = unidades.find((u) => u.id === unidadeId)?.nome ?? null;

  const confirmar = async (): Promise<boolean> => {
    setErro(null);
    if (!podeRevisar) { setErro('Revise os dados da entrada.'); return false; }
    const payload: ItemInput[] = rows.map((r) => ({ variante_id: r.varianteId, quantidade: r.quantidade }));

    let documento: DocumentoEntrada | null = null;
    if (nf) {
      setUploading(true);
      try { documento = await uploadNotaFiscal(nf, unidadeId, data.slice(0, 4)); }
      catch (e) { setUploading(false); setErro(`Falha ao enviar o PDF da nota fiscal: ${(e as Error).message}`); return false; }
      setUploading(false);
    }

    const res = await ops.registrarEntrada({ unidadeId, dataEntrada: data, itens: payload, observacao: observacao.trim() || null, documento });
    if (!res) return false;
    setSucesso({ itens: totais.distintos, pecas: totais.pecas, comNf: !!documento });
    setItens([]); setObservacao(''); setNf(null);
    refetch(); carregarRecentes();
    return true;
  };

  const reset = () => { setItens([]); setObservacao(''); setNf(null); setErro(null); setSucesso(null); };

  return {
    loading, error, refetch, saving: ops.saving, uploading,
    fardamentos, unidades, unidadeUnica,
    unidadeId, data, observacao, itens, nf, erro, sucesso, recentes, loadingRecentes,
    setUnidadeId, setData, setObservacao, setNf, selecionarNf, addItem, setQtd, removeItem, reset, confirmar,
    rows, totais, jaAdicionados, unidadeNome, dataFutura, itensValidos, podeRevisar,
    usuario: profile?.nome ?? '—', hoje: hojeSP(), OBS_MAX, MAX_QTD,
  };
}
