import { useState } from 'react';
import { History } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { EmployeesPagination } from '@/components/employees/EmployeesPagination';
import { SectorIndicatorsEmptyState } from '../components/SectorIndicatorsEmptyState';
import { SectorIndicatorsHistorySummary } from '../components/SectorIndicatorsHistorySummary';
import { SectorIndicatorsHistoryFilters } from '../components/SectorIndicatorsHistoryFilters';
import { SectorIndicatorsHistoryTable } from '../components/SectorIndicatorsHistoryTable';
import { SectorIndicatorsHistoryDrawer } from '../components/SectorIndicatorsHistoryDrawer';
import { useSectorIndicatorsHistory } from '../hooks/useSectorIndicatorsHistory';
import { useSectorIndicatorsHistoryFilters } from '../hooks/useSectorIndicatorsFilters';
import type { SectorIndicatorHistoryRow } from '../types/sector-indicators.types';
import type { SectorIndicatorsPageProps } from './_shared';

export function SectorIndicatorsHistoryView({ data, setCompetencia, onGoToView, onVerIndicadoresGerais }: SectorIndicatorsPageProps) {
  const [selectedRow, setSelectedRow] = useState<SectorIndicatorHistoryRow | null>(null);

  const rows = useSectorIndicatorsHistory(data.indicadores, data.setores);
  const filtersState = useSectorIndicatorsHistoryFilters(rows);

  const empresasOpt = data.empresas.map((e) => ({ id: e.id, nome: e.nome }));
  const setoresOpt = data.setoresPrevistos.map((s) => ({ id: s.id, nome: s.nome }));

  const handleEdit = (row: SectorIndicatorHistoryRow) => { setCompetencia(row.competencia); onGoToView('apuracao'); };
  const handleDelete = async (row: SectorIndicatorHistoryRow) => { if (row.registroId) await data.deleteIndicador(row.registroId); };

  return (
    <div className="space-y-[18px]">
      <SectorIndicatorsHistorySummary rows={filtersState.filtered} />

      <SectionCard title="Histórico de Indicadores" description="Todos os registros de indicadores por setor e competência">
        <div className="space-y-4">
          <SectorIndicatorsHistoryFilters
            searchInput={filtersState.searchInput}
            onSearchChange={filtersState.setSearchInput}
            filters={filtersState.filters}
            onChange={filtersState.setFilters}
            empresas={empresasOpt}
            setores={setoresOpt}
          />

          {rows.length === 0 ? (
            <SectorIndicatorsEmptyState icon={History} title="Nenhum registro de indicadores" description="Os registros de indicadores por setor aparecerão aqui." />
          ) : (
            <>
              <SectorIndicatorsHistoryTable
                rows={filtersState.paged}
                onOpenDrawer={setSelectedRow}
                onEdit={handleEdit}
                onViewIndicadoresGerais={(row) => onVerIndicadoresGerais({ setorId: row.setorId, competencia: row.competencia })}
                onDelete={handleDelete}
              />
              <EmployeesPagination
                page={filtersState.page}
                totalPages={filtersState.totalPages}
                pageSize={filtersState.pageSize}
                total={filtersState.filtered.length}
                onPageChange={filtersState.setPage}
                onPageSizeChange={filtersState.setPageSize}
              />
            </>
          )}
        </div>
      </SectionCard>

      <SectorIndicatorsHistoryDrawer
        row={selectedRow}
        historyRows={rows}
        onClose={() => setSelectedRow(null)}
        onEdit={handleEdit}
        onViewIndicadoresGerais={(row) => onVerIndicadoresGerais({ setorId: row.setorId, competencia: row.competencia })}
      />
    </div>
  );
}
