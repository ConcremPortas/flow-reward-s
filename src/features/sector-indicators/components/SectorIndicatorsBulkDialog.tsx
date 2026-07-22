import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { pluralizeBR } from '@/lib/formatters';
import { INDICATOR_DEFINITIONS } from '../domain/indicatorDefinitions';
import { emptyEntry } from '../domain/indicatorCalculations';
import { parseNumberBR, maskNumericInput } from '../domain/indicatorValidation';
import type { IndicatorId, SectorIndicatorDraftMap } from '../types/sector-indicators.types';

export type BulkMode = 'metas' | 'indicadores';

interface Props {
  open: boolean;
  mode: BulkMode;
  onOpenChange: (open: boolean) => void;
  selectedSetorIds: string[];
  draft: SectorIndicatorDraftMap;
  onApply: (entries: SectorIndicatorDraftMap) => void;
}

interface FieldState { enabled: boolean; meta: string; realizado: string }

/**
 * Aplicação em massa de metas (ou metas + realizado) a vários setores. Não grava
 * direto: alimenta o rascunho (passa pela revisão/salvamento). "Preencher apenas
 * vazios" nunca sobrescreve valores já preenchidos; sobrescrever exige marcação
 * explícita.
 */
export function SectorIndicatorsBulkDialog({ open, mode, onOpenChange, selectedSetorIds, draft, onApply }: Props) {
  const withRealizado = mode === 'indicadores';
  const [fields, setFields] = useState<Record<IndicatorId, FieldState>>(() =>
    INDICATOR_DEFINITIONS.reduce((acc, d) => { acc[d.id] = { enabled: false, meta: '', realizado: '' }; return acc; }, {} as Record<IndicatorId, FieldState>),
  );
  const [overwrite, setOverwrite] = useState(false);

  const patch = (id: IndicatorId, p: Partial<FieldState>) => setFields((prev) => ({ ...prev, [id]: { ...prev[id], ...p } }));

  const enabledDefs = INDICATOR_DEFINITIONS.filter((d) => fields[d.id].enabled);

  const { entries, jaPreenchidos, aplicaveis } = useMemo(() => {
    const result: SectorIndicatorDraftMap = {};
    let ja = 0;
    let count = 0;
    for (const setorId of selectedSetorIds) {
      const cur = draft[setorId] ?? emptyEntry();
      const nextEntry = { ...cur };
      let touched = false;
      for (const def of enabledDefs) {
        const f = fields[def.id];
        const metaVal = parseNumberBR(f.meta);
        const realizadoVal = withRealizado ? parseNumberBR(f.realizado) : null;
        if (metaVal == null && realizadoVal == null) continue;
        const existing = cur[def.id] ?? { meta: null, realizado: null };
        const alreadyFilled = existing.meta != null || (withRealizado && existing.realizado != null);
        if (alreadyFilled && !overwrite) { ja += 1; continue; }
        if (alreadyFilled && overwrite) ja += 1;
        nextEntry[def.id] = {
          meta: metaVal != null ? metaVal : existing.meta,
          realizado: withRealizado && realizadoVal != null ? realizadoVal : existing.realizado,
        };
        touched = true;
      }
      if (touched) { result[setorId] = nextEntry; count += 1; }
    }
    return { entries: result, jaPreenchidos: ja, aplicaveis: count };
  }, [selectedSetorIds, draft, enabledDefs, fields, overwrite, withRealizado]);

  const apply = () => { onApply(entries); onOpenChange(false); };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === 'metas' ? 'Aplicar metas em massa' : 'Aplicar indicadores em massa'}</DialogTitle>
          <DialogDescription>
            {pluralizeBR(selectedSetorIds.length, 'setor selecionado', 'setores selecionados')}. Escolha os indicadores e valores.
            As alterações entram no rascunho e passam pela revisão antes de salvar.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[45vh] space-y-2 overflow-auto">
          {INDICATOR_DEFINITIONS.map((def) => {
            const f = fields[def.id];
            return (
              <div key={def.id} className="flex items-center gap-2 rounded-lg border border-border/60 p-2">
                <Checkbox checked={f.enabled} onCheckedChange={(v) => patch(def.id, { enabled: !!v })} aria-label={`Incluir ${def.label}`} />
                <span className="flex-1 text-sm">{def.label}</span>
                <Input
                  className="h-8 w-24 text-right tabular-nums"
                  placeholder="Meta"
                  value={f.meta}
                  disabled={!f.enabled}
                  onChange={(e) => patch(def.id, { meta: maskNumericInput(e.target.value) })}
                  aria-label={`Meta de ${def.label}`}
                />
                {withRealizado && (
                  <Input
                    className="h-8 w-24 text-right tabular-nums"
                    placeholder="Realizado"
                    value={f.realizado}
                    disabled={!f.enabled}
                    onChange={(e) => patch(def.id, { realizado: maskNumericInput(e.target.value) })}
                    aria-label={`Realizado de ${def.label}`}
                  />
                )}
              </div>
            );
          })}
        </div>

        <div className="rounded-lg border border-border/70 p-3 text-sm">
          <p className="text-foreground">{aplicaveis} setor(es) receberão os valores.</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{jaPreenchidos} campo(s) já preenchido(s) nos setores selecionados.</p>
          <label className="mt-2 flex items-center gap-2 text-sm text-foreground">
            <Checkbox checked={overwrite} onCheckedChange={(v) => setOverwrite(!!v)} />
            Sobrescrever valores já preenchidos
          </label>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={apply} disabled={aplicaveis === 0}>Aplicar a {aplicaveis} setor(es)</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
