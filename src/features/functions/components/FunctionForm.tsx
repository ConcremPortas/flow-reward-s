import { useEffect, useMemo, useState } from 'react';
import { Loader2, Save, AlertTriangle, Info, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { pluralizeBR } from '@/lib/formatters';
import { isValidFunctionName } from '../domain/functionValidation';
import { toPersistedName, analyzeFunctionName } from '../domain/functionNameAnalysis';
import type { FunctionRow } from '../types/function.types';

export interface FunctionFormPayload { nome: string }

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: FunctionRow | null;
  findDuplicate: (nome: string, exceptId?: string) => FunctionRow | undefined;
  findSimilar: (nome: string, exceptId?: string) => { row: FunctionRow; diffs: string[]; confidence: 'high' | 'medium' } | undefined;
  onCreate: (data: FunctionFormPayload) => Promise<void>;
  onUpdate: (id: string, data: FunctionFormPayload) => Promise<void>;
  onOpenExisting: (row: FunctionRow) => void;
}

/**
 * Modal de criação/edição de função — nome + pré-visualização. Não altera caixa
 * nem acentuação (apenas apara extremidades ao persistir). Avisa sobre nome
 * duplicado (mesmo normalizado) e nome semelhante (não bloqueia).
 */
export function FunctionForm({ open, onOpenChange, editing, findDuplicate, findSimilar, onCreate, onUpdate, onOpenExisting }: Props) {
  const isEdit = !!editing;
  const [nome, setNome] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNome(editing?.nome ?? '');
  }, [open, editing]);

  const persisted = toPersistedName(nome);
  const quality = analyzeFunctionName(nome);
  const duplicado = useMemo(() => (persisted ? findDuplicate(persisted, editing?.id) : undefined), [persisted, editing, findDuplicate]);
  const similar = useMemo(() => (persisted && !duplicado ? findSimilar(persisted, editing?.id) : undefined), [persisted, duplicado, editing, findSimilar]);
  const nomeMudou = isEdit && persisted !== editing!.nome;

  const canSave = isValidFunctionName(nome) && !duplicado && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      if (isEdit && editing) await onUpdate(editing.id, { nome: persisted });
      else await onCreate({ nome: persisted });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!saving) onOpenChange(o); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar função' : 'Nova função'}</DialogTitle>
          <DialogDescription>Nome da função exibido nos cadastros de funcionários.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="f-nome">Nome da função *</Label>
            <Input id="f-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Auxiliar de Produção" autoFocus />
          </div>

          {/* Pré-visualização (nome como será persistido) */}
          {persisted && (
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Pré-visualização</p>
              <p className="mt-1 truncate text-sm font-medium text-foreground">{persisted}</p>
            </div>
          )}

          {/* Aviso de formatação (não bloqueante) */}
          {quality.hasIssues && (
            <p className="text-xs text-status-warning">{quality.issues.map(i => i.label).join(' ')} O nome será salvo sem espaços nas extremidades.</p>
          )}

          {/* Impacto da alteração de nome (edição) */}
          {nomeMudou && editing!.usage.funcionarios > 0 && (
            <div className="flex items-start gap-2 rounded-xl border border-border/70 bg-muted/20 p-3 text-sm">
              <Users className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-foreground">{pluralizeBR(editing!.usage.funcionarios, 'funcionário utiliza', 'funcionários utilizam')} esta função. A alteração modificará a nomenclatura exibida para todos eles.</p>
            </div>
          )}

          {/* Duplicidade exata */}
          {duplicado && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div>
                <p className="text-foreground">Já existe uma função chamada <strong>{duplicado.nome}</strong>.</p>
                <Button variant="link" className="h-auto p-0 text-xs" onClick={() => onOpenExisting(duplicado)}>Ver função existente</Button>
              </div>
            </div>
          )}

          {/* Possível função semelhante (não bloqueante) */}
          {similar && (
            <div className="flex items-start gap-2 rounded-xl border border-status-warning/40 bg-status-warning/5 p-3 text-sm">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-status-warning" />
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-status-warning">Possível função semelhante</p>
                <p className="mt-0.5 truncate text-foreground">{similar.row.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {pluralizeBR(similar.row.usage.funcionarios, 'funcionário vinculado', 'funcionários vinculados')} · Diferença: {similar.diffs.join(', ').toLowerCase()}
                </p>
                <Button variant="link" className="h-auto p-0 text-xs" onClick={() => onOpenExisting(similar.row)}>Ver função existente</Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button className="gap-1.5" onClick={handleSave} disabled={!canSave}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? 'Salvar alterações' : 'Criar função'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
