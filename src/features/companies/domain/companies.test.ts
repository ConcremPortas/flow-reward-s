import { describe, it, expect } from 'vitest';
import { onlyDigits, formatCNPJ, maskCNPJInput } from './cnpjFormatting';
import { isValidCNPJ, hasCNPJValue, isCNPJComplete } from './cnpjValidation';
import { isValidCompanyName, normalizeName, cnpjKey, toPersistedName } from './companyValidation';
import { buildCompanyUsageMaps, usageFor, hasActiveLinks } from './companyDependencies';
import { getCompanyRegistrationStatus } from './companyRegistrationStatus';
import { matchesCompanyFilters, computeCompanySummary, countActiveCompanyFilters } from './companyFilters';
import { DEFAULT_COMPANY_FILTERS, type CompanyRow } from '../types/company.types';
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { Setor } from '@/hooks/useSetores';
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
import type { Empresa } from '@/hooks/useEmpresas';

// CNPJ real válido para teste: 11.222.333/0001-81
const CNPJ_OK = '11222333000181';
const CNPJ_FMT = '11.222.333/0001-81';

const emp = (over: Partial<Empresa> & { id: string; nome: string }): Empresa => ({ ativo: true, created_at: '', updated_at: '', ...over });
const setor = (over: Partial<Setor> & { id: string; nome: string }): Setor => ({ ativo: true, created_at: '', updated_at: '', ...over } as Setor);
const func = (over: Partial<Funcionario> & { id: string }): Funcionario => ({ nome: 'X', ativo: true, created_at: '', updated_at: '', ...over });
const res = (funcionarioId: string): ResultadoPremiacao => ({
  id: Math.random().toString(36), mes_competencia: '2026-05-01', nome: 'x', funcionario_id: funcionarioId,
  nota_epi: 1, nota_faltas: 1, nota_advertencias: 1, nota_dss: 1, nota_geral: 1, bonus_possivel: 0, bonus_alcancado: 0, created_at: '', updated_at: '',
} as ResultadoPremiacao);

describe('CNPJ — formatação', () => {
  it('onlyDigits e formatCNPJ', () => {
    expect(onlyDigits('11.222.333/0001-81')).toBe(CNPJ_OK);
    expect(formatCNPJ(CNPJ_OK)).toBe(CNPJ_FMT);
    expect(formatCNPJ('112223330001')).toBe('112223330001'); // incompleto: devolve como está
  });
  it('maskCNPJInput progressivo', () => {
    expect(maskCNPJInput('11222')).toBe('11.222');
    expect(maskCNPJInput(CNPJ_OK)).toBe(CNPJ_FMT);
  });
});

describe('CNPJ — validação (dígitos verificadores)', () => {
  it('válido com e sem máscara', () => {
    expect(isValidCNPJ(CNPJ_OK)).toBe(true);
    expect(isValidCNPJ(CNPJ_FMT)).toBe(true);
  });
  it('inválido: DV errado, tamanho, repetido', () => {
    expect(isValidCNPJ('11222333000180')).toBe(false); // DV errado
    expect(isValidCNPJ('112223330001')).toBe(false);    // curto
    expect(isValidCNPJ('00000000000000')).toBe(false);  // repetido
  });
  it('hasCNPJValue e isCNPJComplete', () => {
    expect(hasCNPJValue('')).toBe(false);
    expect(hasCNPJValue('11')).toBe(true);
    expect(isCNPJComplete(CNPJ_FMT)).toBe(true);
    expect(isCNPJComplete('11')).toBe(false);
  });
});

describe('validação de empresa', () => {
  it('nome obrigatório / persistência apara', () => {
    expect(isValidCompanyName('  ')).toBe(false);
    expect(isValidCompanyName('Concrem Industrial')).toBe(true);
    expect(toPersistedName('  Concrem ')).toBe('Concrem');
  });
  it('normalizeName e cnpjKey', () => {
    expect(normalizeName('  Concrem  Industrial ')).toBe('concrem industrial');
    expect(cnpjKey(CNPJ_FMT)).toBe(CNPJ_OK);
    expect(cnpjKey(null)).toBe('');
  });
});

