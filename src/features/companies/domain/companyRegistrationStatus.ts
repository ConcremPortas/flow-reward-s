// Situação cadastral da empresa — função PURA, fonte única. Sem espalhar ifs no
// JSX. CNPJ é OPCIONAL → ausência não é erro bloqueante (gera "revisar" leve).
// "Inativo" reflete a coluna real `ativo` (fonte de verdade), não hardcoded.
import type { CompanyRegistrationStatus } from '../types/company.types';

interface Input {
  ativo: boolean;
  nome: string;
  cnpjInformado: boolean;
  cnpjValido: boolean;
  duplicadoCnpj: boolean;
}

export function getCompanyRegistrationStatus({ ativo, nome, cnpjInformado, cnpjValido, duplicadoCnpj }: Input): CompanyRegistrationStatus {
  if (!ativo) {
    return { status: 'inativo', motivos: ['Empresa inativa.'], descricao: 'Empresa inativa (desativada).' };
  }
  const motivos: string[] = [];
  if (!nome.trim()) motivos.push('Nome da empresa ausente.');
  if (!cnpjInformado) motivos.push('CNPJ não informado.');
  else if (!cnpjValido) motivos.push('CNPJ inválido (dígitos verificadores).');
  if (duplicadoCnpj) motivos.push('Outra empresa possui o mesmo CNPJ.');

  if (motivos.length > 0) {
    return { status: 'revisar', motivos, descricao: 'Há pendências no cadastro desta empresa.' };
  }
  return { status: 'completo', motivos: [], descricao: 'Cadastro completo.' };
}

export const COMPANY_STATUS_META: Record<CompanyRegistrationStatus['status'], { label: string; variant: 'success' | 'warning' | 'neutral' }> = {
  completo: { label: 'Completo', variant: 'success' },
  revisar: { label: 'Revisar cadastro', variant: 'warning' },
  inativo: { label: 'Inativo', variant: 'neutral' },
};
