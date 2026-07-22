import { useEffect, useMemo, useState } from 'react';
import { Loader2, Save, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { parseNumberBR, maskNumberInput, formatParameter, TIPO_META } from '../domain/rewardBaseFormatting';
import { analyzeName } from '../domain/rewardBaseNameAnalysis';
import { isValidBaseName, isValidBaseParameter, toPersistedName } from '../domain/rewardBaseValidation';
import { deriveEngineBehavior } from '../domain/rewardBaseDefinitions';
import { RewardBaseImpactSummary } from './RewardBaseImpactSummary';
import type { RewardBaseRow, RewardBaseTipo } from '../types/reward-base.types';

export interface RewardBaseFormPayload { nome: string; tipo: RewardBaseTipo; valor_base: number; descricao: string | null }

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: RewardBaseRow | null;
  findDuplicate: (nome: string, exceptId?: string) => RewardBaseRow | undefined;
  onCreate: (data: RewardBaseFormPayload) => Promise<void>;
  onUpdate: (id: string, data: RewardBaseFormPayload) => Promise<void>;
  onOpenExisting: (row: RewardBaseRow) => void;
}

/** Entrada de parâmetro adaptada ao tipo (percentual "%" · valor_fixo "R$"). */
function ParameterInput({ tipo, value, onChange, invalid }: { tipo: RewardBaseTipo; value: string; onChange: (v: string) => void; invalid: boolean }) {
  const meta = TIPO_META[tipo];
  const isPct = tipo === 'percentual';
  return (
    <div className="relative">
      {!isPct && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">R$</span>}
      {isPct && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>}
      <Input
        inputMode="decimal" aria-label={meta.paramLabel} value={value} placeholder={meta.placeholder}
        onChange={(e) => onChange(maskNumberInput(e.target.value))}
        className={cn('tabular-nums', !isPct && 'pl-9', isPct && 'pr-8', invalid && 'border-destructive')}
      />
    </div>
  );
}

/**
 * Modal de criação/edição de base — nome + tipo + parâmetro (adaptativo) +
 * descrição + pré-visualização. Não converte valor entre unidades ao trocar o
 * tipo. Alteração de tipo em base em uso exige confirmação reforçada.
 */
export function RewardBaseForm({ open, onOpenChange, editing, findDuplicate, onCreate, onUpdate, onOpenExisting }: Props) {
  const isEdit = !!editing;
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<RewardBaseTipo>('percentual');
  const [valorText, setValorText] = useState('');
  const [descricao, setDescricao] = useState('');
  const [confirmTipo, setConfirmTipo] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNome(editing?.nome ?? '');
    setTipo(editing?.tipo ?? 'percentual');
    setValorText(editing ? String(editing.valorBase).replace('.', ',') : '');
    setDescricao(editing?.descricao ?? '');
    setConfirmTipo(false);
  }, [open, editing]);

  const persisted = toPersistedName(nome);
  const valor = parseNumberBR(valorText);
  const valorInvalido = valorText.trim() !== '' && !isValidBaseParameter(valor, tipo);
  const duplicado = useMemo(() => (persisted ? findDuplicate(persisted, editing?.id) : undefined), [persisted, editing, findDuplicate]);
  const nameAnalysis = analyzeName(persisted, tipo, valor ?? 0);
  const engine = deriveEngineBehavior(persisted);

  const tipoMudou = isEdit && tipo !== editing!.tipo;
  const precisaConfirmarTipo = tipoMudou && !!editing?.usage.emUso;
  const alterou = isEdit && (persisted !== editing!.nome || tipo !== editing!.tipo || Math.abs((valor ?? NaN) - editing!.valorBase) > 0.001 || (descricao.trim() || null) !== (editing!.descricao ?? null));

  const canSave = isValidBaseName(nome) && isValidBaseParameter(valor, tipo) && !duplicado && !valorInvalido
    && (!precisaConfirmarTipo || confirmTipo) && !saving;

  const handleSave = async () => {
    if (!canSave || valor == null) return;
    setSaving(true);
    try {
      const payload: RewardBaseFormPayload = { nome: persisted, tipo, valor_base: valor, descricao: descricao.trim() || null };
      if (isEdit && editing) await onUpdate(editing.id, payload);
      else await onCreate(payload);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!saving) onOpenChange(o); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar base' : 'Nova base de premiação'}</DialogTitle>
          <DialogDescription>Configuração da base usada no cálculo das premiações.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="b-nome">Nome da base *</Label>
            <Input id="b-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: KIT 100%" autoFocus />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo *</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as RewardBaseTipo)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="percentual">Percentual</SelectItem><SelectItem value="valor_fixo">Valor fixo</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>{TIPO_META[tipo].paramLabel} *</Label>
              <ParameterInput tipo={tipo} value={valorText} onChange={setValorText} invalid={valorInvalido} />
            </div>
          </div>
          {valorInvalido && <p className="text-xs text-destructive">Informe um valor válido (≥ 0). Percentual pode ultrapassar 100%.</p>}

          <div className="space-y-1.5">
            <Label htmlFor="b-desc">Descrição</Label>
            <Textarea id="b-desc" rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição opcional..." />
          </div>

          {/* Pré-visualização */}
          {(persisted || valor != null) && (
            <div className="rounded-xl border border-[#c8a83f]/40 bg-[#f7f0d7]/40 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[#8a6d1f]">Pré-visualização</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-foreground">{persisted || '—'}</span>
                <span className="text-sm text-muted-foreground">{TIPO_META[tipo].label} · <span className="font-bold text-[#7a5f16]">{valor != null ? formatParameter(tipo, valor) : '—'}</span></span>
              </div>
              {engine.behavior !== 'outra' && <p className="mt-1 text-[11px] text-[#8a6d1f]">Motor: {engine.label}</p>}
            </div>
          )}

          {/* Divergência nome × valor (não bloqueante) */}
          {nameAnalysis.state === 'diferente' && tipo === 'percentual' && valor != null && (
            <p className="text-xs text-status-warning">O nome contém {nameAnalysis.percentualNoNome}%, mas o parâmetro é {formatParameter(tipo, valor)}. Pode ser intencional (o motor usa o % do nome como multiplicador).</p>
          )}

          {/* Impacto da edição */}
          {isEdit && alterou && valor != null && <RewardBaseImpactSummary base={editing!} novoNome={persisted} novoTipo={tipo} novoValor={valor} />}

          {/* Confirmação reforçada de mudança de tipo */}
          {precisaConfirmarTipo && (
            <label className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm">
              <Checkbox checked={confirmTipo} onCheckedChange={(v) => setConfirmTipo(!!v)} className="mt-0.5" />
              <span className="text-foreground">Esta base está <strong>em uso</strong>. Alterar o tipo muda a semântica do parâmetro. Confirmo a alteração de tipo. O valor <strong>não</strong> será convertido automaticamente.</span>
            </label>
          )}

          {/* Duplicidade */}
          {duplicado && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div>
                <p className="text-foreground">Já existe uma base chamada <strong>{duplicado.nome}</strong>.</p>
                <Button variant="link" className="h-auto p-0 text-xs" onClick={() => onOpenExisting(duplicado)}>Ver base existente</Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button className="gap-1.5" onClick={handleSave} disabled={!canSave}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? 'Salvar alterações' : 'Criar base'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
