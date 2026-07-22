import type { UseOccurrencesReturn } from '@/features/occurrences/hooks/useOccurrences';
import type { UseOccurrenceDraftReturn } from '@/features/occurrences/hooks/useOccurrenceDraft';
import type { useOccurrenceFilters } from '@/features/occurrences/hooks/useOccurrenceFilters';
import type { useEmployeeSelection } from '@/features/employees/hooks/useEmployeeSelection';

/** Props compartilhadas pelas 4 visões — recebem os dados/estado já processados pelo shell. */
export interface OccurrencePageProps {
  data: UseOccurrencesReturn;
  draft: UseOccurrenceDraftReturn;
  filtersState: ReturnType<typeof useOccurrenceFilters>;
  selection: ReturnType<typeof useEmployeeSelection>;
  competencia: string;
  setCompetencia: (comp: string) => void;
}
