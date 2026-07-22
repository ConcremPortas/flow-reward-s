import { X, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Option { id: string; nome: string }

interface EmployeeSelectionBarProps {
  count: number;
  setores: Option[];
  categorias: Option[];
  statusOptions: string[];
  busy: boolean;
  onChangeSetor: (setorId: string) => void;
  onChangeStatus: (status: string) => void;
  onChangeCategoria: (categoriaId: string) => void;
  onExport: () => void;
  onClear: () => void;
}

/** Barra contextual de ações em massa. Só ações persistíveis com segurança (mesmos hooks de update já existentes). */
export function EmployeeSelectionBar({
  count, setores, categorias, statusOptions, busy,
  onChangeSetor, onChangeStatus, onChangeCategoria, onExport, onClear,
}: EmployeeSelectionBarProps) {
  if (count === 0) return null;

  return (
    <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-primary/20 bg-primary/[0.06] px-4 py-3">
      <span className="text-sm font-semibold text-foreground">{count} selecionado(s)</span>
      {busy && <Loader2 className="h-4 w-4 animate-spin text-primary" />}

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <Select onValueChange={onChangeSetor} disabled={busy}>
          <SelectTrigger className="h-8 w-[160px] text-sm"><SelectValue placeholder="Alterar setor" /></SelectTrigger>
          <SelectContent>{setores.map((s) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}</SelectContent>
        </Select>

        <Select onValueChange={onChangeCategoria} disabled={busy}>
          <SelectTrigger className="h-8 w-[160px] text-sm"><SelectValue placeholder="Alterar categoria" /></SelectTrigger>
          <SelectContent>{categorias.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
        </Select>

        <Select onValueChange={onChangeStatus} disabled={busy}>
          <SelectTrigger className="h-8 w-[150px] text-sm"><SelectValue placeholder="Alterar status" /></SelectTrigger>
          <SelectContent>{statusOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>

        <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={onExport} disabled={busy}>
          <Download className="h-3.5 w-3.5" /> Exportar
        </Button>

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClear} aria-label="Limpar seleção">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
