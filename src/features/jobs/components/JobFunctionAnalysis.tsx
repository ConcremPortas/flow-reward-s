import { GitCompareArrows, Info } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { StatusBadge } from '@/components/app/StatusBadge';
import { formatNumberBR } from '@/lib/formatters';
import type { FuncaoMappingResumo } from '../domain/jobFunctionMapping';

interface Props {
  resumo: FuncaoMappingResumo;
}

/**
 * Diagnóstico das funções × cargos. Sugere equivalências apenas por semelhança
 * de nome, para REVISÃO manual — nunca converte função em cargo nem altera dados.
 */
export function JobFunctionAnalysis({ resumo }: Props) {
  return (
    <SectionCard title="Análise de funções existentes" description="Base para desenhar cargos. Nenhuma conversão é aplicada automaticamente.">
      <div className="mb-4 rounded-lg border border-primary/20 bg-primary/[0.04] p-3">
        <div className="flex items-start gap-2.5">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">Função</strong> é o vínculo operacional do colaborador;
            <strong className="text-foreground"> cargo</strong> é a posição formal do plano. A coluna “cargo equivalente”
            é apenas uma sugestão por nome — a decisão de enquadrar é sempre manual.
          </p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Mini label="Funções distintas" value={resumo.funcoesDistintas} />
        <Mini label="Com colaboradores" value={resumo.funcoesComColaboradores} />
        <Mini label="Sem colaboradores" value={resumo.funcoesSemColaboradores} />
        <Mini label="Colaboradores c/ função" value={resumo.colaboradoresComFuncao} />
      </div>

      {resumo.itens.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Nenhuma função cadastrada.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">Função</th>
                <th className="pb-2 pr-3 font-medium">Colaboradores</th>
                <th className="pb-2 font-medium">Cargo equivalente (sugestão)</th>
              </tr>
            </thead>
            <tbody>
              {resumo.itens.map((i) => (
                <tr key={i.funcaoId} className="border-b border-border/40 last:border-0">
                  <td className="py-2.5 pr-3 font-medium text-foreground">{i.funcaoNome}</td>
                  <td className="py-2.5 pr-3 tabular-nums text-muted-foreground">{formatNumberBR(i.colaboradores)}</td>
                  <td className="py-2.5">
                    {i.cargoEquivalenteNome
                      ? <StatusBadge variant="info">{i.cargoEquivalenteNome}</StatusBadge>
                      : <span className="text-xs text-muted-foreground">Sem cargo equivalente — revisar</span>}
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

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
      <p className="text-lg font-bold leading-none text-foreground">{formatNumberBR(value)}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
