import { useMemo, useState } from 'react';
import { Copy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CompetenciaPicker } from '@/components/dashboard/CompetenciaPicker';
import { formatNumberBR } from '@/lib/formatters';
import { competenciaLabelLong, shiftCompetencia } from '@/features/dashboard/utils/dates';
import type { ProducaoSetor } from '@/hooks/useProducaoSetor';
import type { ProductionDraftMap } from '../types/production-entry.types';
import { buildBaselineFromRegistros } from '../domain/productionCalculations';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competenciaDestino: string;
  registros: ProducaoSetor[];
  draft: ProductionDraftMap;
  setorNome: (setorId: string) => string;
  onApply: (entries: ProductionDraftMap) => void;
}

/**
 * Copia as METAS de uma competência de origem para o rascunho da competência
 * atual. Não grava direto: alimenta o draft (passa pela revisão/salvamento) e
 * NUNCA sobrescreve uma meta já preenchida no destino sem o usuário marcar
 * explicitamente "sobrescrever conflitos".
 */
export function ProductionCopyMetasDialog({ open, onOpenChange, competenciaDestino, registros, draft, setorNome, onApply }: Props) {
  const [origem, setOrigem] = useState(() => shiftCompetencia(competenciaDestino, -1));
  const [overwrite, setOverwrite] = useState(false);

  const origemMetas = useMemo(() => buildBaselineFromRegistros(registros, origem), [registros, origem]);

  const { novos, conflitos } = useMemo(() => {
    const novosArr: string[] = [];
    const conflitosArr: string[] = [];
    for (const [setorId, entry] of Object.entries(origemMetas)) {
      if (entry.meta == null) continue;
      const atual = draft[setorId]?.meta;
      if (atual == null) novosArr.push(setorId);
      else if (atual !== entry.meta) conflitosArr.push(setorId);
    }
    return { novos: novosArr, conflitos: conflitosArr };
  }, [origemMetas, draft]);

  const totalMetas = Object.values(origemMetas).filter((e) => e.meta != null).length;

  const apply = () => {
    const entries: ProductionDraftMap = {};
    const alvo = overwrite ? [...novos, ...conflitos] : novos;
    for (const setorId of alvo) {
      const cur = draft[setorId] ?? { meta: null, realizado: null };
      entries[setorId] = { ...cur, meta: origemMetas[setorId].meta };
    }
    onApply(entries);
    onOpenChange(false);
  };

  const aplicaveis = overwrite ? novos.length + conflitos.length : novos.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Copiar metas do mês anterior</DialogTitle>
          <DialogDescription>
            Copia apenas as metas para {competenciaLabelLong(competenciaDestino)}. As alterações entram no rascunho e
            passam pela revisão antes de salvar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Competência de origem</label>
            <CompetenciaPicker value={origem} onChange={setOrigem} className="w-full" />
          </div>

          <div className="rounded-lg border border-border/70 p-3 text-sm">
            <p className="text-foreground">{totalMetas} meta(s) encontrada(s) em {competenciaLabelLong(origem)}.</p>
            <ul className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
              <li>{novos.length} setor(es) sem meta no destino (serão preenchidos).</li>
              <li>{conflitos.length} setor(es) com meta diferente no destino (conflito).</li>
            </ul>
          </div>

          {conflitos.length > 0 && (
            <>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox checked={overwrite} onCheckedChange={(v) => setOverwrite(!!v)} />
                Sobrescrever metas em conflito ({conflitos.length})
              </label>
              <div className="max-h-32 overflow-auto rounded-lg border border-border/60 p-2 text-xs text-muted-foreground">
                {conflitos.slice(0, 20).map((id) => (
                  <div key={id} className="flex justify-between py-0.5">
                    <span>{setorNome(id)}</span>
                    <span>{formatNumberBR(draft[id]?.meta ?? 0)} → {formatNumberBR(origemMetas[id].meta ?? 0)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button className="gap-1.5" onClick={apply} disabled={aplicaveis === 0}>
            <Copy className="h-4 w-4" /> Aplicar {aplicaveis} meta(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
