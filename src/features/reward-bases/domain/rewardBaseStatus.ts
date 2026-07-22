// Situação cadastral da base — função PURA, fonte única. Sem espalhar ifs no JSX.
//
// Estados: config_incompleta > revisar > sem_vinculo > regular (nesta prioridade).
// A divergência nome×valor é "revisar" (nunca "erro") — pode ser intencional
// (o % do nome é o multiplicador do motor; valor_base é campo separado).
import type {
  RewardBaseNameAnalysis, RewardBaseStatus, RewardBaseTipo, RewardBaseUsage,
} from '../types/reward-base.types';
import { isValidBaseParameter } from './rewardBaseValidation';

interface Input {
  /** Tipo cru do banco (pode ser null/indefinido → configuração incompleta). */
  tipo: string | null | undefined;
  valorBase: number | null | undefined;
  nameAnalysis: RewardBaseNameAnalysis;
  usage: RewardBaseUsage;
  duplicado: boolean;
}

export function getRewardBaseStatus({ tipo, valorBase, nameAnalysis, usage, duplicado }: Input): RewardBaseStatus {
  const motivos: string[] = [];

  const tipoOk = tipo === 'percentual' || tipo === 'valor_fixo';
  const paramOk = isValidBaseParameter(valorBase, (tipo ?? 'percentual') as RewardBaseTipo);
  const configIncompleta = !tipoOk || !paramOk;

  if (!tipoOk) motivos.push('Tipo da base não definido.');
  if (!paramOk) motivos.push('Parâmetro (valor) ausente ou inválido para o tipo.');
  if (nameAnalysis.state === 'diferente') motivos.push('Possível diferença entre a nomenclatura e o parâmetro cadastrado (pode ser intencional).');
  if (nameAnalysis.state === 'nao_interpretavel') motivos.push('O nome contém um percentual não interpretável.');
  if (duplicado) motivos.push('Existe outra base com o mesmo nome.');

  let status: RewardBaseStatus['status'];
  let descricao: string;
  if (configIncompleta) {
    status = 'config_incompleta';
    descricao = 'Configuração incompleta: revise tipo e parâmetro.';
  } else if (nameAnalysis.state === 'diferente' || nameAnalysis.state === 'nao_interpretavel' || duplicado) {
    status = 'revisar';
    descricao = 'Há pontos a revisar no cadastro desta base.';
  } else if (!usage.emUso) {
    status = 'sem_vinculo';
    descricao = 'Base cadastrada, mas sem vínculos ativos.';
  } else {
    status = 'regular';
    descricao = 'Base regular e em uso.';
  }
  return { status, motivos, descricao };
}

export const REWARD_BASE_STATUS_META: Record<RewardBaseStatus['status'], { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  regular: { label: 'Regular', variant: 'success' },
  revisar: { label: 'Revisar', variant: 'warning' },
  sem_vinculo: { label: 'Sem vínculo', variant: 'neutral' },
  config_incompleta: { label: 'Configuração incompleta', variant: 'danger' },
};
