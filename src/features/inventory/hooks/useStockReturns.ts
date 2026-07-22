import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFuncionarios, type Funcionario } from '@/hooks/useFuncionarios';
import { useFardamentos } from './useFardamentos';
import { useEstoqueOps } from './useEstoqueOps';
import {
  getEntregas, getDevolucoesAtivas, getDevolucoesDaEntrega, getDevolucoesRecentes,
  type DevolucaoDetalhe,
} from '../services/inventoryApi';
import type { EntregaRow } from '../types/db.types';
import { disponivelParaDevolver, deveReestocar } from '../domain/returns';
import type { ReturnCondition, ReturnDestination } from '../types/inventory.types';

export type StatusDev = 'total' | 'parcial' | 'sem';
export interface EntregaLista { e: EntregaRow; funcionario: Funcionario | null; entregue: number; devolvido: number; disponivel: number; status: StatusDev }
export interface DisponivelItem { varianteId: string; nome: string; codigo: string; entregue: number; devolvido: number; disponivel: number }

const norm = (s: string) => (s ?? '').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/\p{Diacritic}/gu, '');
const MOTIVO_MAX = 500;
export const DESTINO_EXIGE_MOTIVO = new Set(['BAIXA', 'DESCARTE']);
export const CONDICAO_EXIGE_MOTIVO = new Set(['DANIFICADO', 'SEM_REUSO']);

