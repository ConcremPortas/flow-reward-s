import { describe, it, expect } from 'vitest';
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { Cargo } from '@/hooks/useCargos';
import type { FuncionarioSensivel } from '@/hooks/useFuncionariosSensivel';
import type { Funcao } from '@/hooks/useFuncoes';
import type { HistoricoCargo } from '@/hooks/useHistoricoCargos';
import { calcularPosicaoSalarial } from './employeeSalaryPosition';
import { derivarEnquadramento } from './employeeJobStatus';
import { buildEmployeeRows, calcularContexto } from './employeeJobModel';
import { filtrarColaboradores, ordenarColaboradores, paginar, totalPaginas, contarFiltrosAtivos } from './employeeFilters';
import { agregarPendencias, pendenciasPorSetor } from './employeeJobIssues';
import { mapearFuncoes } from './employeeJobMapping';
import { normalizeJobEmployeesView } from '../views';
import { DEFAULT_JOB_EMPLOYEE_FILTERS } from '../types/job-employee.types';

const cargo = (o: Partial<Cargo> & { id: string; nome: string }): Cargo => ({ ativo: true, created_at: '2026-01-01', updated_at: '2026-01-01', ...o });
const func = (o: Partial<Funcionario> & { id: string; nome: string }): Funcionario => ({ ativo: true, status: 'Ativo', created_at: '2026-01-01', updated_at: '2026-01-01', ...o });
const hist = (o: Partial<HistoricoCargo> & { id: string; funcionario_id: string; data_mudanca: string }): HistoricoCargo => ({ tipo_mudanca: 'enquadramento', created_at: '2026-01-01', updated_at: '2026-01-01', ...o });
const funcao = (id: string, nome: string): Funcao => ({ id, nome, ativo: true, created_at: '2026-01-01', updated_at: '2026-01-01' });
const sens = (id: string, salario: number | null): FuncionarioSensivel => ({ id, nome: 'X', salario, email: null, funcao_id: null, categoria_id: null, setor_id: null, ativo: true });

describe('employeeSalaryPosition — guardada e sem zero fictício', () => {
  it('sem autorização = restrito', () => {
    expect(calcularPosicaoSalarial(cargo({ id: 'c', nome: 'A', salario_minimo: 1000, salario_maximo: 2000 }), 1500, false)).toBe('restrito');
  });
  it('salário ausente não vira zero', () => {
    expect(calcularPosicaoSalarial(cargo({ id: 'c', nome: 'A', salario_minimo: 1000, salario_maximo: 2000 }), null, true)).toBe('sem_salario');
  });
  it('classifica abaixo/dentro/acima', () => {
    const c = cargo({ id: 'c', nome: 'A', salario_minimo: 1000, salario_maximo: 2000 });
    expect(calcularPosicaoSalarial(c, 900, true)).toBe('abaixo');
    expect(calcularPosicaoSalarial(c, 1500, true)).toBe('dentro');
    expect(calcularPosicaoSalarial(c, 2500, true)).toBe('acima');
    expect(calcularPosicaoSalarial(cargo({ id: 'c', nome: 'A' }), 1500, true)).toBe('sem_faixa');
  });
});

describe('employeeJobStatus — função ≠ cargo', () => {
  it('sem cargo mas com função = somente_funcao', () => {
    expect(derivarEnquadramento(true, null, 'restrito').situacao).toBe('somente_funcao');
  });
  it('sem cargo e sem função = sem_cargo', () => {
    expect(derivarEnquadramento(false, null, 'restrito').situacao).toBe('sem_cargo');
  });
  it('cargo completo e salário dentro = regular', () => {
    const c = cargo({ id: 'c', nome: 'A', nivel_hierarquico: 1, salario_minimo: 1000, salario_maximo: 2000 });
    expect(derivarEnquadramento(true, c, 'dentro').situacao).toBe('regular');
  });
  it('salário fora da faixa tem prioridade', () => {
    const c = cargo({ id: 'c', nome: 'A', nivel_hierarquico: 1, salario_minimo: 1000, salario_maximo: 2000 });
    expect(derivarEnquadramento(true, c, 'abaixo').situacao).toBe('abaixo_faixa');
    expect(derivarEnquadramento(true, c, 'acima').situacao).toBe('acima_faixa');
  });
});

