import { describe, it, expect } from 'vitest';
import type { Cargo } from '@/hooks/useCargos';
import type { FuncionarioSensivel } from '@/hooks/useFuncionariosSensivel';
import type { Setor } from '@/hooks/useSetores';
import type { HistoricoCargo } from '@/hooks/useHistoricoCargos';
import {
  moneyLabel,
  countLabel,
  averageAvail,
  sumAvail,
  medianAvail,
  availZero,
  availValue,
  availUnset,
  availRestricted,
} from './dataAvailability';
import { derivarEnquadramentos, contarEnquadrados } from './enquadramento';
import {
  contarEstrutura,
  isModuloNaoImplantado,
  distribuicaoPorNivel,
  coberturaPorSetor,
  diagnosticoFuncaoCargo,
} from './structureAnalysis';
import { calcularMaturidade } from './structureMaturity';
import { calcularRemuneracao, calcularPosicionamento, calcularCompressao } from './compensation';
import { construirPendencias, resumirAtencao } from './governanceIssues';
import { filtrarCargos, filtrarColaboradores, contarFiltrosAtivos } from './filters';
import { normalizeJobsSalariesView } from '../views';
import { DEFAULT_FILTERS } from '../types/jobsSalaries.types';

// U+00A0 (NBSP) que o Intl insere em moeda pt-BR; normaliza para asserção estável.
const norm = (s: string) => s.split(String.fromCharCode(160)).join(' ');

const cargo = (o: Partial<Cargo> & { id: string; nome: string }): Cargo => ({
  ativo: true,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
  ...o,
});
const colab = (o: Partial<FuncionarioSensivel> & { id: string }): FuncionarioSensivel => ({
  nome: 'X',
  salario: null,
  email: null,
  funcao_id: null,
  categoria_id: null,
  setor_id: null,
  ativo: true,
  ...o,
});
const hist = (o: Partial<HistoricoCargo> & { id: string; funcionario_id: string; data_mudanca: string }): HistoricoCargo => ({
  tipo_mudanca: 'promocao',
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
  ...o,
});
const setor = (id: string, nome: string): Setor => ({
  id,
  nome,
  ativo: true,
  created_at: '2026-01-01',
  updated_at: '2026-01-01',
});

describe('dataAvailability — ausência nunca vira zero', () => {
  it('moneyLabel formata só valores reais; ausências têm rótulo próprio', () => {
    expect(norm(moneyLabel(availValue(1500)))).toBe('R$ 1.500,00');
    expect(norm(moneyLabel(availZero()))).toBe('R$ 0,00');
    expect(moneyLabel(availUnset())).toBe('Não informado');
    expect(moneyLabel(availRestricted())).toBe('Acesso restrito');
  });

  it('countLabel trata zero como fato', () => {
    expect(countLabel(availZero())).toBe('0');
    expect(countLabel(availValue(42))).toBe('42');
    expect(countLabel(availUnset())).toBe('Não informado');
  });

  it('média/soma/mediana: sem autorização = restrito; sem dados = não informado (não 0)', () => {
    expect(averageAvail([1000, 2000], false)).toEqual(availRestricted());
    expect(averageAvail([null, null], true)).toEqual(availUnset());
    expect(sumAvail([null, null], true)).toEqual(availUnset());
    expect(medianAvail([], true)).toEqual(availUnset());
    expect(averageAvail([1000, null, 3000], true).value).toBe(2000);
    expect(sumAvail([1000, null, 3000], true).value).toBe(4000);
    expect(medianAvail([1000, 3000, 2000], true).value).toBe(2000);
    expect(medianAvail([1000, 2000, 3000, 4000], true).value).toBe(2500);
  });
});

describe('enquadramento — vínculo funcionário↔cargo só via histórico', () => {
  it('usa o registro mais recente por colaborador', () => {
    const historico = [
      hist({ id: 'h1', funcionario_id: 'f1', data_mudanca: '2025-01-01', cargo_id: 'c1', cargo: { id: 'c1', nome: 'Aux' }, salario_novo: 1000 }),
      hist({ id: 'h2', funcionario_id: 'f1', data_mudanca: '2026-01-01', cargo_id: 'c2', cargo: { id: 'c2', nome: 'Analista' }, salario_novo: 2000 }),
    ];
    const map = derivarEnquadramentos(historico);
    expect(map.get('f1')?.cargoId).toBe('c2');
    expect(map.get('f1')?.salarioRegistrado).toBe(2000);
    expect(contarEnquadrados(map)).toBe(1);
  });

  it('histórico vazio = ninguém enquadrado', () => {
    const map = derivarEnquadramentos([]);
    expect(map.size).toBe(0);
    expect(contarEnquadrados(map)).toBe(0);
  });
});

