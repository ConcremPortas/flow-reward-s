// Validação da Etapa 1 (Configuração) e regra de elegibilidade para auditoria.
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { EpiAuditFormData } from '../types/epi.types';

export interface StepValidation {
  valid: boolean;
  errors: Partial<Record<keyof EpiAuditFormData, string>>;
}

export function validateConfigurationStep(data: EpiAuditFormData): StepValidation {
  const errors: StepValidation['errors'] = {};
  if (!data.dataAuditoria) errors.dataAuditoria = 'Informe a data da auditoria';
  return { valid: Object.keys(errors).length === 0, errors };
}

/**
 * Funcionário elegível para auditoria de EPI — mesma regra já usada na tela
 * atual (status diferente de "rescisão"), preservada sem alteração.
 */
export function isFuncionarioAtivo(f: { status?: string }): boolean {
  const status = (f.status || '').toLowerCase();
  return status !== 'rescisao' && status !== 'rescisão';
}

/** Funcionários elegíveis para a auditoria, ordenados por nome — mesma regra atual. */
export function auditableFuncionarios(funcionarios: Funcionario[]): Funcionario[] {
  return funcionarios.filter(isFuncionarioAtivo).sort((a, b) => a.nome.localeCompare(b.nome));
}
