// Regras de dependência para exclusão de categoria — puras.
//
// A exclusão é SOFT (ativo=false), mas é BLOQUEADA quando há vínculos ATIVOS
// (funcionários, faixas ou fórmulas diretamente ligados). O histórico de
// resultados NÃO bloqueia (é exibido como impacto). Bases são apenas indiretas e
// não bloqueiam.
import type { CategoryUsage } from '../types/category.types';

export function hasActiveLinks(usage: CategoryUsage): boolean {
  return usage.funcionarios > 0 || usage.faixas > 0 || usage.formulas > 0;
}

/** Lista legível dos vínculos ativos que impedem a exclusão. */
export function activeLinkReasons(usage: CategoryUsage): string[] {
  const reasons: string[] = [];
  if (usage.funcionarios > 0) reasons.push('funcionarios');
  if (usage.faixas > 0) reasons.push('faixas');
  if (usage.formulas > 0) reasons.push('formulas');
  return reasons;
}
