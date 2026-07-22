import { useMemo } from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { StatusBadge, type StatusVariant } from '@/components/app/StatusBadge';
import { formatNumberBR } from '@/lib/formatters';
import { FunctionJobMapping } from '../components/FunctionJobMapping';
import { agregarPendencias, pendenciasPorSetor, type Severidade } from '../domain/employeeJobIssues';
import { mapearFuncoes } from '../domain/employeeJobMapping';
import type { JobEmployeesData } from '../hooks/useJobEmployeesData';
import type { JobEmployeeFilters } from '../types/job-employee.types';

interface Props {
  data: JobEmployeesData;
  onAplicarFiltro: (patch: Partial<JobEmployeeFilters>) => void;
  onEnquadrarFuncao: (funcaoId: string) => void;
}

const SEV_VARIANT: Record<Severidade, StatusVariant> = { alta: 'danger', media: 'warning', baixa: 'info' };
const SEV_LABEL: Record<Severidade, string> = { alta: 'Alta', media: 'Média', baixa: 'Baixa' };

export function PendenciasView({ data, onAplicarFiltro, onEnquadrarFuncao }: Props) {
  const issues = useMemo(() => agregarPendencias(data.rows), [data.rows]);
  const porSetor = useMemo(() => pendenciasPorSetor(data.rows), [data.rows]);
  const mapping = useMemo(() => mapearFuncoes(data.funcoes, data.rows, data.cargos), [data.funcoes, data.rows, data.cargos]);

  return (
    <div className="space-y-6">
      <SectionCard title="Resumo de pendências" description="Tipos de pendência de enquadramento, priorizados por severidade.">
        {issues.length === 0 ? (
          <div className="flex items-center gap-3 rounded-lg border border-success/20 bg-success/5 p-4">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <p className="text-sm text-foreground">Nenhuma pendência de enquadramento identificada.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-3 font-medium">Severidade</th>
                  <th className="pb-2 pr-3 font-medium">Pendência</th>
                  <th className="pb-2 pr-3 font-medium">Quantidade</th>
                  <th className="pb-2 pr-3 font-medium">Setores</th>
                  <th className="pb-2 text-right font-medium">Ação</th>
                </tr>
              </thead>
              <tbody>
                {issues.map((i) => (
                  <tr key={i.situacao} className="border-b border-border/40 last:border-0">
                    <td className="py-2.5 pr-3"><StatusBadge variant={SEV_VARIANT[i.severidade]}>{SEV_LABEL[i.severidade]}</StatusBadge></td>
                    <td className="py-2.5 pr-3 font-medium text-foreground">{i.titulo}</td>
                    <td className="py-2.5 pr-3 tabular-nums text-muted-foreground">{formatNumberBR(i.quantidade)}</td>
                    <td className="py-2.5 pr-3 tabular-nums text-muted-foreground">{formatNumberBR(i.setoresAfetados)}</td>
                    <td className="py-2.5 text-right">
                      <button type="button" className="text-xs font-medium text-primary hover:underline" onClick={() => onAplicarFiltro(i.filtro)}>Ver colaboradores</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Pendências por setor" description="Cobertura de enquadramento por setor. Clique para filtrar.">
        {porSetor.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Sem dados por setor.</p>
        ) : (
          <div className="space-y-2.5">
            {porSetor.map((s) => (
              <button
                key={s.setorId ?? '__sem__'} type="button"
                onClick={() => onAplicarFiltro({ setorId: s.setorId, enquadramento: 'pendentes' })}
                className="flex w-full items-center justify-between gap-4 rounded-lg border border-border/70 bg-card p-3 text-left hover:border-primary/25 hover:bg-muted/40"
              >
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{s.setorNome}</h4>
                  <p className="text-xs text-muted-foreground">{formatNumberBR(s.total)} colaborador(es) · {formatNumberBR(s.semCargo)} sem cargo</p>
                </div>
                <StatusBadge variant={s.pendentes > 0 ? 'warning' : 'success'}>
                  {s.pendentes > 0 ? <><AlertTriangle className="h-3 w-3" /> {formatNumberBR(s.pendentes)} pendente(s)</> : 'Regular'}
                </StatusBadge>
              </button>
            ))}
          </div>
        )}
      </SectionCard>

      <FunctionJobMapping linhas={mapping} temCargos={data.temCargos} onEnquadrarFuncao={onEnquadrarFuncao} />
    </div>
  );
}
