import { situacaoDaLinha, type Situacao } from '../fardamentos/situacao';
import type { FardamentoRow, SaldoUnidade } from '../../types/db.types';
import type { MovDetalhada } from '../../services/inventoryApi';

// ── Filtros globais ─────────────────────────────────────────────────────────
export type Periodo = 'hoje' | '7d' | '30d' | 'mes' | 'mes_anterior';
export const PERIODO_LABEL: Record<Periodo, string> = {
  hoje: 'Hoje', '7d': '7 dias', '30d': '30 dias', mes: 'Este mês', mes_anterior: 'Mês anterior',
};
export type GrupoMov = 'ENTRADA' | 'ENTREGA' | 'DEVOLUCAO' | 'AJUSTE' | 'ESTORNO';
export const GRUPO_LABEL: Record<GrupoMov, string> = {
  ENTRADA: 'Entradas', ENTREGA: 'Entregas', DEVOLUCAO: 'Devoluções', AJUSTE: 'Ajustes', ESTORNO: 'Estornos',
};
export const GRUPO_COR: Record<GrupoMov, string> = {
  ENTRADA: 'hsl(var(--success))', ENTREGA: 'hsl(var(--status-warning))', DEVOLUCAO: 'hsl(217 90% 55%)',
  AJUSTE: 'hsl(280 65% 60%)', ESTORNO: 'hsl(var(--destructive))',
};

export interface DashFiltros { periodo: Periodo; unidadeId: string; categoria: string; grupo: GrupoMov | ''; situacao: Situacao | '' }
export const DASH_FILTROS_VAZIO: DashFiltros = { periodo: '30d', unidadeId: '', categoria: '', grupo: '', situacao: '' };

export function grupoDeTipo(tipo: string): GrupoMov {
  if (tipo === 'ENTRADA') return 'ENTRADA';
  if (tipo === 'ENTREGA') return 'ENTREGA';
  if (tipo === 'DEVOLUCAO') return 'DEVOLUCAO';
  if (tipo === 'AJUSTE_ENTRADA' || tipo === 'AJUSTE_SAIDA') return 'AJUSTE';
  return 'ESTORNO';
}

export interface Range { inicio: Date; fim: Date; inicioAnt: Date; fimAnt: Date }
export function periodoRange(p: Periodo, agora: Date): Range {
  const fim = agora;
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (p === 'hoje') {
    const inicio = startOfDay(agora);
    return { inicio, fim, inicioAnt: new Date(inicio.getTime() - 864e5), fimAnt: inicio };
  }
  if (p === '7d' || p === '30d') {
    const dias = p === '7d' ? 7 : 30;
    const inicio = new Date(fim.getTime() - dias * 864e5);
    return { inicio, fim, inicioAnt: new Date(inicio.getTime() - dias * 864e5), fimAnt: inicio };
  }
  if (p === 'mes') {
    const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
    return { inicio, fim, inicioAnt: new Date(agora.getFullYear(), agora.getMonth() - 1, 1), fimAnt: inicio };
  }
  // mes_anterior
  const inicio = new Date(agora.getFullYear(), agora.getMonth() - 1, 1);
  const fimMesAnt = new Date(agora.getFullYear(), agora.getMonth(), 1);
  return { inicio, fim: fimMesAnt, inicioAnt: new Date(agora.getFullYear(), agora.getMonth() - 2, 1), fimAnt: inicio };
}

// ── Estado atual (escopo por unidade/categoria/situação) ────────────────────
export interface Linha {
  f: FardamentoRow; saldos: SaldoUnidade[]; saldoTotal: number; situacao: Situacao;
  custo: number; valor: number;
}

function escopar(f: FardamentoRow, unidadeId: string): Linha {
  const saldos = unidadeId ? f.saldos.filter((s) => s.unidadeId === unidadeId) : f.saldos;
  const saldoTotal = saldos.reduce((a, s) => a + s.quantidade, 0);
  let situacao: Situacao;
  if (f.variante.ativo === false) situacao = 'INATIVO';
  else if (saldoTotal <= 0) situacao = 'SEM_ESTOQUE';
  else if (saldos.some((s) => s.status === 'SEM_ESTOQUE')) situacao = 'CRITICO';
  else if (saldos.some((s) => s.status === 'ALERTA')) situacao = 'ATENCAO';
  else situacao = unidadeId ? 'NORMAL' : situacaoDaLinha(f);
  const custo = f.variante.custo_unitario ?? 0;
  return { f, saldos, saldoTotal, situacao, custo, valor: saldoTotal * custo };
}

