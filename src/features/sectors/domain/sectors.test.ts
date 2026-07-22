import { describe, it, expect } from 'vitest';
import type { Funcionario } from '@/hooks/useFuncionarios';
import { descricaoDisplay, normalizeStr } from './sectorPresentation';
import { getSectorRegistrationStatus } from './sectorRegistrationStatus';
import { buildDependencyMaps, linksFor, hasBlockingDependencies } from './sectorDependencies';
import { matchesSectorFilters, matchesTab, computeSummary, SEM_LIDERANCA } from './sectorFilters';
import { buildLeadershipGroups, computeLeadershipSummary } from './leadershipStructure';
import { DEFAULT_SECTOR_FILTERS, type SectorRow } from '../types/sector.types';

const row = (over: Partial<SectorRow>): SectorRow => {
  // Spread respeita null explícito em `over` (não usar ?? nos campos anuláveis).
  const base: SectorRow = {
    id: 's1', nome: 'Montagem', descricao: null, empresaId: 'e1', empresaNome: 'Concrem',
    supervisorId: 'sup1', supervisorNome: 'Thallison', encarregadoId: 'enc1', encarregadoNome: 'Gabriel',
    links: { funcionarios: 5, producao: 0, indicadores: 0 },
    status: { status: 'completo', pendencias: [], descricao: '' },
    descricaoDisplay: { show: false, text: '' },
  };
  const merged = { ...base, ...over };
  if (!over.status) merged.status = getSectorRegistrationStatus({ empresaId: merged.empresaId, supervisorId: merged.supervisorId, encarregadoId: merged.encarregadoId, funcionarios: merged.links.funcionarios });
  return merged;
};

describe('apresentação da descrição', () => {
  it('vazia → não exibe', () => expect(descricaoDisplay('Montagem', '')).toEqual({ show: false, text: '' }));
  it('igual ao nome (normalizada) → não repete', () => {
    expect(descricaoDisplay('Montagem', 'montagem ').show).toBe(false);
    expect(descricaoDisplay('Almoxarifado', 'ALMOXARIFADO').show).toBe(false);
  });
  it('diferente → exibe texto original', () => expect(descricaoDisplay('Montagem', 'Linha 2')).toEqual({ show: true, text: 'Linha 2' }));
  it('normalizeStr remove acentos/caixa', () => expect(normalizeStr('Produção ')).toBe('producao'));
});

describe('situação cadastral (campos opcionais → pendência organizacional)', () => {
  it('tudo definido + funcionários → completo', () => {
    expect(getSectorRegistrationStatus({ empresaId: 'e', supervisorId: 's', encarregadoId: 'c', funcionarios: 3 }).status).toBe('completo');
  });
  it('sem empresa → pendente', () => {
    const st = getSectorRegistrationStatus({ empresaId: null, supervisorId: 's', encarregadoId: 'c', funcionarios: 3 });
    expect(st.status).toBe('pendente');
    expect(st.pendencias.some(p => p.code === 'empresa')).toBe(true);
  });
  it('sem ambas as lideranças → pendente', () => {
    expect(getSectorRegistrationStatus({ empresaId: 'e', supervisorId: null, encarregadoId: null, funcionarios: 3 }).status).toBe('pendente');
  });
  it('só falta um encarregado → atenção (não bloqueia)', () => {
    expect(getSectorRegistrationStatus({ empresaId: 'e', supervisorId: 's', encarregadoId: null, funcionarios: 3 }).status).toBe('atencao');
  });
  it('sem funcionários vira pendência de baixa severidade', () => {
    const st = getSectorRegistrationStatus({ empresaId: 'e', supervisorId: 's', encarregadoId: 'c', funcionarios: 0 });
    expect(st.pendencias.some(p => p.code === 'funcionarios')).toBe(true);
    expect(st.status).toBe('atencao');
  });
});

