import { useMemo } from 'react';
import type { Setor } from '@/hooks/useSetores';
import { JobsStructureMap } from '../components/JobsStructureMap';
import { JobFunctionAnalysis } from '../components/JobFunctionAnalysis';
import { filtrarJobRows } from '../domain/jobFilters';
import type { JobsModel } from '../domain/jobModel';
import type { JobFilters } from '../types/job.types';

interface Props {
  model: JobsModel;
  filtros: JobFilters;
  setores: Setor[];
  onSelectSetor: (setorId: string | null) => void;
  onSelectNivel: (nivel: string) => void;
}

/** Mapa da estrutura + análise de funções. Respeita os filtros globais. */
export function EstruturaView({ model, filtros, setores, onSelectSetor, onSelectNivel }: Props) {
  const rows = useMemo(() => filtrarJobRows(model.rows, filtros), [model.rows, filtros]);
  return (
    <div className="space-y-6">
      <JobsStructureMap rows={rows} setores={setores} onSelectSetor={onSelectSetor} onSelectNivel={onSelectNivel} />
      <JobFunctionAnalysis resumo={model.funcaoMapping} />
    </div>
  );
}
