import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { FieldDef } from './masterShared';

const SEM = '__sem__';
const SEM_SECAO = '__geral__';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description?: string;
  layout: 'compact' | 'wide';
  fields: FieldDef[];
  initial: Record<string, unknown> | null;
  defaults?: Record<string, unknown>;
  saving: boolean;
  onSubmit: (valores: Record<string, unknown>) => Promise<boolean> | boolean;
}

/**
 * Formulário config-driven de cadastro. `compact` → Dialog de coluna única
 * (entidades simples); `wide` → drawer lateral com seções e grid de 2 colunas
 * (entidades complexas). Só coleta/valida; a persistência vem por `onSubmit`.
 */
export function MasterDataForm({ open, onOpenChange, title, description, layout, fields, initial, defaults, saving, onSubmit }: Props) {
  const vazio = useMemo(() => {
    const o: Record<string, unknown> = {};
    for (const f of fields) o[f.name] = f.type === 'checkbox' ? true : '';
    return o;
  }, [fields]);

  const [valores, setValores] = useState<Record<string, unknown>>(vazio);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      const o: Record<string, unknown> = {};
      for (const f of fields) { const v = initial[f.name]; o[f.name] = f.type === 'checkbox' ? v !== false : v ?? ''; }
      setValores(o);
    } else {
      setValores({ ...vazio, ...(defaults ?? {}) });
    }
    setErro(null);
  }, [open, initial, defaults, fields, vazio]);

  const set = (name: string, v: unknown) => setValores((prev) => ({ ...prev, [name]: v }));

  const handleSubmit = async () => {
    const out: Record<string, unknown> = {};
    for (const f of fields) {
      const raw = valores[f.name];
      if (f.type === 'checkbox') { out[f.name] = raw !== false; continue; }
      if (f.type === 'number') {
        const str = String(raw ?? '').trim();
        if (str === '') { out[f.name] = f.required ? NaN : 0; }
        else { out[f.name] = Number(str); }
        if (f.required && (str === '' || Number.isNaN(Number(str)))) { setErro(`Informe ${f.label.toLowerCase()}.`); return; }
        if (str !== '' && Number.isNaN(Number(str))) { setErro(`${f.label} inválido.`); return; }
        continue;
      }
      if (f.type === 'select') {
        const v = raw === SEM || raw === '' || raw == null ? null : raw;
        if (f.required && !v) { setErro(`Selecione ${f.label.toLowerCase()}.`); return; }
        out[f.name] = v;
        continue;
      }
      const str = String(raw ?? '').trim();
      if (f.required && str === '') { setErro(`Informe ${f.label.toLowerCase()}.`); return; }
      out[f.name] = str === '' ? (f.optional ? null : '') : str;
    }
    setErro(null);
    const ok = await onSubmit(out); // dados preservados se falhar (não fecha)
    if (ok) onOpenChange(false);
  };

  const campo = (f: FieldDef) => (
    <div key={f.name} className={cn('space-y-1.5', f.full && 'sm:col-span-2')}>
      {f.type !== 'checkbox' && <Label htmlFor={`f-${f.name}`} className="text-sm">{f.label}{f.required ? ' *' : ''}</Label>}
      {f.type === 'text' && <Input id={`f-${f.name}`} value={String(valores[f.name] ?? '')} placeholder={f.placeholder} readOnly={f.readOnly} onChange={(e) => set(f.name, e.target.value)} className={f.readOnly ? 'cursor-not-allowed bg-muted/40 text-muted-foreground' : undefined} />}
      {f.type === 'textarea' && <Textarea id={`f-${f.name}`} rows={3} value={String(valores[f.name] ?? '')} placeholder={f.placeholder} onChange={(e) => set(f.name, e.target.value)} />}
      {f.type === 'number' && <Input id={`f-${f.name}`} type="number" step="any" value={String(valores[f.name] ?? '')} placeholder={f.placeholder} onChange={(e) => set(f.name, e.target.value)} />}
      {f.type === 'select' && (
        <Select value={(valores[f.name] as string) || SEM} onValueChange={(v) => set(f.name, v)}>
          <SelectTrigger id={`f-${f.name}`}><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>{f.optional && <SelectItem value={SEM}>—</SelectItem>}{(f.options ?? []).map((o) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}</SelectContent>
        </Select>
      )}
      {f.type === 'checkbox' && <label className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground"><Checkbox checked={valores[f.name] !== false} onCheckedChange={(v) => set(f.name, Boolean(v))} /> {f.label}</label>}
      {f.hint && <p className="text-xs text-muted-foreground">{f.hint}</p>}
    </div>
  );

  // Agrupa por seção preservando a ordem de aparição.
  const secoes = useMemo(() => {
    const ordem: string[] = []; const map = new Map<string, FieldDef[]>();
    for (const f of fields) { const k = f.section ?? SEM_SECAO; if (!map.has(k)) { map.set(k, []); ordem.push(k); } map.get(k)!.push(f); }
    return ordem.map((k) => ({ titulo: k === SEM_SECAO ? null : k, campos: map.get(k)! }));
  }, [fields]);

  const corpo = layout === 'wide'
    ? (
      <div className="space-y-6">
        {secoes.map((sec, i) => (
          <div key={i}>
            {sec.titulo && <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{sec.titulo}</h3>}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{sec.campos.map(campo)}</div>
          </div>
        ))}
        {erro && <p className="text-sm text-destructive">{erro}</p>}
      </div>
    )
    : (
      <div className="space-y-4">
        {fields.map(campo)}
        {erro && <p className="text-sm text-destructive">{erro}</p>}
      </div>
    );

  const rodape = (
    <div className="flex items-center justify-end gap-2">
      <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
      <Button onClick={handleSubmit} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{initial ? 'Salvar' : 'Cadastrar'}</Button>
    </div>
  );

  if (layout === 'wide') {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="flex w-[96vw] flex-col gap-0 p-0 sm:max-w-xl">
          <SheetHeader className="border-b border-border/60 p-5 pb-4 text-left">
            <SheetTitle>{title}</SheetTitle>
            <SheetDescription>{description ?? 'Preencha os campos e salve.'}</SheetDescription>
          </SheetHeader>
          <ScrollArea className="min-h-0 flex-1"><div className="p-5">{corpo}</div></ScrollArea>
          <div className="border-t border-border/60 p-4">{rodape}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description ?? 'Preencha os campos e salve.'}</DialogDescription>
        </DialogHeader>
        {corpo}
        <div className="mt-2 border-t border-border/60 pt-4">{rodape}</div>
      </DialogContent>
    </Dialog>
  );
}
