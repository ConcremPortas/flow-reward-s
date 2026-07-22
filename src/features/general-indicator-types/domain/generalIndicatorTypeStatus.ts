// Situação cadastral do tipo de indicador geral — função PURA, fonte única.
// Independe do status ativo/inativo (esse é exibido em coluna própria).
import type { GeneralIndicatorTypeStatus, GeneralIndicatorTypeUsage } from '../types/general-indicator-type.types';

interface Input {
  codigoValido: boolean;
  nomeInformado: boolean;
  usage: GeneralIndicatorTypeUsage;
  duplicadoCodigo: boolean;
}

export function getGeneralIndicatorTypeStatus({ codigoValido, nomeInformado, usage, duplicadoCodigo }: Input): GeneralIndicatorTypeStatus {
  const motivos: string[] = [];
  const configIncompleta = !codigoValido || !nomeInformado;
  if (!codigoValido) motivos.push('Código técnico ausente ou inválido.');
  if (!nomeInformado) motivos.push('Nome do indicador ausente.');
  if (duplicadoCodigo) motivos.push('Existe outro indicador geral com o mesmo código.');

  let status: GeneralIndicatorTypeStatus['status'];
  let descricao: string;
  if (configIncompleta) {
    status = 'config_incompleta';
    descricao = 'Configuração incompleta: revise código e nome.';
  } else if (duplicadoCodigo) {
    status = 'revisar';
    descricao = 'Há pontos a revisar neste indicador.';
  } else if (usage.medicoes === 0) {
    status = 'sem_medicoes';
    descricao = 'Indicador cadastrado, mas sem medições registradas.';
  } else {
    status = 'regular';
    descricao = 'Indicador regular e em utilização.';
  }
  return { status, motivos, descricao };
}

export const GENERAL_INDICATOR_TYPE_STATUS_META: Record<GeneralIndicatorTypeStatus['status'], { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  regular: { label: 'Regular', variant: 'success' },
  sem_medicoes: { label: 'Sem medições', variant: 'neutral' },
  revisar: { label: 'Revisar', variant: 'warning' },
  config_incompleta: { label: 'Configuração incompleta', variant: 'danger' },
};
