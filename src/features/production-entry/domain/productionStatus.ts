// Regras de SITUAÇÃO da produção por setor — função pura, fonte única.
//
// AUDITORIA (ProducaoSetor.tsx legado, linhas 740-742 e resumo 800-818):
//   percentual >= 100  → "Meta superada"   (success)
//   percentual >= 90    → "Próximo da meta" (warning)
//   percentual < 90     → "Abaixo da meta"  (destructive)
// O valor 100 é classificado como "superada" (não há um estado "Atingida"
// separado no domínio atual — não inventamos um novo limite). Um setor sem
// registro na competência é "pendente" (novo estado apenas para a apuração
// mensal — não altera a classificação de registros existentes).
import type { ProductionSituacao } from '../types/production-entry.types';

export const LIMITE_SUPERADA = 100;
export const LIMITE_PROXIMA = 90;

/**
 * Classifica um registro pelo percentual (realizado/meta*100).
 * `percentual` null (sem registro/meta) → 'pendente'.
 */
export function classifySituacao(percentual: number | null, temRegistro: boolean): ProductionSituacao {
  if (!temRegistro || percentual == null) return 'pendente';
  if (percentual >= LIMITE_SUPERADA) return 'superada';
  if (percentual >= LIMITE_PROXIMA) return 'proxima';
  return 'abaixo';
}

interface SituacaoMeta {
  label: string;
  variant: 'success' | 'warning' | 'danger' | 'neutral';
}

export const SITUACAO_META: Record<ProductionSituacao, SituacaoMeta> = {
  superada: { label: 'Meta superada', variant: 'success' },
  proxima: { label: 'Próximo da meta', variant: 'warning' },
  abaixo: { label: 'Abaixo da meta', variant: 'danger' },
  pendente: { label: 'Pendente', variant: 'neutral' },
};

export function situacaoLabel(s: ProductionSituacao): string {
  return SITUACAO_META[s].label;
}
