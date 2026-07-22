import { describe, it, expect } from 'vitest';
import { validateInformationStep, linkedActiveFuncionarios } from './dssValidation';
import type { Funcionario } from '@/hooks/useFuncionarios';
import { EMPTY_DSS_FORM } from '../types';

const mkFuncionario = (over: Partial<Funcionario> = {}): Funcionario => ({
  id: 'f1', nome: 'João Silva', ativo: true, created_at: '', updated_at: '', ...over,
} as Funcionario);

describe('validateInformationStep', () => {
  it('rejeita quando local, data e tema estão vazios', () => {
    const r = validateInformationStep(EMPTY_DSS_FORM);
    expect(r.valid).toBe(false);
    expect(r.errors.localDssId).toBeTruthy();
    expect(r.errors.dataRealizacao).toBeTruthy();
    expect(r.errors.tema).toBeTruthy();
  });

  it('valida quando todos os campos obrigatórios estão preenchidos', () => {
    const r = validateInformationStep({ localDssId: 'l1', dataRealizacao: '2026-05-10', tema: 'Uso de EPI' });
    expect(r.valid).toBe(true);
    expect(r.errors).toEqual({});
  });

  it('tema só com espaços é tratado como vazio', () => {
    const r = validateInformationStep({ localDssId: 'l1', dataRealizacao: '2026-05-10', tema: '   ' });
    expect(r.valid).toBe(false);
    expect(r.errors.tema).toBeTruthy();
  });
});

describe('linkedActiveFuncionarios', () => {
  it('retorna vazio quando nenhum local é selecionado', () => {
    expect(linkedActiveFuncionarios([mkFuncionario()], '')).toEqual([]);
  });

  it('inclui apenas funcionários vinculados ao local E ativos (correção do bug de auditoria)', () => {
    const funcionarios = [
      mkFuncionario({ id: 'f1', local_dss_id: 'l1', ativo: true }),
      mkFuncionario({ id: 'f2', local_dss_id: 'l1', ativo: false }), // vinculado mas inativo
      mkFuncionario({ id: 'f3', local_dss_id: 'l2', ativo: true }),  // ativo mas outro local
    ];
    const result = linkedActiveFuncionarios(funcionarios, 'l1');
    expect(result.map((f) => f.id)).toEqual(['f1']);
  });

  it('funcionário sem vínculo a nenhum local não aparece em nenhum resultado', () => {
    const funcionarios = [mkFuncionario({ id: 'f9', local_dss_id: undefined, ativo: true })];
    expect(linkedActiveFuncionarios(funcionarios, 'l1')).toEqual([]);
  });
});
