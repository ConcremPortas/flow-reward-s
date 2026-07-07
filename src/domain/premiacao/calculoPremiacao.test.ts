import { describe, it, expect } from "vitest";
import {
  calcularComissao,
  calcularNotaFaltas,
  calcularNotaAdvertencias,
  calcularNotaEpi,
  calcularNotaDss,
  calcularNotaProducao,
  calcularNotaGeral,
  calcularBonus,
  extractKitsMultiplier,
  isProducaoBase,
  isKitsBase,
  FALLBACK_CONFIG,
  type NotasParciais,
  type FormulaPesos,
} from "./calculoPremiacao";

/**
 * TESTES DE CARACTERIZAÇÃO (Etapa 2 da Reforma V2).
 *
 * Congelam o comportamento ATUAL do motor de premiação, transcrito de
 * GerarPremiacoes.tsx. Os valores esperados são o "estado de verdade" de hoje —
 * NÃO uma opinião sobre o que seria correto. Comportamentos suspeitos estão
 * marcados com [ACHADO] e devem ser mantidos até a reforma da regra (Etapa 8).
 */

// Fórmula operacional de PRODUÇÃO (seed real "Auxiliar - PRODUÇÃO": soma 100).
const FORMULA_PROD: FormulaPesos = {
  peso_producao_setor: 60,
  peso_epi: 15,
  peso_faltas: 10,
  peso_advertencias: 5,
  peso_dss: 10,
};

// Fórmula de KITS (seed real "Auxiliar - KITS": epi+dss+faltas+adv = 100).
const FORMULA_KITS: FormulaPesos = {
  peso_producao_setor: 0,
  peso_epi: 35,
  peso_faltas: 25,
  peso_advertencias: 15,
  peso_dss: 25,
};

