// Tipos da Central de Gestão de DSS. Só contratos — sem lógica.

export type PresenceState = 'presente' | 'ausente';
export type AttendanceRowKind = 'sem_alteracao' | 'alterado';
export type PresenceMap = Record<string, boolean>;

export interface AttendanceFilters {
  search: string;
  setorId: string;
  presenca: 'todos' | 'presentes' | 'ausentes';
}

export const DEFAULT_ATTENDANCE_FILTERS: AttendanceFilters = {
  search: '',
  setorId: 'todos',
  presenca: 'todos',
};

export interface HistoryFilters {
  search: string;
  localId: string;
  competenciaInicial: string;
  competenciaFinal: string;
  participacao: 'todos' | 'baixa' | 'alta'; // baixa < 70%, alta >= 90% (ver dssCalculations)
}

export const DEFAULT_HISTORY_FILTERS: HistoryFilters = {
  search: '',
  localId: 'todos',
  competenciaInicial: '',
  competenciaFinal: '',
  participacao: 'todos',
};

export type DssWizardStep = 0 | 1 | 2;
export const DSS_WIZARD_STEPS = ['Informações', 'Lista de Presença', 'Revisão'] as const;

export interface DssFormData {
  localDssId: string;
  dataRealizacao: string; // 'YYYY-MM-DD'
  tema: string;
}

export const EMPTY_DSS_FORM: DssFormData = { localDssId: '', dataRealizacao: '', tema: '' };

export interface LocationSummary {
  vinculados: number;
  ultimoDss: { data: string; tema: string } | null;
  dssRecentes: number; // últimos 90 dias
  participacaoMedia: number | null; // % média histórica do local
}

export interface DssHistoryRow {
  id: string;
  titulo: string;
  data_realizacao: string;
  localNome: string | null;
  localId: string | null;
  presentes: number;
  totalVinculado: number | null; // null se não puder ser recuperado com segurança
  participacao: number | null; // % presentes/totalVinculado
}
