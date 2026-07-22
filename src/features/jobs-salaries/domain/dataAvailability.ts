import { formatCurrencyBRL, formatNumberBR, formatPercentBR } from '@/lib/formatters';

/**
 * Modelo de disponibilidade de valor. Um número ausente NUNCA é 0.
 * Distinguimos explicitamente:
 *  - value        : há um valor real medido/cadastrado (inclui 0 real, ver `zero`)
 *  - zero         : o valor é comprovadamente zero (contagem real = 0)
 *  - unset        : não cadastrado / não informado (null/undefined na origem)
 *  - restricted   : existe, mas o usuário não tem autorização para ver
 *  - unavailable  : não há base de dados/pré-requisito para calcular
 *  - error        : falha ao carregar
 *
 * `zero` vs `unset`: contagens (ex.: "0 cargos cadastrados") são fatos → `zero`.
 * Agregados que dependem de dados inexistentes (ex.: média salarial sem salários)
 * são `unset`, não zero — mostrar "Não informado", jamais "R$ 0,00".
 */
export type AvailKind = 'value' | 'zero' | 'unset' | 'restricted' | 'unavailable' | 'error';

export interface Avail<T = number> {
  readonly kind: AvailKind;
  readonly value?: T;
}

export const availValue = <T>(value: T): Avail<T> => ({ kind: 'value', value });
export const availZero = (): Avail<number> => ({ kind: 'zero', value: 0 });
export const availUnset = <T = number>(): Avail<T> => ({ kind: 'unset' });
export const availRestricted = <T = number>(): Avail<T> => ({ kind: 'restricted' });
export const availUnavailable = <T = number>(): Avail<T> => ({ kind: 'unavailable' });
export const availError = <T = number>(): Avail<T> => ({ kind: 'error' });

export const hasValue = <T>(a: Avail<T>): a is Avail<T> & { value: T } =>
  a.kind === 'value' || a.kind === 'zero';

/** Rótulos padronizados para cada estado ausente (pt-BR). */
export const AVAIL_ABSENT_LABEL: Record<Exclude<AvailKind, 'value' | 'zero'>, string> = {
  unset: 'Não informado',
  restricted: 'Acesso restrito',
  unavailable: 'Não disponível',
  error: 'Não foi possível carregar',
};

/** Contagem: `zero` é fato e vira "0"; ausências viram o rótulo apropriado. */
export function countLabel(a: Avail<number>): string {
  if (a.kind === 'zero') return formatNumberBR(0);
  if (a.kind === 'value') return formatNumberBR(a.value ?? 0);
  return AVAIL_ABSENT_LABEL[a.kind];
}

/** Moeda BRL: só formata valores reais; ausência nunca vira "R$ 0,00". */
export function moneyLabel(a: Avail<number>): string {
  if (a.kind === 'zero') return formatCurrencyBRL(0);
  if (a.kind === 'value') return formatCurrencyBRL(a.value ?? 0);
  return AVAIL_ABSENT_LABEL[a.kind];
}

/** Percentual. */
export function percentLabel(a: Avail<number>, decimals = 0): string {
  if (a.kind === 'zero') return formatPercentBR(0, decimals);
  if (a.kind === 'value') return formatPercentBR(a.value ?? 0, decimals);
  return AVAIL_ABSENT_LABEL[a.kind];
}

/** Texto livre (nome, descrição). */
export function textLabel(a: Avail<string>): string {
  if (a.kind === 'value' || a.kind === 'zero') return a.value ?? AVAIL_ABSENT_LABEL.unset;
  return AVAIL_ABSENT_LABEL[a.kind];
}

/**
 * Média de valores numéricos possivelmente ausentes, respeitando autorização.
 * - authorized=false → restricted
 * - nenhum valor presente → unset (não 0)
 * - senão → média dos valores presentes
 */
export function averageAvail(values: Array<number | null | undefined>, authorized: boolean): Avail<number> {
  if (!authorized) return availRestricted();
  const presentes = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  if (presentes.length === 0) return availUnset();
  const soma = presentes.reduce((acc, v) => acc + v, 0);
  return availValue(soma / presentes.length);
}

/** Soma (massa salarial) respeitando autorização e ausência. */
export function sumAvail(values: Array<number | null | undefined>, authorized: boolean): Avail<number> {
  if (!authorized) return availRestricted();
  const presentes = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  if (presentes.length === 0) return availUnset();
  return availValue(presentes.reduce((acc, v) => acc + v, 0));
}

/** Mediana respeitando autorização e ausência. */
export function medianAvail(values: Array<number | null | undefined>, authorized: boolean): Avail<number> {
  if (!authorized) return availRestricted();
  const presentes = values
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v))
    .sort((a, b) => a - b);
  if (presentes.length === 0) return availUnset();
  const meio = Math.floor(presentes.length / 2);
  const mediana = presentes.length % 2 === 0
    ? (presentes[meio - 1] + presentes[meio]) / 2
    : presentes[meio];
  return availValue(mediana);
}
