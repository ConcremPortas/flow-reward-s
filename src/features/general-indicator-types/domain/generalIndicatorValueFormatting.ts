// Formatação de valores do indicador geral — REUTILIZA a fonte de verdade da
// feature operacional (general-indicators), que resolve formato/unidade pelo
// CÓDIGO do tipo (FAT → moeda BRL; KITS → número/kits). NÃO duplicar o mapa.
//
// Acoplamento documentado: não há campo persistido de unidade/tipo; a formatação
// depende do código via `resolveIndicatorDefinition`.
import { resolveIndicatorDefinition, type IndicatorDefinition } from '@/features/general-indicators/domain/indicatorDefinitions';
import { formatIndicatorValue } from '@/features/general-indicators/domain/indicatorFormatting';

export { resolveIndicatorDefinition };
export type { IndicatorDefinition };

/** Formata um valor (meta/realizado) conforme a definição do tipo. */
export function formatTypeValue(value: number | null | undefined, def: IndicatorDefinition): string {
  return formatIndicatorValue(value, def, { withUnit: true });
}