describe('employeeJobModel — enquadramento via histórico, salário gated', () => {
  const funcionarios = [
    func({ id: 'f1', nome: 'Ana', funcao_id: 'fx', funcao: { nome: 'Auxiliar de Produção' }, setor_id: 's1', setor: { nome: 'Montagem de Kit' } }),
    func({ id: 'f2', nome: 'Bruno', funcao_id: 'fy', funcao: { nome: 'Pintor Industrial' }, setor_id: 's2', setor: { nome: 'Pintura' } }),
  ];
  const cargos = [cargo({ id: 'c1', nome: 'Auxiliar', nivel_hierarquico: 1, salario_minimo: 1000, salario_maximo: 2000 })];
  const historico = [hist({ id: 'h1', funcionario_id: 'f1', data_mudanca: '2026-01-01', cargo_id: 'c1' })];

  it('vincula cargo via histórico e mantém função separada', () => {
    const rows = buildEmployeeRows({ funcionarios, cargos, sensiveisPorId: { f1: sens('f1', 1500) }, historico, autorizadoSalario: true });
    const r1 = rows.find((r) => r.funcionario.id === 'f1')!;
    expect(r1.cargo?.id).toBe('c1');
    expect(r1.funcaoNome).toBe('Auxiliar de Produção');
    expect(r1.situacao).toBe('regular');
    const r2 = rows.find((r) => r.funcionario.id === 'f2')!;
    expect(r2.cargo).toBeNull();
    expect(r2.situacao).toBe('somente_funcao');
  });

  it('sem autorização não expõe salário e posição fica restrita', () => {
    const rows = buildEmployeeRows({ funcionarios, cargos, sensiveisPorId: { f1: sens('f1', 1500) }, historico, autorizadoSalario: false });
    const r1 = rows.find((r) => r.funcionario.id === 'f1')!;
    expect(r1.salario).toBeNull();
    expect(r1.posicaoSalarial).toBe('restrito');
  });

  it('contexto: cobertura de enquadramento e pendências', () => {
    const rows = buildEmployeeRows({ funcionarios, cargos, sensiveisPorId: {}, historico, autorizadoSalario: true });
    const ctx = calcularContexto(rows);
    expect(ctx.totalAtivos).toBe(2);
    expect(ctx.enquadrados).toBe(1);
    expect(ctx.semCargo).toBe(1);
    expect(ctx.coberturaEnquadramento).toBe(50);
    expect(ctx.funcoesDistintas).toBe(2);
  });
});

describe('employeeFilters — filtros, ordenação, paginação', () => {
  const rows = buildEmployeeRows({
    funcionarios: [
      func({ id: 'f1', nome: 'Ana', funcao_id: 'fx', setor_id: 's1' }),
      func({ id: 'f2', nome: 'Bruno', funcao_id: 'fy', setor_id: 's2', ativo: false, status: 'Rescisão' }),
      func({ id: 'f3', nome: 'Carla', funcao_id: 'fx', setor_id: 's1' }),
    ],
    cargos: [], sensiveisPorId: {}, historico: [], autorizadoSalario: false,
  });

  it('filtra por status (ativos por padrão) e por setor', () => {
    expect(filtrarColaboradores(rows, DEFAULT_JOB_EMPLOYEE_FILTERS)).toHaveLength(2);
    expect(filtrarColaboradores(rows, { ...DEFAULT_JOB_EMPLOYEE_FILTERS, status: 'todos' })).toHaveLength(3);
    expect(filtrarColaboradores(rows, { ...DEFAULT_JOB_EMPLOYEE_FILTERS, setorId: 's1' })).toHaveLength(2);
    expect(filtrarColaboradores(rows, { ...DEFAULT_JOB_EMPLOYEE_FILTERS, enquadramento: 'sem_cargo' })).toHaveLength(2);
  });

  it('busca por nome e ordena', () => {
    expect(filtrarColaboradores(rows, { ...DEFAULT_JOB_EMPLOYEE_FILTERS, busca: 'carla' })).toHaveLength(1);
    const ord = ordenarColaboradores(rows, { key: 'nome', dir: 'desc' });
    expect(ord[0].funcionario.nome).toBe('Carla');
  });

  it('pagina corretamente', () => {
    expect(paginar([1, 2, 3, 4, 5], 2, 2)).toEqual([3, 4]);
    expect(totalPaginas(288, 25)).toBe(12);
    expect(contarFiltrosAtivos({ ...DEFAULT_JOB_EMPLOYEE_FILTERS, setorId: 's1', busca: 'x' })).toBe(2);
  });
});

describe('employeeJobIssues + mapping + views', () => {
  const funcionarios = [
    func({ id: 'f1', nome: 'Ana', funcao_id: 'fx', funcao: { nome: 'Auxiliar' }, setor_id: 's1', setor: { nome: 'Montagem' } }),
    func({ id: 'f2', nome: 'Bea', funcao_id: 'fx', funcao: { nome: 'Auxiliar' }, setor_id: 's1', setor: { nome: 'Montagem' } }),
  ];
  const rows = buildEmployeeRows({ funcionarios, cargos: [], sensiveisPorId: {}, historico: [], autorizadoSalario: false });

  it('agrega pendências por tipo com severidade', () => {
    const issues = agregarPendencias(rows);
    const semCargo = issues.find((i) => i.situacao === 'somente_funcao')!;
    expect(semCargo.quantidade).toBe(2);
    expect(semCargo.setoresAfetados).toBe(1);
    expect(semCargo.filtro.enquadramento).toBe('sem_cargo');
  });

  it('agrupa pendências por setor', () => {
    const setores = pendenciasPorSetor(rows);
    expect(setores[0].total).toBe(2);
    expect(setores[0].semCargo).toBe(2);
  });

  it('mapeia função→cargo sem aplicar (sugestão por nome)', () => {
    const map = mapearFuncoes([funcao('fx', 'Auxiliar')], rows, [cargo({ id: 'c1', nome: 'Auxiliar' })]);
    expect(map[0].colaboradores).toBe(2);
    expect(map[0].cargoSugeridoId).toBe('c1');
    expect(map[0].jaEnquadrados).toBe(0);
    expect(map[0].conflito).toBe(false);
  });

  it('normalizeJobEmployeesView', () => {
    expect(normalizeJobEmployeesView('pendencias')).toBe('pendencias');
    expect(normalizeJobEmployeesView('zzz')).toBe('colaboradores');
  });
});
