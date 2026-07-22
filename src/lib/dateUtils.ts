// Camada de compatibilidade — funções de data legadas ainda importadas por
// algumas telas (Produção, Indicadores). Delegam aos utilitários centralizados
// em `@/lib/dateTime` para não duplicar regras de fuso/formatação.
//
// Preferir SEMPRE importar diretamente de `@/lib/dateTime` em código novo.
import { dateOnlyToISO, parseDateOnly, formatDateBR, getCurrentDateInBrasilia } from './dateTime';

/**
 * Normaliza uma data civil ("YYYY-MM-DD") para persistência no banco (coluna
 * `date`). Data civil não sofre conversão de fuso: retorna o mesmo dia.
 */
export const formatDateToBrasilia = (dateString: string): string =>
  dateOnlyToISO(parseDateOnly(dateString));

/** Data civil do banco → exibição brasileira "DD/MM/AAAA". */
export const formatDateToBrazilian = (dateString: string): string =>
  formatDateBR(dateString, '');

/** Data do banco → valor de <input type="date"> ("YYYY-MM-DD"), sem shift de dia. */
export const formatDateToInput = (dateString: string): string => {
  if (!dateString) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
  return dateOnlyToISO(parseDateOnly(dateString));
};

/** Data atual ("YYYY-MM-DD") no fuso de Brasília. */
export const getCurrentDateBrasilia = (): string => getCurrentDateInBrasilia();
