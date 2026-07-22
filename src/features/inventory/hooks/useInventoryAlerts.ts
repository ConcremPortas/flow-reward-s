import { useEffect, useMemo, useState } from 'react';
import { useInventoryScreen, type UltimaMov } from './useInventoryScreen';
import { severidade, SEV_RANK, SEV_OPERACIONAL, type Severidade } from '../components/alerts/severity';
import type { FardamentoRow } from '../types/db.types';
import type { MovDetalhada } from '../services/inventoryApi';

export interface AlertRow {
  key: string; f: FardamentoRow; unidadeId: string; unidadeNome: string;
  quantidade: number; minimo: number; ideal: number | null; severidade: Severidade;
  diff: number; reposicao: number; custo: number; valorRepor: number;
  ultima?: UltimaMov; ativo: boolean; categoria: string;
}

export type Ordenacao = 'urgencia' | 'menor_saldo' | 'maior_falta' | 'mais_antigo' | 'ultima_mov' | 'nome';
export type Agrupamento = 'item' | 'unidade' | 'categoria';

export interface AlertFiltros {
  busca: string; unidadeId: string; categoria: string; modelo: string; tamanho: string;
  severidade: Severidade | ''; incluirInativos: boolean;
}
const FILTROS_VAZIO: AlertFiltros = { busca: '', unidadeId: '', categoria: '', modelo: '', tamanho: '', severidade: '', incluirInativos: false };

const norm = (s: string) => (s ?? '').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/\p{Diacritic}/gu, '');
const MS_DIA = 864e5;

