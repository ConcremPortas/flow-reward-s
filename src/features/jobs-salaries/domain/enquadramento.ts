import type { HistoricoCargo } from '@/hooks/useHistoricoCargos';
import type { Enquadramento } from '../types/jobsSalaries.types';

/**
 * Deriva o enquadramento ATUAL de cada colaborador em um cargo a partir do
 * histórico de cargos. Não existe `cargo_id` na tabela de funcionários — o
 * vínculo funcionário↔cargo só existe através de `concremrh_historico_cargos`.
 * Para cada colaborador, o registro mais recente (`data_mudanca`) define o
 * cargo atual. Sem registro → colaborador NÃO está enquadrado em cargo (o
 * vínculo cadastral dele é com FUNÇÃO, não com cargo).
 *
 * Puro: recebe o histórico já carregado (uma consulta, sem N+1).
 */
export function derivarEnquadramentos(historico: HistoricoCargo[]): Map<string, Enquadramento> {
  const porFuncionario = new Map<string, Enquadramento>();

  for (const h of historico) {
    if (!h.funcionario_id) continue;
    const atual = porFuncionario.get(h.funcionario_id);
    // Mantém o registro com data_mudanca mais recente (histórico vem desc, mas
    // não confiamos na ordem — comparamos explicitamente).
    if (atual && atual.dataMudanca >= h.data_mudanca) continue;
    porFuncionario.set(h.funcionario_id, {
      funcionarioId: h.funcionario_id,
      cargoId: h.cargo_id ?? null,
      cargoNome: h.cargo?.nome ?? null,
      salarioRegistrado: typeof h.salario_novo === 'number' ? h.salario_novo : null,
      dataMudanca: h.data_mudanca,
    });
  }

  return porFuncionario;
}

/** Quantidade de colaboradores efetivamente enquadrados em algum cargo. */
export function contarEnquadrados(enquadramentos: Map<string, Enquadramento>): number {
  let n = 0;
  for (const e of enquadramentos.values()) {
    if (e.cargoId) n++;
  }
  return n;
}
