import { useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { KNOWN_SECTIONS } from '../domain/userAccess';
import { UserAccessEditor } from './UserAccessEditor';
import { UserAccessComparison } from './UserAccessComparison';
import type { UserRow } from '../types/user.types';
import type { SectionKey } from '@/contexts/AuthContext';

interface Props {
  row: UserRow | null;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, secoes: string[]) => Promise<void>;
}

/** Edição de acessos (secoes) com comparação antes/depois. Admin ignora seções. */
export function UserAccessDialog({ row, onOpenChange, onSave }: Props) {
  const [secoes, setSecoes] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (row) setSecoes([...row.secoes]); }, [row]);
  if (!row) return null;
  const isAdmin = row.perfil === 'admin';
  // Preserva seções desconhecidas ao salvar.
  const desconhecidas = row.access.desconhecidas;
  const finalSecoes = isAdmin ? [...KNOWN_SECTIONS] : Array.from(new Set([...(secoes as SectionKey[]), ...desconhecidas]));

  const handle = async () => {
    if (saving) return;
    setSaving(true);
    try { await onSave(row.id, finalSecoes); onOpenChange(false); } finally { setSaving(false); }
  };

  return (
    <Dialog open={!!row} onOpenChange={(o) => { if (!saving) onOpenChange(o); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar acessos — {row.nome ?? row.email}</DialogTitle>
          <DialogDescription>Seções que o usuário pode acessar.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[52vh] space-y-3 overflow-y-auto pr-1">
          <UserAccessEditor perfil={row.perfil} secoes={secoes} onChange={setSecoes} desconhecidas={desconhecidas} />
          {!isAdmin && (
            <div className="rounded-lg border border-border/70 p-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Alterações</p>
              <UserAccessComparison atual={row.access.conhecidas} novo={secoes.filter(s => KNOWN_SECTIONS.includes(s as SectionKey))} />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button className="gap-1.5" onClick={handle} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Salvar acessos</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
