import { describe, it, expect } from 'vitest';
import type { Cargo } from '@/hooks/useCargos';
import type { Setor } from '@/hooks/useSetores';
import type { FuncionarioSensivel } from '@/hooks/useFuncionariosSensivel';
import type { Funcao } from '@/hooks/useFuncoes';
import type { HistoricoCargo } from '@/hooks/useHistoricoCargos';
import type { EstruturaHierarquica } from '@/hooks/useEstruturaHierarquica';
import { derivarSituacao, SITUACAO_LABEL } from './jobStatus';
import { calcularOcupacao, construirJobRows, salarioPorFuncionario } from './jobOccupancy';
import { detectarDuplicidade, validarCampos, podeSalvar } from './jobValidation';
import { levantarDependencias } from './jobDependencies';
import { calcularContexto } from './jobDataQuality';
import { distribuicaoPorNivel, cargosPorSetor, matrizSetorNivel, matrizCelulaKey } from './jobStructure';
import { analisarFuncoes } from './jobFunctionMapping';
import { filtrarJobRows, contarFiltrosAtivos } from './jobFilters';
import { buildJobsModel } from './jobModel';
import { normalizeJobsView } from '../views';
import { DEFAULT_JOB_FILTERS } from '../types/job.types';
import { derivarEnquadramentos } from '@/features/jobs-salaries/domain/enquadramento';

const cargo = (o: Partial<Cargo> & { id: string; nome: string }): Cargo => ({
  ativo: true, created_at: '2026-01-01', updated_at: '2026-01-01', ...o,
});
const colab = (o: Partial<FuncionarioSensivel> & { id: string }): FuncionarioSensivel => ({
  nome: 'X', salario: null, email: null, funcao_id: null, categoria_id: null, setor_id: null, ativo: true, ...o,
});
const hist = (o: Partial<HistoricoCargo> & { id: string; funcionario_id: string; data_mudanca: string }): HistoricoCargo => ({
  tipo_mudanca: 'promocao', created_at: '2026-01-01', updated_at: '2026-01-01', ...o,
});
const setor = (id: string, nome: string): Setor => ({ id, nome, ativo: true, created_at: '2026-01-01', updated_at: '2026-01-01' });
const estr = (o: Partial<EstruturaHierarquica> & { id: string; cargo_id: string }): EstruturaHierarquica => ({
  nivel_hierarquico: 1, pode_aprovar_mudancas: false, quantidade_subordinados_diretos: 0, ativo: true,
  created_at: '2026-01-01', updated_at: '2026-01-01', ...o,
});
const funcao = (id: string, nome: string): Funcao => ({ id, nome, ativo: true, created_at: '2026-01-01', updated_at: '2026-01-01' });

describe('jobStatus — situação derivada', () => {
  it('cargo completo e ocupado é regular', () => {
    const c = cargo({ id: 'c1', nome: 'A', setor_id: 's1', nivel_hierarquico: 1, salario_minimo: 1000, salario_maximo: 2000 });
    expect(derivarSituacao(c, 3, 0).situacao).toBe('regular');
  });
  it('uma lacuna estrutural vira a lacuna específica', () => {
    const c = cargo({ id: 'c1', nome: 'A', setor_id: 's1', salario_minimo: 1000, salario_maximo: 2000 }); // sem nível
    expect(derivarSituacao(c, 1, 0).situacao).toBe('sem_nivel');
  });
  it('duas lacunas estruturais viram configuração incompleta', () => {
    const c = cargo({ id: 'c1', nome: 'A' }); // sem setor, sem nível, sem faixa
    const r = derivarSituacao(c, 0, null);
    expect(r.situacao).toBe('configuracao_incompleta');
    expect(r.lacunas).toContain('sem_ocupantes');
  });
  it('sem ocupantes quando estrutura ok', () => {
    const c = cargo({ id: 'c1', nome: 'A', setor_id: 's1', nivel_hierarquico: 1, salario_minimo: 1000, salario_maximo: 2000 });
    expect(derivarSituacao(c, 0, 0).situacao).toBe('sem_ocupantes');
  });
  it('revisar enquadramento quando há salário fora da faixa', () => {
    const c = cargo({ id: 'c1', nome: 'A', setor_id: 's1', nivel_hierarquico: 1, salario_minimo: 1000, salario_maximo: 2000 });
    expect(derivarSituacao(c, 2, 1).situacao).toBe('revisar_enquadramento');
    expect(Object.keys(SITUACAO_LABEL)).toContain('revisar_enquadramento');
  });
});

