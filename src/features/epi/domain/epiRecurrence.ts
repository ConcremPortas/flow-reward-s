// Reincidência de não conformidade de EPI — função centralizada e documentada.
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { EpiAuditGroup, EpiNonConformityRow } from '../types/epi.types';

export interface EmployeeAuditEvent {
  auditoriaId: string;
  data: string;
  conforme: boolean;
}

export interface EmployeeTimeline {
  /** Chave de identidade: funcionario_id real, ou "legacy-name:<nome>" para auditorias legadas sem id. */
  key: string;
  funcionarioId: string | null;
  nome: string;
  /** Eventos ordenados do mais recente para o mais antigo. */
  events: EmployeeAuditEvent[];
}

/** Linha do tempo de conformidade por funcionário, construída a partir das auditorias já agrupadas. */
export function buildEmployeeTimelines(groups: EpiAuditGroup[]): EmployeeTimeline[] {
  const byKey = new Map<string, EmployeeTimeline>();

  // groups já vem ordenado do mais recente para o mais antigo (groupEpiRecords).
  for (const g of groups) {
    for (const m of g.membros) {
      const key = m.funcionarioId ? m.funcionarioId : `legacy-name:${m.nome.toLowerCase()}`;
      let t = byKey.get(key);
      if (!t) {
        t = { key, funcionarioId: m.funcionarioId, nome: m.nome, events: [] };
        byKey.set(key, t);
      }
      t.events.push({ auditoriaId: g.auditoriaId, data: g.data, conforme: m.conforme });
    }
  }

  return [...byKey.values()];
}

export const RECURRENCE_WINDOW = 3;
export const RECURRENCE_THRESHOLD = 2;

/**
 * Reincidente: 2 ou mais não conformidades dentro das últimas 3 auditorias em
 * que o funcionário foi auditado (regra sugerida na especificação da tarefa,
 * adotada como está — não alterada nem reinterpretada).
 * `events` deve vir ordenado do mais recente para o mais antigo.
 */
export function isReincidente(events: EmployeeAuditEvent[]): boolean {
  const recentes = events.slice(0, RECURRENCE_WINDOW);
  return recentes.filter((e) => !e.conforme).length >= RECURRENCE_THRESHOLD;
}

/** Linhas da Visão "Não Conformidades" — um funcionário por linha, com histórico e reincidência. */
export function buildNonConformityRows(
  timelines: EmployeeTimeline[],
  funcionariosById: Map<string, Funcionario>,
): EpiNonConformityRow[] {
  const rows: EpiNonConformityRow[] = [];

  for (const t of timelines) {
    const naoConformes = t.events.filter((e) => !e.conforme);
    if (naoConformes.length === 0) continue;
    const f = t.funcionarioId ? funcionariosById.get(t.funcionarioId) : undefined;

    rows.push({
      funcionarioId: t.funcionarioId,
      nome: t.nome,
      setorId: f?.setor_id ?? null,
      setorNome: f?.setor?.nome ?? null,
      empresaId: f?.empresa_id ?? null,
      empresaNome: f?.empresa?.nome ?? null,
      ocorrencias: naoConformes.length,
      ultimaOcorrencia: naoConformes[0].data,
      reincidente: isReincidente(t.events),
      auditoriaIds: naoConformes.map((e) => e.auditoriaId),
      ocorrenciasDatas: naoConformes.map((e) => e.data),
    });
  }

  return rows.sort((a, b) => b.ocorrencias - a.ocorrencias || (a.ultimaOcorrencia < b.ultimaOcorrencia ? 1 : -1));
}
