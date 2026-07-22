import { describe, it, expect } from 'vitest';
import { computeRewardsPreview, computeBasePreview, type RewardsPreviewInputs } from './rewardsPreview';
import { calcularComissao } from '@/domain/premiacao/calculoPremiacao';
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { FormulaCalculo } from '@/hooks/useFormulasCalculo';
import type { BasePremiacao } from '@/hooks/useBasePremiacao';

const base = (over: Partial<BasePremiacao>): BasePremiacao =>
  ({ id: 'b1', nome: 'KIT 100%', valor_base: 0, tipo: 'kits', ativo: true, created_at: '', updated_at: '', ...over });

const func = (over: Partial<Funcionario>): Funcionario =>
  ({ id: 'f1', nome: 'João', ativo: true, created_at: '', updated_at: '', base_premiacao_id: 'b1', categoria_id: 'c-aux',
     categoria: { nome: 'Auxiliar' }, faixa: { nome: 'Faixa 100%', valor: 1000 }, ...over });

const formula = (over: Partial<FormulaCalculo>): FormulaCalculo =>
  ({ id: 'fx1', nome: 'AUXILIAR - KIT 100%', categoria_id: 'c-aux', base_premiacao_id: 'b1',
     peso_producao_setor: null, peso_epi: 25, peso_faltas: 25, peso_advertencias: 25, peso_dss: 25,
     peso_faturamento: null, peso_itens_nc: null, peso_tratamento_nc: null, peso_hora_maquina: null,
     peso_operacao_segura: null, peso_limpeza: null, multiplicador_kits: null, ativo: true, created_at: '', updated_at: '', ...over });

const emptyInputs = (over: Partial<RewardsPreviewInputs>): RewardsPreviewInputs => ({
  funcionarios: [], formulas: [], bases: [], setores: [], faltasAdvertencias: [], epiRecords: [],
  dssRecords: [], producaoSetor: [], indicadoresSetor: [], indicadoresGerais: [],
  getConfigKits: () => null, ...over,
});

describe('computeRewardsPreview — pureza e escopo', () => {
  it('não persiste: é pura e retorna resultados em memória para o escopo', () => {
    const inputs = emptyInputs({
      funcionarios: [func({})], formulas: [formula({})], bases: [base({})],
      indicadoresGerais: [{ competencia: '2026-05-01', realizado: 12000, tipo_indicador: { codigo: 'KITS' } }],
    });
    const preview = computeRewardsPreview({ competencia: '2026-05', baseIds: ['b1'], categoriaIds: [] }, inputs);
    expect(preview.bases).toHaveLength(1);
    expect(preview.bases[0].employees).toHaveLength(1);
    expect(preview.totals.funcionariosCalculados).toBe(1);
  });

  it('KITS: comissão e bônus batem com o motor (regras preservadas)', () => {
    const inputs = emptyInputs({
      funcionarios: [func({})], formulas: [formula({})], bases: [base({})],
      indicadoresGerais: [{ competencia: '2026-05-01', realizado: 12000, tipo_indicador: { codigo: 'KITS' } }],
    });
    const [bp] = computeRewardsPreview({ competencia: '2026-05', baseIds: ['b1'], categoriaIds: [] }, inputs).bases;
    const e = bp.employees[0];
    // Sem faltas/adv/epi/dss → todas as notas 1.0; pesos somam 1.0 → nota geral 1.0.
    expect(e.nota_geral).toBeCloseTo(1.0, 5);
    // Comissão via motor: min 10000, +250/faixa, base 100, 25/faixa → 12000 => 300.
    const comissaoEsperada = calcularComissao(12000, { minimo_kits: 10000, incremento_faixa: 250, bonus_base: 100, bonus_por_faixa: 25 });
    expect(e.valor_kits).toBe(comissaoEsperada);
    expect(e.valor_kits).toBe(300);
    // Multiplicador do nome "KIT 100%" = 1.0 → bônus alcançado = comissão.
    expect(e.bonus_alcancado).toBeCloseTo(300, 5);
    expect(e.trace.length).toBeGreaterThan(0); // memória de cálculo observacional
  });

  it('filtro de categoria restringe os funcionários calculados', () => {
    const inputs = emptyInputs({
      funcionarios: [func({ id: 'f1', categoria_id: 'c-aux' }), func({ id: 'f2', categoria_id: 'c-sup', categoria: { nome: 'Supervisor' } })],
      formulas: [formula({})], bases: [base({})],
      indicadoresGerais: [{ competencia: '2026-05-01', realizado: 12000, tipo_indicador: { codigo: 'KITS' } }],
    });
    const bp = computeBasePreview('b1', { competencia: '2026-05', baseIds: ['b1'], categoriaIds: ['c-aux'] }, inputs);
    expect(bp.employees.map(e => e.id)).toEqual(['f1']);
  });

  it('base sem funcionários é sinalizada (skippedReason), sem lançar', () => {
    const bp = computeBasePreview('b1', { competencia: '2026-05', baseIds: ['b1'], categoriaIds: [] }, emptyInputs({ bases: [base({})] }));
    expect(bp.employees).toHaveLength(0);
    expect(bp.skippedReason).toBeTruthy();
  });

  it('funcionário sem fórmula recebe flag (sem quebrar o cálculo)', () => {
    const inputs = emptyInputs({ funcionarios: [func({})], formulas: [], bases: [base({})] });
    const bp = computeBasePreview('b1', { competencia: '2026-05', baseIds: ['b1'], categoriaIds: [] }, inputs);
    expect(bp.employees[0].flags).toContain('Fórmula não encontrada para a categoria/base');
  });
});
