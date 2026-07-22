import { Calculator, CalendarPlus, GitCompare, Users } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { formatCurrencyBRL, formatNumberBR, pluralizeBR } from '@/lib/formatters';
import { formatDateTimeBR } from '@/lib/dateTime';
import { KitsConfigStatus } from './KitsConfigStatus';
import { KitsBonusBreakdown } from './KitsBonusBreakdown';
import { periodLabel, vigenciaLabel } from './periodLabel';
import type { KitsConfigRow } from '../types/kits-config.types';

interface Props {
  row: KitsConfigRow | null;
  onClose: () => void;
  onSimular: (r: KitsConfigRow) => void;
  onNovaVigencia: (r: KitsConfigRow) => void;
  onComparar: (r: KitsConfigRow) => void;
  onVerUtilizacao: (r: KitsConfigRow) => void;
}

export function KitsConfigDrawer({ row, onClose, onSimular, onNovaVigencia, onComparar, onVerUtilizacao }: Props) {
  if (!row) return <Sheet open={false} onOpenChange={() => {}}><SheetContent /></Sheet>;
  const r = row;
  const cfg = { minimoKits: r.minimoKits, incrementoFaixa: r.incrementoFaixa, bonusBase: r.bonusBase, bonusPorFaixa: r.bonusPorFaixa, maxFaixas: r.maxFaixas };

  return (
    <Sheet open={!!row} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-[540px]">
        <SheetHeader className="border-b border-border/60 px-5 py-4">
          <SheetTitle className="truncate">{vigenciaLabel(r)}</SheetTitle>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <KitsConfigStatus state={r.state} />
            <span className="text-xs text-muted-foreground">{periodLabel(r)}</span>
          </div>
          {r.sentinela && <p className="mt-1 text-[11px] text-muted-foreground">Vigência técnica: {r.vigenciaInicio} (regra inicial / desde sempre).</p>}
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <Section label="Parâmetros">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Line k="Mínimo" v={`${formatNumberBR(r.minimoKits)} kits`} />
              <Line k="Incremento" v={`${formatNumberBR(r.incrementoFaixa)} kits`} />
              <Line k="Bônus base" v={formatCurrencyBRL(r.bonusBase)} />
              <Line k="Bônus/faixa" v={formatCurrencyBRL(r.bonusPorFaixa)} />
              <Line k="Máx. faixas" v={r.maxFaixas != null ? `${formatNumberBR(r.maxFaixas)} (não aplicado)` : 'Sem limite'} />
            </div>
          </Section>

          <Section label="Fórmula (exemplo pelo motor)">
            <KitsBonusBreakdown kits={r.minimoKits + r.incrementoFaixa * 10} config={cfg} />
          </Section>

          <Section label="Utilização">
            <p className="text-sm text-foreground">
              {r.usage.utilizada ? `${pluralizeBR(r.usage.competencias, 'competência processada', 'competências processadas')} · ${pluralizeBR(r.usage.resultados, 'resultado', 'resultados')}.` : 'Nenhum processamento registrado com esta regra.'}
            </p>
          </Section>

          <Section label="Trilha">
            <div className="space-y-1 text-sm">
              <Line k="Criada em" v={r.createdAt ? formatDateTimeBR(r.createdAt) : '—'} />
              <Line k="Atualizada em" v={r.updatedAt ? formatDateTimeBR(r.updatedAt) : '—'} />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">Não há versionamento nem autor registrado (apenas created_at/updated_at).</p>
          </Section>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="justify-start gap-2" onClick={() => onSimular(r)}><Calculator className="h-4 w-4" /> Simular</Button>
            <Button variant="outline" className="justify-start gap-2" onClick={() => onComparar(r)}><GitCompare className="h-4 w-4" /> Comparar</Button>
            <Button variant="outline" className="justify-start gap-2" onClick={() => onVerUtilizacao(r)}><Users className="h-4 w-4" /> Ver utilização</Button>
            <Button className="justify-start gap-2" onClick={() => onNovaVigencia(r)}><CalendarPlus className="h-4 w-4" /> Nova vigência</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="rounded-lg border border-border/70 p-3"><p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p><div className="mt-1.5">{children}</div></div>;
}
function Line({ k, v }: { k: string; v: string }) {
  return <div className="flex items-center justify-between gap-2"><span className="text-muted-foreground">{k}</span><span className="font-medium tabular-nums text-foreground">{v}</span></div>;
}
