import type { Cargo } from '@/hooks/useCargos';
import type { FuncionarioSensivel } from '@/hooks/useFuncionariosSensivel';
import type { Enquadramento } from '../types/jobsSalaries.types';
import {
  type Avail,
  availValue,
  availUnset,
  availUnavailable,
  availRestricted,
  averageAvail,
  medianAvail,
  sumAvail,
} from './dataAvailability';

/**
 * Métricas de remuneração — SEMPRE agregadas (nunca expõem salário individual)
 * e SEMPRE guardadas por autorização. Sem autorização, todo agregado é
 * `restricted`. Autorizado mas sem salários cadastrados → `unset` (não 0).
 *
 * A fonte de salário é a VIEW guardada `concremrh_funcionarios_sensivel`
 * (`salario` = null quando não autorizado NO BACKEND). A autorização aqui é
 * uma segunda barreira de UI; a autoridade final é o servidor.
 */
export interface CompensationMetrics {
  autorizado: boolean;
  colaboradoresComSalario: number;
  massaSalarial: Avail<number>;
  mediaSalarial: Avail<number>;
  medianaSalarial: Avail<number>;
  menorSalario: Avail<number>;
  maiorSalario: Avail<number>;
}

export function calcularRemuneracao(
  colaboradores: FuncionarioSensivel[],
  autorizado: boolean,
): CompensationMetrics {
  const ativos = colaboradores.filter((c) => c.ativo !== false);
  const salarios = ativos.map((c) => c.salario);
  const presentes = salarios.filter((s): s is number => typeof s === 'number' && Number.isFinite(s));

  const menor: Avail<number> = !autorizado
    ? availRestricted()
    : presentes.length === 0
      ? availUnset()
      : availValue(Math.min(...presentes));
  const maior: Avail<number> = !autorizado
    ? availRestricted()
    : presentes.length === 0
      ? availUnset()
      : availValue(Math.max(...presentes));

  return {
    autorizado,
    colaboradoresComSalario: presentes.length,
    massaSalarial: sumAvail(salarios, autorizado),
    mediaSalarial: averageAvail(salarios, autorizado),
    medianaSalarial: medianAvail(salarios, autorizado),
    menorSalario: menor,
    maiorSalario: maior,
  };
}

export interface PosicionamentoFaixa {
  cargoId: string;
  cargoNome: string;
  faixaMin: number;
  faixaMax: number;
  /** Compa-ratio médio dos ocupantes (salário / ponto médio da faixa). */
  compaRatio: Avail<number>;
  ocupantesComSalario: number;
  abaixoDaFaixa: number;
  acimaDaFaixa: number;
}

/**
 * Posicionamento salarial vs. faixa do cargo (compa-ratio). Só é calculável
 * quando o cargo tem faixa (mín/máx) E há ocupantes com salário conhecido E o
 * usuário está autorizado. Caso contrário retorna lista vazia com o motivo via
 * `motivoIndisponivel`.
 */
export interface PosicionamentoResultado {
  disponivel: boolean;
  motivoIndisponivel: string | null;
  itens: PosicionamentoFaixa[];
}

