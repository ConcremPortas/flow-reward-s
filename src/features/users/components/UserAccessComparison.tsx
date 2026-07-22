import { Plus, Minus } from 'lucide-react';
import { sectionLabel, permissionDef } from '../domain/permissionDefinitions';

interface Props { atual: string[]; novo: string[] }

/** Comparação de acessos: adicionados / removidos. Destaca seções sensíveis. */
export function UserAccessComparison({ atual, novo }: Props) {
  const setA = new Set(atual);
  const setB = new Set(novo);
  const adicionados = novo.filter(s => !setA.has(s));
  const removidos = atual.filter(s => !setB.has(s));

  if (adicionados.length === 0 && removidos.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma alteração de acessos.</p>;
  }
  const sens = (s: string) => permissionDef(s)?.sensitivity === 'sensivel';

  return (
    <div className="space-y-1.5 text-sm">
      {adicionados.map(s => (
        <div key={`a-${s}`} className="flex items-center gap-1.5 text-success"><Plus className="h-3.5 w-3.5" /> {sectionLabel(s)}{sens(s) && <span className="text-[10px] text-status-warning">(sensível)</span>}</div>
      ))}
      {removidos.map(s => (
        <div key={`r-${s}`} className="flex items-center gap-1.5 text-destructive"><Minus className="h-3.5 w-3.5" /> {sectionLabel(s)}{sens(s) && <span className="text-[10px] text-status-warning">(sensível)</span>}</div>
      ))}
    </div>
  );
}
