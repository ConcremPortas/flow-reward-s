import { describe, it, expect } from 'vitest';
import { normalizeStr, shouldShowDescription } from './dssLocationPresentation';
import { normalizeForDuplicate, isValidLocalNome, toPersistedNome } from './dssLocationValidation';
import { buildDssLocationUsageMaps, usageFor, hasActiveLinks } from './dssLocationDependencies';
import { getDssLocationStatus } from './dssLocationStatus';
import {
  matchesDssLocationFilters, computeDssLocationContext, countActiveDssLocationFilters,
} from './dssLocationFilters';
import { DEFAULT_DSS_LOCATION_FILTERS, type DssLocationRow, type DssLocationUsage } from '../types/dss-location.types';
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { DSS } from '@/hooks/useDSS';
import type { LocalDSS } from '@/hooks/useLocaisDSS';

const local = (over: Partial<LocalDSS> & { id: string; nome: string }): LocalDSS => ({ ativo: true, created_at: '', updated_at: '', ...over });
const emp = (over: Partial<Funcionario> & { id: string }): Funcionario => ({ nome: 'X', ativo: true, created_at: '', updated_at: '', ...over });
const dss = (over: Partial<DSS> & { id: string }): DSS => ({ titulo: 'DSS', data_realizacao: '2026-05-01', created_at: '', updated_at: '', ...over });

// ---------- apresentação ----------
describe('apresentação (descrição)', () => {
  it('oculta descrição vazia', () => {
    expect(shouldShowDescription('Fábrica 01', '')).toBe(false);
    expect(shouldShowDescription('Fábrica 01', null)).toBe(false);
  });
  it('oculta descrição igual ao nome (normalizada)', () => {
    expect(shouldShowDescription('Fábrica 01', ' fábrica 01 ')).toBe(false);
  });
  it('mostra descrição que acrescenta contexto', () => {
    expect(shouldShowDescription('Fábrica 01', 'Turno da manhã')).toBe(true);
  });
  it('normalizeStr remove acento/caixa/espaços', () => {
    expect(normalizeStr('  Fábrica  01 ')).toBe('fabrica 01');
  });
});

// ---------- validação/duplicidade ----------
describe('validação e duplicidade', () => {
  it('nome obrigatório', () => {
    expect(isValidLocalNome('  ')).toBe(false);
    expect(isValidLocalNome('Fábrica 01')).toBe(true);
    expect(toPersistedNome('  Fábrica 01 ')).toBe('Fábrica 01');
  });
  it('duplicidade por caixa/espaços; Fábrica 01 ≠ Fábrica 02', () => {
    expect(normalizeForDuplicate('Fábrica 01')).toBe(normalizeForDuplicate(' fábrica 01 '));
    expect(normalizeForDuplicate('Fábrica 01')).not.toBe(normalizeForDuplicate('Fábrica 02'));
  });
});

// ---------- cobertura/histórico ----------
describe('buildDssLocationUsageMaps / usageFor', () => {
  const locais = [local({ id: 'l1', nome: 'Fábrica 01' }), local({ id: 'l2', nome: 'Fábrica 02' })];
  const funcionarios = [
    emp({ id: 'e1', local_dss_id: 'l1', ativo: true }),
    emp({ id: 'e2', local_dss_id: 'l1', ativo: true }),
    emp({ id: 'e3', local_dss_id: 'l1', ativo: false }),
    emp({ id: 'e4', ativo: true }), // sem local
  ];
  const dssRecords = [
    dss({ id: 'd1', local_dss_id: 'l1', data_realizacao: '2026-04-10', participantes_ids: ['e1', 'e2'] }),
    dss({ id: 'd2', local_dss_id: 'l1', data_realizacao: '2026-05-12', participantes_ids: ['e1'] }),
  ];

  it('conta funcionários (ativos/inativos), DSS, presenças, média e última data', () => {
    const maps = buildDssLocationUsageMaps(funcionarios, dssRecords);
    expect(maps.semLocal).toBe(1); // e4
    const u = usageFor(locais[0], maps);
    expect(u.funcionarios).toBe(3);
    expect(u.funcionariosAtivos).toBe(2);
    expect(u.funcionariosInativos).toBe(1);
    expect(u.dssRealizados).toBe(2);
    expect(u.presencas).toBe(3);           // 2 + 1
    expect(u.presencaMedia).toBe(2);       // round(3/2)
    expect(u.ultimaData).toBe('2026-05-12');
    expect(u.ultimosDss[0].id).toBe('d2'); // mais recente primeiro
    // participação média = média(min(presentes/ativos,1)) = média(min(2/2,1), min(1/2,1)) = (1 + 0.5)/2 = 0.75
    expect(u.participacaoMediaPct).toBe(75);
    expect(u.emUso).toBe(true);
    expect(hasActiveLinks(u)).toBe(true);
  });

  it('local sem funcionários e sem DSS', () => {
    const maps = buildDssLocationUsageMaps(funcionarios, dssRecords);
    const u = usageFor(locais[1], maps);
    expect(u.funcionarios).toBe(0);
    expect(u.dssRealizados).toBe(0);
    expect(u.emUso).toBe(false);
    expect(u.participacaoMediaPct).toBeNull();
    expect(hasActiveLinks(u)).toBe(false);
  });
});

