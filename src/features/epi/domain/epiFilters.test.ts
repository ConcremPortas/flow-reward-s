import { describe, it, expect } from 'vitest';
import { matchesComplianceFilters, matchesEpiHistoryRow, matchesNonConformityRow } from './epiFilters';
import { DEFAULT_COMPLIANCE_FILTERS, DEFAULT_EPI_HISTORY_FILTERS, DEFAULT_NON_CONFORMITY_FILTERS } from '../types/epi.types';
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { EpiAuditGroupEnriched } from './epiCalculations';
import type { EpiNonConformityRow } from '../types/epi.types';

const mkFuncionario = (over: Partial<Funcionario>): Funcionario => ({
  id: 'f1', nome: 'Ana Silva', cpf: '111', setor_id: 's1', empresa_id: 'e1',
  setor: { nome: 'Produção' }, funcao: { nome: 'Operador' }, ativo: true, created_at: '', updated_at: '', ...over,
} as Funcionario);

describe('matchesComplianceFilters', () => {
  it('busca por nome, código, setor e função', () => {
    const f = mkFuncionario({});
    expect(matchesComplianceFilters(f, { ...DEFAULT_COMPLIANCE_FILTERS, search: 'ana' }, {}, {})).toBe(true);
    expect(matchesComplianceFilters(f, { ...DEFAULT_COMPLIANCE_FILTERS, search: '111' }, {}, {})).toBe(true);
    expect(matchesComplianceFilters(f, { ...DEFAULT_COMPLIANCE_FILTERS, search: 'produção' }, {}, {})).toBe(true);
    expect(matchesComplianceFilters(f, { ...DEFAULT_COMPLIANCE_FILTERS, search: 'operador' }, {}, {})).toBe(true);
    expect(matchesComplianceFilters(f, { ...DEFAULT_COMPLIANCE_FILTERS, search: 'zzz' }, {}, {})).toBe(false);
  });

  it('filtra por situação (conforme = ausência no map)', () => {
    const f = mkFuncionario({ id: 'f1' });
    expect(matchesComplianceFilters(f, { ...DEFAULT_COMPLIANCE_FILTERS, situacao: 'conformes' }, {}, {})).toBe(true);
    expect(matchesComplianceFilters(f, { ...DEFAULT_COMPLIANCE_FILTERS, situacao: 'nao_conformes' }, {}, {})).toBe(false);
    expect(matchesComplianceFilters(f, { ...DEFAULT_COMPLIANCE_FILTERS, situacao: 'nao_conformes' }, { f1: false }, {})).toBe(true);
  });

  it('somenteAlterados exige diferença entre draft e baseline', () => {
    const f = mkFuncionario({ id: 'f1' });
    expect(matchesComplianceFilters(f, { ...DEFAULT_COMPLIANCE_FILTERS, somenteAlterados: true }, { f1: false }, { f1: true })).toBe(true);
    expect(matchesComplianceFilters(f, { ...DEFAULT_COMPLIANCE_FILTERS, somenteAlterados: true }, { f1: true }, { f1: true })).toBe(false);
  });

  it('filtra por empresa e setor', () => {
    const f = mkFuncionario({ empresa_id: 'e1', setor_id: 's1' });
    expect(matchesComplianceFilters(f, { ...DEFAULT_COMPLIANCE_FILTERS, empresaId: 'e2' }, {}, {})).toBe(false);
    expect(matchesComplianceFilters(f, { ...DEFAULT_COMPLIANCE_FILTERS, setorId: 's1' }, {}, {})).toBe(true);
  });
});

