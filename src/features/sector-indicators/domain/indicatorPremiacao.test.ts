// Teste de CARACTERIZAÇÃO — amarra as definições/derivações desta feature ao
// motor de premiação existente, garantindo que a reconstrução visual NÃO alterou
// a semântica dos indicadores usada no cálculo da nota geral.
import { describe, it, expect } from 'vitest';
import { calcularMediaIndicador } from '@/domain/premiacao/calculoPremiacao';
import { INDICATOR_DEFINITIONS } from './indicatorDefinitions';
import { makeSemMedicaoEntry, persistFieldsFromEntry } from './indicatorCalculations';

describe('direção da meta (auditoria) vs. motor de premiação', () => {
  it('todos os cinco indicadores são "maior = melhor"', () => {
    expect(INDICATOR_DEFINITIONS).toHaveLength(5);
    for (const def of INDICATOR_DEFINITIONS) expect(def.direction).toBe('higher_is_better');
  });

  it('o motor trata realizado/meta como "maior = melhor" (cap 1.0) — inclusive NC', () => {
    // Realizado maior → nota maior, para QUALQUER indicador (nenhuma inversão).
    const baixo = calcularMediaIndicador([{ meta: 100, realizado: 50 }]);
    const alto = calcularMediaIndicador([{ meta: 100, realizado: 90 }]);
    expect(alto).toBeGreaterThan(baixo);
    // Acima da meta é limitado a 1.0.
    expect(calcularMediaIndicador([{ meta: 100, realizado: 150 }])).toBe(1.0);
    // Sem itens válidos (meta 0/nula) → 1.0 (neutro).
    expect(calcularMediaIndicador([{ meta: 0, realizado: 10 }])).toBe(1.0);
  });
});

describe('"sem medição" preserva a regra legada (1/1 → nota neutra 1.0)', () => {
  it('persiste 1/1 em todos os campos e o motor lê como 100%', () => {
    const fields = persistFieldsFromEntry(makeSemMedicaoEntry());
    expect(fields.hora_maquina_meta).toBe(1);
    expect(fields.hora_maquina_realizado).toBe(1);
    expect(fields.hora_maquina_percentual).toBe(1); // fração 1/1
    // O motor, lendo meta=1/realizado=1, produz nota 1.0.
    expect(calcularMediaIndicador([{ meta: 1, realizado: 1 }])).toBe(1.0);
  });
});
