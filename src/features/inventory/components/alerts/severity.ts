import type { StatusVariant } from '@/components/app/StatusBadge';

/**
 * SEVERIDADE (camada VISUAL — não persistida, não contradiz o banco).
 *
 * O banco/domínio define apenas: alerta quando `quantidade <= minimoEfetivo`
 * (ALERTA) e sem estoque quando `quantidade <= 0`. Aqui apenas SUBDIVIDIMOS esse
 * alerta para leitura operacional, com limiares documentados e fixos no frontend:
 *   • CRITICO       → saldo > 0 e <= 25% do mínimo
 *   • ABAIXO_MIN    → saldo > 25% do mínimo e <= mínimo   (regra real do domínio)
 *   • PROXIMO       → saldo > mínimo e <= mínimo + 25%     (alerta ANTECIPADO/overlay)
 *   • SEM_MINIMO    → mínimo não configurado (pendência cadastral, não operacional)
 * Nenhum limiar vem do banco; são heurísticas de exibição (PERCENTUAL_CRITICO /
 * MARGEM_PROXIMO). Ajustáveis num só lugar.
 */
export const PERCENTUAL_CRITICO = 0.25;
export const MARGEM_PROXIMO = 0.25;

export type Severidade = 'SEM_ESTOQUE' | 'CRITICO' | 'ABAIXO_MIN' | 'PROXIMO' | 'SEM_MINIMO' | 'NORMAL';

export function severidade(quantidade: number, minimo: number): Severidade {
  if (minimo <= 0) return quantidade <= 0 ? 'SEM_ESTOQUE' : 'SEM_MINIMO';
  if (quantidade <= 0) return 'SEM_ESTOQUE';
  if (quantidade <= minimo * PERCENTUAL_CRITICO) return 'CRITICO';
  if (quantidade <= minimo) return 'ABAIXO_MIN';
  if (quantidade <= minimo + Math.ceil(minimo * MARGEM_PROXIMO)) return 'PROXIMO';
  return 'NORMAL';
}

/** Severidades que representam alerta OPERACIONAL (exclui NORMAL e a pendência SEM_MINIMO). */
export const SEV_OPERACIONAL: Severidade[] = ['SEM_ESTOQUE', 'CRITICO', 'ABAIXO_MIN', 'PROXIMO'];
/** Todas as severidades exibíveis na central (inclui pendência SEM_MINIMO). */
export const SEV_LISTAVEIS: Severidade[] = ['SEM_ESTOQUE', 'CRITICO', 'ABAIXO_MIN', 'PROXIMO', 'SEM_MINIMO'];

export const SEV_LABEL: Record<Severidade, string> = {
  SEM_ESTOQUE: 'Sem estoque', CRITICO: 'Crítico', ABAIXO_MIN: 'Abaixo do mínimo',
  PROXIMO: 'Próximo do mínimo', SEM_MINIMO: 'Sem mínimo', NORMAL: 'Normal',
};

export const SEV_VARIANT: Record<Severidade, StatusVariant> = {
  SEM_ESTOQUE: 'danger', CRITICO: 'danger', ABAIXO_MIN: 'warning', PROXIMO: 'info', SEM_MINIMO: 'neutral', NORMAL: 'success',
};

/** Ordem de urgência (menor = mais urgente). */
export const SEV_RANK: Record<Severidade, number> = {
  SEM_ESTOQUE: 0, CRITICO: 1, ABAIXO_MIN: 2, PROXIMO: 3, SEM_MINIMO: 4, NORMAL: 5,
};
