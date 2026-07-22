import { useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KitsConfigComparison } from './KitsConfigComparison';
import { vigenciaLabel } from './periodLabel';
import type { KitsConfigRow } from '../types/kits-config.types';

interface Props {
  a: KitsConfigRow | null;
  all: KitsConfigRow[];
  onOpenChange: (open: boolean) => void;
}

const params = (r: KitsConfigRow) => ({ minimoKits: r.minimoKits, incrementoFaixa: r.incrementoFaixa, bonusBase: r.bonusBase, bonusPorFaixa: r.bonusPorFaixa, maxFaixas: r.maxFaixas });

export function KitsConfigComparisonDialog({ a, all, onOpenChange }: Props) {
  const [bId, setBId] = useState('');
  const candidatos = useMemo(() => all.filter(f => f.id !== a?.id), [all, a]);
  const b = candidatos.find(f => f.id === bId) ?? null;
  if (!a) return null;

  return (
    <Dialog open={!!a} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Comparar configurações</DialogTitle>
          <DialogDescription>Diferença de parâmetros entre duas vigências.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2 text-sm">
          <span className="min-w-0 flex-1 truncate rounded-lg border border-border/70 bg-muted/30 px-3 py-2 font-medium text-foreground">{vigenciaLabel(a)}</span>
          <span className="text-muted-foreground">×</span>
          <Select value={bId} onValueChange={setBId}>
            <SelectTrigger className="min-w-0 flex-1"><SelectValue placeholder="Selecione a configuração B" /></SelectTrigger>
            <SelectContent>{candidatos.map(f => <SelectItem key={f.id} value={f.id}>{vigenciaLabel(f)} · {f.state.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {b ? (
          <KitsConfigComparison atual={params(a)} nova={params(b)} labelA={vigenciaLabel(a)} labelB={vigenciaLabel(b)} />
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">Selecione a segunda configuração.</p>
        )}
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
