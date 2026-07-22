import { pluralizeBR } from '@/lib/formatters';
import type { CompanyUsage } from '../types/company.types';

/** Resumo compacto da estrutura vinculada (célula da tabela). */
export function CompanyStructureSummary({ usage }: { usage: CompanyUsage }) {
  if (!usage.temVinculos) return <span className="text-sm text-muted-foreground">Sem vínculos</span>;
  return (
    <div className="text-sm leading-tight">
      <span className="text-foreground">{pluralizeBR(usage.setores, 'setor', 'setores')}</span>
      <span className="mx-1 text-muted-foreground">·</span>
      <span className="text-muted-foreground">{pluralizeBR(usage.funcionariosAtivos, 'func. ativo', 'func. ativos')}</span>
    </div>
  );
}