export interface DashboardData {
  linhas: Linha[];
  exec: {
    valorTotal: number; pecas: number; itens: number; emAlerta: number; semEstoque: number;
    unidadesComSaldo: number; movimentadasPeriodo: number; entregas: number; entregasAnterior: number;
  };
  saude: { normal: number; atencao: number; critico: number; semEstoque: number; total: number; comMinimo: number; semMinimo: number; unidadeMaisAlertas: string | null };
  eventos: { varianteId: string; grupo: GrupoMov; qtd: number; createdAt: string }[];
  porUnidade: { unidadeId: string; nome: string; pecas: number; valor: number; alertas: number; pct: number }[];
  porCategoria: { categoria: string; qtd: number; valor: number; variantes: number; pct: number }[];
  ranking: { varianteId: string; nome: string; codigo: string; categoria: string; entradas: number; entregas: number; devolucoes: number; total: number; saldo: number; valor: number }[];
  alertas: { linha: Linha; classe: 'SEM_ESTOQUE' | 'CRITICO' | 'ABAIXO_MIN' | 'SEM_MINIMO'; minimo: number; diff: number }[];
  recentes: MovDetalhada[];
  financeiro: { valor: number; custoMedio: number; cobertura: number; unidadeMaior: string | null; categoriaMaior: string | null; breakdownUnidade: { nome: string; valor: number }[]; breakdownCategoria: { nome: string; valor: number }[] };
  pendencias: { semCusto: number; semMinimo: number; semFornecedor: number; semCategoria: number };
  range: Range;
}

const CLASSE_RANK: Record<string, number> = { SEM_ESTOQUE: 0, CRITICO: 1, ABAIXO_MIN: 2, SEM_MINIMO: 3 };

