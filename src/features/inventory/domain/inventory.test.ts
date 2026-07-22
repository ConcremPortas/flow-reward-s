import { describe, it, expect } from 'vitest';
import { aplicarDelta, baixarSaldo, incrementarSaldo, podeAtender, assertQuantidadePositiva } from './balance';
import { calcularAjuste } from './adjustment';
import { disponivelParaDevolver, validarQuantidadeDevolucao, deveReestocar } from './returns';
import { minimoEfetivo, statusEstoque, isAlerta } from './stockStatus';
import { podeReceberEntrega } from './eligibility';
import { canonicalizarParametros } from './idempotency';
import { StockDomainError, RESTOCK_CONDITIONS } from './domainConstants';

describe('balance — nunca negativo (regra inegociável)', () => {
  it('aplica delta e bloqueia negativo', () => {
    expect(aplicarDelta(10, 5)).toBe(15);
    expect(aplicarDelta(10, -10)).toBe(0);
    expect(() => aplicarDelta(2, -3)).toThrow(/não pode ficar negativo/);
  });
  it('baixa exige saldo suficiente', () => {
    expect(baixarSaldo(5, 5)).toBe(0);
    expect(podeAtender(5, 5)).toBe(true);
    expect(() => baixarSaldo(3, 5)).toThrow(/insuficiente/);
  });
  it('incremento valida quantidade', () => {
    expect(incrementarSaldo(0, 7)).toBe(7);
    expect(() => incrementarSaldo(0, 0)).toThrow(/maior que zero/);
    expect(() => assertQuantidadePositiva(1.5)).toThrow(/inteira/);
  });
});

describe('adjustment — regra NOVA por unidade (corrige bug legado)', () => {
  it('calcula diferença sobre o saldo DA UNIDADE (não agregado)', () => {
    const r = calcularAjuste(10, 12);
    expect(r).toMatchObject({ saldoAnterior: 10, saldoNovo: 12, diferenca: 2, direcao: 'IN', tipo: 'AJUSTE_ENTRADA' });
  });
  it('ajuste para baixo gera saída', () => {
    expect(calcularAjuste(10, 4)).toMatchObject({ diferenca: -6, direcao: 'OUT', tipo: 'AJUSTE_SAIDA', saldoNovo: 4 });
  });
  it('nunca produz negativo e rejeita entradas inválidas', () => {
    expect(() => calcularAjuste(10, -1)).toThrow(/não pode ser negativa/);
    expect(() => calcularAjuste(10, 10)).toThrow(/igual ao saldo atual/);
    expect(() => calcularAjuste(10, 2.5)).toThrow(/inteira/);
  });
  it('CARACTERIZAÇÃO INVERSA: a anomalia legada (base agregada→unidade negativa) NÃO ocorre', () => {
    // Legado: A=10,B=10 (agregado 20); ajustar "para 5" fazia A = 10 + (5-20) = -5.
    // Regra nova: o ajuste é sobre a UNIDADE. Ajustar a unidade A (10) para 5:
    const r = calcularAjuste(10, 5);
    expect(r.saldoNovo).toBe(5);      // A fica 5 (nunca -5)
    expect(r.diferenca).toBe(-5);     // diferença sobre a própria unidade, não sobre o agregado
    expect(r.saldoNovo).toBeGreaterThanOrEqual(0);
  });
});

describe('returns — disponível e re-estocagem (preservado)', () => {
  it('disponível = entregue - devolvido (>=0)', () => {
    expect(disponivelParaDevolver(5, 2)).toBe(3);
    expect(disponivelParaDevolver(2, 5)).toBe(0);
  });
  it('valida quantidade contra disponível', () => {
    expect(() => validarQuantidadeDevolucao(4, 3)).toThrow(/maior que a quantidade em posse/);
    expect(() => validarQuantidadeDevolucao(0, 3)).toThrow(/maior que zero/);
    expect(() => validarQuantidadeDevolucao(3, 3)).not.toThrow();
  });
  it('re-estoca só ESTOQUE + {NOVO,BOM,USADO}', () => {
    expect(RESTOCK_CONDITIONS).toEqual(['NOVO', 'BOM', 'USADO']);
    expect(deveReestocar('ESTOQUE', 'BOM')).toBe(true);
    expect(deveReestocar('ESTOQUE', 'DANIFICADO')).toBe(false);
    expect(deveReestocar('DESCARTE', 'NOVO')).toBe(false);
    expect(deveReestocar('MANUTENCAO', 'USADO')).toBe(false);
  });
});

describe('stockStatus — mínimo efetivo (unidade→variante→0)', () => {
  it('fallbacks do mínimo', () => {
    expect(minimoEfetivo(3, 10)).toBe(3);
    expect(minimoEfetivo(null, 10)).toBe(10);
    expect(minimoEfetivo(null, null)).toBe(0);
  });
  it('status e alerta por quantidade <= mínimo', () => {
    expect(statusEstoque(0, 5)).toBe('SEM_ESTOQUE');
    expect(statusEstoque(5, 5)).toBe('ALERTA');
    expect(statusEstoque(6, 5)).toBe('NORMAL');
    expect(isAlerta(5, 5)).toBe(true);
    expect(isAlerta(6, 5)).toBe(false);
  });
});

describe('eligibility — entrega ao colaborador', () => {
  const unidade = { ativo: true, empresaId: 'e1' };
  it('permite colaborador ativo, mesma empresa', () => {
    expect(podeReceberEntrega({ ativo: true, status: 'ATIVO', empresaId: 'e1' }, unidade).ok).toBe(true);
  });
  it('bloqueia desligado/inativo/unidade inativa/empresa diferente', () => {
    expect(podeReceberEntrega({ ativo: true, status: 'DESLIGADO', empresaId: 'e1' }, unidade).ok).toBe(false);
    expect(podeReceberEntrega({ ativo: false, status: 'ATIVO', empresaId: 'e1' }, unidade).ok).toBe(false);
    expect(podeReceberEntrega({ ativo: true, status: 'ATIVO', empresaId: 'e2' }, unidade).ok).toBe(false);
    expect(podeReceberEntrega({ ativo: true, status: 'ATIVO', empresaId: 'e1' }, { ativo: false, empresaId: 'e1' }).ok).toBe(false);
  });
});

describe('idempotency — canonicalização estável', () => {
  it('ordena chaves e ignora ordem de entrada', () => {
    const a = canonicalizarParametros({ b: 1, a: [{ y: 2, x: 1 }] });
    const b = canonicalizarParametros({ a: [{ x: 1, y: 2 }], b: 1 });
    expect(a).toBe(b);
  });
  it('parâmetros diferentes geram strings diferentes', () => {
    expect(canonicalizarParametros({ q: 5 })).not.toBe(canonicalizarParametros({ q: 6 }));
  });
});

describe('StockDomainError', () => {
  it('carrega código e mensagem', () => {
    try { aplicarDelta(0, -1); } catch (e) {
      expect(e).toBeInstanceOf(StockDomainError);
      expect((e as StockDomainError).code).toBe('SALDO_NEGATIVO');
    }
  });
});
