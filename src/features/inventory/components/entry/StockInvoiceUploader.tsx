import { useRef, useState } from 'react';
import { FileText, Paperclip, X, Eye, RefreshCw, CheckCircle2, Loader2, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const fmt = (n: number) => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(0)} KB` : `${(n / 1048576).toFixed(1)} MB`);

interface Props { nf: File | null; uploading: boolean; disabled?: boolean; onSelect: (f: File | null) => void | Promise<unknown>; onRemove: () => void }

export function StockInvoiceUploader({ nf, uploading, disabled, onSelect, onRemove }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const abrir = () => window.open(nf ? URL.createObjectURL(nf) : '', '_blank', 'noopener');

  if (nf) {
    return (
      <div className="rounded-lg border border-border/70 bg-muted/20 p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><FileText className="h-4.5 w-4.5" /></span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-foreground">{nf.name}</span>
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">{fmt(nf.size)} · PDF {uploading ? <span className="flex items-center gap-1 text-primary"><Loader2 className="h-3 w-3 animate-spin" /> enviando…</span> : <span className="flex items-center gap-1 text-success"><CheckCircle2 className="h-3 w-3" /> validado</span>}</span>
            </span>
          </div>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={abrir} disabled={uploading}><Eye className="h-3.5 w-3.5" /> Visualizar</Button>
          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => ref.current?.click()} disabled={uploading}><RefreshCw className="h-3.5 w-3.5" /> Substituir</Button>
          <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs text-destructive hover:text-destructive" onClick={onRemove} disabled={uploading}><X className="h-3.5 w-3.5" /> Remover</Button>
        </div>
        <input ref={ref} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => onSelect(e.target.files?.[0] ?? null)} />
        <p className="mt-2 text-[11px] text-muted-foreground">O PDF é enviado ao confirmar a entrada; a operação só conclui após a confirmação.</p>
      </div>
    );
  }

  return (
    <div>
      <button type="button" disabled={disabled} onClick={() => ref.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); onSelect(e.dataTransfer.files?.[0] ?? null); }}
        className={cn('flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          drag ? 'border-primary bg-primary/5' : 'border-border/70 hover:border-primary/40 hover:bg-muted/30', disabled && 'cursor-not-allowed opacity-60')}
        aria-label="Anexar nota fiscal em PDF">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground"><UploadCloud className="h-5 w-5" /></span>
        <span className="text-sm font-medium text-foreground">Anexar nota fiscal</span>
        <span className="text-xs text-muted-foreground">Arraste o PDF aqui ou clique para selecionar · até 10 MB</span>
        <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-primary"><Paperclip className="h-3.5 w-3.5" /> Selecionar arquivo</span>
      </button>
      <input ref={ref} type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => onSelect(e.target.files?.[0] ?? null)} />
    </div>
  );
}