export function derivarDashboard(
  fardamentos: FardamentoRow[], movimentacoes: MovDetalhada[], filtros: DashFiltros, agora: Date,
): DashboardData {
  const range = periodoRange(filtros.periodo, agora);

  // Estado atual: escopa por unidade e filtra por categoria/situação.
  const linhas = fardamentos
    .map((f) => escopar(f, filtros.unidadeId))
    .filter((l) => (filtros.categoria ? l.f.categoriaNome === filtros.categoria : true))
    .filter((l) => (filtros.situacao ? l.situacao === filtros.situacao : true))
    // Inativos só aparecem se o filtro de situação pedir explicitamente.
    .filter((l) => (l.situacao !== 'INATIVO' || filtros.situacao === 'INATIVO'));

  const catDeVariante = new Map(fardamentos.map((f) => [f.variante.id, f.categoriaNome ?? 'Sem categoria']));

  // Eventos de movimentação (período + unidade + grupo + categoria).
  const dentro = (iso: string, ini: Date, fim: Date) => { const t = new Date(iso).getTime(); return t >= ini.getTime() && t < fim.getTime(); };
  const eventos: DashboardData['eventos'] = [];
  const movimentadas = new Set<string>();
  for (const m of movimentacoes) {
    if (filtros.unidadeId && m.unidadeId !== filtros.unidadeId) continue;
    if (!dentro(m.createdAt, range.inicio, range.fim)) continue;
    const grupo = grupoDeTipo(m.tipo);
    if (filtros.grupo && grupo !== filtros.grupo) continue;
    for (const it of m.itens) {
      if (filtros.categoria && catDeVariante.get(it.varianteId) !== filtros.categoria) continue;
      eventos.push({ varianteId: it.varianteId, grupo, qtd: it.quantidade, createdAt: m.createdAt });
      movimentadas.add(it.varianteId);
    }
  }

  // Entregas do período (independe do filtro de grupo) e período anterior (comparação).
  const contarEntregas = (ini: Date, fim: Date) => movimentacoes.filter((m) => m.tipo === 'ENTREGA' && (!filtros.unidadeId || m.unidadeId === filtros.unidadeId) && dentro(m.createdAt, ini, fim)).length;
  const entregas = contarEntregas(range.inicio, range.fim);
  const entregasAnterior = contarEntregas(range.inicioAnt, range.fimAnt);

  // Executivo (estado atual).
  const comSaldoUnid = new Set<string>();
  let valorTotal = 0, pecas = 0, emAlerta = 0, semEstoque = 0;
  for (const l of linhas) {
    valorTotal += l.valor; pecas += l.saldoTotal;
    if (l.situacao === 'SEM_ESTOQUE') semEstoque++; else if (l.situacao === 'ATENCAO' || l.situacao === 'CRITICO') emAlerta++;
    l.saldos.forEach((s) => { if (s.quantidade > 0) comSaldoUnid.add(s.unidadeId); });
  }

  // Saúde do estoque.
  const cont = { NORMAL: 0, ATENCAO: 0, CRITICO: 0, SEM_ESTOQUE: 0 } as Record<string, number>;
  let comMinimo = 0, semMinimo = 0;
  const alertaPorUnidade = new Map<string, number>();
  for (const l of linhas) {
    if (l.situacao !== 'INATIVO') cont[l.situacao] = (cont[l.situacao] ?? 0) + 1;
    const temMin = (l.f.variante.estoque_minimo_padrao ?? 0) > 0 || l.f.saldos.some((s) => s.minimoEfetivo > 0);
    if (temMin) comMinimo++; else semMinimo++;
    l.saldos.forEach((s) => { if (s.status !== 'NORMAL') alertaPorUnidade.set(s.unidadeNome, (alertaPorUnidade.get(s.unidadeNome) ?? 0) + 1); });
  }
  const totalSaude = cont.NORMAL + cont.ATENCAO + cont.CRITICO + cont.SEM_ESTOQUE;
  const unidadeMaisAlertas = [...alertaPorUnidade.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // Por unidade (estado atual; ignora filtro de unidade para dar a leitura completa).
  const uAcc = new Map<string, { nome: string; pecas: number; valor: number; alertas: number }>();
  for (const f of fardamentos) {
    if (filtros.categoria && f.categoriaNome !== filtros.categoria) continue;
    if (f.variante.ativo === false) continue;
    const custo = f.variante.custo_unitario ?? 0;
    for (const s of f.saldos) {
      const r = uAcc.get(s.unidadeId) ?? { nome: s.unidadeNome, pecas: 0, valor: 0, alertas: 0 };
      r.pecas += s.quantidade; r.valor += s.quantidade * custo; if (s.status !== 'NORMAL') r.alertas += 1;
      uAcc.set(s.unidadeId, r);
    }
  }
  const totalPecasGeral = [...uAcc.values()].reduce((a, r) => a + r.pecas, 0) || 1;
  const porUnidade = [...uAcc.entries()].map(([unidadeId, r]) => ({ unidadeId, ...r, pct: Math.round((r.pecas / totalPecasGeral) * 100) }))
    .filter((r) => r.pecas > 0 || r.alertas > 0).sort((a, b) => b.pecas - a.pecas);

  // Por categoria (estado atual).
  const cAcc = new Map<string, { qtd: number; valor: number; variantes: number }>();
  for (const l of linhas) {
    const cat = l.f.categoriaNome ?? 'Sem categoria';
    const r = cAcc.get(cat) ?? { qtd: 0, valor: 0, variantes: 0 };
    r.qtd += l.saldoTotal; r.valor += l.valor; r.variantes += 1; cAcc.set(cat, r);
  }
  const totalCatQtd = [...cAcc.values()].reduce((a, r) => a + r.qtd, 0) || 1;
  const porCategoria = [...cAcc.entries()].map(([categoria, r]) => ({ categoria, ...r, pct: Math.round((r.qtd / totalCatQtd) * 100) })).sort((a, b) => b.qtd - a.qtd);

  // Ranking de itens (período).
  const rAcc = new Map<string, { entradas: number; entregas: number; devolucoes: number; total: number }>();
  for (const e of eventos) {
    const r = rAcc.get(e.varianteId) ?? { entradas: 0, entregas: 0, devolucoes: 0, total: 0 };
    if (e.grupo === 'ENTRADA') r.entradas += e.qtd; else if (e.grupo === 'ENTREGA') r.entregas += e.qtd; else if (e.grupo === 'DEVOLUCAO') r.devolucoes += e.qtd;
    r.total += e.qtd; rAcc.set(e.varianteId, r);
  }
  const linhaPorVar = new Map(linhas.map((l) => [l.f.variante.id, l]));
  const fardPorVar = new Map(fardamentos.map((f) => [f.variante.id, f]));
  const ranking = [...rAcc.entries()].map(([varianteId, r]) => {
    const l = linhaPorVar.get(varianteId); const f = fardPorVar.get(varianteId);
    return {
      varianteId, nome: f?.variante.nome ?? 'Item', codigo: f?.variante.codigo_interno ?? '—',
      categoria: f?.categoriaNome ?? 'Sem categoria', entradas: r.entradas, entregas: r.entregas, devolucoes: r.devolucoes,
      total: r.total, saldo: l?.saldoTotal ?? f?.saldoTotal ?? 0, valor: l?.valor ?? 0,
    };
  });

  // Alertas prioritários.
  const alertas: DashboardData['alertas'] = [];
  for (const l of linhas) {
    if (l.situacao === 'NORMAL' || l.situacao === 'INATIVO') continue;
    const minimo = Math.max(l.f.variante.estoque_minimo_padrao ?? 0, ...l.saldos.map((s) => s.minimoEfetivo), 0);
    const temMin = minimo > 0;
    const classe = l.situacao === 'SEM_ESTOQUE' ? 'SEM_ESTOQUE' : l.situacao === 'CRITICO' ? 'CRITICO' : temMin ? 'ABAIXO_MIN' : 'SEM_MINIMO';
    alertas.push({ linha: l, classe, minimo, diff: l.saldoTotal - minimo });
  }
  alertas.sort((a, b) => (CLASSE_RANK[a.classe] - CLASSE_RANK[b.classe]) || (a.linha.saldoTotal - b.linha.saldoTotal));

  // Movimentações recentes (período + filtros).
  const recentes = movimentacoes.filter((m) => {
    if (filtros.unidadeId && m.unidadeId !== filtros.unidadeId) return false;
    if (!dentro(m.createdAt, range.inicio, range.fim)) return false;
    if (filtros.grupo && grupoDeTipo(m.tipo) !== filtros.grupo) return false;
    if (filtros.categoria && !m.itens.some((it) => catDeVariante.get(it.varianteId) === filtros.categoria)) return false;
    return true;
  });

  // Financeiro (estado atual).
  const totalVariantesAtivas = fardamentos.filter((f) => f.variante.ativo !== false).length || 1;
  const comCusto = fardamentos.filter((f) => f.variante.ativo !== false && (f.variante.custo_unitario ?? 0) > 0).length;
  const uMaior = porUnidade.slice().sort((a, b) => b.valor - a.valor)[0];
  const cMaior = porCategoria.slice().sort((a, b) => b.valor - a.valor)[0];
  const financeiro = {
    valor: valorTotal, custoMedio: pecas > 0 ? valorTotal / pecas : 0, cobertura: Math.round((comCusto / totalVariantesAtivas) * 100),
    unidadeMaior: uMaior?.nome ?? null, categoriaMaior: cMaior?.categoria ?? null,
    breakdownUnidade: porUnidade.slice().sort((a, b) => b.valor - a.valor).slice(0, 4).map((u) => ({ nome: u.nome, valor: u.valor })),
    breakdownCategoria: porCategoria.slice().sort((a, b) => b.valor - a.valor).slice(0, 4).map((c) => ({ nome: c.categoria, valor: c.valor })),
  };

  // Pendências de cadastro (variantes ativas).
  const ativos = fardamentos.filter((f) => f.variante.ativo !== false);
  const pendencias = {
    semCusto: ativos.filter((f) => (f.variante.custo_unitario ?? 0) <= 0).length,
    semMinimo: ativos.filter((f) => (f.variante.estoque_minimo_padrao ?? 0) <= 0 && !f.saldos.some((s) => s.minimoEfetivo > 0)).length,
    semFornecedor: ativos.filter((f) => !f.variante.fornecedor_id).length,
    semCategoria: ativos.filter((f) => !f.categoriaNome).length,
  };

  return {
    linhas,
    exec: { valorTotal, pecas, itens: linhas.length, emAlerta, semEstoque, unidadesComSaldo: comSaldoUnid.size, movimentadasPeriodo: movimentadas.size, entregas, entregasAnterior },
    saude: { normal: cont.NORMAL, atencao: cont.ATENCAO, critico: cont.CRITICO, semEstoque: cont.SEM_ESTOQUE, total: totalSaude, comMinimo, semMinimo, unidadeMaisAlertas },
    eventos, porUnidade, porCategoria, ranking, alertas, recentes, financeiro, pendencias, range,
  };
}
