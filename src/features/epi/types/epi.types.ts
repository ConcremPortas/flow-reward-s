// Tipos da Central de Auditoria e Conformidade de EPI. Só contratos — sem lógica.

/** true = conforme, false = não conforme. Ausente no map = conforme (regra preservada). */
export type ComplianceMap = Record<string, boolean>;

export interface ComplianceFilters {
  search: string;
  empresaId: string;
  setorId: string;
  situacao: 'todos' | 'conformes' | 'nao_conformes';
  somenteAlterados: boolean;
}

export const DEFAULT_COMPLIANCE_FILTERS: ComplianceFilters = {
  search: '',
  empresaId: 'todos',
  setorId: 'todos',
  situacao: 'todos',
  somenteAlterados: false,
};

export type EpiWizardStep = 0 | 1 | 2;
export const EPI_WIZARD_STEPS = ['Configuração', 'Inspeção', 'Revisão'] as const;

export interface EpiAuditFormData {
  dataAuditoria: string; // 'YYYY-MM-DD'
}

export const EMPTY_EPI_FORM: EpiAuditFormData = { dataAuditoria: '' };

/** Um funcionário dentro de uma auditoria já realizada (nova ou legada). */
export interface EpiAuditMember {
  funcionarioId: string | null; // null só é possível em auditorias legadas sem correspondência
  nome: string;
  conforme: boolean;
  recordId: string | null; // id da linha em concremrh_epi (só em auditorias no formato novo)
}

/**
 * Uma auditoria reconstruída a partir de 1+ linhas de concremrh_epi.
 * `isLegacy` = true: registro único (funcionario_id null) anterior à correção
 * de persistência — o detalhe por funcionário vem de texto livre em `observacoes`.
 */
export interface EpiAuditGroup {
  auditoriaId: string;
  isLegacy: boolean;
  data: string; // data_entrega
  titulo: string;
  createdAt: string;
  totalAuditados: number;
  conformes: number;
  naoConformes: number;
  taxaConformidade: number | null; // % — null se totalAuditados === 0
  membros: EpiAuditMember[];
  summaryRecordId: string | null;
  memberRecordIds: string[]; // todas as linhas do banco pertencentes a esta auditoria (para editar/excluir)
}

export interface EpiHistoryFilters {
  search: string;
  empresaId: string;
  setorId: string;
  dataInicial: string;
  dataFinal: string;
  taxaMinima: string; // '' = sem filtro
  somenteComNaoConformidades: boolean;
}

export const DEFAULT_EPI_HISTORY_FILTERS: EpiHistoryFilters = {
  search: '',
  empresaId: 'todos',
  setorId: 'todos',
  dataInicial: '',
  dataFinal: '',
  taxaMinima: '',
  somenteComNaoConformidades: false,
};

export interface EpiNonConformityRow {
  funcionarioId: string | null;
  nome: string;
  setorId: string | null;
  setorNome: string | null;
  empresaId: string | null;
  empresaNome: string | null;
  ocorrencias: number;
  ultimaOcorrencia: string; // data da auditoria mais recente com não conformidade
  reincidente: boolean;
  auditoriaIds: string[]; // auditorias em que esse funcionário foi não conforme (mais recentes primeiro)
  ocorrenciasDatas: string[]; // datas correspondentes a auditoriaIds, na mesma ordem
}

export interface EpiNonConformityFilters {
  search: string;
  empresaId: string;
  setorId: string;
  funcionarioId: string;
  dataInicial: string;
  dataFinal: string;
  somenteReincidentes: boolean;
}

export const DEFAULT_NON_CONFORMITY_FILTERS: EpiNonConformityFilters = {
  search: '',
  empresaId: 'todos',
  setorId: 'todos',
  funcionarioId: 'todos',
  dataInicial: '',
  dataFinal: '',
  somenteReincidentes: false,
};
