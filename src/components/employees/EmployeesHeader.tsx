import { Users, Plus, UploadCloud, MoreHorizontal, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { PageHeader } from '@/components/app/PageHeader';
import { formatDateTimeBR } from '@/lib/dateTime';

interface EmployeesHeaderProps {
  total: number;
  lastUpdated: Date | null;
  onNew: () => void;
  onImport: () => void;
  onDownloadTemplate: () => void;
  onExportCsv: () => void;
}

/** Cabeçalho compacto da Central de Gestão de Pessoas. */
export function EmployeesHeader({ total, lastUpdated, onNew, onImport, onDownloadTemplate, onExportCsv }: EmployeesHeaderProps) {
  const updated = lastUpdated ? formatDateTimeBR(lastUpdated) : null;

  return (
    <PageHeader
      icon={Users}
      title="Gestão de Pessoas"
      description={`${total} funcionário(s) cadastrado(s)${updated ? ` · atualizado ${updated}` : ''}`}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button className="gap-2" onClick={onNew}>
            <Plus className="h-4 w-4" /> Novo Funcionário
          </Button>
          <Button variant="outline" className="gap-2" onClick={onImport}>
            <UploadCloud className="h-4 w-4" /> Importar
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Mais ações">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onDownloadTemplate}>
                <Download className="mr-2 h-4 w-4" /> Baixar modelo de importação
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportCsv}>
                <Download className="mr-2 h-4 w-4" /> Exportar lista (CSV)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
    />
  );
}