export function useInventoryAlerts() {
  const screen = useInventoryScreen();
  const [filtros, setFiltros] = useState<AlertFiltros>(FILTROS_VAZIO);
  const [buscaRaw, setBuscaRaw] = useState('');
  const [ordenacao, setOrdenacao] = useState<Ordenacao>('urgencia');
  const [agrupamento, setAgrupamento] = useState<Agrupamento>('item');
  const [atualizadoEm, setAtualizadoEm] = useState(() => new Date());

  useEffect(() => { const t = setTimeout(() => setFiltros((p) => ({ ...p, busca: buscaRaw })), 350); return () => clearTimeout(t); }, [buscaRaw]);
  useEffect(() => { if (!screen.loading) setAtualizadoEm(new Date()); }, [screen.loading, screen.fardamentos]);

  // Todas as combinações item×unidade de variantes ATIVAS (universo analisado).
  const combos = useMemo(() => {
    const out: { f: FardamentoRow; s: FardamentoRow['saldos'][number]; sev: Severidade }[] = [];
    for (const f of screen.fardamentos) {
      if (f.variante.ativo === false) continue;
      for (const s of f.saldos) out.push({ f, s, sev: severidade(s.quantidade, s.minimoEfetivo) });
    }
    return out;
  }, [screen.fardamentos]);

  // Linhas de alerta (todas as severidades exibíveis). Inclui inativos só se pedido.
  const todas = useMemo<AlertRow[]>(() => {
    const rows: AlertRow[] = [];
    for (const f of screen.fardamentos) {
      const ativo = f.variante.ativo !== false;
      for (const s of f.saldos) {
        const sev = severidade(s.quantidade, s.minimoEfetivo);
        if (sev === 'NORMAL') continue;
        const ideal = s.estoqueIdeal;
        const alvo = ideal && ideal > 0 ? ideal : s.minimoEfetivo;
        const custo = f.variante.custo_unitario ?? 0;
        const reposicao = Math.max(0, alvo - s.quantidade);
        rows.push({
          key: `${f.variante.id}-${s.unidadeId}`, f, unidadeId: s.unidadeId, unidadeNome: s.unidadeNome,
          quantidade: s.quantidade, minimo: s.minimoEfetivo, ideal, severidade: sev,
          diff: s.quantidade - s.minimoEfetivo, reposicao, custo, valorRepor: reposicao * custo,
          ultima: screen.ultimaMovPorVariante.get(f.variante.id), ativo, categoria: f.categoriaNome ?? 'Sem categoria',
        });
      }
    }
    return rows;
  }, [screen.fardamentos, screen.ultimaMovPorVariante]);

  const ativas = useMemo(() => todas.filter((r) => r.ativo), [todas]);

  // Indicadores (universo ativo).
  const stats = useMemo(() => {
    const unidadesAfetadas = new Set<string>();
    let semEstoque = 0, criticos = 0, abaixoMin = 0, proximos = 0, semMinimo = 0;
    for (const r of ativas) {
      if (r.severidade === 'SEM_ESTOQUE') semEstoque++;
      else if (r.severidade === 'CRITICO') criticos++;
      else if (r.severidade === 'ABAIXO_MIN') abaixoMin++;
      else if (r.severidade === 'PROXIMO') proximos++;
      else if (r.severidade === 'SEM_MINIMO') semMinimo++;
      if (SEV_OPERACIONAL.includes(r.severidade)) unidadesAfetadas.add(r.unidadeId);
    }
    const total = semEstoque + criticos + abaixoMin + proximos;
    return { semEstoque, criticos, abaixoMin, proximos, semMinimo, total, unidadesAfetadas: unidadesAfetadas.size, totalUnidades: screen.unidades.length };
  }, [ativas, screen.unidades.length]);

  // Saúde dos níveis (sobre combos ativos).
  const saude = useMemo(() => {
    const c = { NORMAL: 0, PROXIMO: 0, ABAIXO_MIN: 0, CRITICO: 0, SEM_ESTOQUE: 0, SEM_MINIMO: 0 };
    const alertaPorUnid = new Map<string, number>();
    const alertaPorCat = new Map<string, number>();
    for (const { f, s, sev } of combos) {
      c[sev] = (c[sev] ?? 0) + 1;
      if (SEV_OPERACIONAL.includes(sev)) {
        alertaPorUnid.set(s.unidadeNome, (alertaPorUnid.get(s.unidadeNome) ?? 0) + 1);
        const cat = f.categoriaNome ?? 'Sem categoria';
        alertaPorCat.set(cat, (alertaPorCat.get(cat) ?? 0) + 1);
      }
    }
    const total = combos.length;
    const unidadeMaisAlertas = [...alertaPorUnid.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const categoriaMaisAfetada = [...alertaPorCat.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    return { ...c, total, semMinimo: c.SEM_MINIMO, unidadeMaisAlertas, categoriaMaisAfetada };
  }, [combos]);

  // Painel: unidades mais críticas.
  const combosPorUnidade = useMemo(() => {
    const m = new Map<string, number>();
    for (const { s } of combos) m.set(s.unidadeId, (m.get(s.unidadeId) ?? 0) + 1);
    return m;
  }, [combos]);
  const unidadesCriticas = useMemo(() => {
    const m = new Map<string, { unidadeId: string; nome: string; semEstoque: number; abaixo: number; proximo: number; valorRepor: number; alertas: number }>();
    for (const r of ativas) {
      if (!SEV_OPERACIONAL.includes(r.severidade)) continue;
      const e = m.get(r.unidadeId) ?? { unidadeId: r.unidadeId, nome: r.unidadeNome, semEstoque: 0, abaixo: 0, proximo: 0, valorRepor: 0, alertas: 0 };
      if (r.severidade === 'SEM_ESTOQUE') e.semEstoque++;
      else if (r.severidade === 'CRITICO' || r.severidade === 'ABAIXO_MIN') e.abaixo++;
      else if (r.severidade === 'PROXIMO') e.proximo++;
      e.valorRepor += r.valorRepor; e.alertas++;
      m.set(r.unidadeId, e);
    }
    return [...m.values()].map((u) => ({ ...u, pct: Math.round((u.alertas / (combosPorUnidade.get(u.unidadeId) || 1)) * 100) }))
      .sort((a, b) => (b.semEstoque - a.semEstoque) || (b.abaixo - a.abaixo) || (b.alertas - a.alertas));
  }, [ativas, combosPorUnidade]);

  // Painel: categorias mais afetadas.
  const categoriasAfetadas = useMemo(() => {
    const m = new Map<string, { categoria: string; total: number; semEstoque: number; unidades: Set<string> }>();
    for (const r of ativas) {
      if (!SEV_OPERACIONAL.includes(r.severidade)) continue;
      const e = m.get(r.categoria) ?? { categoria: r.categoria, total: 0, semEstoque: 0, unidades: new Set<string>() };
      e.total++; if (r.severidade === 'SEM_ESTOQUE') e.semEstoque++; e.unidades.add(r.unidadeId);
      m.set(r.categoria, e);
    }
    const totalGeral = stats.total || 1;
    return [...m.values()].map((c) => ({ categoria: c.categoria, total: c.total, semEstoque: c.semEstoque, unidades: c.unidades.size, pct: Math.round((c.total / totalGeral) * 100) }))
      .sort((a, b) => b.total - a.total);
  }, [ativas, stats.total]);

  // Recomendações operacionais.
  const recomendacoes = useMemo(() => {
    const out: { id: string; texto: string; alvo: string }[] = [];
    if (stats.semEstoque > 0) out.push({ id: 'entrada', texto: `Registrar entrada para ${stats.semEstoque} ${stats.semEstoque === 1 ? 'item sem estoque' : 'itens sem estoque'}`, alvo: '/controle-estoque/entradas' });
    if (stats.semMinimo > 0) out.push({ id: 'minimo', texto: `Configurar mínimo de ${stats.semMinimo} ${stats.semMinimo === 1 ? 'item' : 'itens'}`, alvo: '/controle-estoque/cadastros' });
    if (saude.unidadeMaisAlertas) out.push({ id: 'unidade', texto: `Revisar saldos da unidade ${saude.unidadeMaisAlertas}`, alvo: '/controle-estoque/ajuste' });
    const semMov = new Set(ativas.filter((r) => SEV_OPERACIONAL.includes(r.severidade) && (!r.ultima || (atualizadoEm.getTime() - new Date(r.ultima.createdAt).getTime()) > 30 * MS_DIA)).map((r) => r.f.variante.id)).size;
    if (semMov > 0) out.push({ id: 'semmov', texto: `${semMov} ${semMov === 1 ? 'item em alerta sem' : 'itens em alerta sem'} movimentação recente`, alvo: '/controle-estoque/movimentacoes' });
    return out;
  }, [stats, saude.unidadeMaisAlertas, ativas, atualizadoEm]);

  // Movimentações relacionadas a itens em alerta.
  const idsAlerta = useMemo(() => new Set(ativas.filter((r) => SEV_OPERACIONAL.includes(r.severidade)).map((r) => r.f.variante.id)), [ativas]);
  const movimentacoesRelacionadas = useMemo<MovDetalhada[]>(
    () => screen.movimentacoes.filter((m) => m.itens.some((it) => idsAlerta.has(it.varianteId))).slice(0, 8),
    [screen.movimentacoes, idsAlerta],
  );

  // Lista filtrada + ordenada (tabela).
  const filtradas = useMemo(() => {
    const q = norm(filtros.busca.trim());
    const arr = todas.filter((r) => {
      if (!filtros.incluirInativos && !r.ativo) return false;
      if (filtros.severidade && r.severidade !== filtros.severidade) return false;
      if (filtros.unidadeId && r.unidadeId !== filtros.unidadeId) return false;
      if (filtros.categoria && r.f.categoriaNome !== filtros.categoria) return false;
      if (filtros.modelo && r.f.modeloNome !== filtros.modelo) return false;
      if (filtros.tamanho && r.f.tamanhoRotulo !== filtros.tamanho) return false;
      if (q && !norm([r.f.variante.nome, r.f.variante.codigo_interno, r.categoria, r.f.modeloNome ?? '', r.unidadeNome].join(' ')).includes(q)) return false;
      return true;
    });
    const tMov = (r: AlertRow) => (r.ultima ? new Date(r.ultima.createdAt).getTime() : 0);
    arr.sort((a, b) => {
      switch (ordenacao) {
        case 'menor_saldo': return a.quantidade - b.quantidade;
        case 'maior_falta': return (b.minimo - b.quantidade) - (a.minimo - a.quantidade);
        case 'mais_antigo': return tMov(a) - tMov(b);
        case 'ultima_mov': return tMov(b) - tMov(a);
        case 'nome': return a.f.variante.nome.localeCompare(b.f.variante.nome, 'pt-BR');
        default: return (SEV_RANK[a.severidade] - SEV_RANK[b.severidade]) || (a.quantidade - b.quantidade);
      }
    });
    return arr;
  }, [todas, filtros, ordenacao]);

  const reposicao = useMemo(() => filtradas.filter((r) => r.reposicao > 0), [filtradas]);

  const setFiltro = <K extends keyof AlertFiltros>(k: K, v: AlertFiltros[K]) => setFiltros((p) => ({ ...p, [k]: v }));
  const limpar = () => { setFiltros(FILTROS_VAZIO); setBuscaRaw(''); };

  return {
    screen, atualizadoEm,
    filtros, buscaRaw, setBusca: setBuscaRaw, setFiltro, limpar,
    ordenacao, setOrdenacao, agrupamento, setAgrupamento,
    stats, saude, unidadesCriticas, categoriasAfetadas, recomendacoes, movimentacoesRelacionadas,
    filtradas, reposicao, totalAtivas: ativas.length,
    opcoes: screen.opcoes,
  };
}
