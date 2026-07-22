import { describe, it, expect } from 'vitest';
import {
  formatDateBR, formatDateTimeBR, formatTimeBR, formatMonthYearBR, formatLongDateBR,
  parseDateOnly, dateOnlyToISO, dateOnlyInBrasilia, formatTimestampInBrasilia,
} from './dateTime';

// Brasília é UTC-3 o ano todo (sem horário de verão desde 2019).

describe('formatDateBR — data civil (sem shift de fuso)', () => {
  it('"2026-07-14" continua 14/07/2026', () => {
    expect(formatDateBR('2026-07-14')).toBe('14/07/2026');
  });
  it('não recua um dia em nenhuma situação', () => {
    expect(formatDateBR('2026-01-01')).toBe('01/01/2026');
    expect(formatDateBR('2026-12-31')).toBe('31/12/2026');
  });
  it('null/undefined/vazio → fallback', () => {
    expect(formatDateBR(null)).toBe('—');
    expect(formatDateBR(undefined)).toBe('—');
    expect(formatDateBR('')).toBe('—');
  });
  it('data inválida → fallback (sem Invalid Date)', () => {
    expect(formatDateBR('2026-13-40')).toBe('—');
    expect(formatDateBR('abc')).toBe('—');
  });
});

describe('formatDateTimeBR — timestamp UTC em Brasília', () => {
  it('2026-07-14T16:45:00.000Z → 14/07/2026, 13:45', () => {
    expect(formatDateTimeBR('2026-07-14T16:45:00.000Z')).toBe('14/07/2026, 13:45');
  });
  it('virada de dia: 2026-07-14T02:00:00.000Z → 13/07/2026, 23:00', () => {
    expect(formatDateTimeBR('2026-07-14T02:00:00.000Z')).toBe('13/07/2026, 23:00');
  });
  it('meia-noite: 2026-07-14T03:00:00.000Z → 14/07/2026, 00:00', () => {
    expect(formatDateTimeBR('2026-07-14T03:00:00.000Z')).toBe('14/07/2026, 00:00');
  });
  it('formatTimestampInBrasilia é o mesmo comportamento', () => {
    expect(formatTimestampInBrasilia('2026-07-14T16:45:00.000Z')).toBe('14/07/2026, 13:45');
  });
  it('null → fallback', () => {
    expect(formatDateTimeBR(null)).toBe('—');
    expect(formatDateTimeBR('data-ruim')).toBe('—');
  });
});

describe('formatTimeBR', () => {
  it('2026-07-14T16:45:00.000Z → 13:45', () => {
    expect(formatTimeBR('2026-07-14T16:45:00.000Z')).toBe('13:45');
  });
  it('próximo da meia-noite: 2026-07-14T02:59:00.000Z → 23:59', () => {
    expect(formatTimeBR('2026-07-14T02:59:00.000Z')).toBe('23:59');
  });
});

describe('formatMonthYearBR — competência', () => {
  it('"2026-07" → julho de 2026', () => {
    expect(formatMonthYearBR('2026-07')).toBe('julho de 2026');
  });
  it('aceita "YYYY-MM-DD"', () => {
    expect(formatMonthYearBR('2026-01-15')).toBe('janeiro de 2026');
  });
  it('inválida/nula → fallback', () => {
    expect(formatMonthYearBR('2026-13')).toBe('—');
    expect(formatMonthYearBR(null)).toBe('—');
  });
});

describe('formatLongDateBR', () => {
  it('"2026-07-14" → terça-feira, 14 de julho de 2026', () => {
    expect(formatLongDateBR('2026-07-14')).toBe('terça-feira, 14 de julho de 2026');
  });
});

describe('parseDateOnly / dateOnlyToISO — round-trip sem perda de dia', () => {
  it('round-trip preserva o dia', () => {
    const d = parseDateOnly('2026-07-14');
    expect(d).not.toBeNull();
    expect(dateOnlyToISO(d)).toBe('2026-07-14');
  });
  it('parseDateOnly rejeita data impossível', () => {
    expect(parseDateOnly('2026-02-31')).toBeNull();
  });
  it('dateOnlyToISO com null → vazio', () => {
    expect(dateOnlyToISO(null)).toBe('');
  });
});

describe('dateOnlyInBrasilia — dia civil de um instante', () => {
  it('instante às 02:00Z pertence ao dia anterior em Brasília', () => {
    expect(dateOnlyInBrasilia('2026-07-14T02:00:00.000Z')).toBe('2026-07-13');
  });
  it('instante às 03:00Z já é o novo dia em Brasília', () => {
    expect(dateOnlyInBrasilia('2026-07-14T03:00:00.000Z')).toBe('2026-07-14');
  });
});
