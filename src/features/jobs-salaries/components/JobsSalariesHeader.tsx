import type { ReactNode } from 'react';
import { Briefcase } from 'lucide-react';
import { PageHeader } from '@/components/app/PageHeader';

interface Props {
  children?: ReactNode;
  actions?: ReactNode;
}

/** Cabeçalho da Central de Cargos e Remuneração + navegação entre visões. */
export function JobsSalariesHeader({ children, actions }: Props) {
  return (
    <div className="space-y-4">
      <PageHeader
        icon={Briefcase}
        title="Central de Cargos e Remuneração"
        description="Estrutura de cargos, enquadramento, remuneração e governança do plano."
        actions={actions}
      />
      {children}
    </div>
  );
}
