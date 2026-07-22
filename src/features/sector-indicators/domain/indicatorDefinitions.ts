// Definição centralizada dos cinco indicadores de setor — fonte única.
//
// ⚠️ AUDITORIA DA DIREÇÃO DA META (ponto crítico do pedido):
// Apesar de os nomes "Identificação de Não Conformidades" e "Tratamento de Não
// Conformidades" sugerirem "quanto menor, melhor", o MOTOR DE PREMIAÇÃO trata os
// CINCO indicadores como "maior = melhor": calcula `min(realizado/meta, 1.0)`
// para cada um, inclusive os dois de NC (GerarPremiacoes.tsx:355-372, função
// `calcularMediaIndicador`). Ou seja, os valores persistidos já representam um
// grau de atingimento onde realizado alto (próximo/acima da meta) é bom. Por
// isso `direction` é 'higher_is_better' em todos — NÃO invertemos a semântica só
// pelo nome, o que divergiria do cálculo real da nota geral.
//
// Os campos não são configuráveis por setor: os cinco indicadores são FIXOS
// (colunas dedicadas na tabela `concremrh_indicadores_setor`).
import type { IndicatorId } from '../types/sector-indicators.types';

export interface IndicatorDefinition {
  id: IndicatorId;
  label: string;
  shortLabel: string;
  /** Direção da meta — auditada: todos "maior = melhor" (ver nota acima). */
  direction: 'higher_is_better';
  metaField: `${IndicatorId}_meta`;
  realizadoField: `${IndicatorId}_realizado`;
  percentualField: `${IndicatorId}_percentual`;
  /** Casas decimais para exibição do percentual. */
  precision: number;
  format: 'percentual';
  description: string;
}

export const INDICATOR_DEFINITIONS: readonly IndicatorDefinition[] = [
  {
    id: 'hora_maquina',
    label: 'Hora Máquina',
    shortLabel: 'H. Máquina',
    direction: 'higher_is_better',
    metaField: 'hora_maquina_meta',
    realizadoField: 'hora_maquina_realizado',
    percentualField: 'hora_maquina_percentual',
    precision: 1,
    format: 'percentual',
    description: 'Disponibilidade/utilização de hora máquina frente à meta do setor.',
  },
  {
    id: 'identificacao_nc',
    label: 'Identificação de Não Conformidades',
    shortLabel: 'Ident. NC',
    direction: 'higher_is_better',
    metaField: 'identificacao_nc_meta',
    realizadoField: 'identificacao_nc_realizado',
    percentualField: 'identificacao_nc_percentual',
    precision: 1,
    format: 'percentual',
    description: 'Grau de atingimento da meta de identificação de não conformidades.',
  },
  {
    id: 'limpeza',
    label: 'Limpeza',
    shortLabel: 'Limpeza',
    direction: 'higher_is_better',
    metaField: 'limpeza_meta',
    realizadoField: 'limpeza_realizado',
    percentualField: 'limpeza_percentual',
    precision: 1,
    format: 'percentual',
    description: 'Grau de atingimento da meta de limpeza e organização do setor.',
  },
  {
    id: 'tratamento_nc',
    label: 'Tratamento de Não Conformidades',
    shortLabel: 'Trat. NC',
    direction: 'higher_is_better',
    metaField: 'tratamento_nc_meta',
    realizadoField: 'tratamento_nc_realizado',
    percentualField: 'tratamento_nc_percentual',
    precision: 1,
    format: 'percentual',
    description: 'Grau de atingimento da meta de tratamento de não conformidades.',
  },
  {
    id: 'operacao_segura',
    label: 'Operação Segura',
    shortLabel: 'Op. Segura',
    direction: 'higher_is_better',
    metaField: 'operacao_segura_meta',
    realizadoField: 'operacao_segura_realizado',
    percentualField: 'operacao_segura_percentual',
    precision: 1,
    format: 'percentual',
    description: 'Grau de atingimento da meta de operação segura do setor.',
  },
] as const;

export const INDICATOR_IDS: readonly IndicatorId[] = INDICATOR_DEFINITIONS.map((d) => d.id);

export function getIndicatorDefinition(id: IndicatorId): IndicatorDefinition {
  const def = INDICATOR_DEFINITIONS.find((d) => d.id === id);
  if (!def) throw new Error(`Indicador desconhecido: ${id}`);
  return def;
}
