// Tipos da Gestão de Locais de DSS. Só contratos.
//
// Auditoria: entidade `LocalDSS` (tabela `concremrh_locais_dss`). Campos
// persistidos: id, nome, descricao?, ativo, created_at, updated_at. O formulário
// legado edita nome/descricao. Exclusão é SOFT (ativo=false; fetch filtra ativo=true).
//
// Relações reais (FK direta → concremrh_locais_dss):
//   - funcionarios.local_dss_id (direto)
//   - concremrh_dss.local_dss_id (direto) — a PRESENÇA é o array `participantes_ids`
//     na própria linha do DSS (não há tabela separada de presença).
// O motor de premiação NÃO usa o local (usa presença no DSS por funcionário,
// independente do cadastro de local).
//
// "Fábrica 01 - NOITE": NÃO há campo de turno/jornada/grupo — a distinção existe
// apenas no texto do NOME. O modelo trata tudo como "local" (nome livre).

export interface DssLocationUsage {
  funcionarios: number;        // funcionários vinculados (local_dss_id)
  funcionariosAtivos: number;
  funcionariosInativos: number;
  dssRealizados: number;       // registros de DSS com este local (FK)
  presencas: number;           // soma de participantes_ids ao longo dos DSS
  presencaMedia: number;       // presenças / dssRealizados (arredondado)
  participacaoMediaPct: number | null; // média (presentes/vinculados ativos), best-effort
  ultimaData: string | null;   // data_realizacao mais recente ('YYYY-MM-DD')
  ultimosDss: { id: string; titulo: string; data: string; presentes: number }[];
  emUso: boolean;              // funcionários > 0 || dss > 0
  temHistorico: boolean;       // dss > 0
}

export type DssLocationStatusKind = 'em_uso' | 'sem_funcionarios' | 'sem_historico' | 'revisar';

export interface DssLocationStatus {
  status: DssLocationStatusKind;
  motivos: string[];
  descricao: string;
}

export interface DssLocationRow {
  id: string;
  nome: string;
  descricao: string | null;
  mostrarDescricao: boolean;   // descrição acrescenta contexto (≠ nome, não vazia)
  usage: DssLocationUsage;
  status: DssLocationStatus;
  duplicado: boolean;
}

export interface DssLocationFilters {
  search: string;
  utilizacao: 'todos' | 'com_funcionarios' | 'sem_funcionarios' | 'com_historico' | 'sem_historico';
  situacao: 'todos' | DssLocationStatusKind;
}

export const DEFAULT_DSS_LOCATION_FILTERS: DssLocationFilters = {
  search: '', utilizacao: 'todos', situacao: 'todos',
};
