// Regras de SITUAÇÃO e ESTADO das células — fonte única, puras.
//
// AUDITORIA: a tela legada classificava por percentual (exibido em %):
//   >= 100 → superada (success) · >= 95 → atenção (warning) · < 95 → abaixo.
// A apuração de PRODUÇÃO usa o limite de atenção em 90. Para NÃO introduzir uma
// regra nova sem base, mantemos os limites da própria tela de indicadores:
// atingido >= 100, atenção >= 95, abaixo < 95. Um setor sem dados na competência
// é "pendente"; um setor marcado "sem medição" (todos os pares 1/1) tem estado
// próprio 'sem_medicao' — não pintamos como atingido para não sugerir medição.
import type { CellState, IndicatorSituacao } from '../types/sector-indicators.types';

export const LIMITE_ATINGIDO = 100;
export const LIMITE_ATENCAO = 95;

/** Estado de uma célula de indicador pelo percentual (escala 0-100). */
export function classifyCellState(
  percentual: number | null,
  opts: { hasData: boolean; semMedicao: boolean },
): CellState {
  if (opts.semMedicao) return 'sem_medicao';
  if (!opts.hasData || percentual == null) return 'pendente';
  if (percentual >= LIMITE_ATINGIDO) return 'atingido';
  if (percentual >= LIMITE_ATENCAO) return 'atencao';
  return 'abaixo';
}

/** Situação consolidada do setor pela média de exibição dos percentuais. */
export function classifySectorSituacao(
  media: number | null,
  opts: { temDados: boolean; semMedicao: boolean },
): IndicatorSituacao {
  if (opts.semMedicao) return 'sem_medicao';
  if (!opts.temDados || media == null) return 'pendente';
  if (media >= LIMITE_ATINGIDO) return 'superada';
  if (media >= LIMITE_ATENCAO) return 'proxima';
  return 'abaixo';
}

interface StateMeta {
  label: string;
  variant: 'success' | 'warning' | 'danger' | 'neutral';
  /** Classe de fundo suave (heatmap) da célula. */
  heatmap: string;
  /** Classe do ponto de status (cor sólida) — literal para o scanner do Tailwind. */
  dot: string;
}

export const CELL_STATE_META: Record<CellState, StateMeta> = {
  atingido: { label: 'Atingido', variant: 'success', heatmap: 'bg-success/10 text-success', dot: 'bg-success' },
  atencao: { label: 'Atenção', variant: 'warning', heatmap: 'bg-status-warning/10 text-status-warning', dot: 'bg-status-warning' },
  abaixo: { label: 'Abaixo', variant: 'danger', heatmap: 'bg-destructive/10 text-destructive', dot: 'bg-destructive' },
  sem_medicao: { label: 'Sem medição', variant: 'neutral', heatmap: 'bg-muted/40 text-muted-foreground', dot: 'bg-muted-foreground/50' },
  pendente: { label: 'Pendente', variant: 'neutral', heatmap: 'bg-transparent text-muted-foreground/60', dot: 'bg-muted-foreground/30' },
};

export const SITUACAO_META: Record<IndicatorSituacao, { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  superada: { label: 'Meta atingida', variant: 'success' },
  proxima: { label: 'Em atenção', variant: 'warning' },
  abaixo: { label: 'Abaixo da meta', variant: 'danger' },
  sem_medicao: { label: 'Sem medição', variant: 'neutral' },
  pendente: { label: 'Pendente', variant: 'neutral' },
};

export function situacaoLabel(s: IndicatorSituacao): string {
  return SITUACAO_META[s].label;
}
