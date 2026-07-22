import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFuncionarios, type Funcionario } from '@/hooks/useFuncionarios';
import { useFardamentos } from './useFardamentos';
import { useEstoqueOps } from './useEstoqueOps';
import {
  getEntregas, getEntregaRecibo, getDevolucoesAtivas, getDevolucoesRecentes, getMedidasFuncionario,
  getTrocasDaEntrega, getTrocasRecentes, type ReciboEntrega, type TrocaDetalhe, type MedidasFuncionario,
} from '../services/inventoryApi';
import { disponivelParaDevolver } from '../domain/returns';
import type { EntregaRow, FardamentoRow } from '../types/db.types';

const MOTIVO_MAX = 500;
const MOTIVO_MIN = 3;

export interface DisponivelItem { varianteId: string; nome: string; codigo: string; entregue: number; devolvido: number; disponivel: number }
export type StatusDev = 'total' | 'parcial' | 'sem';
export interface EntregaLista { e: EntregaRow; funcionario: Funcionario | null; entregue: number; devolvido: number; disponivel: number; status: StatusDev }

const norm = (s: string) => (s ?? '').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/\p{Diacritic}/gu, '');

export function useStockExchange() {
  const { fardamentos, unidades, refetch } = useFardamentos();
  const { funcionarios } = useFuncionarios();
  const ops = useEstoqueOps();
  const { profile } = useAuth();

  const [entregas, setEntregas] = useState<EntregaRow[]>([]);
  const [devPorRecibo, setDevPorRecibo] = useState<Map<string, number>>(new Map());
  const [loadingEntregas, setLoadingEntregas] = useState(true);
  const [buscaRaw, setBuscaRaw] = useState(''); const [busca, setBusca] = useState('');
  const [fUnidade, setFUnidade] = useState(''); const [fComDisponivel, setFComDisponivel] = useState(true);

  const [entregaId, setEntregaId] = useState('');
  const [disponiveis, setDisponiveis] = useState<DisponivelItem[]>([]);
  const [loadingDisp, setLoadingDisp] = useState(false);
  const [historico, setHistorico] = useState<TrocaDetalhe[]>([]);
  const [recentes, setRecentes] = useState<TrocaDetalhe[]>([]);
  const [loadingRecentes, setLoadingRecentes] = useState(true);
  const [medidas, setMedidas] = useState<MedidasFuncionario | null>(null);

  const [varianteDevolvida, setVarianteDevolvida] = useState('');
  const [varianteNova, setVarianteNova] = useState('');
  const [quantidadeRaw, setQuantidadeRaw] = useState('');
  const [motivo, setMotivo] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<ReciboEntrega | null>(null);
  const mounted = useRef(true);

  useEffect(() => { const t = setTimeout(() => setBusca(buscaRaw), 350); return () => clearTimeout(t); }, [buscaRaw]);

  const carregar = useCallback(async () => {
    try {
      setLoadingEntregas(true); setLoadingRecentes(true);
      const [es, devs, trs] = await Promise.all([getEntregas(60), getDevolucoesRecentes(300), getTrocasRecentes(15)]);
      if (!mounted.current) return;
      setEntregas(es);
      const map = new Map<string, number>();
      for (const d of devs) if (d.status === 'ATIVA') map.set(d.recibo, (map.get(d.recibo) ?? 0) + d.quantidade);
      setDevPorRecibo(map); setRecentes(trs);
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

  useEffect(() => {
    if (!funcionario) { setMedidas(null); return; }
    let vivo = true; getMedidasFuncionario(funcionario.id).then((m) => { if (vivo) setMedidas(m); }).catch(() => { if (vivo) setMedidas(null); });
    return () => { vivo = false; };
  }, [funcionario]);

  const recomputar = useCallback(async (e: EntregaRow) => {
    setLoadingDisp(true);
    const entregue = new Map<string, { nome: string; codigo: string; qtd: number }>();
    (e.itens ?? []).forEach((it) => { const c = entregue.get(it.variante_id) ?? { nome: it.variante?.nome ?? 'Item', codigo: it.variante?.codigo_interno ?? '', qtd: 0 }; c.qtd += it.quantidade; entregue.set(it.variante_id, c); });
    const devolvido = new Map<string, number>();
    try { const devs = await getDevolucoesAtivas(e.id); devs.forEach((d) => devolvido.set(d.variante_id, (devolvido.get(d.variante_id) ?? 0) + d.quantidade)); } catch { /* 0 */ }
    const lst: DisponivelItem[] = [];
    for (const [vid, info] of entregue) { const dev = devolvido.get(vid) ?? 0; lst.push({ varianteId: vid, nome: info.nome, codigo: info.codigo, entregue: info.qtd, devolvido: dev, disponivel: disponivelParaDevolver(info.qtd, dev) }); }
    if (mounted.current) { setDisponiveis(lst); setLoadingDisp(false); }
    try { const h = await getTrocasDaEntrega(e.id); if (mounted.current) setHistorico(h); } catch { /* */ }
  }, []);

  const selecionarEntrega = async (e: EntregaRow) => { setEntregaId(e.id); setVarianteDevolvida(''); setVarianteNova(''); setQuantidadeRaw(''); setMotivo(''); setErro(null); setHistorico([]); await recomputar(e); };
  const limparEntrega = () => { setEntregaId(''); setDisponiveis([]); setHistorico([]); setVarianteDevolvida(''); setVarianteNova(''); setQuantidadeRaw(''); };

  const dispSel = disponiveis.find((d) => d.varianteId === varianteDevolvida) ?? null;
  const dispQtd = dispSel?.disponivel ?? 0;
  const fardDevolvida = fardPorVar.get(varianteDevolvida) ?? null;
  const fardNova = fardPorVar.get(varianteNova) ?? null;
  const unidadeId = entrega?.unidade_id ?? '';
  const saldoDevolvida = fardDevolvida?.saldos.find((s) => s.unidadeId === unidadeId)?.quantidade ?? 0;
  const saldoNova = fardNova?.saldos.find((s) => s.unidadeId === unidadeId)?.quantidade ?? 0;
  const minimoNova = fardNova?.saldos.find((s) => s.unidadeId === unidadeId)?.minimoEfetivo ?? (fardNova?.variante.estoque_minimo_padrao ?? 0);
  const custoDev = fardDevolvida?.variante.custo_unitario ?? 0;
  const custoNova = fardNova?.variante.custo_unitario ?? 0;

  const qtd = Number(quantidadeRaw);
  const excedeDisp = Number.isInteger(qtd) && qtd > dispQtd;
  const excedeSaldo = Number.isInteger(qtd) && qtd > saldoNova;
  const qtdValida = Number.isInteger(qtd) && qtd > 0 && qtd <= dispQtd && qtd <= saldoNova;
  const saldoDevolvidaFinal = saldoDevolvida + (qtdValida ? qtd : 0);
  const saldoNovaFinal = saldoNova - (qtdValida ? qtd : 0);

  const tamanhoSugerido = useMemo(() => { if (!medidas || !fardNova) return null; return fardNova.variante.tamanho?.tipo === 'CALCADO' ? medidas.calcado : (medidas.camisa ?? medidas.calca); }, [medidas, fardNova]);
  const compat = !!tamanhoSugerido && tamanhoSugerido === fardNova?.tamanhoRotulo;
  const mesmaVariante = !!varianteNova && varianteNova === varianteDevolvida;

  const financeiro = useMemo(() => {
    const temCusto = custoDev > 0 && custoNova > 0;
    const q = qtdValida ? qtd : 0;
    return { valorDev: custoDev * q, valorNova: custoNova * q, diferenca: (custoNova - custoDev) * q, temCusto };
  }, [custoDev, custoNova, qtd, qtdValida]);

  const motivoOk = motivo.trim().length >= MOTIVO_MIN;
  const podeRevisar = !!entrega && !!varianteDevolvida && !!varianteNova && !mesmaVariante && qtdValida && motivoOk && !ops.saving;

  const confirmar = async (): Promise<boolean> => {
    setErro(null);
    if (!podeRevisar || !entrega) { setErro('Revise os dados da troca.'); return false; }
    const res = await ops.registrarTroca({ entregaOriginalId: entrega.id, unidadeId, varianteDevolvida, varianteNova, quantidade: qtd, motivo: motivo.trim() });
    if (!res) return false;
    const novaEntregaId = (res as { nova_entrega_id?: string }).nova_entrega_id;
    if (novaEntregaId) { try { setSucesso(await getEntregaRecibo(novaEntregaId)); } catch { /* recibo indisponível */ } }
    setVarianteDevolvida(''); setVarianteNova(''); setQuantidadeRaw(''); setMotivo('');
    await recomputar(entrega); refetch(); carregar();
    return true;
  };
  const reset = () => setSucesso(null);

  return {
    unidades, loadingEntregas, loadingRecentes, saving: ops.saving, fardamentos,
    buscaRaw, setBusca: setBuscaRaw, fUnidade, setFUnidade, fComDisponivel, setFComDisponivel,
    lista, entrega, funcionario, entregaId, selecionarEntrega, limparEntrega,
    disponiveis, loadingDisp, historico, recentes, medidas,
    varianteDevolvida, setVarianteDevolvida, varianteNova, setVarianteNova, quantidadeRaw, setQuantidadeRaw, motivo, setMotivo, erro, sucesso,
    dispSel, dispQtd, fardDevolvida, fardNova, unidadeId, saldoDevolvida, saldoNova, minimoNova, custoDev, custoNova,
    qtd, qtdValida, excedeDisp, excedeSaldo, saldoDevolvidaFinal, saldoNovaFinal, tamanhoSugerido, compat, mesmaVariante,
    financeiro, motivoOk, podeRevisar, confirmar, reset,
    usuario: profile?.nome ?? '—', MOTIVO_MAX,
  };
}
