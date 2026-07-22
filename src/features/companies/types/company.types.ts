// Tipos da Gestão de Empresas. Só contratos.
//
// Auditoria: entidade `Empresa` (tabela `concremrh_empresas`). Campos persistidos:
// id, nome, cnpj?, email?, telefone?, endereco?, ativo, created_at, updated_at. O
// formulário legado edita nome/cnpj. `ativo` é a fonte de verdade do status, MAS é
// usado como flag de SOFT-DELETE (fetch filtra ativo=true; delete faz ativo=false).
// Não há ciclo ativo/inativo distinto da exclusão — por isso não há fluxo separado
// de "Inativar" (seria idêntico ao excluir).
//
// Relações reais (FK direta → concremrh_empresas): setores.empresa_id,
// funcionarios.empresa_id. Produção/indicadores/DSS/EPI são indiretos (via setor/
// funcionário); resultados de premiação, via funcionário. O motor NÃO usa empresa.
// CNPJ: text nullable/opcional; comparação de duplicidade por dígitos.

export type CompanyStatusKind = 'completo' | 'revisar' | 'inativo';

export interface CompanyRegistrationStatus {
  status: CompanyStatusKind;
  motivos: string[];
  descricao: string;
}

/** Vínculos/estrutura de uma empresa (agregados em lote — sem N+1). */
export interface CompanyUsage {
  setores: number;
  funcionarios: number;
  funcionariosAtivos: number;
  resultadosHistoricos: number; // resultados de funcionários desta empresa (indireto)
  temVinculos: boolean;         // setores > 0 || funcionarios > 0
}

export interface CompanyRow {
  id: string;
  nome: string;
  cnpj: string | null;        // valor persistido (pode estar formatado ou só dígitos)
  ativo: boolean;
  cnpjValido: boolean;        // DV válido (só quando há valor)
  cnpjInformado: boolean;
  usage: CompanyUsage;
  status: CompanyRegistrationStatus;
  duplicadoCnpj: boolean;     // outra empresa com o mesmo CNPJ (dígitos)
}

export interface CompanyFilters {
  search: string;
  situacao: 'todos' | CompanyStatusKind;
}

export const DEFAULT_COMPANY_FILTERS: CompanyFilters = { search: '', situacao: 'todos' };
