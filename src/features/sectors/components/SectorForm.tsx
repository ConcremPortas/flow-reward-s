import { useEffect, useMemo, useState } from 'react';
import { Loader2, Save, AlertTriangle, ArrowRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Empresa } from '@/hooks/useEmpresas';
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { SectorRow } from '../types/sector.types';

const NONE = '__none__';

export interface SectorFormPayload { nome: string; descricao?: string; empresa_id?: string; supervisor_id?: string; encarregado_id?: string }

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: SectorRow | null;
  empresas: Empresa[];
  supervisores: Funcionario[];
  encarregados: Funcionario[];
  findDuplicate: (nome: string, empresaId: string | null, exceptId?: string) => SectorRow | undefined;
  onCreate: (data: SectorFormPayload) => Promise<void>;
  onUpdate: (id: string, data: SectorFormPayload) => Promise<void>;
  onOpenExisting: (row: SectorRow) => void;
}

/** Modal de criação/edição — Informações + Liderança. Campos existentes apenas. */
export function SectorForm({ open, onOpenChange, editing, empresas, supervisores, encarregados, findDuplicate, onCreate, onUpdate, onOpenExisting }: Props) {
  const isEdit = !!editing;
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [empresaId, setEmpresaId] = useState(NONE);
  const [supervisorId, setSupervisorId] = useState(NONE);
  const [encarregadoId, setEncarregadoId] = useState(NONE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNome(editing?.nome ?? '');
    setDescricao(editing?.descricao ?? '');
    setEmpresaId(editing?.empresaId ?? NONE);
    setSupervisorId(editing?.supervisorId ?? NONE);
    setEncarregadoId(editing?.encarregadoId ?? NONE);
  }, [open, editing]);

  const empresaReal = empresaId === NONE ? null : empresaId;
  const duplicado = useMemo(
    () => (nome.trim() ? findDuplicate(nome, empresaReal, editing?.id) : undefined),
    [nome, empresaReal, editing, findDuplicate],
  );

  const nomeFor = (list: Funcionario[], id: string) => list.find(f => f.id === id)?.nome ?? id;
  const supervisorChanged = isEdit && (editing!.supervisorId ?? NONE) !== supervisorId;
  const encarregadoChanged = isEdit && (editing!.encarregadoId ?? NONE) !== encarregadoId;

  const canSave = nome.trim().length > 0 && !duplicado && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    const payload: SectorFormPayload = {
      nome: nome.trim(),
      descricao: descricao.trim() || undefined,
      empresa_id: empresaId === NONE ? undefined : empresaId,
      supervisor_id: supervisorId === NONE ? undefined : supervisorId,
      encarregado_id: encarregadoId === NONE ? undefined : encarregadoId,
    };
    setSaving(true);
    try {
      if (isEdit && editing) await onUpdate(editing.id, payload);
      else await onCreate(payload);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!saving) onOpenChange(o); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar setor' : 'Novo setor'}</DialogTitle>
          <DialogDescription>Informações e liderança do setor.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Informações do setor</p>
            <div className="space-y-1.5">
              <Label htmlFor="s-nome">Nome *</Label>
              <Input id="s-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Montagem" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="s-desc">Descrição</Label>
              <Input id="s-desc" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Opcional" />
            </div>
            <div className="space-y-1.5">
              <Label>Empresa</Label>
              <Select value={empresaId} onValueChange={setEmpresaId}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent><SelectItem value={NONE}>Nenhuma</SelectItem>{empresas.map(e => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3 border-t border-border/60 pt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Liderança</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Supervisor</Label>
                <Select value={supervisorId} onValueChange={setSupervisorId}>
                  <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent><SelectItem value={NONE}>Nenhum</SelectItem>{supervisores.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}</SelectContent>
                </Select>
                {supervisorChanged && <ChangeLine anterior={editing!.supervisorNome ?? 'Nenhum'} novo={supervisorId === NONE ? 'Nenhum' : nomeFor(supervisores, supervisorId)} />}
              </div>
              <div className="space-y-1.5">
                <Label>Encarregado</Label>
                <Select value={encarregadoId} onValueChange={setEncarregadoId}>
                  <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                  <SelectContent><SelectItem value={NONE}>Nenhum</SelectItem>{encarregados.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}</SelectContent>
                </Select>
                {encarregadoChanged && <ChangeLine anterior={editing!.encarregadoNome ?? 'Nenhum'} novo={encarregadoId === NONE ? 'Nenhum' : nomeFor(encarregados, encarregadoId)} />}
              </div>
            </div>
          </div>

          {duplicado && (
            <div className="flex items-start gap-2 rounded-xl border border-status-warning/40 bg-status-warning/5 p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-warning" />
              <div>
                <p className="text-foreground">Já existe um setor chamado <strong>{duplicado.nome}</strong>{duplicado.empresaNome ? ` na empresa ${duplicado.empresaNome}` : ''}.</p>
                <Button variant="link" className="h-auto p-0 text-xs" onClick={() => onOpenExisting(duplicado)}>Ver setor existente</Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button className="gap-1.5" onClick={handleSave} disabled={!canSave}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? 'Salvar alterações' : 'Criar setor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ChangeLine({ anterior, novo }: { anterior: string; novo: string }) {
  return (
    <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
      <span className="line-through">{anterior}</span><ArrowRight className="h-3 w-3" /><span className="font-medium text-foreground">{novo}</span>
    </p>
  );
}
