import { describe, it, expect } from 'vitest';
import { validateConfigurationStep, isFuncionarioAtivo, auditableFuncionarios } from './epiValidation';
import type { Funcionario } from '@/hooks/useFuncionarios';

const mk = (id: string, nome: string, status = 'ativo'): Funcionario =>
  ({ id, nome, status, ativo: true, created_at: '', updated_at: '' } as Funcionario);

describe('validateConfigurationStep', () => {
  it('exige data da auditoria', () => {
    expect(validateConfigurationStep({ dataAuditoria: '' }).valid).toBe(false);
    expect(validateConfigurationStep({ dataAuditoria: '2026-07-14' }).valid).toBe(true);
  });
});

describe('isFuncionarioAtivo / auditableFuncionarios', () => {
  it('exclui funcionários em rescisão (com ou sem acento)', () => {
    expect(isFuncionarioAtivo({ status: 'Rescisão' })).toBe(false);
    expect(isFuncionarioAtivo({ status: 'rescisao' })).toBe(false);
    expect(isFuncionarioAtivo({ status: 'Ativo' })).toBe(true);
  });

  it('ordena por nome e remove rescindidos', () => {
    const funcionarios = [mk('1', 'Zeca'), mk('2', 'Ana', 'Rescisão'), mk('3', 'Bruno')];
    const result = auditableFuncionarios(funcionarios);
    expect(result.map((f) => f.nome)).toEqual(['Bruno', 'Zeca']);
  });
});
