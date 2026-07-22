import { useEffect, useMemo, useState } from 'react';
import { Loader2, Save, AlertTriangle, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { pluralizeBR } from '@/lib/formatters';
import { isValidLocalNome, toPersistedNome } from '../domain/dssLocationValidation';
import type { DssLocationRow } from '../types/dss-location.types';

export interface DssLocationFormPayload { nome: string; descricao: string | null }

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: DssLocationRow | null;
  findDuplicate: (nome: string, exceptId?: string) => DssLocationRow | undefined;
  onCreate: (data: DssLocationFormPayload) => Promise<void>;
  onUpdate: (id: string, data: DssLocationFormPayload) => Promise<void>;
  onOpenExisting: (row: DssLocationRow) => void;
}

/**
 * Modal de criação/edição de local de DSS — nome + descrição. Sem campos de
 * turno/unidade/horário (não existem no modelo). A vinculação de funcionários é
 * feita na tela Funcionários (informado no formulário).
 */
export function DssLocationForm({ open, onOpenChange, editing, findDuplicate, onCreate, onUpdate, onOpenExisting }: Props) {
  const isEdit = !!editing;
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNome(editing?.nome ?? '');
    setDescricao(editing?.descricao ?? '');
  }, [open, editing]);

  const persisted = toPersistedNome(nome);
  const duplicado = useMemo(() => (persisted ? findDuplicate(persisted, editing?.id) : undefined), [persisted, editing, findDuplicate]);
  const nomeMudou = isEdit && persisted !== editing!.nome;
  const canSave = isValidLocalNome(nome) && !duplicado && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const payload: DssLocationFormPayload = { nome: persisted, descricao: descricao.trim() || null };
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
          <DialogTitle>{isEdit ? 'Editar local de DSS' : 'Novo local de DSS'}</DialogTitle>
          <DialogDescription>Local ou grupo usado no controle de presença dos DSS.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="dl-nome">Nome do local *</Label>
            <Input id="dl-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Fábrica 01" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dl-desc">Descrição</Label>
            <Textarea id="dl-desc" rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição opcional (evite repetir o nome)..." />
          </div>

          {persisted && (
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Pré-visualização</p>
              <p className="mt-1 truncate text-sm font-medium text-foreground">{persisted}</p>
              {descricao.trim() && <p className="truncate text-xs text-muted-foreground">{descricao.trim()}</p>}
            </div>
          )}

          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> A vinculação de funcionários a este local é feita na tela de Funcionários.
          </p>

          {/* Impacto da alteração de nome */}
          {isEdit && nomeMudou && editing!.usage.emUso && (
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3 text-sm">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Contexto da alteração</p>
              <ul className="mt-1.5 space-y-0.5 text-foreground">
                {editing!.usage.funcionarios > 0 && <li>{pluralizeBR(editing!.usage.funcionarios, 'funcionário vinculado', 'funcionários vinculados')}</li>}
                {editing!.usage.dssRealizados > 0 && <li>{pluralizeBR(editing!.usage.dssRealizados, 'DSS realizado', 'DSS realizados')}</li>}
                {editing!.usage.presencas > 0 && <li>{pluralizeBR(editing!.usage.presencas, 'registro de presença', 'registros de presença')}</li>}
              </ul>
              <p className="mt-1.5 text-xs text-muted-foreground">Os vínculos usam o ID do local — a alteração de nome os preserva.</p>
            </div>
          )}

          {duplicado && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div>
                <p className="text-foreground">Já existe um local chamado <strong>{duplicado.nome}</strong> ({pluralizeBR(duplicado.usage.funcionarios, 'funcionário', 'funcionários')}, {pluralizeBR(duplicado.usage.dssRealizados, 'DSS', 'DSS')}).</p>
                <Button variant="link" className="h-auto p-0 text-xs" onClick={() => onOpenExisting(duplicado)}>Ver local existente</Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button className="gap-1.5" onClick={handleSave} disabled={!canSave}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? 'Salvar alterações' : 'Criar local'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