describe('jobOccupancy — ocupação via enquadramento (não funcao_id)', () => {
  const cargos = [cargo({ id: 'c1', nome: 'A', salario_minimo: 1000, salario_maximo: 2000 }), cargo({ id: 'c2', nome: 'B' })];
  const historico = [
    hist({ id: 'h1', funcionario_id: 'f1', data_mudanca: '2026-01-01', cargo_id: 'c1' }),
    hist({ id: 'h2', funcionario_id: 'f2', data_mudanca: '2026-01-01', cargo_id: 'c1' }),
  ];
  it('conta ocupantes por cargo e detecta fora da faixa (autorizado)', () => {
    const enq = derivarEnquadramentos(historico);
    const sal = salarioPorFuncionario([colab({ id: 'f1', salario: 1500 }), colab({ id: 'f2', salario: 5000 })]);
    const occ = calcularOcupacao(cargos, enq, sal, true);
    expect(occ.get('c1')?.ocupantes).toBe(2);
    expect(occ.get('c1')?.ocupantesForaDaFaixa).toBe(1); // 5000 > 2000
    expect(occ.get('c2')?.ocupantes).toBe(0);
  });
  it('não autorizado → fora da faixa é null', () => {
    const enq = derivarEnquadramentos(historico);
    const occ = calcularOcupacao(cargos, enq, new Map(), false);
    expect(occ.get('c1')?.ocupantesForaDaFaixa).toBeNull();
  });
  it('construirJobRows combina situação + ocupação', () => {
    const enq = derivarEnquadramentos(historico);
    const occ = calcularOcupacao(cargos, enq, new Map(), false);
    const rows = construirJobRows(cargos, occ);
    expect(rows.find((r) => r.cargo.id === 'c2')?.situacao).toBe('configuracao_incompleta');
    expect(rows.find((r) => r.cargo.id === 'c1')?.ocupantes).toBe(2);
  });
});

describe('jobValidation — duplicidade observacional e campos', () => {
  const cargos = [cargo({ id: 'c1', nome: 'Analista Fiscal' })];
  it('detecta duplicidade por nome (acento/caixa-insensível), ignorando o próprio', () => {
    expect(detectarDuplicidade('analista  fiscal'.replace('  ', ' '), cargos).duplicado).toBe(true);
    expect(detectarDuplicidade('Analista Fiscal', cargos, 'c1').duplicado).toBe(false);
    expect(detectarDuplicidade('Outro', cargos).duplicado).toBe(false);
  });
  it('valida faixa coerente e nível inteiro', () => {
    expect(podeSalvar(validarCampos({ nome: 'AB', nivel: '', salarioMin: '', salarioMax: '' }))).toBe(true);
    expect(validarCampos({ nome: 'AB', nivel: '', salarioMin: '3000', salarioMax: '1000' }).faixaCoerente).toBe(false);
    expect(validarCampos({ nome: 'AB', nivel: '1.5', salarioMin: '', salarioMax: '' }).nivelValido).toBe(false);
    expect(validarCampos({ nome: 'A', nivel: '', salarioMin: '', salarioMax: '' }).nomeValido).toBe(false);
  });
});

describe('jobDependencies — não assume 0 ocupantes = exclusão segura', () => {
  it('bloqueia exclusão com histórico mesmo sem ocupantes atuais', () => {
    const historico = [hist({ id: 'h1', funcionario_id: 'f1', data_mudanca: '2020-01-01', cargo_anterior_id: 'c1' })];
    const enq = derivarEnquadramentos([]); // ninguém enquadrado hoje
    const dep = levantarDependencias(cargo({ id: 'c1', nome: 'A' }), enq, historico, []);
    expect(dep.ocupantesAtuais).toBe(0);
    expect(dep.registrosHistorico).toBe(1);
    expect(dep.podeExcluir).toBe(false);
    expect(dep.podeInativar).toBe(true);
  });
  it('bloqueia exclusão com subordinados na estrutura', () => {
    const dep = levantarDependencias(cargo({ id: 'c1', nome: 'A' }), new Map(), [], [estr({ id: 'e1', cargo_id: 'c2', cargo_superior_id: 'c1' })]);
    expect(dep.subordinadosDiretos).toBe(1);
    expect(dep.podeExcluir).toBe(false);
  });
  it('permite exclusão quando não há nenhum vínculo', () => {
    const dep = levantarDependencias(cargo({ id: 'c1', nome: 'A' }), new Map(), [], []);
    expect(dep.podeExcluir).toBe(true);
  });
});