// ---------- situação ----------
describe('getDssLocationStatus', () => {
  const u = (over: Partial<DssLocationUsage>): DssLocationUsage => ({
    funcionarios: 0, funcionariosAtivos: 0, funcionariosInativos: 0, dssRealizados: 0, presencas: 0,
    presencaMedia: 0, participacaoMediaPct: null, ultimaData: null, ultimosDss: [], emUso: false, temHistorico: false, ...over,
  });
  it('em uso quando há funcionários e DSS', () => {
    expect(getDssLocationStatus({ usage: u({ funcionarios: 5, dssRealizados: 3 }), duplicado: false }).status).toBe('em_uso');
  });
  it('sem funcionários', () => {
    expect(getDssLocationStatus({ usage: u({ funcionarios: 0, dssRealizados: 2 }), duplicado: false }).status).toBe('sem_funcionarios');
  });
  it('sem histórico quando há funcionários mas nenhum DSS', () => {
    expect(getDssLocationStatus({ usage: u({ funcionarios: 5, dssRealizados: 0 }), duplicado: false }).status).toBe('sem_historico');
  });
  it('revisar quando duplicado', () => {
    expect(getDssLocationStatus({ usage: u({ funcionarios: 5, dssRealizados: 3 }), duplicado: true }).status).toBe('revisar');
  });
});

// ---------- filtros/contexto ----------
describe('filtros e faixa de contexto', () => {
  const mkRow = (over: Partial<DssLocationRow> & { id: string; nome: string }): DssLocationRow => ({
    descricao: null, mostrarDescricao: false, duplicado: false,
    usage: { funcionarios: 0, funcionariosAtivos: 0, funcionariosInativos: 0, dssRealizados: 0, presencas: 0, presencaMedia: 0, participacaoMediaPct: null, ultimaData: null, ultimosDss: [], emUso: false, temHistorico: false },
    status: { status: 'sem_funcionarios', motivos: [], descricao: '' }, ...over,
  });
  const f1 = mkRow({ id: 'l1', nome: 'Fábrica 01', usage: { funcionarios: 141, funcionariosAtivos: 138, funcionariosInativos: 3, dssRealizados: 8, presencas: 900, presencaMedia: 112, participacaoMediaPct: 80, ultimaData: '2026-05-12', ultimosDss: [], emUso: true, temHistorico: true }, status: { status: 'em_uso', motivos: [], descricao: '' } });
  const f2 = mkRow({ id: 'l2', nome: 'Fábrica 02' });
  const rows = [f1, f2];

  it('busca por nome', () => {
    expect(matchesDssLocationFilters(f1, { ...DEFAULT_DSS_LOCATION_FILTERS, search: 'fabrica 01' })).toBe(true);
    expect(matchesDssLocationFilters(f2, { ...DEFAULT_DSS_LOCATION_FILTERS, search: 'fabrica 01' })).toBe(false);
  });
  it('filtros de utilização', () => {
    expect(matchesDssLocationFilters(f1, { ...DEFAULT_DSS_LOCATION_FILTERS, utilizacao: 'com_funcionarios' })).toBe(true);
    expect(matchesDssLocationFilters(f2, { ...DEFAULT_DSS_LOCATION_FILTERS, utilizacao: 'sem_funcionarios' })).toBe(true);
    expect(matchesDssLocationFilters(f1, { ...DEFAULT_DSS_LOCATION_FILTERS, utilizacao: 'com_historico' })).toBe(true);
    expect(matchesDssLocationFilters(f2, { ...DEFAULT_DSS_LOCATION_FILTERS, utilizacao: 'sem_historico' })).toBe(true);
    expect(countActiveDssLocationFilters({ ...DEFAULT_DSS_LOCATION_FILTERS, utilizacao: 'com_historico', situacao: 'em_uso' })).toBe(2);
  });
  it('faixa de contexto agrega e recebe funcionários sem local', () => {
    expect(computeDssLocationContext(rows, 7)).toMatchObject({ locais: 2, funcionariosVinculados: 141, funcionariosSemLocal: 7, dssRealizados: 8, ultimaData: '2026-05-12' });
  });
});
