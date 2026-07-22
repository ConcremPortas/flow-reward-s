import { useMemo, useState } from 'react';
import { Search, Pencil, FileText } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { DSS } from '@/hooks/useDSS';
import type { Funcionario } from '@/hooks/useFuncionarios';
import { linkedActiveFuncionarios } from '@/features/dss/domain/dssValidation';
import { formatDateBR } from '@/lib/dateTime';

interface Props {
  dss: DSS | null;
  funcionarios: Funcionario[];
  onClose: () => void;
  onEdit: (dss: DSS) => void;
  onGenerateReport: (dss: DSS) => void;
}

export function DssDetailsDrawer({ dss, funcionarios, onClose, onEdit, onGenerateReport }: Props) {
  const [search, setSearch] = useState('');

  const { presentes, ausentes, total } = useMemo(() => {
    if (!dss) return { presentes: [] as Funcionario[], ausentes: [] as Funcionario[], total: 0 };
    const vinculados = dss.local_dss_id ? linkedActiveFuncionarios(funcionarios, dss.local_dss_id) : [];
    const ids = new Set(dss.participantes_ids || []);
    return {
      presentes: vinculados.filter((f) => ids.has(f.id)),
      ausentes: vinculados.filter((f) => !ids.has(f.id)),
      total: vinculados.length,
    };
  }, [dss, funcionarios]);

  if (!dss) return <Sheet open={false} onOpenChange={() => {}}><SheetContent /></Sheet>;

  const t = search.toLowerCase();
  const presentesFiltrados = t ? presentes.filter((f) => f.nome.toLowerCase().includes(t)) : presentes;
  const ausentesFiltrados = t ? ausentes.filter((f) => f.nome.toLowerCase().includes(t)) : ausentes;
  const participacao = total > 0 ? (presentes.length / total) * 100 : 0;

  return (
    <Sheet open={!!dss} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader><SheetTitle>{dss.titulo}</SheetTitle></SheetHeader>

        <p className="mt-1 text-xs text-muted-foreground">
          {dss.local_dss?.nome || 'Local não informado'} · {formatDateBR(dss.data_realizacao)}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <Field label="Presentes" value={String(presentes.length)} />
          <Field label="Ausentes" value={String(ausentes.length)} />
          <Field label="Participação" value={`${participacao.toFixed(0)}%`} />
        </div>

        <div className="mt-4 flex gap-2">
          <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => onEdit(dss)}><Pencil className="h-3.5 w-3.5" /> Editar</Button>
          <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => onGenerateReport(dss)}><FileText className="h-3.5 w-3.5" /> Gerar relatório</Button>
        </div>

        <div className="relative mt-5">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar funcionário..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-success">Presentes ({presentesFiltrados.length})</p>
            <div className="space-y-1">
              {presentesFiltrados.map((f) => <p key={f.id} className="truncate rounded-md bg-success/[0.06] px-2.5 py-1.5 text-xs text-foreground">{f.nome}</p>)}
              {presentesFiltrados.length === 0 && <p className="text-xs text-muted-foreground">Nenhum</p>}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-destructive">Ausentes ({ausentesFiltrados.length})</p>
            <div className="space-y-1">
              {ausentesFiltrados.map((f) => <p key={f.id} className="truncate rounded-md bg-destructive/[0.05] px-2.5 py-1.5 text-xs text-foreground">{f.nome}</p>)}
              {ausentesFiltrados.length === 0 && <p className="text-xs text-muted-foreground">Nenhum</p>}
            </div>
          </div>
        </div>
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
