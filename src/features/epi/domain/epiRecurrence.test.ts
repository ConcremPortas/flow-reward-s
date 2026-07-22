import { describe, it, expect } from 'vitest';
import { buildEmployeeTimelines, isReincidente, buildNonConformityRows } from './epiRecurrence';
import type { EpiAuditGroup } from '../types/epi.types';
import type { Funcionario } from '@/hooks/useFuncionarios';

const mkGroup = (auditoriaId: string, data: string, membros: EpiAuditGroup['membros']): EpiAuditGroup => ({
  auditoriaId, data, isLegacy: false, titulo: 'Auditoria', createdAt: `${data}T10:00:00Z`,
  totalAuditados: membros.length, conformes: membros.filter((m) => m.conforme).length,
  naoConformes: membros.filter((m) => !m.conforme).length, taxaConformidade: null,
  membros, summaryRecordId: null, memberRecordIds: [],
});

describe('buildEmployeeTimelines', () => {
  it('agrupa eventos por funcionario_id através de várias auditorias (mais recente primeiro)', () => {
    const groups = [
      mkGroup('a3', '2026-07-01', [{ funcionarioId: 'f1', nome: 'Ana', conforme: false, recordId: 'r3' }]),
      mkGroup('a2', '2026-06-01', [{ funcionarioId: 'f1', nome: 'Ana', conforme: true, recordId: 'r2' }]),
      mkGroup('a1', '2026-05-01', [{ funcionarioId: 'f1', nome: 'Ana', conforme: false, recordId: 'r1' }]),
    ];
    const timelines = buildEmployeeTimelines(groups);
    expect(timelines).toHaveLength(1);
    expect(timelines[0].events.map((e) => e.auditoriaId)).toEqual(['a3', 'a2', 'a1']);
  });

  it('funcionários legados (sem id) são agrupados por nome', () => {
    const groups = [
      mkGroup('legacy:x', '2026-05-01', [{ funcionarioId: null, nome: 'Carlos', conforme: false, recordId: null }]),
    ];
    const timelines = buildEmployeeTimelines(groups);
    expect(timelines[0].key).toBe('legacy-name:carlos');
  });
});

describe('isReincidente', () => {
  it('2+ não conformidades nas últimas 3 auditorias → reincidente', () => {
    const events = [
      { auditoriaId: 'a3', data: '2026-07-01', conforme: false },
      { auditoriaId: 'a2', data: '2026-06-01', conforme: false },
      { auditoriaId: 'a1', data: '2026-05-01', conforme: true },
    ];
    expect(isReincidente(events)).toBe(true);
  });

  it('apenas 1 não conformidade nas últimas 3 → não reincidente', () => {
    const events = [
      { auditoriaId: 'a3', data: '2026-07-01', conforme: false },
      { auditoriaId: 'a2', data: '2026-06-01', conforme: true },
      { auditoriaId: 'a1', data: '2026-05-01', conforme: true },
    ];
    expect(isReincidente(events)).toBe(false);
  });

  it('não conformidade fora da janela das últimas 3 não conta', () => {
    const events = [
      { auditoriaId: 'a4', data: '2026-08-01', conforme: true },
      { auditoriaId: 'a3', data: '2026-07-01', conforme: true },
      { auditoriaId: 'a2', data: '2026-06-01', conforme: false },
      { auditoriaId: 'a1', data: '2026-05-01', conforme: false }, // fora da janela de 3
    ];
    expect(isReincidente(events)).toBe(false);
  });
});

describe('buildNonConformityRows', () => {
  const funcionariosById = new Map([
    ['f1', { id: 'f1', nome: 'Ana', setor_id: 's1', empresa_id: 'e1', setor: { nome: 'Produção' }, empresa: { nome: 'Concrem' } } as Funcionario],
  ]);

  it('inclui apenas funcionários com ao menos 1 não conformidade', () => {
    const groups = [
      mkGroup('a1', '2026-07-01', [
        { funcionarioId: 'f1', nome: 'Ana', conforme: false, recordId: 'r1' },
        { funcionarioId: 'f2', nome: 'Bruno', conforme: true, recordId: 'r2' },
      ]),
    ];
    const timelines = buildEmployeeTimelines(groups);
    const rows = buildNonConformityRows(timelines, funcionariosById);
    expect(rows).toHaveLength(1);
    expect(rows[0].nome).toBe('Ana');
    expect(rows[0].setorNome).toBe('Produção');
    expect(rows[0].ocorrencias).toBe(1);
  });

  it('ordena por número de ocorrências (maior primeiro)', () => {
    const groups = [
      mkGroup('a2', '2026-07-01', [
        { funcionarioId: 'f1', nome: 'Ana', conforme: false, recordId: 'r1' },
        { funcionarioId: 'f2', nome: 'Bruno', conforme: false, recordId: 'r2' },
      ]),
      mkGroup('a1', '2026-06-01', [
        { funcionarioId: 'f2', nome: 'Bruno', conforme: false, recordId: 'r3' },
      ]),
    ];
    const timelines = buildEmployeeTimelines(groups);
    const rows = buildNonConformityRows(timelines, funcionariosById);
    expect(rows[0].nome).toBe('Bruno');
    expect(rows[0].ocorrencias).toBe(2);
  });
});
