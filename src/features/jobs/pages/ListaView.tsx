import { useMemo } from 'react';
import { Briefcase } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { EmptyState } from '@/components/app/EmptyState';
import { Button } from '@/components/ui/button';
import { formatNumberBR } from '@/lib/formatters';
import { JobsContext } from '../components/JobsContext';
import { JobsFilters } from '../components/JobsFilters';
import { JobsTable } from '../components/JobsTable';
import type { JobRowHandlers } from '../components/JobActionsMenu';
import { filtrarJobRows } from '../domain/jobFilters';
import type { JobsModel } from '../domain/jobModel';
import type { JobFilters } from '../types/job.types';

interface Props {
  model: JobsModel;
  filtros: JobFilters;
  ativos: number;
  autorizadoSalario: boolean;
  setores: Array<{ id: string; nome: string }>;
  onChangeFiltros: (f: Partial<JobFilters>) => void;
  onLimpar: () => void;
  handlers: JobRowHandlers;
}

export function ListaView({ model, filtros, ativos, autorizadoSalario, setores, onChangeFiltros, onLimpar, handlers }: Props) {
  const rows = useMemo(() => filtrarJobRows(model.rows, filtros), [model.rows, filtros]);

  return (
    <div className="space-y-[18px]">
      <JobsContext ctx={model.contexto} onQuickFilter={onChangeFiltros} />

      <SectionCard title="Cargos" description="Estrutura, ocupação, faixa e situação de cada cargo.">
        <div className="space-y-4">
          <JobsFilters
            filtros={filtros}
            setores={setores}
            niveis={model.niveisDistintos}
            ativos={ativos}
            onChange={onChangeFiltros}
            onLimpar={onLimpar}
          />

          {rows.length === 0 ? (
            <EmptyState
              icon={Briefcase}
              title="Nenhum cargo no recorte atual"
              description={ativos > 0 ? 'Nenhum cargo corresponde aos filtros aplicados.' : 'Não há cargos para exibir.'}
              action={ativos > 0 ? <Button variant="outline" size="sm" onClick={onLimpar}>Limpar filtros</Button> : undefined}
            />
          ) : (
            <>
              <JobsTable rows={rows} autorizadoSalario={autorizadoSalario} handlers={handlers} />
              <p className="text-xs text-muted-foreground">Mostrando {formatNumberBR(rows.length)} de {formatNumberBR(model.rows.length)} cargo(s).</p>
            </>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
