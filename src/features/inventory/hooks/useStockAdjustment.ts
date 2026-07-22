import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFardamentos } from './useFardamentos';
import { useEstoqueOps } from './useEstoqueOps';
import { getMovimentacoesPorVariante, type MovVariante } from '../services/inventoryApi';
import { calcularAjuste } from '../domain/adjustment';
import { StockDomainError } from '../domain/domainConstants';
import type { AdjustmentResult } from '../types/inventory.types';
import type { FardamentoRow, SaldoUnidade } from '../types/db.types';

export const MOTIVOS_AJUSTE = ['Contagem física', 'Perda identificada', 'Erro de lançamento', 'Avaria', 'Correção de entrada', 'Correção de entrega', 'Outro'];
const MOTIVO_MIN = 5;
const MOTIVO_MAX = 500;
const VARIACAO_RELEVANTE = 0.4; // 40% — apenas SINALIZAÇÃO visual (não bloqueia). Documentado.
const MS_DIA = 864e5;
const SEM_MOV_DIAS = 30;

export interface AjusteAviso { tipo: 'info' | 'warn' | 'danger'; texto: string }
export interface AjusteSucesso { saldoAnterior: number; saldoNovo: number; diferenca: number; item: string; codigo: string; unidade: string }

export function useStockAdjustment() {
  const { fardamentos, unidades, loading, error, refetch } = useFardamentos();
  const ops = useEstoqueOps();
  const { profile } = useAuth();

  const [varianteId, setVarianteId] = useState('');
  const [unidadeId, setUnidadeId] = useState('');
  const [contadoRaw, setContadoRaw] = useState('');
  const [motivoTipo, setMotivoTipo] = useState('');
  const [motivoDesc, setMotivoDesc] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<AjusteSucesso | null>(null);
  const [movs, setMovs] = useState<MovVariante[]>([]);
  const [loadingMovs, setLoadingMovs] = useState(false);
  const mounted = useRef(true);

  const fardamento = useMemo<FardamentoRow | null>(() => fardamentos.find((f) => f.variante.id === varianteId) ?? null, [fardamentos, varianteId]);
  const saldoUnidade = useMemo<SaldoUnidade | null>(() => fardamento?.saldos.find((s) => s.unidadeId === unidadeId) ?? null, [fardamento, unidadeId]);
  const saldoAtual = saldoUnidade?.quantidade ?? 0;
  const minimo = saldoUnidade ? saldoUnidade.minimoEfetivo : (fardamento?.variante.estoque_minimo_padrao ?? 0);
  const custo = fardamento?.variante.custo_unitario ?? 0;
  const temCusto = custo > 0;

  // Seleção automática quando existe apenas uma unidade (sinalizada na UI).
  const unidadeUnica = unidades.length === 1;
  useEffect(() => { if (unidadeUnica && !unidadeId) setUnidadeId(unidades[0].id); }, [unidadeUnica, unidadeId, unidades]);

  // Prévia (domínio puro). Erros de regra viram aviso, não travam a tela.
  const previa = useMemo((): { result?: AdjustmentResult; aviso?: string } => {
    const s = contadoRaw.trim();
    if (!varianteId || !unidadeId || s === '') return {};
    const n = Number(s);
    if (!Number.isFinite(n)) return { aviso: 'Informe um número válido.' };
    try { return { result: calcularAjuste(saldoAtual, n) }; }
    catch (e) { return { aviso: e instanceof StockDomainError ? e.message : 'Valor inválido.' }; }
  }, [contadoRaw, varianteId, unidadeId, saldoAtual]);

  const impactoFinanceiro = previa.result && temCusto ? previa.result.diferenca * custo : null;

  const outrasUnidades = useMemo(() => (fardamento?.saldos ?? []).filter((s) => s.unidadeId !== unidadeId), [fardamento, unidadeId]);

  // Movimentações da combinação item + unidade.
  useEffect(() => {
    mounted.current = true;
    if (!varianteId || !unidadeId) { setMovs([]); return () => { mounted.current = false; }; }
    (async () => {
      try { setLoadingMovs(true); const rows = await getMovimentacoesPorVariante(varianteId, 100); if (mounted.current) setMovs(rows.filter((m) => m.unidadeId === unidadeId).slice(0, 5)); }
      catch { if (mounted.current) setMovs([]); }
      finally { if (mounted.current) setLoadingMovs(false); }
    })();
    return () => { mounted.current = false; };
  }, [varianteId, unidadeId]);

  const avisos = useMemo<AjusteAviso[]>(() => {
    const out: AjusteAviso[] = [];
    if (!fardamento || !saldoUnidade) return out;
    const novo = previa.result?.saldoNovo;
    if (minimo <= 0) out.push({ tipo: 'info', texto: 'Este item não possui estoque mínimo configurado nesta unidade.' });
    if (novo != null) {
      if (novo === 0) out.push({ tipo: 'danger', texto: 'A contagem informada deixará o item SEM estoque nesta unidade.' });
      else if (minimo > 0 && novo <= minimo) out.push({ tipo: 'warn', texto: 'A contagem informada deixará o item abaixo do estoque mínimo da unidade.' });
    }
    if (!temCusto) out.push({ tipo: 'info', texto: 'Custo unitário não cadastrado — o impacto financeiro não pode ser estimado.' });
    if (previa.result && saldoAtual > 0) {
      const variacao = Math.abs(previa.result.diferenca) / saldoAtual;
      if (variacao >= VARIACAO_RELEVANTE) out.push({ tipo: 'warn', texto: `Ajuste relevante: variação de ${Math.round(variacao * 100)}% em relação ao saldo atual.` });
    }
    const ultima = movs[0];
    if (!ultima) out.push({ tipo: 'info', texto: 'Sem movimentação registrada para este item nesta unidade.' });
    else if (Date.now() - new Date(ultima.createdAt).getTime() > SEM_MOV_DIAS * MS_DIA) out.push({ tipo: 'info', texto: 'Este item não tem movimentação recente nesta unidade.' });
    return out;
  }, [fardamento, saldoUnidade, previa.result, minimo, temCusto, saldoAtual, movs]);

  const motivoFinal = useMemo(() => {
    const d = motivoDesc.trim();
    if (motivoTipo && motivoTipo !== 'Outro') return `${motivoTipo} — ${d}`;
    return d;
  }, [motivoTipo, motivoDesc]);

  const motivoValido = motivoDesc.trim().length >= MOTIVO_MIN && motivoDesc.trim().length <= MOTIVO_MAX;
  const podeRevisar = !!previa.result && motivoValido && !!varianteId && !!unidadeId;

  const selecionarItem = (id: string) => { setVarianteId(id); if (!unidadeUnica) setUnidadeId(''); setContadoRaw(''); setErro(null); };
  const reset = () => { setVarianteId(''); if (!unidadeUnica) setUnidadeId(''); setContadoRaw(''); setMotivoTipo(''); setMotivoDesc(''); setErro(null); setSucesso(null); setMovs([]); };

  const confirmar = async (): Promise<boolean> => {
    setErro(null);
    if (!podeRevisar || !previa.result || !fardamento) { setErro('Revise os dados do ajuste.'); return false; }
    const res = await ops.ajustarSaldo({ varianteId, unidadeId, saldoContado: previa.result.saldoNovo, motivo: motivoFinal });
    if (!res) return false; // erro já tratado por toast em useEstoqueOps (mensagem traduzida)
    const r = res as { saldo_anterior?: number; saldo_novo?: number; diferenca?: number };
    setSucesso({
      saldoAnterior: r.saldo_anterior ?? previa.result.saldoAnterior, saldoNovo: r.saldo_novo ?? previa.result.saldoNovo,
      diferenca: r.diferenca ?? previa.result.diferenca, item: fardamento.variante.nome, codigo: fardamento.variante.codigo_interno,
      unidade: saldoUnidade?.unidadeNome ?? unidades.find((u) => u.id === unidadeId)?.nome ?? '—',
    });
    setContadoRaw(''); setMotivoTipo(''); setMotivoDesc('');
    refetch();
    return true;
  };

  return {
    loading, error, refetch, saving: ops.saving,
    unidades, unidadeUnica,
    fardamentos,
    varianteId, unidadeId, contadoRaw, motivoTipo, motivoDesc, erro, sucesso,
    setUnidadeId, setContadoRaw, setMotivoTipo, setMotivoDesc, selecionarItem, reset,
    fardamento, saldoUnidade, saldoAtual, minimo, custo, temCusto,
    previa, impactoFinanceiro, outrasUnidades, avisos,
    movs, loadingMovs,
    motivoFinal, motivoValido, podeRevisar, confirmar,
    usuario: profile?.nome ?? '—',
    MOTIVO_MAX,
  };
}
