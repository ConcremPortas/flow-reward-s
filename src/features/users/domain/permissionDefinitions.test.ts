import { describe, it, expect } from 'vitest';
import { ALL_SECTIONS } from '@/contexts/AuthContext';
import {
  PERMISSION_DEFS, KNOWN_SECTIONS, isKnownSection, sectionLabel, permissionDef,
} from './permissionDefinitions';

describe('permissionDefinitions — registro central de seções', () => {
  it('inclui a seção estoque (Controle de Estoque) sincronizada com o domínio', () => {
    const def = permissionDef('estoque');
    expect(def).toBeDefined();
    expect(def?.label).toBe('Controle de Estoque');
    expect(def?.group).toBe('operacao');
    expect(def?.sensitivity).toBe('sensivel');
    expect(def?.route).toBe('/controle-estoque');
  });

  it('estoque é seção conhecida e tem rótulo amigável (não a chave crua)', () => {
    expect(isKnownSection('estoque')).toBe(true);
    expect(sectionLabel('estoque')).toBe('Controle de Estoque');
  });

  it('estoque aparece após Produção e antes de Premiações', () => {
    const keys = [...PERMISSION_DEFS].sort((a, b) => a.order - b.order).map((d) => d.key);
    expect(keys.indexOf('estoque')).toBe(keys.indexOf('producao') + 1);
    expect(keys.indexOf('estoque')).toBeLessThan(keys.indexOf('premiacoes'));
  });

  it('PERMISSION_DEFS e KNOWN_SECTIONS/ALL_SECTIONS cobrem exatamente as mesmas chaves (sem divergência)', () => {
    const defsKeys = new Set(PERMISSION_DEFS.map((d) => d.key));
    expect(defsKeys.size).toBe(ALL_SECTIONS.length);
    for (const s of ALL_SECTIONS) expect(defsKeys.has(s)).toBe(true);
    expect([...KNOWN_SECTIONS].sort()).toEqual([...ALL_SECTIONS].sort());
  });

  it('não há ordens duplicadas', () => {
    const orders = PERMISSION_DEFS.map((d) => d.order);
    expect(new Set(orders).size).toBe(orders.length);
  });
});
