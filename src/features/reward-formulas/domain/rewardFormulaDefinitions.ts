// Definição centralizada dos critérios (pesos) da fórmula. Ordem e rótulos da UI.
// Chaves = colunas reais de `concremrh_formulas_calculo`. NÃO inventar critérios.
//
// AUDITORIA — quais critérios o motor efetivamente usa depende do MODO:
//   - Produção (não supervisor): produção, epi, dss, faltas, advertências (5).
//   - KITS (não supervisor): epi, dss, faltas, advertências (4).
//   - Supervisor/Encarregado em Produção: os 11 critérios.
// Os pesos são armazenados em 0–100 e o motor divide por 100. `multiplicador_kits`
// é DECORATIVO aqui: o motor usa o multiplicador extraído do NOME da base
// (extractKitsMultiplier), não este campo.

export type WeightKey =
  | 'peso_producao_setor' | 'peso_faturamento' | 'peso_epi' | 'peso_faltas' | 'peso_dss'
  | 'peso_itens_nc' | 'peso_advertencias' | 'peso_tratamento_nc' | 'peso_hora_maquina'
  | 'peso_operacao_segura' | 'peso_limpeza';

export interface CriterioDef { key: WeightKey; label: string; short: string }

export const CRITERIOS: CriterioDef[] = [
  { key: 'peso_producao_setor', label: 'Produção do Setor', short: 'Produção' },
  { key: 'peso_faturamento', label: 'Faturamento', short: 'Faturamento' },
  { key: 'peso_epi', label: 'EPI', short: 'EPI' },
  { key: 'peso_faltas', label: 'Faltas', short: 'Faltas' },
  { key: 'peso_dss', label: 'DSS', short: 'DSS' },
  { key: 'peso_itens_nc', label: 'Itens Não Conformes', short: 'Itens NC' },
  { key: 'peso_advertencias', label: 'Advertências', short: 'Advertências' },
  { key: 'peso_tratamento_nc', label: 'Tratamento NC', short: 'Tratamento NC' },
  { key: 'peso_hora_maquina', label: 'Hora Máquina', short: 'Hora Máq.' },
  { key: 'peso_operacao_segura', label: 'Operação Segura', short: 'Op. Segura' },
  { key: 'peso_limpeza', label: 'Limpeza', short: 'Limpeza' },
];

export const CRITERIO_LABEL: Record<WeightKey, string> = Object.fromEntries(
  CRITERIOS.map(c => [c.key, c.label]),
) as Record<WeightKey, string>;

/** Multiplicadores de kit oferecidos pelo cadastro legado (campo decorativo). */
export const KIT_MULTIPLIERS = [0.25, 0.5, 0.75, 1, 2];
