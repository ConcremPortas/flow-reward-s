import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { EmployeeTimeline } from '@/features/epi/domain/epiRecurrence';
import { isReincidente } from '@/features/epi/domain/epiRecurrence';
import { formatDateBR } from '@/lib/dateTime';

interface Props {
  timeline: EmployeeTimeline | null;
  funcionariosById: Map<string, Funcionario>;
  onClose: () => void;
}

export function EpiNonConformityDrawer({ timeline, funcionariosById, onClose }: Props) {
  if (!timeline) return <Sheet open={false} onOpenChange={() => {}}><SheetContent /></Sheet>;

  const f = timeline.funcionarioId ? funcionariosById.get(timeline.funcionarioId) : undefined;
  const naoConformes = timeline.events.filter((e) => !e.conforme).length;
  const reincidente = isReincidente(timeline.events);

  return (
    <Sheet open={!!timeline} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader><SheetTitle>{timeline.nome}</SheetTitle></SheetHeader>

        <p className="mt-1 text-xs text-muted-foreground">
          {f?.setor?.nome || 'Setor não disponível'} · {f?.empresa?.nome || 'Empresa não disponível'}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <Field label="Auditorias" value={String(timeline.events.length)} />
          <Field label="Não conformidades" value={String(naoConformes)} />
          <Field label="Reincidência" value={reincidente ? 'Sim' : 'Não'} />
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sequência de Auditorias</p>
          <div className="space-y-1.5">
            {timeline.events.map((e) => (
              <div key={e.auditoriaId} className="flex items-center justify-between rounded-md border border-border/60 px-3 py-2 text-sm">
                <span className="text-foreground">{formatDateBR(e.data)}</span>
                {e.conforme ? <Badge variant="secondary">Conforme</Badge> : <Badge variant="destructive">Não conforme</Badge>}
              </div>
            ))}
          </div>
        </div>

        {!timeline.funcionarioId && (
          <p className="mt-4 text-[11px] text-muted-foreground">
            Este histórico inclui auditorias registradas antes da correção de persistência (identificadas apenas por nome, sem vínculo de cadastro).
          </p>
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