describe('jobStructure — distribuição, cobertura e matriz', () => {
  const cargos = [
    cargo({ id: 'c1', nome: 'A', setor_id: 's1', nivel_hierarquico: 1 }),
    cargo({ id: 'c2', nome: 'B', setor_id: 's1', nivel_hierarquico: 2 }),
    cargo({ id: 'c3', nome: 'C' }), // sem setor, sem nível
  ];
  const historico = [hist({ id: 'h1', funcionario_id: 'f1', data_mudanca: '2026-01-01', cargo_id: 'c1' })];
  const enq = derivarEnquadramentos(historico);
  const occ = calcularOcupacao(cargos, enq, new Map(), false);
  const rows = construirJobRows(cargos, occ);
  const setores = [setor('s1', 'Produção'), setor('s2', 'Adm')];

  it('distribuição por nível separa "Sem nível" por último', () => {
    const dist = distribuicaoPorNivel(rows);
    expect(dist[dist.length - 1].nivel).toBe('Sem nível');
    expect(dist.find((d) => d.nivel === '1')?.ocupantes).toBe(1);
  });
  it('cobertura por setor inclui setores sem cargos e "Sem setor"', () => {
    const cob = cargosPorSetor(rows, setores);
    expect(cob.find((s) => s.setorId === 's2')?.cobertura).toBe('sem_cargos');
    expect(cob.find((s) => s.setorNome === 'Sem setor')?.cargos).toBe(1);
    expect(cob.find((s) => s.setorId === 's1')?.cobertura).toBe('estruturado');
  });
  it('matriz setor×nível indexa por chave estável', () => {
    const m = matrizSetorNivel(rows, setores);
    expect(m.niveis).toContain('1');
    const cel = m.celulas.get(matrizCelulaKey('s1', '1'));
    expect(cel?.cargos).toBe(1);
    expect(cel?.estado).toBe('estruturado');
  });
});

describe('jobFunctionMapping — sem conversão automática', () => {
  it('conta colaboradores por função e sugere cargo equivalente (só observacional)', () => {
    const res = analisarFuncoes(
      [funcao('fx', 'Soldador'), funcao('fy', 'Pintor')],
      [colab({ id: 'f1', funcao_id: 'fx' }), colab({ id: 'f2', funcao_id: 'fx' })],
      [cargo({ id: 'c1', nome: 'Soldador' })],
    );
    const soldador = res.itens.find((i) => i.funcaoId === 'fx')!;
    expect(soldador.colaboradores).toBe(2);
    expect(soldador.cargoEquivalenteId).toBe('c1'); // sugestão, não aplicada
    expect(res.funcoesSemColaboradores).toBe(1);
  });
});

describe('jobFilters + views + contexto + model', () => {
  const cargos = [
    cargo({ id: 'c1', nome: 'Analista', setor_id: 's1', nivel_hierarquico: 1, salario_minimo: 1000, salario_maximo: 2000 }),
    cargo({ id: 'c2', nome: 'Auxiliar', ativo: false }),
  ];
  const historico = [hist({ id: 'h1', funcionario_id: 'f1', data_mudanca: '2026-01-01', cargo_id: 'c1' })];
  const occ = calcularOcupacao(cargos, derivarEnquadramentos(historico), new Map(), false);
  const rows = construirJobRows(cargos, occ);

  it('normalizeJobsView cai em lista', () => {
    expect(normalizeJobsView('estrutura')).toBe('estrutura');
    expect(normalizeJobsView('zzz')).toBe('lista');
  });
  it('filtra por status/ocupação/faixa e conta filtros ativos', () => {
    expect(filtrarJobRows(rows, DEFAULT_JOB_FILTERS)).toHaveLength(1); // só ativos
    expect(filtrarJobRows(rows, { ...DEFAULT_JOB_FILTERS, status: 'todos' })).toHaveLength(2);
    expect(filtrarJobRows(rows, { ...DEFAULT_JOB_FILTERS, ocupacao: 'sem_ocupantes' })).toHaveLength(0);
    expect(filtrarJobRows(rows, { ...DEFAULT_JOB_FILTERS, faixa: 'com_faixa' })).toHaveLength(1);
    expect(contarFiltrosAtivos({ ...DEFAULT_JOB_FILTERS, status: 'todos', busca: 'x' })).toBe(2);
  });
  it('contexto conta ativos/ocupados/sem faixa', () => {
    const ctx = calcularContexto(rows);
    expect(ctx.total).toBe(2);
    expect(ctx.ativos).toBe(1);
    expect(ctx.ocupados).toBe(1);
    expect(ctx.semFaixa).toBe(1);
  });
  it('buildJobsModel marca não implantado quando não há cargos', () => {
    const model = buildJobsModel({ cargos: [], setores: [], funcionarios: [colab({ id: 'f1', funcao_id: 'fx' })], funcoes: [funcao('fx', 'F')], historico: [], estrutura: [], autorizadoSalario: false });
    expect(model.naoImplantado).toBe(true);
    expect(model.colaboradoresAtivos).toBe(1);
    expect(model.funcaoMapping.funcoesDistintas).toBe(1);
  });
});
