import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatNumberBR } from '@/lib/formatters';
import { PAGE_SIZES } from '../views';
import { totalPaginas } from '../domain/employeeFilters';

interface Props {
  total: number;
  pagina: number;
  porPagina: number;
  onPagina: (p: number) => void;
  onPorPagina: (n: number) => void;
}

export function JobEmployeesPagination({ total, pagina, porPagina, onPagina, onPorPagina }: Props) {
  const paginas = totalPaginas(total, porPagina);
  const inicio = total === 0 ? 0 : (pagina - 1) * porPagina + 1;
  const fim = Math.min(pagina * porPagina, total);
  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>Mostrando {formatNumberBR(inicio)}–{formatNumberBR(fim)} de {formatNumberBR(total)}</span>
        <Select value={String(porPagina)} onValueChange={(v) => onPorPagina(Number(v))}>
          <SelectTrigger className="h-8 w-[110px]"><SelectValue /></SelectTrigger>
          <SelectContent>{PAGE_SIZES.map((n) => <SelectItem key={n} value={String(n)}>{n} por página</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" className="h-8" disabled={pagina <= 1} onClick={() => onPagina(pagina - 1)}><ChevronLeft className="h-4 w-4" /> Anterior</Button>
        <span className="text-xs text-muted-foreground">Página {formatNumberBR(pagina)} de {formatNumberBR(paginas)}</span>
        <Button variant="outline" size="sm" className="h-8" disabled={pagina >= paginas} onClick={() => onPagina(pagina + 1)}>Próxima <ChevronRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}
