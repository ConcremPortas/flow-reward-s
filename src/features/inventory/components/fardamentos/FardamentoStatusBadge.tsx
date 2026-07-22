import { StatusBadge } from '@/components/app/StatusBadge';
import { SITUACAO_LABEL, SITUACAO_VARIANT, type Situacao } from './situacao';

/** Selo de situação da linha, derivado das regras por-unidade. Texto + cor (não só cor). */
export function FardamentoStatusBadge({ situacao }: { situacao: Situacao }) {
  return <StatusBadge variant={SITUACAO_VARIANT[situacao]}>{SITUACAO_LABEL[situacao]}</StatusBadge>;
}
