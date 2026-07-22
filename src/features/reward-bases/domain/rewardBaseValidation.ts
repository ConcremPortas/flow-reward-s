// Validação e normalização para duplicidade de base — pura.
//
// Percentual PODE ultrapassar 100% (existe "KIT 200%") — não impor teto. Zero é
// permitido. Duplicidade normaliza apenas caixa e espaços (sem fuzzy).
import type { RewardBaseTipo } from '../types/reward-base.types';

export function normalizeForDuplicate(nome: string | null | undefined): string {
  return (nome ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

export function toPersistedName(nome: string): string {
  return (nome ?? '').trim();
}

export function isValidBaseName(nome: string): boolean {
  return toPersistedName(nome).length > 0;
}

/** Parâmetro válido: número finito ≥ 0. Sem teto (percentual > 100% é legítimo). */
export function isValidBaseParameter(valor: number | null | undefined, _tipo: RewardBaseTipo): boolean {
  return valor != null && Number.isFinite(valor) && valor >= 0;
}
