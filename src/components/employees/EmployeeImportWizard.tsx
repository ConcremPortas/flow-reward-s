import { useRef, useState } from 'react';
import { Download, UploadCloud, FileSpreadsheet, X, Check, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { useEmployeeImport, ImportStep } from '@/features/employees/hooks/useEmployeeImport';
import type { ImportPreviewRow } from '@/features/employees/types';

const MAX_SIZE_MB = 5;
const ACCEPTED = ['.xlsx', '.xls'];

const STATUS_META: Record<ImportPreviewRow['status'], { label: string; className: string }> = {
  valido: { label: 'Válido', className: 'bg-success/10 text-success' },
  alerta: { label: 'Alerta', className: 'bg-status-warning/10 text-status-warning' },
  invalido: { label: 'Inválido', className: 'bg-destructive/10 text-destructive' },
  duplicado: { label: 'Duplicado', className: 'bg-muted text-muted-foreground' },
};

interface EmployeeImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  importState: ReturnType<typeof useEmployeeImport>;
}

const STEP_LABELS: Record<ImportStep, string> = { arquivo: 'Arquivo', validacao: 'Validação', confirmacao: 'Confirmação' };
const STEP_ORDER: ImportStep[] = ['arquivo', 'validacao', 'confirmacao'];

/** Importação de funcionários em 3 etapas com pré-visualização local antes de gravar. */
export function EmployeeImportWizard({ open, onOpenChange, importState }: EmployeeImportWizardProps) {
  const {
    step, setStep, file, setFile, isParsing, isImporting, progress,
    previewRows, summary, insertedCount, reset, downloadTemplate, buildPreview, commitImport, downloadErrorReport,
  } = importState;
  const [dragOver, setDragOver] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const committed = insertedCount > 0 || (progress === 100 && !isImporting && step === 'confirmacao');

  const acceptFile = (f: File | null) => {
    setSizeError(null);
    if (!f) { setFile(null); return; }
    const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase();
    if (!ACCEPTED.includes(ext)) { setSizeError('Formato não suportado. Use .xlsx ou .xls.'); return; }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) { setSizeError(`Arquivo maior que ${MAX_SIZE_MB}MB.`); return; }
    setFile(f);
  };

  const close = () => { onOpenChange(false); reset(); };
  const stepIdx = STEP_ORDER.indexOf(step);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); }}>
      <DialogContent className="max-w-[800px]">
        <DialogHeader><DialogTitle>Importar Funcionários</DialogTitle></DialogHeader>

        <div className="flex items-center gap-2 pb-1">
          {STEP_ORDER.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                i < stepIdx ? 'bg-primary text-primary-foreground' : i === stepIdx ? 'bg-primary/15 text-primary ring-2 ring-primary/30' : 'bg-muted text-muted-foreground',
              )}>
                {i < stepIdx ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={cn('hidden text-xs font-medium sm:block', i === stepIdx ? 'text-foreground' : 'text-muted-foreground')}>{STEP_LABELS[s]}</span>
              {i < STEP_ORDER.length - 1 && <div className="h-px flex-1 bg-border" />}
            </div>
          ))}
        </div>

        <div className="max-h-[55vh] overflow-y-auto py-2">
          {step === 'arquivo' && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Importe funcionários em lote a partir de uma planilha. Baixe o modelo para garantir que as colunas e referências (setor, função, categoria etc.) estejam no formato correto.
              </p>
              <Button variant="outline" className="gap-2" onClick={downloadTemplate}><Download className="h-4 w-4" /> Baixar Modelo</Button>

              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); acceptFile(e.dataTransfer.files?.[0] || null); }}
                onClick={() => inputRef.current?.click()}
                className={cn(
                  'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors',
                  dragOver ? 'border-primary bg-primary/[0.04]' : 'border-border hover:bg-muted/30',
                )}
              >
                <UploadCloud className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Arraste o arquivo aqui ou clique para selecionar</p>
                <p className="text-xs text-muted-foreground">Formatos aceitos: .xlsx, .xls · tamanho máximo {MAX_SIZE_MB}MB</p>
                <input ref={inputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => acceptFile(e.target.files?.[0] || null)} />
              </div>

              {sizeError && <p className="text-xs text-destructive">{sizeError}</p>}

              {file && !sizeError && (
                <div className="flex items-center justify-between rounded-lg border border-border/70 p-3">
                  <div className="flex items-center gap-2 text-sm text-foreground"><FileSpreadsheet className="h-4 w-4 text-primary" /> {file.name}</div>
                  <button type="button" onClick={() => acceptFile(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                </div>
              )}
            </div>
          )}

          {step === 'validacao' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <SummaryStat label="Total de linhas" value={summary.total} />
                <SummaryStat label="Válidos" value={summary.validos} tone="text-success" />
                <SummaryStat label="Alertas" value={summary.alertas} tone="text-status-warning" />
                <SummaryStat label="Inválidos/Duplicados" value={summary.invalidos + summary.duplicados} tone="text-destructive" />
              </div>
              <div className="max-h-64 overflow-y-auto rounded-lg border border-border/70">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50"><TableHead>Linha</TableHead><TableHead>Funcionário</TableHead><TableHead>Status</TableHead><TableHead>Problema</TableHead></TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.map((r) => (
                      <TableRow key={`${r.line}-${r.cod_funcionario}`}>
                        <TableCell className="text-xs">{r.line}</TableCell>
                        <TableCell className="text-xs font-medium">{r.nome || '—'}</TableCell>
                        <TableCell><span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', STATUS_META[r.status].className)}>{STATUS_META[r.status].label}</span></TableCell>
                        <TableCell className="text-xs text-muted-foreground">{r.problema || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {step === 'confirmacao' && !committed && (
            <div className="space-y-4">
              <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/[0.05] p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p className="text-xs text-muted-foreground">
                  Serão importados <span className="font-medium text-foreground">{summary.validos + summary.alertas} funcionário(s)</span> (válidos + alertas).
                  {summary.invalidos + summary.duplicados > 0 && ` ${summary.invalidos + summary.duplicados} linha(s) inválida(s)/duplicada(s) serão ignoradas.`}
                </p>
              </div>
              {isImporting && <Progress value={progress} />}
            </div>
          )}

          {step === 'confirmacao' && committed && (
            <div className="space-y-3">
              <div className="rounded-lg border border-success/20 bg-success/[0.05] p-4 text-sm text-foreground">
                Importação concluída: <span className="font-semibold">{insertedCount}</span> funcionário(s) inserido(s).
              </div>
              {(summary.invalidos > 0 || summary.duplicados > 0) && (
                <Button variant="outline" size="sm" className="gap-1.5" onClick={downloadErrorReport}>
                  <Download className="h-3.5 w-3.5" /> Baixar relatório de erros
                </Button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border/60 pt-4">
          <Button variant="outline" onClick={close}>{committed ? 'Fechar' : 'Cancelar'}</Button>
          <div className="flex items-center gap-2">
            {step === 'validacao' && (
              <Button variant="outline" className="gap-1.5" onClick={() => { setStep('arquivo'); }}>
                <ChevronLeft className="h-4 w-4" /> Corrigir arquivo
              </Button>
            )}
            {step === 'arquivo' && (
              <Button className="gap-1.5" onClick={buildPreview} disabled={!file || !!sizeError || isParsing}>
                {isParsing ? 'Analisando...' : 'Analisar arquivo'} <ChevronRight className="h-4 w-4" />
              </Button>
            )}
            {step === 'validacao' && (
              <Button className="gap-1.5" onClick={() => setStep('confirmacao')} disabled={summary.validos + summary.alertas === 0}>
                Continuar <ChevronRight className="h-4 w-4" />
              </Button>
            )}
            {step === 'confirmacao' && !committed && (
              <Button onClick={commitImport} disabled={isImporting || summary.validos + summary.alertas === 0}>
                {isImporting ? 'Importando...' : 'Confirmar importação'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="rounded-lg border border-border/70 p-3">
      <p className={cn('text-xl font-bold', tone || 'text-foreground')}>{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}
