import { useMemo, useState } from 'react';
import { Search, Pencil, FileText } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmployeesPagination } from '@/components/employees/EmployeesPagination';
import { formatDateBR } from '@/lib/dateTime';
import type { EpiAuditGroupEnriched } from '@/features/epi/domain/epiCalculations';
import type { EpiAuditMember } from '@/features/epi/types/epi.types';

interface Props {
  group: EpiAuditGroupEnriched | null;
  onClose: () => void;
  onEdit: (group: EpiAuditGroupEnriched) => void;
  onGenerateReport: (group: EpiAuditGroupEnriched) => void;
}

type Situacao = 'todos' | 'conformes' | 'nao_conformes';

export function EpiAuditDrawer({ group, onClose, onEdit, onGenerateReport }: Props) {
  const [search, setSearch] = useState('');
  const [situacao, setSituacao] = useState<Situacao>('todos');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const filtered = useMemo(() => {
    if (!group) return [] as EpiAuditMember[];
    const t = search.toLowerCase();
    return group.membros.filter((m) => {
      if (t && !m.nome.toLowerCase().includes(t)) return false;
      if (situacao === 'conformes' && !m.conforme) return false;
      if (situacao === 'nao_conformes' && m.conforme) return false;
      return true;
    });
  }, [group, search, situacao]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const paged = filtered.slice((clampedPage - 1) * pageSize, clampedPage * pageSize);

  if (!group) return <Sheet open={false} onOpenChange={() => {}}><SheetContent /></Sheet>;

  return (
    <Sheet
      open={!!group}
      onOpenChange={(o) => { if (!o) { onClose(); setSearch(''); setSituacao('todos'); setPage(1); } }}
    >
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader><SheetTitle>{group.titulo}</SheetTitle></SheetHeader>

        <p className="mt-1 text-xs text-muted-foreground">
          {formatDateBR(group.data)}
          {group.isLegacy && ' · registro anterior à correção de persistência'}
        </p>

        <div className="mt-4 grid grid-cols-4 gap-3">
          <Field label="Auditados" value={String(group.totalAuditados)} />
          <Field label="Conformes" value={String(group.conformes)} />
          <Field label="Não conformes" value={String(group.naoConformes)} />
          <Field label="Taxa" value={group.taxaConformidade != null ? `${group.taxaConformidade.toFixed(0)}%` : '—'} />
        </div>

        <div className="mt-4 flex gap-2">
          <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => onEdit(group)}><Pencil className="h-3.5 w-3.5" /> Editar</Button>
          <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => onGenerateReport(group)}><FileText className="h-3.5 w-3.5" /> Gerar relatório</Button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <div className="relative min-w-[160px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar funcionário..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-9" />
          </div>
          <Select value={situacao} onValueChange={(v) => { setSituacao(v as Situacao); setPage(1); }}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="conformes">Conformes</SelectItem>
              <SelectItem value="nao_conformes">Não conformes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-3 space-y-1">
          {paged.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted-foreground">Nenhum funcionário encontrado.</p>
          ) : paged.map((m) => (
            <div
              key={m.recordId ?? m.nome}
              className={`flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs ${m.conforme ? 'bg-success/[0.06] text-foreground' : 'bg-destructive/[0.05] text-foreground'}`}
            >
              <span className="truncate">{m.nome}</span>
              <span className={m.conforme ? 'font-medium text-success' : 'font-medium text-destructive'}>{m.conforme ? 'Conforme' : 'Não conforme'}</span>
            </div>
          ))}
        </div>

        {filtered.length > 0 && (
          <div className="mt-3">
            <EmployeesPagination
              page={clampedPage} totalPages={totalPages} pageSize={pageSize} total={filtered.length}
              onPageChange={setPage} onPageSizeChange={(n) => { setPageSize(n); setPage(1); }}
              pageSizeOptions={[25, 50, 100]}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/70 p-2.5 text-center">
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
