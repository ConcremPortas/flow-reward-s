import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Save, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { formatCurrencyBRL } from '@/lib/formatters';
import { parseCurrencyBR, maskCurrencyInput, isValidTierValue } from '../domain/bonusTierValidation';
import { analyzeName, stripMoneyFromName } from '../domain/bonusTierNameAnalysis';
import { BonusTierImpactSummary } from './BonusTierImpactSummary';
import type { BonusTierRow } from '../types/bonus-tier.types';

export interface TierFormPayload { nome: string; valor: number }

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: BonusTierRow | null;
  findDuplicate: (nome: string, exceptId?: string) => BonusTierRow | undefined;
  onCreate: (data: TierFormPayload) => Promise<void>;
  onUpdate: (id: string, data: TierFormPayload) => Promise<void>;
  onOpenExisting: (row: BonusTierRow) => void;
}

/** Componente de entrada monetária pt-BR (vírgula decimal, formata no blur). */
function CurrencyInput({ value, onChange, invalid }: { value: string; onChange: (v: string) => void; invalid: boolean }) {
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const display = focused ? value : (parseCurrencyBR(value) != null ? formatCurrencyBRL(parseCurrencyBR(value)!) : value);
  return (
    <div className="relative">
      {!focused && parseCurrencyBR(value) != null ? null : <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>}
      <Input
        ref={ref} inputMode="decimal" aria-label="Valor do bônus em reais" value={display} placeholder="0,00"
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        onChange={(e) => onChange(maskCurrencyInput(e.target.value))}
        className={cn('tabular-nums', (focused || parseCurrencyBR(value) == null) && 'pl-9', invalid && 'border-destructive')}
      />
    </div>
  );
}

/** Modal de criação/edição de faixa — nome + valor monetário pt-BR + pré-visualização. */
export function BonusTierForm({ open, onOpenChange, editing, findDuplicate, onCreate, onUpdate, onOpenExisting }: Props) {
  const isEdit = !!editing;
  const [nome, setNome] = useState('');
  const [valorText, setValorText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNome(editing?.nome ?? '');
    setValorText(editing ? String(editing.valor).replace('.', ',') : '');
  }, [open, editing]);

  const valor = parseCurrencyBR(valorText);
  const valorInvalido = valorText.trim() !== '' && !isValidTierValue(valor);
  const duplicado = useMemo(() => (nome.trim() ? findDuplicate(nome, editing?.id) : undefined), [nome, editing, findDuplicate]);
  const nomeAnalysis = analyzeName(nome, valor ?? 0);
  const valorMudou = isEdit && valor != null && Math.abs(valor - (editing!.valor ?? 0)) > 0.005;

  const canSave = nome.trim().length > 0 && isValidTierValue(valor) && !duplicado && !valorInvalido && !saving;

  const handleSave = async () => {
    if (!canSave || valor == null) return;
    setSaving(true);
    try {
      if (isEdit && editing) await onUpdate(editing.id, { nome: nome.trim(), valor });
      else await onCreate({ nome: nome.trim(), valor });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!saving) onOpenChange(o); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar faixa' : 'Nova faixa de premiação'}</DialogTitle>
          <DialogDescription>Nome e valor do bônus. O valor é usado no cálculo de premiações.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="t-nome">Nome da faixa *</Label>
            <Input id="t-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Faixa A" />
          </div>
          <div className="space-y-1.5">
            <Label>Valor do bônus *</Label>
            <CurrencyInput value={valorText} onChange={setValorText} invalid={valorInvalido} />
            {valorInvalido && <p className="text-xs text-destructive">Informe um valor válido (use vírgula para os centavos).</p>}
          </div>

          {/* Pré-visualização */}
          {(nome.trim() || valor != null) && (
            <div className="rounded-xl border border-[#c8a83f]/40 bg-[#f7f0d7]/40 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[#8a6d1f]">Pré-visualização</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-foreground">{nome.trim() || '—'}</span>
                <span className="text-lg font-bold tabular-nums text-[#7a5f16]">{valor != null ? formatCurrencyBRL(valor) : '—'}</span>
              </div>
            </div>
          )}

          {/* Aviso: nome contém valor monetário */}
          {nomeAnalysis.temValorNoNome && (
            <div className="flex items-start gap-2 rounded-xl border border-status-warning/40 bg-status-warning/5 p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-warning" />
              <div className="min-w-0">
                <p className="text-foreground">O nome informado parece conter um valor monetário. O valor da faixa já é armazenado separadamente.</p>
                <div className="mt-1.5 flex gap-2">
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setNome(stripMoneyFromName(nome))}>Remover valor do nome</Button>
                  <span className="self-center text-xs text-muted-foreground">ou mantenha o nome como está.</span>
                </div>
              </div>
            </div>
          )}

          {/* Divergência nome × novo valor (edição) */}
          {isEdit && nomeAnalysis.state === 'divergente' && valor != null && (
            <p className="text-xs text-status-warning">O nome da faixa indica {formatCurrencyBRL(nomeAnalysis.valorNoNome ?? 0)}, mas o valor {valorMudou ? 'será' : 'é'} {formatCurrencyBRL(valor)}. Revise o nome se necessário.</p>
          )}

          {/* Impacto da alteração de valor (edição) */}
          {valorMudou && <BonusTierImpactSummary usage={editing!.usage} valorAtual={editing!.valor} valorNovo={valor!} />}

          {duplicado && (
            <div className="flex items-start gap-2 rounded-xl border border-status-warning/40 bg-status-warning/5 p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-warning" />
              <div>
                <p className="text-foreground">Já existe uma faixa chamada <strong>{duplicado.nome}</strong>.</p>
                <Button variant="link" className="h-auto p-0 text-xs" onClick={() => onOpenExisting(duplicado)}>Ver faixa existente</Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button className="gap-1.5" onClick={handleSave} disabled={!canSave}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? 'Salvar alterações' : 'Criar faixa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
