// Situação cadastral do setor — função PURA, fonte única. Sem espalhar
// `if (!supervisor)` pelo JSX.
//
// AUDITORIA: nenhum dos campos (empresa/supervisor/encarregado) é obrigatório no
// banco nem no formulário legado. Portanto "pendência" aqui é ORGANIZACIONAL
// (lacuna de estrutura), NÃO um erro de validação: nunca bloqueia, nunca é
// persistida. É derivada para dar visibilidade à completude da estrutura.
import type { Pendencia, RegistrationStatus } from '../types/sector.types';

interface Input {
  empresaId: string | null;
  supervisorId: string | null;
  encarregadoId: string | null;
  funcionarios: number;
}

export function getSectorRegistrationStatus({ empresaId, supervisorId, encarregadoId, funcionarios }: Input): RegistrationStatus {
  const pendencias: Pendencia[] = [];
  if (!empresaId) pendencias.push({ code: 'empresa', severity: 'alta', label: 'Empresa não vinculada' });
  if (!supervisorId) pendencias.push({ code: 'supervisor', severity: 'media', label: 'Supervisor não definido' });
  if (!encarregadoId) pendencias.push({ code: 'encarregado', severity: 'media', label: 'Encarregado não definido' });
  if (funcionarios === 0) pendencias.push({ code: 'funcionarios', severity: 'baixa', label: 'Sem funcionários vinculados' });

  let status: RegistrationStatus['status'];
  let descricao: string;
  if (pendencias.length === 0) {
    status = 'completo';
    descricao = 'Estrutura completa: empresa, supervisor e encarregado definidos.';
  } else if (!empresaId || (!supervisorId && !encarregadoId)) {
    // Lacuna estrutural relevante: sem empresa, ou sem nenhuma liderança.
    status = 'pendente';
    descricao = 'Faltam definições estruturais importantes.';
  } else {
    status = 'atencao';
    descricao = 'Estrutura parcial — há definições pendentes.';
  }
  return { status, pendencias, descricao };
}

export const STATUS_META: Record<RegistrationStatus['status'], { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  completo: { label: 'Completo', variant: 'success' },
  atencao: { label: 'Atenção', variant: 'warning' },
  pendente: { label: 'Pendente', variant: 'danger' },
};
