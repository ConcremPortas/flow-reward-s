import { AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { KitsBonusBreakdown } from './KitsBonusBreakdown';
import { vigenciaLabel } from './periodLabel';
import type { useKitsConfigEditor } from '../hooks/useKitsConfigEditor';
import type { KitsConfigRow } from '../types/kits-config.types';

type Editor = ReturnType<typeof useKitsConfigEditor>;

interface Props { ed: Editor; duplicado: KitsConfigRow | undefined; onOpenExisting: (r: KitsConfigRow) => void }

export function KitsConfigParametersStep({ ed, duplicado, onOpenExisting }: Props) {
  const p = ed.parsed;
  const podePrevia = p.minimoKits != null && p.incrementoFaixa != null && p.bonusBase != null && p.bonusPorFaixa != null && p.incrementoFaixa > 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="k-vig">Vigência a partir de *</Label>
          <Input id="k-vig" type="month" value={ed.vigencia} onChange={(e) => ed.setVigencia(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="k-min">Mínimo de kits *</Label>
          <Input id="k-min" inputMode="numeric" value={ed.minimo} onChange={(e) => ed.setMinimo(e.target.value.replace(/[^\d.,]/g, ''))} placeholder="Ex: 11000" className="tabular-nums" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="k-inc">Incremento por faixa (kits) *</Label>
          <Input id="k-inc" inputMode="numeric" value={ed.incremento} onChange={(e) => ed.setIncremento(e.target.value.replace(/[^\d.,]/g, ''))} placeholder="Ex: 250" className="tabular-nums" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="k-base">Bônus base (R$) *</Label>
          <Input id="k-base" inputMode="decimal" value={ed.bonusBase} onChange={(e) => ed.setBonusBase(e.target.value.replace(/[^\d.,]/g, ''))} placeholder="Ex: 100" className="tabular-nums" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="k-faixa">Bônus por faixa (R$) *</Label>
          <Input id="k-faixa" inputMode="decimal" value={ed.bonusFaixa} onChange={(e) => ed.setBonusFaixa(e.target.value.replace(/[^\d.,]/g, ''))} placeholder="Ex: 25" className="tabular-nums" />
        </div>
        <div className="space-y-1.5">
          <Label>Máximo de faixas</Label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox checked={ed.semLimite} onCheckedChange={(v) => ed.setSemLimite(!!v)} /> Sem limite
          </label>
          {!ed.semLimite && (
            <Input inputMode="numeric" value={ed.maxFaixas} onChange={(e) => ed.setMaxFaixas(e.target.value.replace(/[^\d]/g, ''))} placeholder="Ex: 48" className="tabular-nums" />
          )}
          <p className="text-[11px] text-muted-foreground">O motor atual não aplica teto de faixas; o valor é apenas armazenado.</p>
        </div>
      </div>

      {duplicado && (
        <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div>
            <p className="text-foreground">Já existe uma configuração para <strong>{vigenciaLabel(duplicado)}</strong>.</p>
            <Button variant="link" className="h-auto p-0 text-xs" onClick={() => onOpenExisting(duplicado)}>Ver configuração existente</Button>
          </div>
        </div>
      )}

      {podePrevia && (
        <div className="rounded-xl border border-[#c8a83f]/40 bg-[#f7f0d7]/40 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8a6d1f]">Prévia (motor) — exemplo com 10 faixas</p>
          <div className="mt-1.5">
            <KitsBonusBreakdown kits={(p.minimoKits ?? 0) + (p.incrementoFaixa ?? 0) * 10} config={{ minimoKits: p.minimoKits ?? 0, incrementoFaixa: p.incrementoFaixa ?? 0, bonusBase: p.bonusBase ?? 0, bonusPorFaixa: p.bonusPorFaixa ?? 0, maxFaixas: p.maxFaixas }} />
          </div>
        </div>
      )}

      {ed.validation.errors.length > 0 && (
        <ul className="space-y-0.5 text-xs text-destructive">{ed.validation.errors.map((e, i) => <li key={i}>• {e}</li>)}</ul>
      )}
    </div>
  );
}
