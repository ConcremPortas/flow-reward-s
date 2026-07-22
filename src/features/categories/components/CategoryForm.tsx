import { useEffect, useMemo, useState } from 'react';
import { Loader2, Save, AlertTriangle, ShieldAlert } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { pluralizeBR } from '@/lib/formatters';
import { isValidCategoryName, toPersistedName } from '../domain/categoryValidation';
import type { CategoryRow } from '../types/category.types';

export interface CategoryFormPayload { nome: string }

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: CategoryRow | null;
  findDuplicate: (nome: string, exceptId?: string) => CategoryRow | undefined;
  onCreate: (data: CategoryFormPayload) => Promise<void>;
  onUpdate: (id: string, data: CategoryFormPayload) => Promise<void>;
  onOpenExisting: (row: CategoryRow) => void;
}

/**
 * Modal de criação/edição de categoria — apenas nome + pré-visualização. Não
 * altera caixa/acentuação (só apara extremidades). Avisa sobre duplicidade
 * (exata/caixa/espaços) e, na edição, sobre impacto e referências textuais.
 */
export function CategoryForm({ open, onOpenChange, editing, findDuplicate, onCreate, onUpdate, onOpenExisting }: Props) {
  const isEdit = !!editing;
  const [nome, setNome] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNome(editing?.nome ?? '');
  }, [open, editing]);

  const persisted = toPersistedName(nome);
  const duplicado = useMemo(() => (persisted ? findDuplicate(persisted, editing?.id) : undefined), [persisted, editing, findDuplicate]);
  const nomeMudou = isEdit && persisted !== editing!.nome;
  const canSave = isValidCategoryName(nome) && !duplicado && !saving;

  const u = editing?.usage;
  const temImpacto = isEdit && u && (u.funcionarios > 0 || u.faixas > 0 || u.formulas > 0 || u.basesIndiretas > 0);
  const avisoTextual = isEdit && nomeMudou && !!u?.premiavelPorNome;

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
          <DialogTitle>{isEdit ? 'Editar categoria' : 'Nova categoria'}</DialogTitle>
          <DialogDescription>Nome usado na classificação e premiação dos funcionários.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="c-nome">Nome da categoria *</Label>
            <Input id="c-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Auxiliar" autoFocus />
          </div>

          {persisted && (
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Pré-visualização</p>
              <p className="mt-1 truncate text-sm font-medium text-foreground">{persisted}</p>
            </div>
          )}

          {/* Impacto da alteração (edição) */}
          {isEdit && nomeMudou && temImpacto && u && (
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Impacto da alteração</p>
              <ul className="mt-1.5 space-y-0.5 text-sm text-foreground">
                {u.funcionarios > 0 && <li>{pluralizeBR(u.funcionarios, 'funcionário vinculado', 'funcionários vinculados')}</li>}
                {u.faixas > 0 && <li>{pluralizeBR(u.faixas, 'faixa relacionada', 'faixas relacionadas')}</li>}
                {u.formulas > 0 && <li>{pluralizeBR(u.formulas, 'fórmula de cálculo relacionada', 'fórmulas de cálculo relacionadas')}</li>}
                {u.basesIndiretas > 0 && <li>{pluralizeBR(u.basesIndiretas, 'base relacionada (indireta)', 'bases relacionadas (indiretas)')}</li>}
              </ul>
              <p className="mt-1.5 text-xs text-muted-foreground">Os vínculos por ID são preservados; muda apenas a nomenclatura exibida.</p>
            </div>
          )}

          {/* Alerta de referências textuais (categoria premiável) */}
          {avisoTextual && (
            <div className="flex items-start gap-2 rounded-xl border border-status-warning/50 bg-status-warning/5 p-3 text-sm">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-status-warning" />
              <div>
                <p className="font-semibold text-status-warning">Atenção — referências textuais</p>
                <p className="mt-0.5 text-foreground">O nome desta categoria é usado em regras de <strong>elegibilidade de premiação</strong> (comparações textuais no processamento e no relatório). Alterar a nomenclatura pode afetar quem é premiado. Ajuste apenas se tiver certeza.</p>
              </div>
            </div>
          )}

          {/* Duplicidade */}
          {duplicado && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div>
                <p className="text-foreground">Já existe uma categoria chamada <strong>{duplicado.nome}</strong>.</p>
                <Button variant="link" className="h-auto p-0 text-xs" onClick={() => onOpenExisting(duplicado)}>Ver categoria existente</Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button className="gap-1.5" onClick={handleSave} disabled={!canSave}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? 'Salvar alterações' : 'Criar categoria'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
