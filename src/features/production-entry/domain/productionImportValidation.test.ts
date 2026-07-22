import { describe, it, expect } from 'vitest';
import { validateImportRows, summarizeImport, parseCompetencia, resolveSetorId } from './productionImportValidation';
import type { Setor } from '@/hooks/useSetores';

const setores = [
  { id: 's1', nome: 'Montagem de Kit', ativo: true, created_at: '', updated_at: '' },
  { id: 's2', nome: 'Pintura', ativo: true, created_at: '', updated_at: '' },
] as Setor[];

describe('parseCompetencia (sem timezone)', () => {
  it('aceita AAAA-MM, MM/AAAA, MM-AAAA, AAAA/MM', () => {
    expect(parseCompetencia('2026-05')).toBe('2026-05');
    expect(parseCompetencia('05/2026')).toBe('2026-05');
    expect(parseCompetencia('05-2026')).toBe('2026-05');
    expect(parseCompetencia('2026/05')).toBe('2026-05');
  });
  it('inválida → vazio', () => {
    expect(parseCompetencia('xx')).toBe('');
    expect(parseCompetencia('')).toBe('');
  });
});

describe('resolveSetorId', () => {
  it('resolve por id, por nome exato e por prefixo (ignorando acentos/caixa)', () => {
    expect(resolveSetorId({ setor_id: 's2' }, setores)).toBe('s2');
    expect(resolveSetorId({ setor_nome: 'montagem de kit' }, setores)).toBe('s1');
    expect(resolveSetorId({ setor: 'Montagem de Kit - Turno A' }, setores)).toBe('s1');
    expect(resolveSetorId({ setor_nome: 'Inexistente' }, setores)).toBe('');
  });
});

describe('validateImportRows', () => {
  it('classifica válido/alerta/inválido com dados reais', () => {
    const rows = validateImportRows({
      rawRows: [
        { setor_nome: 'Montagem de Kit', competencia: '2026-05', meta_mensal: '1000', producao_realizada: '900' }, // válido
        { setor_nome: 'Pintura', competencia: '2026-05', meta_mensal: '0', producao_realizada: '10' },             // inválido (meta<=0)
        { setor_nome: 'Fantasma', competencia: '2026-05', meta_mensal: '100', producao_realizada: '90' },          // inválido (setor)
        { setor_nome: 'Montagem de Kit', competencia: '2026-04', meta_mensal: '500', producao_realizada: '-1' },   // inválido (realizado<0)
      ],
      setores,
      existingKeys: new Set(),
    });
    expect(rows[0].status).toBe('valido');
    expect(rows[1].status).toBe('invalido');
    expect(rows[1].problema).toContain('Meta mensal inválida');
    expect(rows[2].status).toBe('invalido');
    expect(rows[2].problema).toContain('Setor não identificado');
    expect(rows[3].status).toBe('invalido');
    expect(rows[3].problema).toContain('Produção realizada inválida');
  });

  it('marca alerta para registro já existente e duplicado no arquivo', () => {
    const rows = validateImportRows({
      rawRows: [
        { setor_nome: 'Montagem de Kit', competencia: '2026-05', meta_mensal: '1000', producao_realizada: '900' },
        { setor_nome: 'Montagem de Kit', competencia: '2026-05', meta_mensal: '1000', producao_realizada: '950' }, // dup no arquivo
        { setor_nome: 'Pintura', competencia: '2026-05', meta_mensal: '100', producao_realizada: '90' },           // já existe no banco
      ],
      setores,
      existingKeys: new Set(['s2|2026-05']),
    });
    expect(rows[0].status).toBe('valido');
    expect(rows[1].status).toBe('alerta');
    expect(rows[1].problema).toContain('duplicado no arquivo');
    expect(rows[2].status).toBe('alerta');
    expect(rows[2].problema).toContain('Já existe registro');

    const summary = summarizeImport(rows);
    expect(summary).toEqual({ total: 3, validos: 1, alertas: 2, invalidos: 0 });
  });

  it('alerta quando competência diverge da selecionada', () => {
    const rows = validateImportRows({
      rawRows: [{ setor_nome: 'Montagem de Kit', competencia: '2026-04', meta_mensal: '100', producao_realizada: '90' }],
      setores,
      existingKeys: new Set(),
      competenciaAlvo: '2026-05',
    });
    expect(rows[0].status).toBe('alerta');
    expect(rows[0].problema).toContain('diferente da selecionada');
  });
});