export function calcularPosicionamento(
  cargos: Cargo[],
  colaboradores: FuncionarioSensivel[],
  enquadramentos: Map<string, Enquadramento>,
  autorizado: boolean,
): PosicionamentoResultado {
  if (!autorizado) {
    return { disponivel: false, motivoIndisponivel: 'Acesso restrito à remuneração.', itens: [] };
  }
  const cargosComFaixa = cargos.filter(
    (c) => typeof c.salario_minimo === 'number' && typeof c.salario_maximo === 'number' && c.salario_maximo! > 0,
  );
  if (cargosComFaixa.length === 0) {
    return {
      disponivel: false,
      motivoIndisponivel: 'Nenhum cargo possui faixa salarial (mínimo e máximo) cadastrada.',
      itens: [],
    };
  }

  const salarioPorFunc = new Map(colaboradores.map((c) => [c.id, c.salario]));
  // Agrupa ocupantes por cargo via enquadramento.
  const ocupantesPorCargo = new Map<string, number[]>();
  for (const e of enquadramentos.values()) {
    if (!e.cargoId) continue;
    const sal = salarioPorFunc.get(e.funcionarioId);
    if (typeof sal !== 'number' || !Number.isFinite(sal)) continue;
    const arr = ocupantesPorCargo.get(e.cargoId) ?? [];
    arr.push(sal);
    ocupantesPorCargo.set(e.cargoId, arr);
  }

  const itens: PosicionamentoFaixa[] = cargosComFaixa.map((c) => {
    const min = c.salario_minimo!;
    const max = c.salario_maximo!;
    const pontoMedio = (min + max) / 2;
    const sals = ocupantesPorCargo.get(c.id) ?? [];
    const compa: Avail<number> = sals.length === 0 || pontoMedio <= 0
      ? availUnset()
      : availValue(sals.reduce((acc, s) => acc + s / pontoMedio, 0) / sals.length);
    return {
      cargoId: c.id,
      cargoNome: c.nome,
      faixaMin: min,
      faixaMax: max,
      compaRatio: compa,
      ocupantesComSalario: sals.length,
      abaixoDaFaixa: sals.filter((s) => s < min).length,
      acimaDaFaixa: sals.filter((s) => s > max).length,
    };
  });

  const temOcupantes = itens.some((i) => i.ocupantesComSalario > 0);
  if (!temOcupantes) {
    return {
      disponivel: false,
      motivoIndisponivel: 'Há faixas cadastradas, mas nenhum colaborador enquadrado com salário conhecido.',
      itens,
    };
  }

  return { disponivel: true, motivoIndisponivel: null, itens };
}

/**
 * Compressão salarial entre níveis adjacentes: só é calculável com faixas E
 * níveis definidos. Retorna indisponibilidade explícita caso contrário.
 */
export interface CompressaoResultado {
  disponivel: boolean;
  motivoIndisponivel: string | null;
  compressaoMedia: Avail<number>;
}

export function calcularCompressao(cargos: Cargo[], autorizado: boolean): CompressaoResultado {
  if (!autorizado) {
    return { disponivel: false, motivoIndisponivel: 'Acesso restrito à remuneração.', compressaoMedia: availRestricted() };
  }
  const comFaixaENivel = cargos.filter(
    (c) =>
      typeof c.salario_minimo === 'number' &&
      typeof c.salario_maximo === 'number' &&
      c.nivel_hierarquico != null &&
      String(c.nivel_hierarquico).trim() !== '',
  );
  if (comFaixaENivel.length < 2) {
    return {
      disponivel: false,
      motivoIndisponivel: 'É necessário ter pelo menos dois cargos com faixa salarial e nível hierárquico definidos.',
      compressaoMedia: availUnavailable(),
    };
  }
  // Ponto médio por nível.
  const porNivel = new Map<string, number[]>();
  for (const c of comFaixaENivel) {
    const k = String(c.nivel_hierarquico).trim();
    const pm = (c.salario_minimo! + c.salario_maximo!) / 2;
    const arr = porNivel.get(k) ?? [];
    arr.push(pm);
    porNivel.set(k, arr);
  }
  const niveisOrdenados = Array.from(porNivel.entries())
    .map(([nivel, pms]) => ({ nivel, media: pms.reduce((a, b) => a + b, 0) / pms.length }))
    .sort((a, b) => a.nivel.localeCompare(b.nivel, 'pt-BR', { numeric: true }));

  if (niveisOrdenados.length < 2) {
    return {
      disponivel: false,
      motivoIndisponivel: 'É necessário ter cargos em pelo menos dois níveis distintos.',
      compressaoMedia: availUnavailable(),
    };
  }

  const razoes: number[] = [];
  for (let i = 1; i < niveisOrdenados.length; i++) {
    const inf = niveisOrdenados[i - 1].media;
    const sup = niveisOrdenados[i].media;
    if (inf > 0) razoes.push(sup / inf);
  }
  if (razoes.length === 0) {
    return { disponivel: false, motivoIndisponivel: 'Dados insuficientes para calcular compressão.', compressaoMedia: availUnavailable() };
  }
  return {
    disponivel: true,
    motivoIndisponivel: null,
    compressaoMedia: availValue(razoes.reduce((a, b) => a + b, 0) / razoes.length),
  };
}
