import type { StatusVariant } from '@/components/app/StatusBadge';
import type { FardamentoRow } from '../../types/db.types';

/**
 * Situação da LINHA (variante) — agregação das situações por-unidade já existentes
 * (statusEstoque: NORMAL/ALERTA/SEM_ESTOQUE) + o flag ativo. NÃO introduz regra de
 * negócio nova: apenas resume o estado por-unidade para exibição.
 *   INATIVO      → variante inativa
 *   SEM_ESTOQUE  → saldo total zerado
 *   CRITICO      → há ruptura (alguma unidade zerada) embora ainda haja saldo total
 *   ATENCAO      → alguma unidade no/abaixo do mínimo (emAlerta)
 *   NORMAL       → demais
 */
export type Situacao = 'INATIVO' | 'SEM_ESTOQUE' | 'CRITICO' | 'ATENCAO' | 'NORMAL';

export function situacaoDaLinha(f: FardamentoRow): Situacao {
  if (f.variante.ativo === false) return 'INATIVO';
  if (f.saldoTotal <= 0) return 'SEM_ESTOQUE';
  if (f.saldos.some((s) => s.status === 'SEM_ESTOQUE')) return 'CRITICO';
  if (f.emAlerta) return 'ATENCAO';
  return 'NORMAL';
}

export const SITUACAO_LABEL: Record<Situacao, string> = {
  INATIVO: 'Inativo', SEM_ESTOQUE: 'Sem estoque', CRITICO: 'Crítico', ATENCAO: 'Atenção', NORMAL: 'Normal',
};

export const SITUACAO_VARIANT: Record<Situacao, StatusVariant> = {
  INATIVO: 'neutral', SEM_ESTOQUE: 'danger', CRITICO: 'danger', ATENCAO: 'warning', NORMAL: 'success',
};

export const SITUACOES: Situacao[] = ['NORMAL', 'ATENCAO', 'CRITICO', 'SEM_ESTOQUE', 'INATIVO'];
