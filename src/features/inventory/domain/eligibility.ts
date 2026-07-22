import { STATUS_BLOQUEIA_ENTREGA } from './domainConstants';
import type { EligibilityResult } from '../types/inventory.types';

/** Dados mínimos do colaborador (do cadastro corporativo `concremrh_funcionarios`). */
export interface ColaboradorElegibilidade {
  ativo: boolean | null;
  status: string | null;
  empresaId: string | null;
}

/** Dados mínimos da unidade de estoque (`concremrh_estoque_unidades`). */
export interface UnidadeElegibilidade {
  ativo: boolean | null;
  empresaId: string | null;
}

const normalizar = (s: string | null | undefined): string => (s ?? '').trim().toUpperCase();

/**
 * Elegibilidade do colaborador para receber entrega. Regras caracterizadas +
 * decisão D-6 (empresa incompatível bloqueia por padrão). Pura.
 */
export function podeReceberEntrega(colaborador: ColaboradorElegibilidade, unidade: UnidadeElegibilidade): EligibilityResult {
  if (unidade.ativo === false) return { ok: false, motivo: 'Local de estoque inativo.' };
  if (colaborador.ativo === false) return { ok: false, motivo: 'Colaborador inativo.' };
  if (STATUS_BLOQUEIA_ENTREGA.has(normalizar(colaborador.status))) {
    return { ok: false, motivo: 'Não é permitido registrar entrega para colaborador desligado.' };
  }
  if (colaborador.empresaId && unidade.empresaId && colaborador.empresaId !== unidade.empresaId) {
    return { ok: false, motivo: 'Colaborador pertence a outra empresa do local de estoque.' };
  }
  return { ok: true };
}
