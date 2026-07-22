import { describe, it, expect } from 'vitest';
import { construirFardamentos } from './fardamentos';
import type { UnidadeRow, VarianteRow, SaldoRow } from '../types/db.types';

const unidade = (id: string, nome: string): UnidadeRow => ({ id, codigo: id, nome, empresa_id: 'e1', setor_id: null, descricao: null, ativo: true });
const variante = (id: string, nome: string, minPadrao = 0): VarianteRow => ({
  id, codigo_interno: `C-${id}`, codigo_barras: null, nome, descricao: null, modelo_id: 'm1', tamanho_id: 't1',
  fornecedor_id: null, genero: 'UNISSEX', cor: null, material: null, marca: null, localizacao: null,
  custo_unitario: 0, estoque_minimo_padrao: minPadrao, foto_url: null, ativo: true, deletado_em: null,
  modelo: { nome: 'Camisa Polo', categoria: { nome: 'Camisas' } }, tamanho: { rotulo: 'M', tipo: 'ROUPA' },
});
const saldo = (variante_id: string, unidade_id: string, quantidade: number, estoque_minimo: number | null = null): SaldoRow =>
  ({ id: `${variante_id}-${unidade_id}`, variante_id, unidade_id, quantidade, estoque_minimo, estoque_ideal: null });

describe('construirFardamentos', () => {
  const unidades = [unidade('u1', 'Matriz'), unidade('u2', 'Filial')];

  it('soma saldo total e resolve nomes de categoria/modelo/tamanho', () => {
    const rows = construirFardamentos([variante('v1', 'Polo Azul')], [saldo('v1', 'u1', 10), saldo('v1', 'u2', 5)], unidades);
    expect(rows).toHaveLength(1);
    expect(rows[0].saldoTotal).toBe(15);
    expect(rows[0].categoriaNome).toBe('Camisas');
    expect(rows[0].modeloNome).toBe('Camisa Polo');
    expect(rows[0].tamanhoRotulo).toBe('M');
    expect(rows[0].saldos.map((s) => s.unidadeNome).sort()).toEqual(['Filial', 'Matriz']);
  });

  it('status por unidade usa mínimo efetivo (unidade → variante → 0) e sinaliza alerta', () => {
    // min da unidade=8 → 5<=8 ALERTA; sem saldo em u2
    const rows = construirFardamentos([variante('v1', 'Polo', 3)], [saldo('v1', 'u1', 5, 8)], unidades);
    const s = rows[0].saldos[0];
    expect(s.minimoEfetivo).toBe(8);
    expect(s.status).toBe('ALERTA');
    expect(rows[0].emAlerta).toBe(true);
  });

  it('fallback do mínimo para o padrão da variante quando o saldo não define', () => {
    const rows = construirFardamentos([variante('v1', 'Polo', 2)], [saldo('v1', 'u1', 2, null)], unidades);
    expect(rows[0].saldos[0].minimoEfetivo).toBe(2);
    expect(rows[0].saldos[0].status).toBe('ALERTA'); // 2 <= 2
  });

  it('variante sem saldo → total 0, sem alerta (lista vazia de saldos)', () => {
    const rows = construirFardamentos([variante('v1', 'Polo')], [], unidades);
    expect(rows[0].saldoTotal).toBe(0);
    expect(rows[0].saldos).toHaveLength(0);
    expect(rows[0].emAlerta).toBe(false);
  });
});
