import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getVariantesTodas, getSaldos } from '../services/inventoryApi';
import {
  getCategoriasTodas, getTamanhosTodas, getUnidadesTodas, getModelos, getFornecedores,
  getEmpresas, getSetores, getUsuariosNomes,
  criarCadastro, atualizarCadastro, definirAtivoCadastro, excluirCadastro,
  type CadastroKey, type ModeloRow, type FornecedorRow, type OpcaoRow,
} from '../services/cadastrosApi';
import { minimoEfetivo, statusEstoque } from '../domain/stockStatus';
import type { CategoriaRow, TamanhoRow, UnidadeRow, VarianteRow, SaldoRow } from '../types/db.types';
import { tipoTamLabel, type MasterCtx, type FormOpcoes, type SaldoDetalhe, type UnidadeAgg, type VarNaUnidade } from '../components/masterdata/masterShared';

/** Traduz erros de escrita para pt-BR (FK restrict → orienta a inativar). */
function traduzErro(e: unknown): string {
  const msg = (e instanceof Error ? e.message : String(e)).toLowerCase();
  if (msg.includes('foreign key') || msg.includes('violates foreign key') || msg.includes('restrict')) {
    return 'Não é possível excluir: existem registros vinculados a este item. Inative-o em vez de excluir.';
  }
  if (msg.includes('row-level security') || msg.includes('permission') || msg.includes('policy')) {
    return 'Você não tem permissão para esta ação. A exclusão é restrita a administradores.';
  }
  if (msg.includes('duplicate') || msg.includes('unique')) {
    return 'Já existe um registro com esses dados (nome, código ou combinação).';
  }
  if (msg.includes('check constraint')) return 'Valor inválido para um dos campos.';
  return 'Não foi possível concluir a operação. Tente novamente.';
}

export interface MasterData {
  loading: boolean;
  error: boolean;
  saving: boolean;
  atualizadoEm: Date;
  refetch: () => void;
  ctx: MasterCtx;
  opcoes: FormOpcoes;
  totais: { registros: number; ativos: number };
  criar: (key: CadastroKey, valores: Record<string, unknown>) => Promise<boolean>;
  atualizar: (key: CadastroKey, id: string, valores: Record<string, unknown>) => Promise<boolean>;
  setAtivo: (key: CadastroKey, id: string, ativo: boolean) => Promise<boolean>;
  excluir: (key: CadastroKey, id: string) => Promise<boolean>;
}

/**
 * Carrega TODOS os cadastros (ativos + inativos) + saldos + nomes de usuários e
 * compõe um contexto derivado (maps, agregados por unidade/variante, contagens de
 * vínculos). Leituras respeitam a RLS; mutações são escrita direta (RLS 0003/0006).
 * Sem N+1: consultas em lote e derivações memoizadas.
 */
