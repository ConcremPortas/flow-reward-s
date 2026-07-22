// Situação derivada do local de DSS — função PURA, fonte única. NÃO persistida.
// Não há campo "ativo/inativo" de negócio (ativo é soft-delete); o status reflete
// utilização e histórico.
import type { DssLocationStatus, DssLocationUsage } from '../types/dss-location.types';

interface Input {
  usage: DssLocationUsage;
  duplicado: boolean;
}

export function getDssLocationStatus({ usage, duplicado }: Input): DssLocationStatus {
  const motivos: string[] = [];
  if (duplicado) motivos.push('Existe outro local com o mesmo nome.');
  if (usage.funcionarios === 0) motivos.push('Nenhum funcionário vinculado a este local.');
  if (usage.dssRealizados === 0) motivos.push('Nenhum DSS registrado neste local.');

  let status: DssLocationStatus['status'];
  let descricao: string;
  if (duplicado) {
    status = 'revisar';
    descricao = 'Há pontos a revisar no cadastro deste local.';
  } else if (usage.funcionarios === 0) {
    status = 'sem_funcionarios';
    descricao = 'Local sem funcionários vinculados.';
  } else if (usage.dssRealizados === 0) {
    status = 'sem_historico';
    descricao = 'Local com funcionários, mas sem DSS registrados.';
  } else {
    status = 'em_uso';
    descricao = 'Local em uso, com funcionários e histórico de DSS.';
  }
  return { status, motivos, descricao };
}

export const DSS_LOCATION_STATUS_META: Record<DssLocationStatus['status'], { label: string; variant: 'success' | 'warning' | 'neutral' }> = {
  em_uso: { label: 'Em uso', variant: 'success' },
  sem_funcionarios: { label: 'Sem funcionários', variant: 'warning' },
  sem_historico: { label: 'Sem histórico', variant: 'neutral' },
  revisar: { label: 'Revisar', variant: 'warning' },
};
