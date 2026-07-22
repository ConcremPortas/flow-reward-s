import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { EmptyState } from '@/components/app/EmptyState';
import { EmployeesPagination } from '@/components/employees/EmployeesPagination';
import { ProductionHistorySummary } from '../components/ProductionHistorySummary';
import { ProductionHistoryFilters } from '../components/ProductionHistoryFilters';
import { ProductionHistoryTable } from '../components/ProductionHistoryTable';
import { ProductionSectorDrawer } from '../components/ProductionSectorDrawer';
import { useProductionHistory } from '../hooks/useProductionHistory';
import { useProductionHistoryFilters } from '../hooks/useProductionFilters';
import type { ProductionHistoryRow, ProductionRow } from '../types/production-entry.types';
import type { ProductionPageProps } from './_shared';

export function ProductionHistoryView({ data, competencia, setCompetencia, onGoToView }: ProductionPageProps) {
  const navigate = useNavigate();
  const [selectedRow, setSelectedRow] = useState<ProductionRow | null>(null);
  const [drawerCompetencia, setDrawerCompetencia] = useState(competencia);

  const rows = useProductionHistory(data.registros, data.setores);
  const filtersState = useProductionHistoryFilters(rows);

  const empresasOpt = data.empresas.map((e) => ({ id: e.id, nome: e.nome }));
  const setoresOpt = data.setoresPrevistos.map((s) => ({ id: s.id, nome: s.nome }));

  const handleEdit = (row: ProductionHistoryRow) => {
    setCompetencia(row.competencia);
    onGoToView('apuracao');
  };

  const handleViewIndicators = (row: ProductionHistoryRow) => navigate(`/premiacoes/indicadores-setor?setor=${row.setorId}`);

  const handleDelete = async (row: ProductionHistoryRow) => {
    if (row.registroId) await data.deleteRegistro(row.registroId);
  };

  return (
    <div className="space-y-[18px]">
      <ProductionHistorySummary rows={filtersState.filtered} />

      <SectionCard title="Histórico de Produção" description="Todos os registros de meta e produção realizada por setor e competência">
        <div className="space-y-4">
          <ProductionHistoryFilters
            searchInput={filtersState.searchInput}
            onSearchChange={filtersState.setSearchInput}
            filters={filtersState.filters}
            onChange={filtersState.setFilters}
            empresas={empresasOpt}
            setores={setoresOpt}
          />

          {rows.length === 0 ? (
            <EmptyState icon={History} title="Nenhum registro de produção" description="Os registros de produção por setor aparecerão aqui." />
          ) : (
            <>
              <ProductionHistoryTable
                rows={filtersState.paged}
                onOpenDrawer={(row) => { setDrawerCompetencia(row.competencia); setSelectedRow(row); }}
                onEdit={handleEdit}
                onViewIndicators={handleViewIndicators}
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

      <ProductionSectorDrawer
        row={selectedRow}
        competencia={drawerCompetencia}
        registros={data.registros}
        onClose={() => setSelectedRow(null)}
      />
    </div>
  );
}
