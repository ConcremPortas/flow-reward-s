// Permissões derivadas por estado + utilização — PURO.
//
// Regra: apenas configurações PROGRAMADAS e NÃO UTILIZADAS podem ser editadas ou
// excluídas. Atual/histórica ou utilizada → protegida (criar nova vigência).
import type { KitsConfigStateKind, KitsConfigUsage } from '../types/kits-config.types';

export function canEditConfig(state: KitsConfigStateKind, usage: KitsConfigUsage): boolean {
  return state === 'programada' && !usage.utilizada;
}

export function canDeleteConfig(state: KitsConfigStateKind, usage: KitsConfigUsage): boolean {
  return state === 'programada' && !usage.utilizada;
}

export function protectionReason(state: KitsConfigStateKind, usage: KitsConfigUsage): string | null {
  if (canEditConfig(state, usage)) return null;
  if (usage.utilizada) return 'Esta configuração já foi utilizada em processamentos. Para alterar a regra, crie uma nova vigência.';
  if (state === 'atual') return 'Esta é a configuração vigente. Para alterar a regra, crie uma nova vigência.';
  return 'Configuração histórica protegida. Para alterar a regra, crie uma nova vigência.';
}
