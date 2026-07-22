// Validação de parâmetros da configuração de kits — PURA e testável.
// Não inventa limites além do domínio: mínimo/incremento > 0; bônus ≥ 0;
// max_faixas: null (sem limite) ou inteiro ≥ 1.

export interface KitsConfigInput {
  vigenciaInicio: string;        // 'YYYY-MM'
  minimoKits: number | null;
  incrementoFaixa: number | null;
  bonusBase: number | null;
  bonusPorFaixa: number | null;
  maxFaixas: number | null;
}

export interface KitsConfigValidation { valid: boolean; errors: string[]; warnings: string[] }

const VIGENCIA_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function validateKitsConfig(input: KitsConfigInput): KitsConfigValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!VIGENCIA_RE.test(input.vigenciaInicio ?? '')) errors.push('Informe a vigência (mês/ano).');
  if (input.minimoKits == null || !Number.isFinite(input.minimoKits) || input.minimoKits <= 0) errors.push('O mínimo de kits deve ser maior que zero.');
  if (input.incrementoFaixa == null || !Number.isFinite(input.incrementoFaixa) || input.incrementoFaixa <= 0) errors.push('O incremento por faixa deve ser maior que zero.');
  if (input.bonusBase == null || !Number.isFinite(input.bonusBase) || input.bonusBase < 0) errors.push('O bônus base não pode ser negativo.');
  if (input.bonusPorFaixa == null || !Number.isFinite(input.bonusPorFaixa) || input.bonusPorFaixa < 0) errors.push('O bônus por faixa não pode ser negativo.');
  if (input.maxFaixas != null && (!Number.isInteger(input.maxFaixas) || input.maxFaixas < 1)) errors.push('O máximo de faixas deve ser um inteiro ≥ 1, ou "sem limite".');

  if (input.maxFaixas != null) warnings.push('O máximo de faixas é armazenado, mas o cálculo atual do motor não aplica teto de faixas.');

  return { valid: errors.length === 0, errors, warnings };
}

export function isValidVigencia(vigencia: string): boolean {
  return VIGENCIA_RE.test(vigencia ?? '');
}