describe('matchesEpiHistoryRow', () => {
  const mkGroup = (over: Partial<EpiAuditGroupEnriched>): EpiAuditGroupEnriched => ({
    auditoriaId: 'a1', isLegacy: false, data: '2026-07-01', titulo: 'Auditoria de EPI', createdAt: '',
    totalAuditados: 10, conformes: 8, naoConformes: 2, taxaConformidade: 80,
    membros: [], summaryRecordId: null, memberRecordIds: [],
    empresaIds: new Set(['e1']), setorIds: new Set(['s1']), ...over,
  });

  it('filtra por texto no título', () => {
    const g = mkGroup({ titulo: 'Auditoria de EPI — Julho' });
    expect(matchesEpiHistoryRow(g, { ...DEFAULT_EPI_HISTORY_FILTERS, search: 'julho' })).toBe(true);
    expect(matchesEpiHistoryRow(g, { ...DEFAULT_EPI_HISTORY_FILTERS, search: 'agosto' })).toBe(false);
  });

  it('filtra por período', () => {
    const g = mkGroup({ data: '2026-07-15' });
    expect(matchesEpiHistoryRow(g, { ...DEFAULT_EPI_HISTORY_FILTERS, dataInicial: '2026-07-01', dataFinal: '2026-07-31' })).toBe(true);
    expect(matchesEpiHistoryRow(g, { ...DEFAULT_EPI_HISTORY_FILTERS, dataInicial: '2026-08-01' })).toBe(false);
  });

  it('empresa/setor funcionam como filtro de relevância (algum membro no escopo)', () => {
    const g = mkGroup({ empresaIds: new Set(['e1']), setorIds: new Set(['s1']) });
    expect(matchesEpiHistoryRow(g, { ...DEFAULT_EPI_HISTORY_FILTERS, empresaId: 'e1' })).toBe(true);
    expect(matchesEpiHistoryRow(g, { ...DEFAULT_EPI_HISTORY_FILTERS, empresaId: 'e2' })).toBe(false);
  });

  it('taxaMinima e somenteComNaoConformidades', () => {
    const g = mkGroup({ taxaConformidade: 60, naoConformes: 4 });
    expect(matchesEpiHistoryRow(g, { ...DEFAULT_EPI_HISTORY_FILTERS, taxaMinima: '70' })).toBe(false);
    expect(matchesEpiHistoryRow(g, { ...DEFAULT_EPI_HISTORY_FILTERS, taxaMinima: '50' })).toBe(true);
    expect(matchesEpiHistoryRow(g, { ...DEFAULT_EPI_HISTORY_FILTERS, somenteComNaoConformidades: true })).toBe(true);
    expect(matchesEpiHistoryRow(mkGroup({ naoConformes: 0 }), { ...DEFAULT_EPI_HISTORY_FILTERS, somenteComNaoConformidades: true })).toBe(false);
  });
});

describe('matchesNonConformityRow', () => {
  const mkRow = (over: Partial<EpiNonConformityRow>): EpiNonConformityRow => ({
    funcionarioId: 'f1', nome: 'Ana', setorId: 's1', setorNome: 'Produção', empresaId: 'e1', empresaNome: 'Concrem',
    ocorrencias: 2, ultimaOcorrencia: '2026-07-01', reincidente: true, auditoriaIds: ['a1', 'a2'],
    ocorrenciasDatas: ['2026-07-01', '2026-05-01'], ...over,
  });

  it('filtra por reincidência', () => {
    expect(matchesNonConformityRow(mkRow({ reincidente: true }), { ...DEFAULT_NON_CONFORMITY_FILTERS, somenteReincidentes: true })).toBe(true);
    expect(matchesNonConformityRow(mkRow({ reincidente: false }), { ...DEFAULT_NON_CONFORMITY_FILTERS, somenteReincidentes: true })).toBe(false);
  });

  it('filtra por período usando qualquer ocorrência dentro do intervalo', () => {
    const row = mkRow({ ocorrenciasDatas: ['2026-07-01', '2026-01-01'] });
    expect(matchesNonConformityRow(row, { ...DEFAULT_NON_CONFORMITY_FILTERS, dataInicial: '2026-06-01' })).toBe(true);
    expect(matchesNonConformityRow(row, { ...DEFAULT_NON_CONFORMITY_FILTERS, dataInicial: '2026-08-01' })).toBe(false);
  });

  it('filtra por empresa/setor/funcionário específico', () => {
    const row = mkRow({ empresaId: 'e1', setorId: 's1', funcionarioId: 'f1' });
    expect(matchesNonConformityRow(row, { ...DEFAULT_NON_CONFORMITY_FILTERS, empresaId: 'e2' })).toBe(false);
    expect(matchesNonConformityRow(row, { ...DEFAULT_NON_CONFORMITY_FILTERS, funcionarioId: 'f1' })).toBe(true);
  });
});