export function useStockReturns() {
  const { fardamentos, unidades, refetch } = useFardamentos();
  const { funcionarios } = useFuncionarios();
  const ops = useEstoqueOps();
  const { profile } = useAuth();

  const [entregas, setEntregas] = useState<EntregaRow[]>([]);
  const [devPorRecibo, setDevPorRecibo] = useState<Map<string, number>>(new Map());
  const [loadingEntregas, setLoadingEntregas] = useState(true);
  const [buscaRaw, setBuscaRaw] = useState('');
  const [busca, setBusca] = useState('');
  const [fUnidade, setFUnidade] = useState('');
  const [fComDisponivel, setFComDisponivel] = useState(true);

  const [entregaId, setEntregaId] = useState('');
  const [disponiveis, setDisponiveis] = useState<DisponivelItem[]>([]);
  const [loadingDisp, setLoadingDisp] = useState(false);
  const [historico, setHistorico] = useState<DevolucaoDetalhe[]>([]);
  const [recentes, setRecentes] = useState<DevolucaoDetalhe[]>([]);
  const [loadingRecentes, setLoadingRecentes] = useState(true);

  const [varianteId, setVarianteId] = useState('');
  const [quantidadeRaw, setQuantidadeRaw] = useState('');
  const [condicao, setCondicao] = useState<ReturnCondition>('BOM');
  const [destino, setDestino] = useState<ReturnDestination>('ESTOQUE');
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<null | { recibo: string; item: string; quantidade: number; condicao: ReturnCondition; destino: ReturnDestination; reestocado: boolean; saldoAntes: number; saldoDepois: number }>(null);
  const mounted = useRef(true);

  useEffect(() => { const t = setTimeout(() => setBusca(buscaRaw), 350); return () => clearTimeout(t); }, [buscaRaw]);

  const carregar = useCallback(async () => {
    try {
      setLoadingEntregas(true); setLoadingRecentes(true);
      const [es, devs] = await Promise.all([getEntregas(60), getDevolucoesRecentes(300)]);
      if (!mounted.current) return;
      setEntregas(es);
      const map = new Map<string, number>();
      for (const d of devs) if (d.status === 'ATIVA') map.set(d.recibo, (map.get(d.recibo) ?? 0) + d.quantidade);
      setDevPorRecibo(map);
      setRecentes(devs.slice(0, 15));
    } catch { /* auxiliar */ } finally { if (mounted.current) { setLoadingEntregas(false); setLoadingRecentes(false); } }
  }, []);
  useEffect(() => { mounted.current = true; carregar(); return () => { mounted.current = false; }; }, [carregar]);

  const funcPorId = useMemo(() => new Map(funcionarios.map((f) => [f.id, f])), [funcionarios]);
  const fardPorVar = useMemo(() => new Map(fardamentos.map((f) => [f.variante.id, f])), [fardamentos]);

  const lista = useMemo<EntregaLista[]>(() => {
    const q = norm(busca.trim());
    return entregas.map((e) => {
      const entregue = (e.itens ?? []).reduce((a, i) => a + i.quantidade, 0);
      const devolvido = devPorRecibo.get(e.recibo) ?? 0;
      const disponivel = Math.max(0, entregue - devolvido);
      const status: StatusDev = devolvido >= entregue && entregue > 0 ? 'total' : devolvido > 0 ? 'parcial' : 'sem';
      return { e, funcionario: funcPorId.get(e.funcionario_id) ?? null, entregue, devolvido, disponivel, status };
    }).filter((x) => {
      if (fUnidade && x.e.unidade_id !== fUnidade) return false;
      if (fComDisponivel && x.disponivel <= 0) return false;
      if (q) { const alvo = norm([x.e.recibo, x.funcionario?.nome ?? x.e.funcionario?.nome ?? '', x.funcionario?.setor?.nome ?? '', x.funcionario?.funcao?.nome ?? '', x.funcionario?.empresa?.nome ?? ''].join(' ')); if (!alvo.includes(q)) return false; }
      return true;
    }).slice(0, 40);
  }, [entregas, devPorRecibo, funcPorId, busca, fUnidade, fComDisponivel]);

  const entrega = useMemo(() => entregas.find((e) => e.id === entregaId) ?? null, [entregas, entregaId]);
  const funcionario = entrega ? (funcPorId.get(entrega.funcionario_id) ?? null) : null;

  const recomputar = useCallback(async (e: EntregaRow) => {
    setLoadingDisp(true);
    const entregue = new Map<string, { nome: string; codigo: string; qtd: number }>();
    (e.itens ?? []).forEach((it) => {
      const cur = entregue.get(it.variante_id) ?? { nome: it.variante?.nome ?? 'Item', codigo: it.variante?.codigo_interno ?? '', qtd: 0 };
      cur.qtd += it.quantidade; entregue.set(it.variante_id, cur);
    });
    const devolvido = new Map<string, number>();
    try { const devs = await getDevolucoesAtivas(e.id); devs.forEach((d) => devolvido.set(d.variante_id, (devolvido.get(d.variante_id) ?? 0) + d.quantidade)); } catch { /* assume 0 */ }
    const lst: DisponivelItem[] = [];
    for (const [vid, info] of entregue) {
      const dev = devolvido.get(vid) ?? 0;
      lst.push({ varianteId: vid, nome: info.nome, codigo: info.codigo, entregue: info.qtd, devolvido: dev, disponivel: disponivelParaDevolver(info.qtd, dev) });
    }
    if (mounted.current) { setDisponiveis(lst); setLoadingDisp(false); }
    try { const h = await getDevolucoesDaEntrega(e.id); if (mounted.current) setHistorico(h); } catch { /* */ }
  }, []);

  const selecionarEntrega = async (e: EntregaRow) => { setEntregaId(e.id); setVarianteId(''); setQuantidadeRaw(''); setMotivo(''); setErro(null); setHistorico([]); await recomputar(e); };
  const limparEntrega = () => { setEntregaId(''); setDisponiveis([]); setHistorico([]); setVarianteId(''); setQuantidadeRaw(''); };

  const dispSel = disponiveis.find((d) => d.varianteId === varianteId) ?? null;
  const dispQtd = dispSel?.disponivel ?? 0;
  const fardamento = fardPorVar.get(varianteId) ?? null;
  const saldoAtual = entrega ? (fardamento?.saldos.find((s) => s.unidadeId === entrega.unidade_id)?.quantidade ?? 0) : 0;
  const custo = fardamento?.variante.custo_unitario ?? 0;
  const reestoca = deveReestocar(destino, condicao);
  const qtd = Number(quantidadeRaw);
  const qtdValida = Number.isInteger(qtd) && qtd > 0 && qtd <= dispQtd;
  const excede = Number.isInteger(qtd) && qtd > dispQtd;
  const saldoFinal = reestoca && qtdValida ? saldoAtual + qtd : saldoAtual;
  const impacto = reestoca && qtdValida && custo > 0 ? qtd * custo : null;

  const motivoObrigatorio = DESTINO_EXIGE_MOTIVO.has(destino) || CONDICAO_EXIGE_MOTIVO.has(condicao);
  const motivoOk = !motivoObrigatorio || motivo.trim().length >= 3;
  const podeRevisar = !!entrega && !!varianteId && qtdValida && motivoOk && !ops.saving;

  const confirmar = async (): Promise<boolean> => {
    setErro(null);
    if (!podeRevisar || !entrega) { setErro('Revise os dados da devolução.'); return false; }
    const res = await ops.registrarDevolucao({ entregaId: entrega.id, varianteId, unidadeId: entrega.unidade_id, quantidade: qtd, condicao, destino, motivo: motivo.trim() });
    if (!res) return false;
    setSucesso({ recibo: entrega.recibo, item: dispSel?.nome ?? 'Item', quantidade: qtd, condicao, destino, reestocado: reestoca, saldoAntes: saldoAtual, saldoDepois: saldoFinal });
    setVarianteId(''); setQuantidadeRaw(''); setMotivo('');
    await recomputar(entrega); refetch(); carregar();
    return true;
  };

  const reset = () => { setSucesso(null); };

  return {
    unidades, loadingEntregas, loadingRecentes, saving: ops.saving,
    buscaRaw, setBusca: setBuscaRaw, fUnidade, setFUnidade, fComDisponivel, setFComDisponivel,
    lista, entrega, funcionario, entregaId, selecionarEntrega, limparEntrega,
    disponiveis, loadingDisp, historico, recentes,
    varianteId, setVarianteId, quantidadeRaw, setQuantidadeRaw, condicao, setCondicao, destino, setDestino, motivo, setMotivo, erro, sucesso,
    dispSel, dispQtd, saldoAtual, custo, reestoca, qtd, qtdValida, excede, saldoFinal, impacto,
    motivoObrigatorio, motivoOk, podeRevisar, confirmar, reset,
    usuario: profile?.nome ?? '—', MOTIVO_MAX,
  };
}