/** Notas parciais "perfeitas" (1.0), variáveis sobrescritas por cenário. */
function notas(overrides: Partial<NotasParciais> = {}): NotasParciais {
  return {
    notaProducao: 1, notaEpi: 1, notaFaltas: 1, notaDss: 1, notaAdvertencias: 1,
    notaFaturamento: 1, notaItensNC: 1, notaTratamentoNC: 1, notaHoraMaquina: 1,
    notaOperacaoSegura: 1, notaLimpeza: 1,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Notas parciais
// ---------------------------------------------------------------------------

describe("notas parciais — escalas de faltas e advertências", () => {
  it("faltas: 0→1.0, 1→0.75, 2→0.5, 3→0.25, 4+→0", () => {
    expect(calcularNotaFaltas(0)).toBe(1.0);
    expect(calcularNotaFaltas(1)).toBe(0.75);
    expect(calcularNotaFaltas(2)).toBe(0.5);
    expect(calcularNotaFaltas(3)).toBe(0.25);
    expect(calcularNotaFaltas(4)).toBe(0);
    expect(calcularNotaFaltas(10)).toBe(0);
  });

  it("advertências seguem a mesma escala das faltas", () => {
    expect(calcularNotaAdvertencias(0)).toBe(1.0);
    expect(calcularNotaAdvertencias(1)).toBe(0.75);
    expect(calcularNotaAdvertencias(2)).toBe(0.5);
    expect(calcularNotaAdvertencias(3)).toBe(0.25);
    expect(calcularNotaAdvertencias(4)).toBe(0);
  });
});

describe("nota EPI", () => {
  it("sem auditoria no mês → 1.0 (benefício da dúvida)", () => {
    expect(calcularNotaEpi(0, 0)).toBe(1.0);
  });

  it("com não conformidade: (auditorias - nc) / auditorias", () => {
    expect(calcularNotaEpi(4, 1)).toBe(0.75);
    expect(calcularNotaEpi(2, 2)).toBe(0);
    expect(calcularNotaEpi(5, 0)).toBe(1.0);
  });
});

describe("nota DSS", () => {
  it("sem registros de DSS no local → 1.0", () => {
    expect(calcularNotaDss(0, 0)).toBe(1.0);
  });

  it("presença parcial: presenças / total", () => {
    expect(calcularNotaDss(4, 2)).toBe(0.5);
    expect(calcularNotaDss(3, 3)).toBe(1.0);
    expect(calcularNotaDss(4, 0)).toBe(0);
  });
});

describe("nota de produção", () => {
  it("produção 100% da meta → percentual 1.0 e nota 1.0", () => {
    expect(calcularNotaProducao(100, 100)).toEqual({ percentual: 1.0, nota: 1.0 });
  });

  it("produção abaixo da meta → nota proporcional", () => {
    expect(calcularNotaProducao(100, 80)).toEqual({ percentual: 0.8, nota: 0.8 });
  });

  it("produção acima da meta → percentual real preservado, nota limitada a 1.0", () => {
    expect(calcularNotaProducao(100, 150)).toEqual({ percentual: 1.5, nota: 1.0 });
  });

  it("sem meta (0) → percentual 0 e nota 0", () => {
    expect(calcularNotaProducao(0, 500)).toEqual({ percentual: 0, nota: 0 });
  });
});

// ---------------------------------------------------------------------------
// Detecção de tipo de base
// ---------------------------------------------------------------------------

describe("detecção de base e multiplicador de kits", () => {
  it("classifica base de PRODUÇÃO por nome normalizado", () => {
    expect(isProducaoBase("PRODUÇÃO")).toBe(true);
    expect(isProducaoBase("Produção Geral")).toBe(true);
    expect(isProducaoBase("KITS 100%")).toBe(false);
  });

  it("classifica base de KITS por prefixo", () => {
    expect(isKitsBase("KITS 100%")).toBe(true);
    expect(isKitsBase("kit especial")).toBe(true);
    expect(isKitsBase("PRODUÇÃO")).toBe(false);
  });

  it("extrai multiplicador do percentual no nome da base", () => {
    expect(extractKitsMultiplier("KITS 100%")).toBe(1.0);
    expect(extractKitsMultiplier("KITS 50%")).toBe(0.5);
    expect(extractKitsMultiplier("KITS")).toBe(1.0); // sem % → 1.0
    expect(extractKitsMultiplier("PRODUÇÃO")).toBe(1.0);
  });
});

// ---------------------------------------------------------------------------
// Comissão de kits
// ---------------------------------------------------------------------------

describe("comissão de kits (calcularComissao)", () => {
  it("abaixo do mínimo → 0", () => {
    expect(calcularComissao(9999, FALLBACK_CONFIG)).toBe(0);
  });

  it("exatamente no mínimo → apenas bônus base", () => {
    expect(calcularComissao(10000, FALLBACK_CONFIG)).toBe(100);
  });

  it("acima do mínimo → bônus base + faixas completas * bônus por faixa", () => {
    // 10500: floor(500/250)=2 faixas → 100 + 2*25 = 150
    expect(calcularComissao(10500, FALLBACK_CONFIG)).toBe(150);
    // 10499: floor(499/250)=1 → 100 + 25 = 125
    expect(calcularComissao(10499, FALLBACK_CONFIG)).toBe(125);
  });
});

// ---------------------------------------------------------------------------
// Cenário 1 — operacional com produção 100%
// ---------------------------------------------------------------------------

describe("Cenário: operacional PRODUÇÃO com desempenho perfeito", () => {
  it("nota geral = 1.0 e bônus integral", () => {
    const notaGeral = calcularNotaGeral({
      notas: notas(),
      formula: FORMULA_PROD,
      isProducaoGeracao: true,
      isSupervisorOrEncarregado: false,
    });
    expect(notaGeral).toBeCloseTo(1.0, 10);

    const bonus = calcularBonus({
      notaGeral, valorFaixa: 500, valorFixo: 0,
      isKitsGeracao: false, multiplicadorKits: 1.0,
    });
    expect(bonus.bonusPossivel).toBe(500);
    expect(bonus.bonusAlcancado).toBeCloseTo(500, 10);
  });
});

// ---------------------------------------------------------------------------
// Cenário 2 — funcionário com faltas
// ---------------------------------------------------------------------------

describe("Cenário: operacional com 2 faltas", () => {
  it("notaFaltas=0.5 reduz a nota geral proporcionalmente ao peso (10%)", () => {
    const notaGeral = calcularNotaGeral({
      notas: notas({ notaFaltas: calcularNotaFaltas(2) }),
      formula: FORMULA_PROD,
      isProducaoGeracao: true,
      isSupervisorOrEncarregado: false,
    });
    // 1*0.6 + 1*0.15 + 1*0.10 + 0.5*0.10 + 1*0.05 = 0.95
    expect(notaGeral).toBeCloseTo(0.95, 10);

    const bonus = calcularBonus({
      notaGeral, valorFaixa: 500, valorFixo: 0,
      isKitsGeracao: false, multiplicadorKits: 1.0,
    });
    expect(bonus.bonusAlcancado).toBeCloseTo(475, 10);
  });
});

// ---------------------------------------------------------------------------
// Cenário 3 — funcionário com advertências
// ---------------------------------------------------------------------------

describe("Cenário: operacional com 1 advertência", () => {
  it("notaAdvertencias=0.75 com peso 5% → nota geral 0.9875", () => {
    const notaGeral = calcularNotaGeral({
      notas: notas({ notaAdvertencias: calcularNotaAdvertencias(1) }),
      formula: FORMULA_PROD,
      isProducaoGeracao: true,
      isSupervisorOrEncarregado: false,
    });
    // 0.6 + 0.15 + 0.10 + 0.10 + 0.75*0.05 = 0.9875
    expect(notaGeral).toBeCloseTo(0.9875, 10);
  });
});

// ---------------------------------------------------------------------------
// Cenários 4-7 — EPI e DSS integrados na nota geral
// ---------------------------------------------------------------------------

describe("Cenário: EPI e DSS afetando a nota geral (operacional PRODUÇÃO)", () => {
  it("EPI sem auditoria (1.0) e DSS sem registro (1.0) não penalizam", () => {
    const notaGeral = calcularNotaGeral({
      notas: notas({ notaEpi: calcularNotaEpi(0, 0), notaDss: calcularNotaDss(0, 0) }),
      formula: FORMULA_PROD,
      isProducaoGeracao: true,
      isSupervisorOrEncarregado: false,
    });
    expect(notaGeral).toBeCloseTo(1.0, 10);
  });

  it("EPI com 1 NC em 4 (0.75) e DSS presença parcial 2/4 (0.5) reduzem a nota", () => {
    const notaGeral = calcularNotaGeral({
      notas: notas({ notaEpi: calcularNotaEpi(4, 1), notaDss: calcularNotaDss(4, 2) }),
      formula: FORMULA_PROD,
      isProducaoGeracao: true,
      isSupervisorOrEncarregado: false,
    });
    // 1*0.6 + 0.75*0.15 + 0.5*0.10 + 1*0.10 + 1*0.05 = 0.9125
    expect(notaGeral).toBeCloseTo(0.9125, 10);
  });
});

// ---------------------------------------------------------------------------
// Cenários 8-9 — produção abaixo / acima da meta na nota geral
// ---------------------------------------------------------------------------

describe("Cenário: produção abaixo e acima da meta (operacional)", () => {
  it("produção 80% → nota geral 0.88", () => {
    const { nota } = calcularNotaProducao(100, 80);
    const notaGeral = calcularNotaGeral({
      notas: notas({ notaProducao: nota }),
      formula: FORMULA_PROD,
      isProducaoGeracao: true,
      isSupervisorOrEncarregado: false,
    });
    // 0.8*0.6 + 0.15 + 0.10 + 0.10 + 0.05 = 0.88
    expect(notaGeral).toBeCloseTo(0.88, 10);
  });

  it("produção 150% é limitada a 1.0 → nota geral 1.0 (sem prêmio extra por exceder)", () => {
    const { percentual, nota } = calcularNotaProducao(100, 150);
    expect(percentual).toBe(1.5); // percentual real preservado para exibição
    const notaGeral = calcularNotaGeral({
      notas: notas({ notaProducao: nota }),
      formula: FORMULA_PROD,
      isProducaoGeracao: true,
      isSupervisorOrEncarregado: false,
    });
    expect(notaGeral).toBeCloseTo(1.0, 10);
  });
});

// ---------------------------------------------------------------------------
// Cenários 10-11 — base Kits 100% e 50%
// ---------------------------------------------------------------------------

describe("Cenário: base KITS 100%", () => {
  it("nota geral pela fórmula de kits e bônus = comissão * multiplicador 1.0", () => {
    const notaGeral = calcularNotaGeral({
      notas: notas(),
      formula: FORMULA_KITS,
      isProducaoGeracao: false,
      isSupervisorOrEncarregado: false,
    });
    // epi*0.35 + dss*0.25 + faltas*0.25 + adv*0.15 = 1.0
    expect(notaGeral).toBeCloseTo(1.0, 10);

    const valorKits = calcularComissao(10500, FALLBACK_CONFIG); // 150
    const bonus = calcularBonus({
      notaGeral, valorFaixa: 0, valorFixo: 0,
      isKitsGeracao: true, valorKits, multiplicadorKits: extractKitsMultiplier("KITS 100%"),
    });
    expect(bonus.bonusBase).toBe(150);
    expect(bonus.bonusPossivel).toBe(150);
    expect(bonus.bonusAlcancado).toBeCloseTo(150, 10);
  });
});

describe("Cenário: base KITS 50%", () => {
  it("mesma comissão, mas multiplicador 0.5 corta o bônus pela metade", () => {
    const notaGeral = calcularNotaGeral({
      notas: notas(),
      formula: FORMULA_KITS,
      isProducaoGeracao: false,
      isSupervisorOrEncarregado: false,
    });
    const valorKits = calcularComissao(10500, FALLBACK_CONFIG); // 150
    const bonus = calcularBonus({
      notaGeral, valorFaixa: 0, valorFixo: 0,
      isKitsGeracao: true, valorKits, multiplicadorKits: extractKitsMultiplier("KITS 50%"),
    });
    expect(bonus.bonusBase).toBe(75);
    expect(bonus.bonusPossivel).toBe(75);
    expect(bonus.bonusAlcancado).toBeCloseTo(75, 10);
  });
});

describe("Cenário: KITS com pesos zerados na fórmula → média aritmética simples", () => {
  it("[ACHADO] quando a soma dos pesos de kits ≈ 0, usa média dos 4 critérios", () => {
    const notaGeral = calcularNotaGeral({
      notas: notas({ notaFaltas: 0.5 }),
      formula: { peso_epi: 0, peso_dss: 0, peso_faltas: 0, peso_advertencias: 0 },
      isProducaoGeracao: false,
      isSupervisorOrEncarregado: false,
    });
    // (1 + 1 + 0.5 + 1) / 4 = 0.875
    expect(notaGeral).toBeCloseTo(0.875, 10);
  });
});

// ---------------------------------------------------------------------------
// Cenário 12 — supervisor/encarregado com pesos extras ausentes
// ---------------------------------------------------------------------------

describe("Cenário: supervisor/encarregado em PRODUÇÃO", () => {
  it("sem fórmula → usa pesos-padrão de fallback (somam 1.0) → nota perfeita = 1.0", () => {
    const notaGeral = calcularNotaGeral({
      notas: notas(),
      formula: null,
      isProducaoGeracao: true,
      isSupervisorOrEncarregado: true,
    });
    expect(notaGeral).toBeCloseTo(1.0, 10);
  });

  it("[ACHADO CRÍTICO] fórmula sem os 6 pesos extras → indicadores extras contam 0", () => {
    // Fórmula com apenas os 5 pesos-base populados (como ocorreria se as colunas
    // extras não existirem no banco), replicando a fatia base do fallback:
    // producao=20, epi=10, faltas=10, adv=3, dss=10  (extras ausentes → 0)
    const formulaSemExtras: FormulaPesos = {
      peso_producao_setor: 20,
      peso_epi: 10,
      peso_faltas: 10,
      peso_advertencias: 3,
      peso_dss: 10,
    };
    const notaGeral = calcularNotaGeral({
      notas: notas(), // desempenho PERFEITO em tudo
      formula: formulaSemExtras,
      isProducaoGeracao: true,
      isSupervisorOrEncarregado: true,
    });
    // Mesmo com desempenho perfeito, a nota máxima possível é só a soma dos 5 pesos:
    // 0.20+0.10+0.10+0.03+0.10 = 0.53 — os 53% restantes (faturamento, NC, etc.) são perdidos.
    expect(notaGeral).toBeCloseTo(0.53, 10);
  });
});

// ---------------------------------------------------------------------------
// Cenário 13 — funcionário com valor_fixo
// ---------------------------------------------------------------------------

describe("Cenário: funcionário com valor_fixo", () => {
  it("valor_fixo é somado de forma plana (não é escalado pela nota)", () => {
    const bonusPerfeito = calcularBonus({
      notaGeral: 1.0, valorFaixa: 500, valorFixo: 200,
      isKitsGeracao: false, multiplicadorKits: 1.0,
    });
    expect(bonusPerfeito.bonusPossivel).toBe(700);
    expect(bonusPerfeito.bonusAlcancado).toBeCloseTo(700, 10);

    const bonusParcial = calcularBonus({
      notaGeral: 0.8, valorFaixa: 500, valorFixo: 200,
      isKitsGeracao: false, multiplicadorKits: 1.0,
    });
    // bônus base escala (500*0.8=400), mas o fixo (200) entra inteiro → 600
    expect(bonusParcial.bonusPossivel).toBe(700);
    expect(bonusParcial.bonusAlcancado).toBeCloseTo(600, 10);
  });
});

// ---------------------------------------------------------------------------
// Achado adicional — fórmula ausente em não-supervisor zera a nota
// ---------------------------------------------------------------------------

describe("Cenário: sem fórmula para não-supervisor", () => {
  it("[ACHADO] operacional sem fórmula → nota geral 0 (bônus alcançado só o valor_fixo)", () => {
    const notaGeral = calcularNotaGeral({
      notas: notas(),
      formula: null,
      isProducaoGeracao: true,
      isSupervisorOrEncarregado: false,
    });
    expect(notaGeral).toBe(0);

    const bonus = calcularBonus({
      notaGeral, valorFaixa: 500, valorFixo: 100,
      isKitsGeracao: false, multiplicadorKits: 1.0,
    });
    expect(bonus.bonusAlcancado).toBe(100); // 500*0 + 100
  });
});