describe('estrutura vinculada (lote, sem N+1)', () => {
  const empresas = [emp({ id: 'e1', nome: 'Concrem Industrial' }), emp({ id: 'e2', nome: 'Outra' })];
  const setores = [setor({ id: 's1', nome: 'A', empresa_id: 'e1' }), setor({ id: 's2', nome: 'B', empresa_id: 'e1' })];
  const funcionarios = [
    func({ id: 'f1', empresa_id: 'e1', ativo: true }),
    func({ id: 'f2', empresa_id: 'e1', ativo: true }),
    func({ id: 'f3', empresa_id: 'e1', ativo: false }),
  ];
  const resultados = [res('f1'), res('f1'), res('f2')];

  it('conta setores, funcionários, ativos e resultados (via funcionário)', () => {
    const maps = buildCompanyUsageMaps(setores, funcionarios, resultados);
    const u = usageFor(empresas[0], maps);
    expect(u.setores).toBe(2);
    expect(u.funcionarios).toBe(3);
    expect(u.funcionariosAtivos).toBe(2);
    expect(u.resultadosHistoricos).toBe(3);
    expect(u.temVinculos).toBe(true);
    expect(hasActiveLinks(u)).toBe(true);
  });
  it('empresa sem vínculos', () => {
    const maps = buildCompanyUsageMaps(setores, funcionarios, resultados);
    const u = usageFor(empresas[1], maps);
    expect(u.temVinculos).toBe(false);
    expect(hasActiveLinks(u)).toBe(false);
  });
});

describe('situação cadastral', () => {
  it('completo com CNPJ válido', () => {
    expect(getCompanyRegistrationStatus({ ativo: true, nome: 'Concrem', cnpjInformado: true, cnpjValido: true, duplicadoCnpj: false }).status).toBe('completo');
  });
  it('revisar com CNPJ ausente (opcional, não bloqueante)', () => {
    const s = getCompanyRegistrationStatus({ ativo: true, nome: 'Concrem', cnpjInformado: false, cnpjValido: false, duplicadoCnpj: false });
    expect(s.status).toBe('revisar');
    expect(s.motivos.join(' ')).toContain('CNPJ não informado');
  });
  it('revisar com CNPJ inválido', () => {
    expect(getCompanyRegistrationStatus({ ativo: true, nome: 'Concrem', cnpjInformado: true, cnpjValido: false, duplicadoCnpj: false }).status).toBe('revisar');
  });
  it('inativo reflete a coluna ativo', () => {
    expect(getCompanyRegistrationStatus({ ativo: false, nome: 'Concrem', cnpjInformado: true, cnpjValido: true, duplicadoCnpj: false }).status).toBe('inativo');
  });
});

describe('filtros e resumo', () => {
  const mkRow = (over: Partial<CompanyRow> & { id: string; nome: string }): CompanyRow => ({
    cnpj: null, ativo: true, cnpjValido: false, cnpjInformado: false, duplicadoCnpj: false,
    usage: { setores: 0, funcionarios: 0, funcionariosAtivos: 0, resultadosHistoricos: 0, temVinculos: false },
    status: { status: 'completo', motivos: [], descricao: '' }, ...over,
  });
  const concrem = mkRow({ id: 'e1', nome: 'Concrem Industrial', cnpj: CNPJ_FMT, cnpjInformado: true, cnpjValido: true,
    usage: { setores: 42, funcionarios: 286, funcionariosAtivos: 286, resultadosHistoricos: 100, temVinculos: true } });
  const revisar = mkRow({ id: 'e2', nome: 'Sem CNPJ', status: { status: 'revisar', motivos: ['x'], descricao: '' } });
  const rows = [concrem, revisar];

  it('busca por nome e por CNPJ (com e sem máscara)', () => {
    expect(matchesCompanyFilters(concrem, { ...DEFAULT_COMPANY_FILTERS, search: 'concrem' })).toBe(true);
    expect(matchesCompanyFilters(concrem, { ...DEFAULT_COMPANY_FILTERS, search: '11.222.333' })).toBe(true);
    expect(matchesCompanyFilters(concrem, { ...DEFAULT_COMPANY_FILTERS, search: '11222333' })).toBe(true);
    expect(matchesCompanyFilters(revisar, { ...DEFAULT_COMPANY_FILTERS, search: 'concrem' })).toBe(false);
  });
  it('filtro por situação', () => {
    expect(matchesCompanyFilters(revisar, { ...DEFAULT_COMPANY_FILTERS, situacao: 'revisar' })).toBe(true);
    expect(matchesCompanyFilters(concrem, { ...DEFAULT_COMPANY_FILTERS, situacao: 'revisar' })).toBe(false);
    expect(countActiveCompanyFilters({ ...DEFAULT_COMPANY_FILTERS, situacao: 'revisar' })).toBe(1);
  });
  it('resumo', () => {
    const s = computeCompanySummary(rows);
    expect(s).toMatchObject({ total: 2, ativas: 2, aRevisar: 1, setoresVinculados: 42, funcionariosVinculados: 286 });
  });
});
