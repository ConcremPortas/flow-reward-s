// Situação cadastral do tipo — função PURA, fonte única. Sem espalhar ifs no JSX.
import type {
  IndicatorTypeMeasurementUsage, IndicatorTypeStatus,
} from '../types/indicator-type.types';

interface Input {
  ativo: boolean;
  codigoValido: boolean;
  nomeInformado: boolean;
  usage: IndicatorTypeMeasurementUsage;
  duplicadoCodigo: boolean;
}

export function getIndicatorTypeStatus({ ativo, codigoValido, nomeInformado, usage, duplicadoCodigo }: Input): IndicatorTypeStatus {
  const motivos: string[] = [];
  const configIncompleta = !codigoValido || !nomeInformado;
  if (!codigoValido) motivos.push('Código técnico ausente ou inválido.');
  if (!nomeInformado) motivos.push('Nome do indicador ausente.');
  if (duplicadoCodigo) motivos.push('Existe outro tipo com o mesmo código.');
  if (!usage.temCorrespondencia) motivos.push('Código sem correspondência com uma medição setorial conhecida.');

  let status: IndicatorTypeStatus['status'];
  let descricao: string;
  if (configIncompleta) {
    status = 'config_incompleta';
    descricao = 'Configuração incompleta: revise código e nome.';
  } else if (duplicadoCodigo || !usage.temCorrespondencia) {
    status = 'revisar';
    descricao = 'Há pontos a revisar neste tipo de indicador.';
  } else if (usage.medicoes === 0) {
    status = 'sem_utilizacao';
    descricao = 'Tipo cadastrado, mas sem medições registradas.';
  } else {
    status = 'regular';
    descricao = 'Tipo regular e em utilização.';
  }
  // Inativo (soft-delete) não aparece na listagem (fetch filtra ativo=true);
  // mantemos o parâmetro para clareza do contrato.
  void ativo;
  return { status, motivos, descricao };
}

export const INDICATOR_TYPE_STATUS_META: Record<IndicatorTypeStatus['status'], { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  regular: { label: 'Regular', variant: 'success' },
  sem_utilizacao: { label: 'Sem utilização', variant: 'neutral' },
  revisar: { label: 'Revisar', variant: 'warning' },
  config_incompleta: { label: 'Configuração incompleta', variant: 'danger' },
};
