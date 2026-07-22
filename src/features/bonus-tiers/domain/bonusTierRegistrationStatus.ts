// Situação cadastral da faixa — função PURA, fonte única. Sem espalhar ifs no JSX.
//
// Valor zero NÃO é motivo de status (é um valor válido: sem bônus base).
import type { NameAnalysis, TierRegistrationStatus, TierUsage } from '../types/bonus-tier.types';

interface Input {
  usage: TierUsage;
  nameAnalysis: NameAnalysis;
  duplicado: boolean;
}

export function getTierRegistrationStatus({ usage, nameAnalysis, duplicado }: Input): TierRegistrationStatus {
  const motivos: string[] = [];
  if (nameAnalysis.state === 'divergente') motivos.push('O nome indica um valor diferente do valor cadastrado.');
  if (nameAnalysis.state === 'nao_interpretavel') motivos.push('O nome contém um valor monetário não interpretável.');
  if (duplicado) motivos.push('Existe outra faixa com o mesmo nome.');

  let status: TierRegistrationStatus['status'];
  let descricao: string;
  if (motivos.length > 0) {
    status = 'revisar';
    descricao = 'Há pontos a revisar no cadastro desta faixa.';
  } else if (!usage.emUso) {
    status = 'sem_vinculo';
    descricao = 'Faixa cadastrada, mas sem funcionários vinculados.';
  } else {
    status = 'regular';
    descricao = 'Faixa regular e em uso.';
  }
  return { status, motivos, descricao };
}

export const TIER_STATUS_META: Record<TierRegistrationStatus['status'], { label: string; variant: 'success' | 'warning' | 'neutral' }> = {
  regular: { label: 'Regular', variant: 'success' },
  revisar: { label: 'Revisar', variant: 'warning' },
  sem_vinculo: { label: 'Sem vínculo', variant: 'neutral' },
};
