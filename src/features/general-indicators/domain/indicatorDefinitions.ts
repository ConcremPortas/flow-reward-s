// Definição centralizada dos indicadores gerais — orientada pelo CÓDIGO do tipo.
//
// AUDITORIA: os tipos de indicador são CADASTRÁVEIS (tabela
// `concremrh_tipos_indicadores_gerais`, seed inicial: FAT e KITS). Por isso a
// definição de formatação/direção é resolvida pelo `codigo`, com um fallback
// seguro para códigos ainda não mapeados. NÃO assumimos que futuros indicadores
// sejam "maior = melhor": o fallback é documentado e a direção é uma propriedade
// explícita, de modo que um novo indicador possa declarar 'lower_is_better'.
//
// Relação com premiação (não alterar): FAT é lido via `percentual` armazenado
// (notaFaturamento = percentual/100); KITS é lido via `realizado`
// (calcularComissao(realizado, config)). Ambos "maior = melhor".
import type { IndicatorDirection, IndicatorFormat } from '../types/general-indicators.types';

export interface IndicatorDefinition {
  code: string;
  label: string;
  shortLabel: string;
  format: IndicatorFormat;
  unit: string;
  precision: number;
  direction: IndicatorDirection;
  description: string;
}

const DEFINITIONS_BY_CODE: Record<string, IndicatorDefinition> = {
  FAT: {
    code: 'FAT',
    label: 'Faturamento',
    shortLabel: 'Faturamento',
    format: 'currency',
    unit: 'BRL',
    precision: 2,
    direction: 'higher_is_better',
    description: 'Faturamento mensal da empresa.',
  },
  KITS: {
    code: 'KITS',
    label: 'Quantidade de Kits',
    shortLabel: 'Kits',
    format: 'integer',
    unit: 'kits',
    precision: 0,
    direction: 'higher_is_better',
    description: 'Quantidade de kits produzidos/vendidos.',
  },
};

/**
 * Fallback para códigos não mapeados: formato decimal, sem unidade, direção
 * "maior = melhor" (default pragmático — a maioria dos indicadores de meta é
 * assim; um indicador "menor = melhor" deve ser mapeado explicitamente aqui).
 */
function fallbackDefinition(codigo: string, nome: string): IndicatorDefinition {
  return {
    code: codigo,
    label: nome || codigo,
    shortLabel: nome || codigo,
    format: 'decimal',
    unit: '',
    precision: 2,
    direction: 'higher_is_better',
    description: nome || codigo,
  };
}

/** Resolve a definição de um tipo de indicador pelo código (com fallback). */
export function resolveIndicatorDefinition(codigo: string | null | undefined, nome = ''): IndicatorDefinition {
  const code = (codigo ?? '').toUpperCase();
  const known = DEFINITIONS_BY_CODE[code];
  if (known) return nome ? { ...known, label: known.label, description: known.description } : known;
  return fallbackDefinition(code || 'N/D', nome);
}

export function hasKnownDefinition(codigo: string | null | undefined): boolean {
  return !!DEFINITIONS_BY_CODE[(codigo ?? '').toUpperCase()];
}
