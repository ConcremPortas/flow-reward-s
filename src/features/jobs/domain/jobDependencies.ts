import type { Cargo } from '@/hooks/useCargos';
import type { HistoricoCargo } from '@/hooks/useHistoricoCargos';
import type { EstruturaHierarquica } from '@/hooks/useEstruturaHierarquica';
import type { Enquadramento } from '@/features/jobs-salaries/types/jobsSalaries.types';

export interface JobDependencies {
  ocupantesAtuais: number;
  registrosHistorico: number;
  subordinadosDiretos: number; // cargos que têm este como superior (estrutura)
  possuiPosicaoNaEstrutura: boolean;
  /** Bloqueia exclusão definitiva conforme regra real (há vínculos). */
  podeExcluir: boolean;
  /** Inativar é sempre possível (soft-delete), preservando histórico. */
  podeInativar: boolean;
  motivos: string[];
}

/**
 * Levanta as dependências REAIS de um cargo antes de inativar/excluir. Tudo a
 * partir de dados já carregados em lote (sem N+1). Não assume que "0 ocupantes =
 * exclusão segura": histórico e posição na estrutura também vinculam o cargo.
 *
 * Nota: o sistema atual não faz exclusão física de cargos (a operação de
 * "remover" é soft-delete = ativo:false). Portanto tratamos exclusão como
 * bloqueada quando há QUALQUER vínculo, preferindo sempre a inativação, que
 * preserva o histórico.
 */
export function levantarDependencias(
  cargo: Cargo,
  enquadramentos: Map<string, Enquadramento>,
  historico: HistoricoCargo[],
  estrutura: EstruturaHierarquica[],
): JobDependencies {
  let ocupantes = 0;
  for (const e of enquadramentos.values()) {
    if (e.cargoId === cargo.id) ocupantes++;
  }
  const registrosHistorico = historico.filter(
    (h) => h.cargo_id === cargo.id || h.cargo_anterior_id === cargo.id,
  ).length;
  const subordinados = estrutura.filter((s) => s.cargo_superior_id === cargo.id).length;
  const possuiPosicao = estrutura.some((s) => s.cargo_id === cargo.id);

  const motivos: string[] = [];
  if (ocupantes > 0) motivos.push(`${ocupantes} colaborador(es) atualmente enquadrado(s) neste cargo.`);
  if (registrosHistorico > 0) motivos.push(`${registrosHistorico} registro(s) de histórico de cargos referenciam este cargo.`);
  if (subordinados > 0) motivos.push(`${subordinados} cargo(s) têm este como superior na estrutura hierárquica.`);
  if (possuiPosicao) motivos.push('O cargo ocupa uma posição na estrutura hierárquica.');

  const temVinculo = ocupantes > 0 || registrosHistorico > 0 || subordinados > 0 || possuiPosicao;

  return {
    ocupantesAtuais: ocupantes,
    registrosHistorico,
    subordinadosDiretos: subordinados,
    possuiPosicaoNaEstrutura: possuiPosicao,
    podeExcluir: !temVinculo,
    podeInativar: true,
    motivos,
  };
}
