import { describe, it, expect } from 'vitest';
import { buildImportPreview, summarizeImport, type FuncionarioLookup } from './occurrenceImportValidation';

const codMap = new Map<string, FuncionarioLookup>([
  ['0001', { id: 'f1', nome: 'João Silva' }],
  ['0002', { id: 'f2', nome: 'Maria Souza' }],
]);

describe('buildImportPreview', () => {
  it('marca como válido quando o código existe e há ocorrência > 0', () => {
    const rows = buildImportPreview([{ cod_funcionario: '0001', faltas: 2, advertencias: 0 }], codMap);
    expect(rows[0].status).toBe('valido');
    expect(rows[0].funcionarioId).toBe('f1');
  });

  it('funcionário não encontrado gera linha inválida', () => {
    const rows = buildImportPreview([{ cod_funcionario: '9999', faltas: 1, advertencias: 0 }], codMap);
    expect(rows[0].status).toBe('invalido');
    expect(rows[0].mensagem).toMatch(/não encontrado/i);
  });

  it('valor negativo é marcado como inválido', () => {
    const rows = buildImportPreview([{ cod_funcionario: '0001', faltas: -1, advertencias: 0 }], codMap);
    expect(rows[0].status).toBe('invalido');
  });

  it('valor não numérico é marcado como inválido', () => {
    const rows = buildImportPreview([{ cod_funcionario: '0001', faltas: 'abc', advertencias: 0 }], codMap);
    expect(rows[0].status).toBe('invalido');
  });

  it('código duplicado no arquivo é sinalizado a partir da segunda ocorrência', () => {
    const rows = buildImportPreview([
      { cod_funcionario: '0001', faltas: 1, advertencias: 0 },
      { cod_funcionario: '0001', faltas: 2, advertencias: 0 },
    ], codMap);
    expect(rows[0].status).toBe('valido');
    expect(rows[1].status).toBe('duplicado');
  });

  it('linha com faltas e advertências zeradas vira alerta (nada a importar)', () => {
    const rows = buildImportPreview([{ cod_funcionario: '0002', faltas: 0, advertencias: 0 }], codMap);
    expect(rows[0].status).toBe('alerta');
  });

  it('aceita headers maiúsculos (compat. com o template atual)', () => {
    const rows = buildImportPreview([{ COD_FUNCIONARIO: '0002', FALTAS: 3, ADVERTENCIAS: 1 }], codMap);
    expect(rows[0].status).toBe('valido');
    expect(rows[0].faltas).toBe(3);
  });
});

describe('summarizeImport', () => {
  it('conta cada categoria de status corretamente', () => {
    const rows = buildImportPreview([
      { cod_funcionario: '0001', faltas: 1, advertencias: 0 },
      { cod_funcionario: '0001', faltas: 1, advertencias: 0 }, // duplicado
      { cod_funcionario: '9999', faltas: 1, advertencias: 0 }, // inválido
      { cod_funcionario: '0002', faltas: 0, advertencias: 0 }, // alerta
    ], codMap);
    const summary = summarizeImport(rows);
    expect(summary).toEqual({ total: 4, validos: 1, alertas: 1, invalidos: 1, duplicados: 1 });
  });
});
