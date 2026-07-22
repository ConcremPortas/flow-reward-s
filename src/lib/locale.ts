// Constantes e instâncias Intl compartilhadas de localização da aplicação.
// Fonte única de verdade para idioma, fuso horário e moeda.
//
// Por que centralizar as instâncias de Intl: criar `new Intl.*Format` é caro;
// reutilizar instâncias evita recriá-las a cada renderização. Todas as
// funções de formatação (dateTime.ts / formatters.ts) consomem estas.

export const APP_LOCALE = 'pt-BR';
export const APP_TIME_ZONE = 'America/Sao_Paulo';
export const APP_CURRENCY = 'BRL';

/** Primeiro dia da semana: segunda-feira (1). Usado por componentes de calendário. */
export const APP_WEEK_STARTS_ON = 1;

// ── Instâncias reutilizáveis (não recriar por render) ───────────────────────

/** Data civil: 14/07/2026. */
export const dateFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  timeZone: APP_TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

/** Data + hora: 14/07/2026, 13:45. */
export const dateTimeFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  timeZone: APP_TIME_ZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** Somente hora: 13:45. */
export const timeFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  timeZone: APP_TIME_ZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

// ── Formatadores de DATA CIVIL (sem instante/timezone) ──────────────────────
// Datas sem horário (admissão, nascimento, competência, realização) não
// representam um instante — não devem sofrer conversão de fuso. Formatamos a
// partir de uma data construída em UTC e formatada em UTC, garantindo que o
// dia/mês/ano selecionado nunca mude, independentemente do fuso do navegador.

/** Data civil: 14/07/2026 (formata a partir de UTC, sem shift de dia). */
export const civilDateFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  timeZone: 'UTC',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

/** Mês e ano civil por extenso: "julho de 2026". */
export const civilMonthYearFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  timeZone: 'UTC',
  month: 'long',
  year: 'numeric',
});

/** Data civil longa: "segunda-feira, 14 de julho de 2026". */
export const civilLongDateFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
  timeZone: 'UTC',
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** Moeda: R$ 115.981,05. */
export const currencyFormatter = new Intl.NumberFormat(APP_LOCALE, {
  style: 'currency',
  currency: APP_CURRENCY,
});

/** Número inteiro: 314. */
export const integerFormatter = new Intl.NumberFormat(APP_LOCALE, {
  maximumFractionDigits: 0,
});

/** Número decimal: 1.234,56. */
export const decimalFormatter = new Intl.NumberFormat(APP_LOCALE, {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Tempo relativo: "há 2 dias". */
export const relativeTimeFormatter = new Intl.RelativeTimeFormat(APP_LOCALE, {
  numeric: 'auto',
});
