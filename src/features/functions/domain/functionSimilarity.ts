// Detecção OBSERVACIONAL de nomes semelhantes entre funções. Determinística, sem
// IA. NÃO afirma duplicidade nem altera dados — apenas sinaliza "possível
// correspondência" para revisão humana.
//
// Estratégia (do sinal mais forte ao mais fraco):
//   1. mesma chave de comparação (ignora caixa/acento/separador) → alta confiança;
//   2. mesmos tokens em ordem diferente → alta confiança;
//   3. similaridade textual alta (Levenshtein) dentro do mesmo 1º token → média.
// Grupos = componentes conexos das correspondências (union-find).
import {
  comparisonKey, tokenKey, similarityRatio, stripAccents, collapseSpaces,
} from './functionNameNormalization';
import type {
  SimilarityMatch, SimilarityGroup, SimilarityType, SimilarityConfidence,
} from '../types/function.types';

export interface SimNameItem { id: string; nome: string }
export interface SimUsageLookup { (id: string): { funcionarios: number; setores: number } }

const SEPARATORS_RE = /[-–—:/|]+/g;
const FUZZY_THRESHOLD = 0.86;

const sepNorm = (s: string) => (s ?? '').replace(SEPARATORS_RE, ' ');
const keyKeepAccent = (s: string) => collapseSpaces(sepNorm(s).toLowerCase());          // ignora caixa+separador
const keyKeepCase = (s: string) => collapseSpaces(stripAccents(sepNorm(s)));            // ignora acento+separador
const keyKeepSep = (s: string) => collapseSpaces(stripAccents(s.toLowerCase()));        // ignora acento+caixa

interface PairClass { type: SimilarityType; confidence: SimilarityConfidence; diffs: string[] }

/** Diferenças concretas entre dois nomes com a MESMA chave de comparação. */
function keyEqualDiffs(a: string, b: string): string[] {
  if (a === b) return ['Nome idêntico'];
  const diffs: string[] = [];
  if (keyKeepAccent(a) !== keyKeepAccent(b)) diffs.push('Acentuação');
  if (keyKeepCase(a) !== keyKeepCase(b)) diffs.push('Caixa (maiúsc./minúsc.)');
  if (keyKeepSep(a) !== keyKeepSep(b)) diffs.push('Separador');
  return diffs.length ? diffs : ['Formatação'];
}

/** Classifica o par (a, b) ou retorna null se não forem semelhantes. */
export function classifyPair(a: string, b: string): PairClass | null {
  if (comparisonKey(a) === comparisonKey(b)) {
    const diffs = keyEqualDiffs(a, b);
    let type: SimilarityType = 'normalization_difference';
    if (diffs.length === 1) {
      if (diffs[0] === 'Acentuação') type = 'accent_difference';
      else if (diffs[0] === 'Caixa (maiúsc./minúsc.)') type = 'case_difference';
      else if (diffs[0] === 'Separador') type = 'separator_difference';
    }
    return { type, confidence: 'high', diffs };
  }
  if (tokenKey(a) && tokenKey(a) === tokenKey(b)) {
    return { type: 'token_equivalent', confidence: 'high', diffs: ['Ordem/composição das palavras'] };
  }
  if (similarityRatio(comparisonKey(a), comparisonKey(b)) >= FUZZY_THRESHOLD) {
    return { type: 'similar_name', confidence: 'medium', diffs: ['Nomes muito semelhantes'] };
  }
  return null;
}

const firstToken = (nome: string) => comparisonKey(nome).split(' ')[0] ?? '';

/**
 * Constrói as correspondências por função. Evita O(n²) global: compara apenas
 * dentro do mesmo primeiro token normalizado (barato e cobre os casos reais).
 */
export function buildSimilarityMatches(items: SimNameItem[], usage: SimUsageLookup): Map<string, SimilarityMatch[]> {
  const result = new Map<string, SimilarityMatch[]>();
  const buckets = new Map<string, SimNameItem[]>();
  for (const it of items) {
    const b = firstToken(it.nome);
    if (!b) continue;
    if (!buckets.has(b)) buckets.set(b, []);
    buckets.get(b)!.push(it);
  }

  const push = (from: SimNameItem, to: SimNameItem, cls: PairClass) => {
    if (!result.has(from.id)) result.set(from.id, []);
    result.get(from.id)!.push({
      targetId: to.id, targetNome: to.nome, targetFuncionarios: usage(to.id).funcionarios,
      type: cls.type, confidence: cls.confidence, diffs: cls.diffs,
    });
  };

  for (const group of buckets.values()) {
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const cls = classifyPair(group[i].nome, group[j].nome);
        if (!cls) continue;
        push(group[i], group[j], cls);
        push(group[j], group[i], cls);
      }
    }
  }
  return result;
}

/** Union-find simples para agrupar componentes conexos. */
class DSU {
  private parent = new Map<string, string>();
  find(x: string): string {
    if (!this.parent.has(x)) this.parent.set(x, x);
    let root = x;
    while (this.parent.get(root) !== root) root = this.parent.get(root)!;
    this.parent.set(x, root);
    return root;
  }
  union(a: string, b: string) { this.parent.set(this.find(a), this.find(b)); }
}

/** Agrupa funções semelhantes (componentes conexos). Grupos com ≥ 2 membros. */
export function buildSimilarityGroups(items: SimNameItem[], usage: SimUsageLookup): SimilarityGroup[] {
  const matches = buildSimilarityMatches(items, usage);
  const byId = new Map(items.map(it => [it.id, it]));
  const dsu = new DSU();
  for (const it of items) dsu.find(it.id);
  const pairDiffs = new Map<string, { diffs: Set<string>; confidence: SimilarityConfidence }>();

  for (const [fromId, list] of matches) {
    for (const m of list) {
      dsu.union(fromId, m.targetId);
      const k = [fromId, m.targetId].sort().join('|');
      if (!pairDiffs.has(k)) pairDiffs.set(k, { diffs: new Set(), confidence: m.confidence });
      const entry = pairDiffs.get(k)!;
      m.diffs.forEach(d => entry.diffs.add(d));
      if (m.confidence === 'medium') entry.confidence = 'medium';
    }
  }

  const comps = new Map<string, string[]>();
  for (const it of items) {
    if (!matches.has(it.id)) continue;
    const root = dsu.find(it.id);
    if (!comps.has(root)) comps.set(root, []);
    comps.get(root)!.push(it.id);
  }

  const groups: SimilarityGroup[] = [];
  for (const [root, ids] of comps) {
    if (ids.length < 2) continue;
    const diffs = new Set<string>();
    let confidence: SimilarityConfidence = 'high';
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const entry = pairDiffs.get([ids[i], ids[j]].sort().join('|'));
        if (!entry) continue;
        entry.diffs.forEach(d => diffs.add(d));
        if (entry.confidence === 'medium') confidence = 'medium';
      }
    }
    const members = ids
      .map(id => {
        const it = byId.get(id)!;
        const u = usage(id);
        return { id, nome: it.nome, funcionarios: u.funcionarios, setores: u.setores };
      })
      .sort((a, b) => b.funcionarios - a.funcionarios || a.nome.localeCompare(b.nome, 'pt-BR'));
    groups.push({ key: root, confidence, diffs: Array.from(diffs), members });
  }

  // Ordena: mais membros, depois mais funcionários totais.
  return groups.sort((a, b) =>
    b.members.length - a.members.length ||
    b.members.reduce((s, m) => s + m.funcionarios, 0) - a.members.reduce((s, m) => s + m.funcionarios, 0),
  );
}