export function useInventoryMasterData(): MasterData {
  const [categorias, setCategorias] = useState<CategoriaRow[]>([]);
  const [modelos, setModelos] = useState<ModeloRow[]>([]);
  const [tamanhos, setTamanhos] = useState<TamanhoRow[]>([]);
  const [variantes, setVariantes] = useState<VarianteRow[]>([]);
  const [unidades, setUnidades] = useState<UnidadeRow[]>([]);
  const [fornecedores, setFornecedores] = useState<FornecedorRow[]>([]);
  const [empresas, setEmpresas] = useState<OpcaoRow[]>([]);
  const [setores, setSetores] = useState<OpcaoRow[]>([]);
  const [usuarios, setUsuarios] = useState<OpcaoRow[]>([]);
  const [saldos, setSaldos] = useState<SaldoRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [atualizadoEm, setAtualizadoEm] = useState(() => new Date());
  const mounted = useRef(true);
  const { toast } = useToast();

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const [cat, mod, tam, varr, uni, forn, emp, set, usr, sal] = await Promise.all([
        getCategoriasTodas(), getModelos(), getTamanhosTodas(), getVariantesTodas(), getUnidadesTodas(),
        getFornecedores(), getEmpresas(), getSetores(), getUsuariosNomes(), getSaldos(),
      ]);
      if (!mounted.current) return;
      setCategorias(cat); setModelos(mod); setTamanhos(tam); setVariantes(varr); setUnidades(uni);
      setFornecedores(forn); setEmpresas(emp); setSetores(set); setUsuarios(usr); setSaldos(sal);
      setAtualizadoEm(new Date());
    } catch (e) {
      console.error('Erro ao carregar cadastros do estoque:', e);
      if (mounted.current) setError(true);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => { mounted.current = true; fetchAll(); return () => { mounted.current = false; }; }, [fetchAll]);

  const run = useCallback(async (fn: () => Promise<void>, successMsg?: string): Promise<boolean> => {
    setSaving(true);
    try {
      await fn();
      await fetchAll();
      if (successMsg) toast({ title: successMsg });
      return true;
    } catch (e) {
      console.error('Erro em operação de cadastro:', e);
      toast({ title: 'Operação não concluída', description: traduzErro(e), variant: 'destructive' });
      return false;
    } finally {
      if (mounted.current) setSaving(false);
    }
  }, [fetchAll, toast]);

  // ── Maps base ──
  const catMap = useMemo(() => new Map(categorias.map((c) => [c.id, c])), [categorias]);
  const modMap = useMemo(() => new Map(modelos.map((m) => [m.id, m])), [modelos]);
  const tamMap = useMemo(() => new Map(tamanhos.map((t) => [t.id, t])), [tamanhos]);
  const empMap = useMemo(() => new Map(empresas.map((e) => [e.id, e.nome])), [empresas]);
  const setMap = useMemo(() => new Map(setores.map((s) => [s.id, s.nome])), [setores]);
  const fornMap = useMemo(() => new Map(fornecedores.map((f) => [f.id, f])), [fornecedores]);
  const uniMap = useMemo(() => new Map(unidades.map((u) => [u.id, u])), [unidades]);
  const usrMap = useMemo(() => new Map(usuarios.map((u) => [u.id, u.nome])), [usuarios]);
  const varMap = useMemo(() => new Map(variantes.map((v) => [v.id, v])), [variantes]);

  // ── Agregados de saldo ──
  const saldoTotalVar = useMemo(() => {
    const m = new Map<string, number>();
    for (const s of saldos) m.set(s.variante_id, (m.get(s.variante_id) ?? 0) + s.quantidade);
    return m;
  }, [saldos]);

  const saldoDetVar = useMemo(() => {
    const m = new Map<string, SaldoDetalhe[]>();
    for (const s of saldos) {
      const variante = varMap.get(s.variante_id);
      const min = minimoEfetivo(s.estoque_minimo, variante?.estoque_minimo_padrao);
      const alerta = statusEstoque(s.quantidade, min) !== 'NORMAL';
      const arr = m.get(s.variante_id) ?? [];
      arr.push({ unidadeId: s.unidade_id, unidadeNome: uniMap.get(s.unidade_id)?.nome ?? '—', quantidade: s.quantidade, minimo: min, alerta });
      m.set(s.variante_id, arr);
    }
    return m;
  }, [saldos, varMap, uniMap]);

  const unidadeAggMap = useMemo(() => {
    const m = new Map<string, UnidadeAgg>();
    for (const s of saldos) {
      const agg = m.get(s.unidade_id) ?? { pecas: 0, itens: 0, valor: 0, alertas: 0 };
      const variante = varMap.get(s.variante_id);
      const min = minimoEfetivo(s.estoque_minimo, variante?.estoque_minimo_padrao);
      agg.pecas += s.quantidade;
      if (s.quantidade > 0) agg.itens += 1;
      agg.valor += s.quantidade * (variante?.custo_unitario ?? 0);
      if (statusEstoque(s.quantidade, min) !== 'NORMAL') agg.alertas += 1;
      m.set(s.unidade_id, agg);
    }
    return m;
  }, [saldos, varMap]);

  const varsDaUnidade = useMemo(() => {
    const m = new Map<string, VarNaUnidade[]>();
    for (const s of saldos) {
      if (s.quantidade <= 0) continue;
      const variante = varMap.get(s.variante_id);
      const min = minimoEfetivo(s.estoque_minimo, variante?.estoque_minimo_padrao);
      const arr = m.get(s.unidade_id) ?? [];
      arr.push({ varianteId: s.variante_id, nome: variante?.nome ?? 'Item', codigo: variante?.codigo_interno ?? '', quantidade: s.quantidade, alerta: statusEstoque(s.quantidade, min) !== 'NORMAL' });
      m.set(s.unidade_id, arr);
    }
    return m;
  }, [saldos, varMap]);

  // ── Contagens de vínculo ──
  const modelosPorCat = useMemo(() => {
    const m = new Map<string, ModeloRow[]>();
    for (const md of modelos) { const a = m.get(md.categoria_id) ?? []; a.push(md); m.set(md.categoria_id, a); }
    return m;
  }, [modelos]);
  const variantesPorModelo = useMemo(() => {
    const m = new Map<string, VarianteRow[]>();
    for (const v of variantes) { const a = m.get(v.modelo_id) ?? []; a.push(v); m.set(v.modelo_id, a); }
    return m;
  }, [variantes]);
  const variantesPorTamanho = useMemo(() => {
    const m = new Map<string, number>();
    for (const v of variantes) m.set(v.tamanho_id, (m.get(v.tamanho_id) ?? 0) + 1);
    return m;
  }, [variantes]);
  const variantesPorForn = useMemo(() => {
    const m = new Map<string, { total: number; ativas: number }>();
    for (const v of variantes) {
      if (!v.fornecedor_id) continue;
      const a = m.get(v.fornecedor_id) ?? { total: 0, ativas: 0 };
      a.total += 1; if (v.ativo) a.ativas += 1;
      m.set(v.fornecedor_id, a);
    }
    return m;
  }, [variantes]);

  const ctx = useMemo<MasterCtx>(() => ({
    categoriaNome: (id) => (id ? catMap.get(id)?.nome ?? '—' : '—'),
    modeloNome: (id) => (id ? modMap.get(id)?.nome ?? '—' : '—'),
    tamanhoLabel: (id) => { const t = id ? tamMap.get(id) : undefined; return t ? `${t.rotulo} · ${tipoTamLabel(t.tipo)}` : '—'; },
    empresaNome: (id) => (id ? empMap.get(id) ?? '—' : '—'),
    setorNome: (id) => (id ? setMap.get(id) ?? '—' : '—'),
    fornecedorNome: (id) => { const f = id ? fornMap.get(id) : undefined; return f ? (f.nome_fantasia || f.razao_social) : '—'; },
    unidadeNome: (id) => (id ? uniMap.get(id)?.nome ?? '—' : '—'),
    usuarioNome: (id) => (id ? usrMap.get(id) ?? '—' : '—'),

    saldoVariante: (v) => saldoTotalVar.get(v) ?? 0,
    saldoDetalheVariante: (v) => saldoDetVar.get(v) ?? [],
    alertaVariante: (v) => { const tot = saldoTotalVar.get(v) ?? 0; if (tot <= 0) return true; return (saldoDetVar.get(v) ?? []).some((s) => s.alerta); },
    custoVariante: (v) => varMap.get(v)?.custo_unitario ?? 0,

    modelosDaCategoria: (c) => modelosPorCat.get(c) ?? [],
    variantesAtivasDaCategoria: (c) => {
      const mods = new Set((modelosPorCat.get(c) ?? []).map((m) => m.id));
      return variantes.filter((v) => mods.has(v.modelo_id) && v.ativo).length;
    },
    variantesDoModelo: (m) => variantesPorModelo.get(m) ?? [],
    tamanhosDoModelo: (m) => {
      const rot = new Set<string>();
      for (const v of variantesPorModelo.get(m) ?? []) { const t = tamMap.get(v.tamanho_id); if (t) rot.add(t.rotulo); }
      return Array.from(rot);
    },
    variantesDoTamanho: (t) => variantesPorTamanho.get(t) ?? 0,
    variantesDoFornecedor: (f) => variantesPorForn.get(f) ?? { total: 0, ativas: 0 },

    unidadeAgg: (u) => unidadeAggMap.get(u) ?? { pecas: 0, itens: 0, valor: 0, alertas: 0 },
    variantesDaUnidade: (u) => varsDaUnidade.get(u) ?? [],

    categorias, modelos, tamanhos, variantes, unidades, fornecedores, empresas, setores,
  }), [catMap, modMap, tamMap, empMap, setMap, fornMap, uniMap, usrMap, varMap, saldoTotalVar, saldoDetVar,
    modelosPorCat, variantesPorModelo, variantesPorTamanho, variantesPorForn, unidadeAggMap, varsDaUnidade,
    categorias, modelos, tamanhos, variantes, unidades, fornecedores, empresas, setores]);

  const opcoes = useMemo<FormOpcoes>(() => ({
    categorias: categorias.filter((c) => c.ativo).map((c) => ({ id: c.id, nome: c.nome })),
    modelos: modelos.filter((m) => m.ativo).map((m) => ({ id: m.id, nome: m.nome })),
    tamanhos: tamanhos.filter((t) => t.ativo).map((t) => ({ id: t.id, nome: `${t.rotulo} (${tipoTamLabel(t.tipo)})` })),
    fornecedores: fornecedores.filter((f) => f.ativo).map((f) => ({ id: f.id, nome: f.nome_fantasia || f.razao_social })),
    empresas, setores,
  }), [categorias, modelos, tamanhos, fornecedores, empresas, setores]);

  const totais = useMemo(() => {
    const all = [...categorias, ...modelos, ...tamanhos, ...variantes, ...unidades, ...fornecedores];
    return { registros: all.length, ativos: all.filter((r) => r.ativo).length };
  }, [categorias, modelos, tamanhos, variantes, unidades, fornecedores]);

  return {
    loading, error, saving, atualizadoEm, refetch: fetchAll, ctx, opcoes, totais,
    criar: (key, valores) => run(() => criarCadastro(key, valores).then(() => undefined), 'Registro cadastrado.'),
    atualizar: (key, id, valores) => run(() => atualizarCadastro(key, id, valores), 'Registro atualizado.'),
    setAtivo: (key, id, ativo) => run(() => definirAtivoCadastro(key, id, ativo), ativo ? 'Registro reativado.' : 'Registro inativado.'),
    excluir: (key, id) => run(() => excluirCadastro(key, id), 'Registro excluído.'),
  };
}
