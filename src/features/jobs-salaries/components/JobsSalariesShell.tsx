import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useJobsSalariesData } from '../hooks/useJobsSalariesData';
import { useJobsSalariesFilters } from '../hooks/useJobsSalariesFilters';
import { buildJobsSalariesModel } from '../domain/model';
import { normalizeJobsSalariesView } from '../views';
import type { JobsSalariesView } from '../types/jobsSalaries.types';
import { JobsSalariesHeader } from './JobsSalariesHeader';
import { JobsSalariesNavigation } from './JobsSalariesNavigation';
import { JobsSalariesFilters } from './JobsSalariesFilters';
import { JobsSalariesSkeleton } from './JobsSalariesSkeleton';
import { SetupState } from './SetupState';
import { ResumoView } from '../pages/ResumoView';
import { EstruturaView } from '../pages/EstruturaView';
import { RemuneracaoView } from '../pages/RemuneracaoView';
import { GovernancaView } from '../pages/GovernancaView';

/**
 * Central de Cargos e Remuneração — shell único (?view=resumo|estrutura|
 * remuneracao|governanca). Carrega os dados uma vez, deriva todo o modelo de
 * forma pura e apenas orquestra as visões. Estado de implantação quando não há
 * cargos; remuneração é guardada por autorização (front + backend). Não altera
 * banco/RLS nem o motor de premiação.
 */
export function JobsSalariesShell() {
  const data = useJobsSalariesData();
  const { filtros, setFiltros, limpar, ativos } = useJobsSalariesFilters();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = normalizeJobsSalariesView(searchParams.get('view'));

  const model = useMemo(() => buildJobsSalariesModel(data, filtros), [data, filtros]);

  const setView = (v: JobsSalariesView) => {
    const sp = new URLSearchParams(searchParams);
    sp.set('view', v);
    setSearchParams(sp, { replace: false });
  };

  const carregandoBase = data.load.cargos.loading && data.cargos.length === 0;
  if (carregandoBase) return <JobsSalariesSkeleton />;

  // Módulo não implantado: estado de setup é o conteúdo primário, sem filtros.
  if (model.naoImplantado) {
    return (
      <div className="mx-auto w-full max-w-[1800px] space-y-6">
        <JobsSalariesHeader />
        <SetupState counts={model.countsGlobais} />
      </div>
    );
  }

  const mostrarFiltros = view === 'estrutura' || view === 'remuneracao';

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-6">
      <JobsSalariesHeader>
        <JobsSalariesNavigation active={view} onChange={setView} />
      </JobsSalariesHeader>

      {mostrarFiltros && (
        <JobsSalariesFilters
          filtros={filtros}
          options={model.filterOptions}
          ativos={ativos}
          onChange={setFiltros}
          onLimpar={limpar}
        />
      )}

      <div key={view} className="animate-in fade-in slide-in-from-right-2 duration-200 motion-reduce:animate-none">
        {view === 'resumo' && <ResumoView model={model} filtrosAtivos={ativos} />}
        {view === 'estrutura' && <EstruturaView model={model} />}
        {view === 'remuneracao' && <RemuneracaoView model={model} />}
        {view === 'governanca' && <GovernancaView model={model} data={data} />}
      </div>
    </div>
  );
}
