import type { Cargo } from '@/hooks/useCargos';

const normalizar = (s: string | null | undefined): string =>
  (s ?? '').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').trim();

export interface DuplicidadeResultado {
  duplicado: boolean;
  existente: Cargo | null;
}

/**
 * Duplicidade de cargo por NOME (case/acento-insensível). É OBSERVACIONAL: não
 * há constraint única confirmada no banco, então avisamos — não bloqueamos
 * silenciosamente nem alteramos constraints. `excludeId` ignora o próprio cargo
 * (edição).
 */
export function detectarDuplicidade(nome: string, cargos: Cargo[], excludeId?: string): DuplicidadeResultado {
  const alvo = normalizar(nome);
  if (alvo === '') return { duplicado: false, existente: null };
  const existente = cargos.find((c) => c.id !== excludeId && normalizar(c.nome) === alvo) ?? null;
  return { duplicado: !!existente, existente };
}

export interface ValidacaoCampos {
  nomeValido: boolean;
  faixaCoerente: boolean; // min <= max quando ambos definidos
  nivelValido: boolean; // inteiro >= 0 quando informado
  erros: string[];
}

/** Validação dos campos do editor. Só bloqueia o que é objetivamente inválido. */
export function validarCampos(input: {
  nome: string;
  nivel: string;
  salarioMin: string;
  salarioMax: string;
}): ValidacaoCampos {
  const erros: string[] = [];
  const nomeValido = input.nome.trim().length >= 2;
  if (!nomeValido) erros.push('Informe um nome de cargo com pelo menos 2 caracteres.');

  const min = input.salarioMin.trim() === '' ? null : Number(input.salarioMin);
  const max = input.salarioMax.trim() === '' ? null : Number(input.salarioMax);
  let faixaCoerente = true;
  if (min != null && (!Number.isFinite(min) || min < 0)) { faixaCoerente = false; erros.push('Salário mínimo inválido.'); }
  if (max != null && (!Number.isFinite(max) || max < 0)) { faixaCoerente = false; erros.push('Salário máximo inválido.'); }
  if (min != null && max != null && Number.isFinite(min) && Number.isFinite(max) && min > max) {
    faixaCoerente = false;
    erros.push('O salário mínimo não pode ser maior que o máximo.');
  }

  let nivelValido = true;
  if (input.nivel.trim() !== '') {
    const n = Number(input.nivel);
    if (!Number.isInteger(n) || n < 0) { nivelValido = false; erros.push('Nível hierárquico deve ser um inteiro não negativo.'); }
  }

  return { nomeValido, faixaCoerente, nivelValido, erros };
}

/** O salvamento é permitido quando não há erro objetivo. */
export function podeSalvar(v: ValidacaoCampos): boolean {
  return v.nomeValido && v.faixaCoerente && v.nivelValido;
}
