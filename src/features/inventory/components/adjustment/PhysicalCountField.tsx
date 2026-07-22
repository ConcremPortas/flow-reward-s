import { Minus, Plus, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { formatNumberBR } from '@/lib/formatters';
import type { AdjustmentResult } from '../../types/inventory.types';

interface Props {
  value: string; onChange: (v: string) => void; disabled?: boolean;
  saldoAtual: number; ativo: boolean; previa: { result?: AdjustmentResult; aviso?: string };
}

export function PhysicalCountField({ value, onChange, disabled, saldoAtual, ativo, previa }: Props) {
  const n = Number(value);
  const step = (d: number) => { const base = Number.isFinite(n) && value.trim() !== '' ? n : saldoAtual; onChange(String(Math.max(0, Math.round(base + d)))); };

  return (
    <div className="space-y-2">
      <Label htmlFor="contagem" className="text-sm font-medium">Quantidade física contada *</Label>
      <div className="flex items-stretch gap-2">
        <Button type="button" variant="outline" size="icon" className="h-12 w-12 shrink-0" onClick={() => step(-1)} disabled={disabled || !ativo} aria-label="Diminuir">
          <Minus className="h-4 w-4" />
        </Button>
        <div className="relative flex-1">
          <Input id="contagem" type="number" inputMode="numeric" min={0} step={1} value={value} disabled={disabled || !ativo}
            onChange={(e) => onChange(e.target.value)} placeholder={ativo ? 'Contagem' : 'Selecione item e unidade'}
            className="h-12 pr-14 text-center text-lg font-semibold tabular-nums" aria-describedby="contagem-ajuda contagem-previa" />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">peças</span>
        </div>
        <Button type="button" variant="outline" size="icon" className="h-12 w-12 shrink-0" onClick={() => step(1)} disabled={disabled || !ativo} aria-label="Aumentar">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <p id="contagem-ajuda" className="text-xs text-muted-foreground">Informe o total físico contado na unidade (inteiro ≥ 0). O saldo será igualado a esse número.</p>

      {ativo && (
        <div id="contagem-previa" aria-live="polite" className="mt-1 grid grid-cols-3 gap-2 rounded-lg border border-border/60 bg-muted/20 p-2.5 text-center">
          <Bloco rot="Saldo atual" val={formatNumberBR(saldoAtual)} />
          <Bloco rot="Contagem" val={value.trim() === '' ? '—' : formatNumberBR(n)} />
          {previa.result ? (
            <div>
              <div className={cn('flex items-center justify-center gap-0.5 text-sm font-bold tabular-nums', previa.result.direcao === 'IN' ? 'text-success' : 'text-status-warning')}>
                {previa.result.direcao === 'IN' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
                {previa.result.diferenca > 0 ? '+' : ''}{formatNumberBR(previa.result.diferenca)}
              </div>
              <div className="text-[11px] text-muted-foreground">Diferença</div>
            </div>
          ) : <Bloco rot="Diferença" val={value.trim() === '' ? '—' : '0'} />}
        </div>
      )}
    </div>
  );
}

function Bloco({ rot, val }: { rot: string; val: string }) {
  return <div><div className="text-sm font-semibold tabular-nums text-foreground">{val}</div><div className="text-[11px] text-muted-foreground">{rot}</div></div>;
}
