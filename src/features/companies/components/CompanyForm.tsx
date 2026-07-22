import { useEffect, useMemo, useState } from 'react';
import { Loader2, Save, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { pluralizeBR } from '@/lib/formatters';
import { maskCNPJInput, formatCNPJ } from '../domain/cnpjFormatting';
import { isValidCNPJ, hasCNPJValue } from '../domain/cnpjValidation';
import { isValidCompanyName, toPersistedName } from '../domain/companyValidation';
import type { CompanyRow } from '../types/company.types';

export interface CompanyFormPayload { nome: string; cnpj: string | null }

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: CompanyRow | null;
  findByCnpj: (cnpj: string, exceptId?: string) => CompanyRow | undefined;
  onCreate: (data: CompanyFormPayload) => Promise<void>;
  onUpdate: (id: string, data: CompanyFormPayload) => Promise<void>;
  onOpenExisting: (row: CompanyRow) => void;
}

/**
 * Modal de criação/edição de empresa — nome + CNPJ (com máscara/validação). CNPJ
 * é opcional; se informado, deve ser válido (DV) e único. Não altera dados
 * persistidos automaticamente. Sem campo de status na criação (ativo por padrão).
 */
export function CompanyForm({ open, onOpenChange, editing, findByCnpj, onCreate, onUpdate, onOpenExisting }: Props) {
  const isEdit = !!editing;
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNome(editing?.nome ?? '');
    setCnpj(editing?.cnpj ? formatCNPJ(editing.cnpj) : '');
  }, [open, editing]);

  const persistedNome = toPersistedName(nome);
  const cnpjInformado = hasCNPJValue(cnpj);
  const cnpjValido = !cnpjInformado || isValidCNPJ(cnpj);
  const duplicado = useMemo(() => (cnpjInformado ? findByCnpj(cnpj, editing?.id) : undefined), [cnpj, cnpjInformado, editing, findByCnpj]);

  const nomeMudou = isEdit && persistedNome !== editing!.nome;
  const cnpjMudou = isEdit && (editing!.cnpj ? formatCNPJ(editing!.cnpj) : '') !== formatCNPJ(cnpj);
  const temEstrutura = isEdit && editing!.usage.temVinculos;

  const canSave = isValidCompanyName(nome) && cnpjValido && !duplicado && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const payload: CompanyFormPayload = { nome: persistedNome, cnpj: cnpjInformado ? formatCNPJ(cnpj) : null };
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
          <DialogTitle>{isEdit ? 'Editar empresa' : 'Nova empresa'}</DialogTitle>
          <DialogDescription>Dados cadastrais da empresa.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="e-nome">Nome da empresa *</Label>
            <Input id="e-nome" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Concrem Industrial" autoFocus />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="e-cnpj">CNPJ</Label>
            <Input id="e-cnpj" value={cnpj} inputMode="numeric" onChange={(e) => setCnpj(maskCNPJInput(e.target.value))} placeholder="12.345.678/0001-90"
              className={cn('font-mono', cnpjInformado && !cnpjValido && 'border-destructive')} />
            {cnpjInformado && !cnpjValido && <p className="text-xs text-destructive">CNPJ inválido (verifique os dígitos). Deixe em branco se não houver.</p>}
          </div>

          {/* Pré-visualização */}
          {persistedNome && (
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Pré-visualização</p>
              <p className="mt-1 truncate text-sm font-medium text-foreground">{persistedNome}</p>
              <p className="font-mono text-xs text-muted-foreground">{cnpjInformado ? formatCNPJ(cnpj) : 'CNPJ não informado'}</p>
            </div>
          )}

          {/* Impacto da alteração (edição) */}
          {isEdit && (nomeMudou || cnpjMudou) && temEstrutura && editing && (
            <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Estrutura vinculada</p>
              <ul className="mt-1.5 space-y-0.5 text-sm text-foreground">
                {editing.usage.setores > 0 && <li>{pluralizeBR(editing.usage.setores, 'setor', 'setores')}</li>}
                {editing.usage.funcionarios > 0 && <li>{pluralizeBR(editing.usage.funcionarios, 'funcionário', 'funcionários')}</li>}
                {editing.usage.resultadosHistoricos > 0 && <li>{pluralizeBR(editing.usage.resultadosHistoricos, 'processamento histórico', 'processamentos históricos')}</li>}
              </ul>
              <p className="mt-1.5 text-xs text-muted-foreground">Os vínculos usam o ID da empresa — a alteração de nome/CNPJ os preserva.</p>
            </div>
          )}

          {/* Duplicidade de CNPJ */}
          {duplicado && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
              <div>
                <p className="font-semibold text-foreground">Empresa já cadastrada</p>
                <p className="text-foreground">{duplicado.nome} · <span className="font-mono">{formatCNPJ(duplicado.cnpj)}</span></p>
                <Button variant="link" className="h-auto p-0 text-xs" onClick={() => onOpenExisting(duplicado)}>Ver empresa existente</Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button className="gap-1.5" onClick={handleSave} disabled={!canSave}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? 'Salvar alterações' : 'Criar empresa'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
