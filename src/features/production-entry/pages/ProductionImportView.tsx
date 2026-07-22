import { ProductionImportWizard } from '../components/ProductionImportWizard';
import { useProductionImport } from '../hooks/useProductionImport';
import type { ProductionPageProps } from './_shared';

export function ProductionImportView({ data }: ProductionPageProps) {
  const imp = useProductionImport({ setores: data.setores, onImported: data.refetch });
  return <ProductionImportWizard imp={imp} />;
}
