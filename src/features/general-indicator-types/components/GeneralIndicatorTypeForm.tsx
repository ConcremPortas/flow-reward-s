import { useEffect, useMemo, useState } from 'react';
import { Loader2, Save, AlertTriangle, Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { pluralizeBR } from '@/lib/formatters';
import { normalizeCodigo, isValidCodigo, isValidNome, toPersistedNome } from '../domain/generalIndicatorTypeValidation';
import { resolveIndicatorDefinition } from '../domain/generalIndicatorValueFormatting';
import type { GeneralIndicatorTypeRow } from '../types/general-indicator-type.types';

export interface GeneralIndicatorTypeFormPayload { codigo: string; nome: string; descricao: string | null }

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: GeneralIndicatorTypeRow | null;
  findByCodigo: (codigo: string, exceptId?: string) => GeneralIndicatorTypeRow | undefined;
  onCreate: (data: GeneralIndicatorTypeFormPayload) => Promise<void>;
  onUpdate: (id: string, data: GeneralIndicatorTypeFormPayload) => Promise<void>;
  onOpenExisting: (row: GeneralIndicatorTypeRow) => void;
}

/**
 * Modal de criação/edição de indicador geral. O CÓDIGO só é definido na criação;
 * na edição é somente leitura (proteção: os códigos FAT/KITS dirigem regras de
 * premiação e a formatação). Código normalizado para MAIÚSCULAS.
 */
export function GeneralIndicatorTypeForm({ open, onOpenChange, editing, findByCodigo, onCreate, onUpdate, onOpenExisting }: Props) {
  const isEdit = !!editing;
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCodigo(editing?.codigo ?? '');
    setNome(editing?.nome ?? '');
    setDescricao(editing?.descricao ?? '');
  }, [open, editing]);

  const codigoNorm = normalizeCodigo(codigo);
  const persistedNome = toPersistedNome(nome);
  const codigoValido = isValidCodigo(codigo);
  const duplicado = useMemo(() => (!isEdit && codigoNorm ? findByCodigo(codigoNorm) : undefined), [isEdit, codigoNorm, findByCodigo]);
  const def = resolveIndicatorDefinition(codigoNorm, persistedNome);

  const canSave = codigoValido && isValidNome(nome) && !duplicado && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const payload: GeneralIndicatorTypeFormPayload = { codigo: codigoNorm, nome: persistedNome, descricao: descricao.trim() || null };
      if (isEdit && editing) await onUpdate(editing.id, { ...payload, codigo: editing.codigo });
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
          <DialogTitle>{isEdit ? 'Editar indicador geral' : 'Novo indicador geral'}</DialogTitle>
          <DialogDescription>Indicador consolidado usado na avaliação da empresa.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="git-nome">Nome *</Label>
            <Input id="git-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Faturamento" autoFocus />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="git-codigo">Código técnico *</Label>
            {isEdit ? (
              <div className="flex items-center gap-2 rounded-lg border border-border/70 bg-muted/40 px-3 py-2">
                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="font-mono text-sm font-semibold text-foreground">{editing!.codigo}</span>
                <span className="ml-auto text-xs text-muted-foreground">Não editável</span>
              </div>
            ) : (
              <>
                <Input id="git-codigo" value={codigo} onChange={(e) => setCodigo(normalizeCodigo(e.target.value))} placeholder="Ex: FAT" className="font-mono uppercase" />
                <p className="text-[11px] text-muted-foreground">Armazenado em maiúsculas. Não pode ser alterado após a criação (usado em regras de premiação e formatação).</p>
              </>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="git-desc">Descrição</Label>
            <Textarea id="git-desc" rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição opcional..." />
          </div>

          {/* Pré-visualização */}
          {(codigoNorm || persistedNome) && (
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Pré-visualização</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="rounded-md border border-border/70 bg-muted px-1.5 py-0.5 font-mono text-xs font-semibold text-foreground">{codigoNorm || '—'}</span>
                <span className="truncate text-sm font-medium text-foreground">{persistedNome || '—'}</span>
              </div>
              {codigoNorm && <p className="mt-1 text-[11px] text-muted-foreground">Formato: {def.format === 'currency' ? 'Moeda (BRL)' : def.format === 'integer' || def.format === 'quantity' ? `Número${def.unit ? ` (${def.unit})` : ''}` : def.format === 'percent' ? 'Percentual' : 'Decimal'}.</p>}
            </div>
          )}

          {isEdit && editing!.usage.medicoes > 0 && (
            <p className="text-xs text-muted-foreground">Este indicador possui {pluralizeBR(editing!.usage.medicoes, 'medição registrada', 'medições registradas')}. A edição de nome/descrição preserva os dados.</p>
          )}

          {duplicado && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div>
                <p className="text-foreground">Já existe um indicador geral com o código <strong className="font-mono">{duplicado.codigo}</strong> ({duplicado.nome}).</p>
                <Button variant="link" className="h-auto p-0 text-xs" onClick={() => onOpenExisting(duplicado)}>Ver indicador existente</Button>
              </div>
            </div>
          )}
          {!codigoValido && codigo.trim() !== '' && <p className="text-xs text-destructive">Código inválido: use apenas letras/números, sem espaços.</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button className="gap-1.5" onClick={handleSave} disabled={!canSave}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? 'Salvar alterações' : 'Criar indicador'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
