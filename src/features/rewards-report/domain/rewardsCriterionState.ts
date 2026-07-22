// Classificação centralizada do estado de uma célula de critério — puro.
// Desambigua o "—" legado: valor / não aplicável / sem dado. Regras EXPLÍCITAS.
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
import type { CriterionKey, CriterionState } from '../types/rewards-report.types';

interface Def { key: CriterionKey; label: string; field: keyof ResultadoPremiacao; optional: boolean }

// `optional: true` → a ausência (null) significa "não aplicável" (o critério não
// entra no cálculo deste funcionário: produção só para bases de produção;
// faturamento/indicadores só para supervisor/encarregado em produção).
// `optional: false` → o critério é sempre calculado (nota nunca deveria faltar).
export const CRITERION_DEFS: readonly Def[] = [
  { key: 'producao', label: 'Produção', field: 'nota_producao', optional: true },
  { key: 'epi', label: 'EPI', field: 'nota_epi', optional: false },
  { key: 'faltas', label: 'Faltas', field: 'nota_faltas', optional: false },
  { key: 'advertencias', label: 'Advertências', field: 'nota_advertencias', optional: false },
  { key: 'dss', label: 'DSS', field: 'nota_dss', optional: false },
  { key: 'faturamento', label: 'Faturamento', field: 'nota_faturamento', optional: true },
  { key: 'itens_nc', label: 'Identificação de NC', field: 'nota_itens_nc', optional: true },
  { key: 'tratamento_nc', label: 'Tratamento de NC', field: 'nota_tratamento_nc', optional: true },
  { key: 'hora_maquina', label: 'Hora Máquina', field: 'nota_hora_maquina', optional: true },
  { key: 'operacao_segura', label: 'Operação Segura', field: 'nota_operacao_segura', optional: true },
  { key: 'limpeza', label: 'Limpeza', field: 'nota_limpeza', optional: true },
];

const toneFor = (v: number): CriterionState['tone'] => (v >= 1 ? 'ok' : v >= 0.9 ? 'atencao' : 'impacto');

export function classifyCriterion(r: ResultadoPremiacao, def: Def): CriterionState {
  const raw = r[def.field] as number | null | undefined;

  if (raw == null) {
    if (def.optional) {
      return { kind: 'nao_aplicavel', value: null, label: 'N/A', tone: 'neutro', tooltip: `${def.label} não faz parte do cálculo deste funcionário.` };
    }
    return { kind: 'sem_dado', value: null, label: 'Sem dado', tone: 'neutro', tooltip: `${def.label} sem valor calculado neste resultado.` };
  }
  if (Number.isNaN(raw)) {
    return { kind: 'erro', value: null, label: 'Erro', tone: 'impacto', tooltip: `${def.label} com valor inválido.` };
  }
  // Nota 1,0 pode indicar ausência de medição (regra do motor: sem dado → 1,0 neutro).
  const tip = raw === 1
    ? `${def.label}: 100% (nota máxima; 1,0 também ocorre na ausência de medição — neutro).`
    : `${def.label}: nota ${(raw * 100).toFixed(1)}%.`;
  return { kind: 'valor', value: raw, label: '', tone: toneFor(raw), tooltip: tip };
}

export function classifyByKey(r: ResultadoPremiacao, key: CriterionKey): CriterionState {
  const def = CRITERION_DEFS.find(d => d.key === key)!;
  return classifyCriterion(r, def);
}
