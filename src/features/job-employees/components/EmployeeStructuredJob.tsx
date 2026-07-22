import { Layers } from 'lucide-react';
import type { Cargo } from '@/hooks/useCargos';

/** Célula "Cargo estruturado": mostra cargo + nível ou "Não vinculado". */
export function EmployeeStructuredJob({ cargo }: { cargo: Cargo | null }) {
  if (!cargo) return <span className="text-sm text-muted-foreground">Não vinculado</span>;
  const nivel = cargo.nivel_hierarquico != null && String(cargo.nivel_hierarquico).trim() !== '' ? `Nível ${cargo.nivel_hierarquico}` : 'Sem nível';
  return (
    <div className="text-sm">
      <div className="font-medium text-foreground">{cargo.nome}</div>
      <div className="flex items-center gap-1 text-xs text-muted-foreground"><Layers className="h-3 w-3" />{nivel}</div>
    </div>
  );
}