describe('structureAnalysis — módulo não implantado e função≠cargo', () => {
  it('0 cargos = módulo não implantado', () => {
    const counts = contarEstrutura([], [], [colab({ id: 'f1', funcao_id: 'fx' })], [], new Map());
    expect(isModuloNaoImplantado(counts)).toBe(true);
    expect(counts.totalCargos).toBe(0);
    expect(counts.colaboradoresSemCargo).toBe(1);
  });

  it('conta enquadrados e sem-cargo corretamente', () => {
    const historico = [hist({ id: 'h1', funcionario_id: 'f1', data_mudanca: '2026-01-01', cargo_id: 'c1', cargo: { id: 'c1', nome: 'A' } })];
    const enq = derivarEnquadramentos(historico);
    const counts = contarEstrutura(
      [cargo({ id: 'c1', nome: 'A', nivel_hierarquico: 1 })],
      [setor('s1', 'Setor 1')],
      [colab({ id: 'f1' }), colab({ id: 'f2' })],
      [],
      enq,
    );
    expect(counts.totalEnquadrados).toBe(1);
    expect(counts.colaboradoresSemCargo).toBe(1);
    expect(counts.totalNiveis).toBe(1);
  });

  it('diagnóstico função×cargo não converte função em cargo', () => {
    const historico = [hist({ id: 'h1', funcionario_id: 'f1', data_mudanca: '2026-01-01', cargo_id: 'c1', cargo: { id: 'c1', nome: 'A' } })];
    const enq = derivarEnquadramentos(historico);
    const diag = diagnosticoFuncaoCargo(
      [cargo({ id: 'c1', nome: 'A' }), cargo({ id: 'c2', nome: 'B' })],
      [colab({ id: 'f1', funcao_id: 'fx' }), colab({ id: 'f2', funcao_id: 'fy' })],
      enq,
    );
    expect(diag.colaboradoresComFuncao).toBe(2);
    expect(diag.colaboradoresComCargo).toBe(1);
    expect(diag.colaboradoresSemVinculoCargo).toBe(1);
    expect(diag.cargosSemOcupante).toBe(1);
  });

  it('distribuição por nível agrupa cargos sem nível em "Sem nível"', () => {
    const dist = distribuicaoPorNivel(
      [cargo({ id: 'c1', nome: 'A', nivel_hierarquico: 2 }), cargo({ id: 'c2', nome: 'B' })],
      new Map(),
    );
    expect(dist.find((d) => d.nivel === 'Sem nível')?.cargos).toBe(1);
    expect(dist[dist.length - 1].nivel).toBe('Sem nível');
  });

  it('cobertura por setor conta cargos e headcount ativo', () => {
    const cob = coberturaPorSetor(
      [cargo({ id: 'c1', nome: 'A', setor_id: 's1' })],
      [setor('s1', 'Produção'), setor('s2', 'Adm')],
      [colab({ id: 'f1', setor_id: 's1' }), colab({ id: 'f2', setor_id: 's1', ativo: false })],
    );
    const s1 = cob.find((c) => c.setorId === 's1')!;
    expect(s1.cargos).toBe(1);
    expect(s1.colaboradores).toBe(1); // inativo não conta
  });
});

describe('structureMaturity', () => {
  it('módulo vazio = 0 e não implantado', () => {
    const counts = contarEstrutura([], [], [], [], new Map());
    const m = calcularMaturidade([], counts);
    expect(m.score).toBe(0);
    expect(m.classe).toBe('nao_implantado');
    expect(m.proximosPassos[0]).toMatch(/Cadastrar/);
  });

  it('estrutura completa pontua alto', () => {
    const cargos = [cargo({ id: 'c1', nome: 'A', nivel_hierarquico: 1, salario_minimo: 1000, salario_maximo: 2000, missao: 'm' })];
    const historico = [hist({ id: 'h1', funcionario_id: 'f1', data_mudanca: '2026-01-01', cargo_id: 'c1', cargo: { id: 'c1', nome: 'A' } })];
    const enq = derivarEnquadramentos(historico);
    const counts = contarEstrutura(cargos, [], [colab({ id: 'f1' })], [], enq);
    const m = calcularMaturidade(cargos, counts);
    expect(m.score).toBe(100);
    expect(m.classe).toBe('maduro');
  });
});

