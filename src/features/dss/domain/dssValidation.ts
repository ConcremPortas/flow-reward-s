// Validação da Etapa 1 (Informações) e regra de vínculo funcionário↔local.
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { DssFormData } from '../types';

export interface StepValidation {
  valid: boolean;
  errors: Partial<Record<keyof DssFormData, string>>;
}

export function validateInformationStep(data: DssFormData): StepValidation {
  const errors: StepValidation['errors'] = {};
  if (!data.localDssId) errors.localDssId = 'Selecione o local do DSS';
  if (!data.dataRealizacao) errors.dataRealizacao = 'Informe a data de realização';
  if (!data.tema.trim()) errors.tema = 'Informe o tema do DSS';
  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Funcionários vinculados a um local de DSS e aptos a compor a lista de presença.
 * CORREÇÃO DE AUDITORIA: o fluxo anterior filtrava só por local no cadastro (sem
 * checar `ativo`) e só por `ativo` na edição (ignorando o local por completo — um
 * funcionário de outro local aparecia na edição). Aqui as duas telas usam a MESMA
 * regra: vinculado ao local E ativo.
 */
export function linkedActiveFuncionarios(funcionarios: Funcionario[], localDssId: string): Funcionario[] {
  if (!localDssId) return [];
  return funcionarios.filter((f) => f.local_dss_id === localDssId && f.ativo);
}
