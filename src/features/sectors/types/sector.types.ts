// Tipos da Central de Estrutura Organizacional (setores). Só contratos.
//
// Auditoria (relacionamentos): `concremrh_setores` tem empresa_id → empresas
// (FK, ON DELETE CASCADE), supervisor_id e encarregado_id → concremrh_funcionarios
// (FK, ON DELETE SET NULL). Os três são OPCIONAIS (nullable; o formulário legado
// marca supervisor/encarregado como "Opcional"). A exclusão é SOFT (ativo=false)
// — preservada. Funcionários vinculam-se por `setor_id` e/ou `setor_ids[]`. Não
// há constraint de unicidade de nome no banco — a duplicidade é checada só na app.

export type RegistrationStatusKind = 'completo' | 'atencao' | 'pendente';
export type PendenciaSeverity = 'alta' | 'media' | 'baixa';

export interface Pendencia {
  code: 'empresa' | 'supervisor' | 'encarregado' | 'funcionarios';
  severity: PendenciaSeverity;
  label: string;
}

export interface RegistrationStatus {
  status: RegistrationStatusKind;
  pendencias: Pendencia[];
  descricao: string;
}

/** Contagem de vínculos de um setor (agregada em lote — sem N+1). */
export interface SectorLinks {
  funcionarios: number;
  producao: number;
  indicadores: number;
}

/** Linha enriquecida de setor (setor + derivações de apresentação/status/vínculos). */
export interface SectorRow {
  id: string;
  nome: string;
  descricao: string | null;
  empresaId: string | null;
  empresaNome: string | null;
  supervisorId: string | null;
  supervisorNome: string | null;
  encarregadoId: string | null;
  encarregadoNome: string | null;
  links: SectorLinks;
  status: RegistrationStatus;
  /** Decisão de exibição da descrição (evita repetir o nome). */
  descricaoDisplay: { show: boolean; text: string };
}

export interface SectorFilters {
  search: string;
  empresaId: string;      // 'todos' | id
  supervisorId: string;   // 'todos' | id | '__sem__'
  encarregadoId: string;  // 'todos' | id | '__sem__'
  situacao: 'todos' | RegistrationStatusKind;
}

export const DEFAULT_SECTOR_FILTERS: SectorFilters = {
  search: '', empresaId: 'todos', supervisorId: 'todos', encarregadoId: 'todos', situacao: 'todos',
};

export type SectorTab = 'todos' | 'completa' | 'pendencias';

/** Grupo da visão Estrutura de Liderança (por supervisor). */
export interface LeadershipGroupData {
  supervisorId: string | null;
  supervisorNome: string;
  setores: SectorRow[];
  encarregadosUnicos: number;
  funcionariosVinculados: number;
  comPendencia: number;
}
