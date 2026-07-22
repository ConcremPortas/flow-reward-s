// Validação do wizard de cadastro/edição — preserva exatamente a regra atual:
// só nome + código são obrigatórios para salvar (os demais campos são
// recomendados/visualmente marcados com *, mas nunca bloquearam o salvamento).
import type { EmployeeFormData } from '../types';

export interface StepValidation {
  valid: boolean;
  errors: Partial<Record<keyof EmployeeFormData, string>>;
}

export function validateIdentification(data: EmployeeFormData): StepValidation {
  const errors: StepValidation['errors'] = {};
  if (!data.cod_funcionario.trim()) errors.cod_funcionario = 'Código é obrigatório';
  if (!data.nome.trim()) errors.nome = 'Nome é obrigatório';
  return { valid: Object.keys(errors).length === 0, errors };
}

// Etapas 2 e 3 não possuem campos bloqueantes hoje — mantido para não alterar regra atual.
export function validateStructure(): StepValidation {
  return { valid: true, errors: {} };
}
export function validateRewards(): StepValidation {
  return { valid: true, errors: {} };
}

export function validateAll(data: EmployeeFormData): StepValidation {
  return validateIdentification(data);
}
