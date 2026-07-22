// Detalhamento do bônus para exibição — o VALOR final vem SEMPRE do motor
// (`calcularComissao`); os intermediários apenas explicam a composição. Não é uma
// segunda fórmula: `bonusTotal` e `adicional` derivam do motor.
import { calcularComissao } from '@/domain/premiacao/calculoPremiacao';

export interface KitsBonusInput {
  minimoKits: number;
  incrementoFaixa: number;
  bonusBase: number;
  bonusPorFaixa: number;
  maxFaixas: number | null;
}

export interface KitsBonusBreakdown {
  kits: number;
  minimo: number;
  atingiuMinimo: boolean;
  excedente: number;          // kits acima do mínimo (0 se abaixo)
  faixas: number;             // faixas completas (floor) — decomposição
  limite: number | null;      // max_faixas informado (não aplicado pelo motor)
  bonusBaseAplicado: number;
  adicional: number;          // vem do motor (bonusTotal - base)
  bonusTotal: number;         // motor
}

export function computeKitsBonusBreakdown(kits: number, cfg: KitsBonusInput): KitsBonusBreakdown {
  const bonusTotal = calcularComissao(kits, {
    minimo_kits: cfg.minimoKits, incremento_faixa: cfg.incrementoFaixa,
    bonus_base: cfg.bonusBase, bonus_por_faixa: cfg.bonusPorFaixa,
  });
  const atingiuMinimo = kits >= cfg.minimoKits;
  const excedente = atingiuMinimo ? kits - cfg.minimoKits : 0;
  const faixas = atingiuMinimo && cfg.incrementoFaixa > 0 ? Math.floor(excedente / cfg.incrementoFaixa) : 0;
  const bonusBaseAplicado = atingiuMinimo ? cfg.bonusBase : 0;
  return {
    kits, minimo: cfg.minimoKits, atingiuMinimo, excedente, faixas,
    limite: cfg.maxFaixas, bonusBaseAplicado,
    adicional: bonusTotal - bonusBaseAplicado, bonusTotal,
  };
}
