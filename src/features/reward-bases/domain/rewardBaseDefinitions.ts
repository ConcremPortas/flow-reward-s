// Comportamento da base NO MOTOR — derivado do NOME. Reutiliza as funções PURAS
// do motor (`src/domain/premiacao/calculoPremiacao.ts`) SEM alterá-lo, garantindo
// que a exibição observacional bata exatamente com o cálculo real.
//
// Auditoria: o motor não usa `tipo`/`valor_base`; deriva tudo do nome:
//   isKitsBase = startsWith('KIT'); isProducaoBase = includes('PRODUCAO');
//   extractKitsMultiplier = /(\d+)%/ → multiplicador (bonusBase = valorKits × mult).
import { isKitsBase, isProducaoBase, extractKitsMultiplier } from '@/domain/premiacao/calculoPremiacao';
import { formatPercentBR } from '@/lib/formatters';
import type { EngineBehaviorInfo } from '../types/reward-base.types';

export function deriveEngineBehavior(nome: string): EngineBehaviorInfo {
  if (isProducaoBase(nome)) {
    return { behavior: 'producao', multiplicador: 1, label: 'Produção' };
  }
  if (isKitsBase(nome)) {
    const mult = extractKitsMultiplier(nome);
    return { behavior: 'kits', multiplicador: mult, label: `Kits · multiplicador ${formatPercentBR(mult * 100, Number.isInteger(mult * 100) ? 0 : 1)}` };
  }
  return { behavior: 'outra', multiplicador: 1, label: 'Outra' };
}