describe('compensation — guarda por autorização e dados', () => {
  it('sem autorização, tudo é restrito', () => {
    const r = calcularRemuneracao([colab({ id: 'f1', salario: 3000 })], false);
    expect(r.mediaSalarial).toEqual(availRestricted());
    expect(r.massaSalarial).toEqual(availRestricted());
  });

  it('autorizado sem salários = não informado (nunca 0)', () => {
    const r = calcularRemuneracao([colab({ id: 'f1', salario: null })], true);
    expect(r.mediaSalarial).toEqual(availUnset());
    expect(r.colaboradoresComSalario).toBe(0);
  });

  it('posicionamento indisponível sem faixas', () => {
    const res = calcularPosicionamento([cargo({ id: 'c1', nome: 'A' })], [], new Map(), true);
    expect(res.disponivel).toBe(false);
    expect(res.motivoIndisponivel).toMatch(/faixa/i);
  });

  it('posicionamento calcula compa-ratio com faixa + ocupante', () => {
    const cargos = [cargo({ id: 'c1', nome: 'A', salario_minimo: 1000, salario_maximo: 3000 })];
    const historico = [hist({ id: 'h1', funcionario_id: 'f1', data_mudanca: '2026-01-01', cargo_id: 'c1', cargo: { id: 'c1', nome: 'A' } })];
    const enq = derivarEnquadramentos(historico);
    const res = calcularPosicionamento(cargos, [colab({ id: 'f1', salario: 2000 })], enq, true);
    expect(res.disponivel).toBe(true);
    expect(res.itens[0].compaRatio.value).toBeCloseTo(1); // 2000 / ((1000+3000)/2)
  });

  it('compressão indisponível com menos de 2 níveis', () => {
    const res = calcularCompressao([cargo({ id: 'c1', nome: 'A', salario_minimo: 1000, salario_maximo: 2000, nivel_hierarquico: 1 })], true);
    expect(res.disponivel).toBe(false);
  });
});

describe('governanceIssues', () => {
  it('lista apenas pendências com quantidade > 0, ordenadas por severidade', () => {
    const cargos = [cargo({ id: 'c1', nome: 'A' })]; // sem faixa, sem nível, sem setor, sem descrição
    const historico: HistoricoCargo[] = [];
    const enq = derivarEnquadramentos(historico);
    const counts = contarEstrutura(cargos, [], [colab({ id: 'f1' })], [], enq);
    const diag = diagnosticoFuncaoCargo(cargos, [colab({ id: 'f1' })], enq);
    const issues = construirPendencias(cargos, [colab({ id: 'f1' })], counts, diag, false);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].severidade).toBe('alta');
    const resumo = resumirAtencao(issues);
    expect(resumo.totalPendencias).toBe(issues.length);
    expect(resumo.destaques.length).toBeLessThanOrEqual(3);
  });
});

describe('filters + views', () => {
  it('normalizeJobsSalariesView cai em resumo para inválidos', () => {
    expect(normalizeJobsSalariesView('remuneracao')).toBe('remuneracao');
    expect(normalizeJobsSalariesView('xyz')).toBe('resumo');
    expect(normalizeJobsSalariesView(null)).toBe('resumo');
  });

  it('filtra cargos por setor/nível/busca (acento-insensível)', () => {
    const cargos = [
      cargo({ id: 'c1', nome: 'Analista', setor_id: 's1', nivel_hierarquico: 2 }),
      cargo({ id: 'c2', nome: 'Encarregado', setor_id: 's2', nivel_hierarquico: 3 }),
    ];
    expect(filtrarCargos(cargos, { ...DEFAULT_FILTERS, setorId: 's1' })).toHaveLength(1);
    expect(filtrarCargos(cargos, { ...DEFAULT_FILTERS, nivel: '3' })[0].id).toBe('c2');
    expect(filtrarCargos(cargos, { ...DEFAULT_FILTERS, busca: 'ANALISTA' })).toHaveLength(1);
  });

  it('filtra colaboradores por status e cargo (via enquadramento)', () => {
    const historico = [hist({ id: 'h1', funcionario_id: 'f1', data_mudanca: '2026-01-01', cargo_id: 'c1', cargo: { id: 'c1', nome: 'A' } })];
    const enq = derivarEnquadramentos(historico);
    const colabs = [colab({ id: 'f1' }), colab({ id: 'f2', ativo: false })];
    expect(filtrarColaboradores(colabs, { ...DEFAULT_FILTERS, status: 'ativos' }, enq)).toHaveLength(1);
    expect(filtrarColaboradores(colabs, { ...DEFAULT_FILTERS, status: 'inativos' }, enq)).toHaveLength(1);
    expect(filtrarColaboradores(colabs, { ...DEFAULT_FILTERS, cargoId: 'c1' }, enq)).toHaveLength(1);
  });

  it('contarFiltrosAtivos ignora o status padrão', () => {
    expect(contarFiltrosAtivos(DEFAULT_FILTERS)).toBe(0);
    expect(contarFiltrosAtivos({ ...DEFAULT_FILTERS, setorId: 's1', busca: 'x' })).toBe(2);
    expect(contarFiltrosAtivos({ ...DEFAULT_FILTERS, status: 'todos' })).toBe(1);
  });
});
