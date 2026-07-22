import { Info, Users } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { StatusBadge } from '@/components/app/StatusBadge';
import { Button } from '@/components/ui/button';
import { formatNumberBR } from '@/lib/formatters';
import type { FunctionMappingRow } from '../domain/employeeJobMapping';

interface Props {
  linhas: FunctionMappingRow[];
  temCargos: boolean;
  onEnquadrarFuncao: (funcaoId: string) => void;
}

/**
 * Mapeamento função → cargo. Sugestão observacional por nome; nunca aplica
 * automaticamente. "Enquadrar em lote" abre o fluxo com os colaboradores da
 * função pré-selecionados (a confirmação é manual).
 */
export function FunctionJobMapping({ linhas, temCargos, onEnquadrarFuncao }: Props) {
  return (
    <SectionCard title="Mapeamento de função para cargo" description="Base para enquadrar colaboradores. A função operacional é sempre preservada.">
      <div className="mb-4 rounded-lg border border-primary/20 bg-primary/[0.04] p-3">
        <div className="flex items-start gap-2.5">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">A coluna “cargo sugerido” é apenas uma correspondência por nome, para revisão manual. Nenhum vínculo é aplicado sem confirmação.</p>
        </div>
      </div>

      {linhas.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma função cadastrada.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">Função</th>
                <th className="pb-2 pr-3 font-medium">Colaboradores</th>
                <th className="pb-2 pr-3 font-medium">Setores</th>
                <th className="pb-2 pr-3 font-medium">Cargo sugerido</th>
                <th className="pb-2 text-right font-medium">Ação</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.funcaoId} className="border-b border-border/40 last:border-0">
                  <td className="py-2.5 pr-3 font-medium text-foreground">{l.funcaoNome}{l.conflito && <StatusBadge variant="warning" className="ml-2">Conflito</StatusBadge>}</td>
                  <td className="py-2.5 pr-3 tabular-nums text-muted-foreground">{formatNumberBR(l.colaboradores)}{l.jaEnquadrados > 0 && <span className="ml-1 text-xs">({formatNumberBR(l.jaEnquadrados)} enquadrados)</span>}</td>
                  <td className="py-2.5 pr-3 text-xs text-muted-foreground">{l.setores.slice(0, 3).join(', ')}{l.setores.length > 3 ? ` +${l.setores.length - 3}` : ''}</td>
                  <td className="py-2.5 pr-3">{l.cargoSugeridoNome ? <StatusBadge variant="info">{l.cargoSugeridoNome}</StatusBadge> : <span className="text-xs text-muted-foreground">Sem correspondência</span>}</td>
                  <td className="py-2.5 text-right">
                    {temCargos && l.colaboradores > 0 && (
                      <Button size="sm" variant="outline" onClick={() => onEnquadrarFuncao(l.funcaoId)}><Users className="mr-1.5 h-3.5 w-3.5" /> Enquadrar em lote</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
