import type { Funcao } from '@/hooks/useFuncoes';
import type { Cargo } from '@/hooks/useCargos';
import type { FuncionarioSensivel } from '@/hooks/useFuncionariosSensivel';

const normalizar = (s: string | null | undefined): string =>
  (s ?? '').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').trim();

export interface FuncaoAnalise {
  funcaoId: string;
  funcaoNome: string;
  colaboradores: number;
  /** Cargo de nome equivalente (observacional). Sugestão de revisão — NUNCA aplicada. */
  cargoEquivalenteId: string | null;
  cargoEquivalenteNome: string | null;
}

export interface FuncaoMappingResumo {
  funcoesDistintas: number;
  funcoesComColaboradores: number;
  funcoesSemColaboradores: number;
  colaboradoresComFuncao: number;
  itens: FuncaoAnalise[];
}

/**
 * Diagnóstico das FUNÇÕES atuais para apoiar a implantação de cargos. Mede
 * quantos colaboradores existem por função e sugere (por semelhança textual de
 * nome) um cargo equivalente — para REVISÃO manual. NÃO converte função em
 * cargo, não altera dados. Função pura sobre dados carregados em lote.
 */
export function analisarFuncoes(
  funcoes: Funcao[],
  colaboradores: FuncionarioSensivel[],
  cargos: Cargo[],
): FuncaoMappingResumo {
  const ativos = colaboradores.filter((c) => c.ativo !== false);
  const contagem = new Map<string, number>();
  for (const c of ativos) {
    if (!c.funcao_id) continue;
    contagem.set(c.funcao_id, (contagem.get(c.funcao_id) ?? 0) + 1);
  }

  const cargoPorNome = new Map(cargos.map((c) => [normalizar(c.nome), c]));

  const itens: FuncaoAnalise[] = funcoes
    .map((f) => {
      const equivalente = cargoPorNome.get(normalizar(f.nome)) ?? null;
      return {
        funcaoId: f.id,
        funcaoNome: f.nome,
        colaboradores: contagem.get(f.id) ?? 0,
        cargoEquivalenteId: equivalente?.id ?? null,
        cargoEquivalenteNome: equivalente?.nome ?? null,
      };
    })
    .sort((a, b) => b.colaboradores - a.colaboradores || a.funcaoNome.localeCompare(b.funcaoNome, 'pt-BR'));

  return {
    funcoesDistintas: funcoes.length,
    funcoesComColaboradores: itens.filter((i) => i.colaboradores > 0).length,
    funcoesSemColaboradores: itens.filter((i) => i.colaboradores === 0).length,
    colaboradoresComFuncao: ativos.filter((c) => c.funcao_id != null).length,
    itens,
  };
}