describe('dependências em lote (sem N+1)', () => {
  const mkFunc = (id: string, over: Partial<Funcionario>): Funcionario => ({ id, nome: id, ativo: true, created_at: '', updated_at: '', ...over });
  it('conta funcionários por setor_id e setor_ids, sem duplicar', () => {
    const funcs = [mkFunc('f1', { setor_id: 's1' }), mkFunc('f2', { setor_ids: ['s1', 's2'] }), mkFunc('f3', { setor_id: 's1', setor_ids: ['s1'] }), mkFunc('f4', { setor_id: 's1', ativo: false })];
    const maps = buildDependencyMaps(funcs, [{ setor_id: 's1' }, { setor_id: 's1' }], [{ setor_id: 's2' }]);
    expect(linksFor('s1', maps).funcionarios).toBe(3); // f1,f2,f3 (f4 inativo fora); f3 não conta 2x
    expect(linksFor('s1', maps).producao).toBe(2);
    expect(linksFor('s2', maps).funcionarios).toBe(1);
    expect(linksFor('s2', maps).indicadores).toBe(1);
  });
  it('funcionários vinculados sinalizam impacto na exclusão', () => {
    expect(hasBlockingDependencies({ funcionarios: 3, producao: 0, indicadores: 0 })).toBe(true);
    expect(hasBlockingDependencies({ funcionarios: 0, producao: 5, indicadores: 0 })).toBe(false);
  });
});

describe('filtros e abas', () => {
  const rows = [
    row({ id: 's1', nome: 'Montagem', supervisorId: 'sup1', empresaId: 'e1' }),
    row({ id: 's2', nome: 'Pintura', supervisorId: null, encarregadoId: null, empresaId: 'e1', links: { funcionarios: 0, producao: 0, indicadores: 0 } }),
  ];
  it('busca por nome/empresa/liderança', () => {
    expect(matchesSectorFilters(rows[0], { ...DEFAULT_SECTOR_FILTERS, search: 'thall' }, )).toBe(true);
    expect(matchesSectorFilters(rows[0], { ...DEFAULT_SECTOR_FILTERS, search: 'pintura' })).toBe(false);
  });
  it('filtro "sem supervisor"', () => {
    expect(matchesSectorFilters(rows[1], { ...DEFAULT_SECTOR_FILTERS, supervisorId: SEM_LIDERANCA })).toBe(true);
    expect(matchesSectorFilters(rows[0], { ...DEFAULT_SECTOR_FILTERS, supervisorId: SEM_LIDERANCA })).toBe(false);
  });
  it('abas completa/pendências', () => {
    expect(matchesTab(rows[0], 'completa')).toBe(true);
    expect(matchesTab(rows[1], 'pendencias')).toBe(true);
    expect(matchesTab(rows[1], 'completa')).toBe(false);
  });
  it('resumo agrega métricas reais', () => {
    const s = computeSummary(rows);
    expect(s.total).toBe(2);
    expect(s.completos).toBe(1);
    expect(s.semSupervisor).toBe(1);
    expect(s.semFuncionarios).toBe(1);
  });
});

describe('estrutura de liderança', () => {
  const rows = [
    row({ id: 's1', supervisorId: 'sup1', supervisorNome: 'Thallison', encarregadoId: 'enc1', links: { funcionarios: 16, producao: 0, indicadores: 0 } }),
    row({ id: 's2', supervisorId: 'sup1', supervisorNome: 'Thallison', encarregadoId: 'enc1', links: { funcionarios: 12, producao: 0, indicadores: 0 } }),
    row({ id: 's3', supervisorId: null, encarregadoId: null, links: { funcionarios: 4, producao: 0, indicadores: 0 } }),
  ];
  it('agrupa por supervisor com contagens por ID único; sem supervisor por último', () => {
    const groups = buildLeadershipGroups(rows);
    expect(groups[0].supervisorNome).toBe('Thallison');
    expect(groups[0].setores).toHaveLength(2);
    expect(groups[0].encarregadosUnicos).toBe(1); // mesmo enc1 nos 2 setores
    expect(groups[0].funcionariosVinculados).toBe(28);
    expect(groups[groups.length - 1].supervisorId).toBeNull();
  });
  it('resumo conta supervisores/encarregados por ID', () => {
    const s = computeLeadershipSummary(rows);
    expect(s.supervisores).toBe(1);
    expect(s.encarregados).toBe(1);
    expect(s.setores).toBe(3);
  });
});
