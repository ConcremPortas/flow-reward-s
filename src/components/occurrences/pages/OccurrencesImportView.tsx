import { useRef, useState } from 'react';
import { Download, UploadCloud, FileSpreadsheet, X, Check, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SectionCard } from '@/components/app/SectionCard';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useOccurrenceImport, type OccurrenceImportStep } from '@/features/occurrences/hooks/useOccurrenceImport';
import { competenciaLabelLong } from '@/features/dashboard/utils/dates';
import type { OccurrencePageProps } from './_shared';
import type { OccurrenceImportRow } from '@/features/occurrences/types';

const STEP_LABELS: Record<OccurrenceImportStep, string> = { arquivo: 'Arquivo', validacao: 'Validação', confirmacao: 'Confirmação' };
const STEP_ORDER: OccurrenceImportStep[] = ['arquivo', 'validacao', 'confirmacao'];

const STATUS_META: Record<OccurrenceImportRow['status'], { label: string; className: string }> = {
  valido: { label: 'Válido', className: 'bg-success/10 text-success' },
  alerta: { label: 'Alerta', className: 'bg-status-warning/10 text-status-warning' },
  invalido: { label: 'Inválido', className: 'bg-destructive/10 text-destructive' },
  duplicado: { label: 'Duplicado', className: 'bg-muted text-muted-foreground' },
};

export function OccurrencesImportView({ data, draft, competencia }: OccurrencePageProps) {
  const importState = useOccurrenceImport(data.funcionariosAtivos, competencia);
  const {
    step, setStep, file, acceptFile, isParsing, previewRows, summary,
    getValidEntries, reset, downloadTemplate, buildPreview, downloadErrorReport,
    maxSizeMb, acceptedFormats,
  } = importState;

  const [dragOver, setDragOver] = useState(false);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const [merged, setMerged] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const stepIdx = STEP_ORDER.indexOf(step);

  const handleFile = (f: File | null) => { setSizeError(acceptFile(f)); };

  const doMerge = () => {
    draft.mergeDraft(getValidEntries());
    setMerged(true);
  };

  const handleConfirmImport = () => {
    // Proteção contra perda: se já houver edições manuais não salvas, exige confirmação explícita.
    if (draft.isDirty) setConfirmOverwrite(true);
    else doMerge();
  };

  return (
    <div className="space-y-[18px]">
      <SectionCard title="Importar Faltas e Advertências" description={`Competência ${competenciaLabelLong(competencia)}`}>
        <div className="flex items-center gap-2 pb-4">
          {STEP_ORDER.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                i < stepIdx ? 'bg-primary text-primary-foreground' : i === stepIdx ? 'bg-primary/15 text-primary ring-2 ring-primary/30' : 'bg-muted text-muted-foreground',
              )}>
                {i < stepIdx ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span className={cn('text-xs font-medium', i === stepIdx ? 'text-foreground' : 'text-muted-foreground')}>{STEP_LABELS[s]}</span>
              {i < STEP_ORDER.length - 1 && <div className="h-px flex-1 bg-border" />}
            </div>
          ))}
        </div>

        {step === 'arquivo' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Importe faltas e advertências em lote para a competência <strong>{competenciaLabelLong(competencia)}</strong>. Baixe o modelo com todos os funcionários ativos para preencher corretamente.
            </p>
            <Button variant="outline" className="gap-2" onClick={downloadTemplate}><Download className="h-4 w-4" /> Baixar Template</Button>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0] || null); }}
              onClick={() => inputRef.current?.click()}
              className={cn(
                'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors',
                dragOver ? 'border-primary bg-primary/[0.04]' : 'border-border hover:bg-muted/30',
              )}
            >
              <UploadCloud className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Arraste o arquivo aqui ou clique para selecionar</p>
              <p className="text-xs text-muted-foreground">Formatos aceitos: {acceptedFormats.join(', ')} · tamanho máximo {maxSizeMb}MB</p>
              <input ref={inputRef} type="file" accept={acceptedFormats.join(',')} className="hidden" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
            </div>

            {sizeError && <p className="text-xs text-destructive">{sizeError}</p>}

            {file && !sizeError && (
              <div className="flex items-center justify-between rounded-lg border border-border/70 p-3">
                <div className="flex items-center gap-2 text-sm text-foreground"><FileSpreadsheet className="h-4 w-4 text-primary" /> {file.name}</div>
                <button type="button" onClick={() => handleFile(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
              </div>
            )}

            <div className="flex justify-end">
              <Button className="gap-1.5" onClick={buildPreview} disabled={!file || !!sizeError || isParsing}>
                {isParsing ? 'Analisando...' : 'Analisar arquivo'} <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 'validacao' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <SummaryStat label="Linhas encontradas" value={summary.total} />
              <SummaryStat label="Válidos" value={summary.validos} tone="text-success" />
              <SummaryStat label="Alertas" value={summary.alertas} tone="text-status-warning" />
              <SummaryStat label="Inválidos/Duplicados" value={summary.invalidos + summary.duplicados} tone="text-destructive" />
            </div>
            <div className="max-h-80 overflow-y-auto rounded-lg border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Linha</TableHead><TableHead>Código</TableHead><TableHead>Funcionário</TableHead>
                    <TableHead className="text-center">Faltas</TableHead><TableHead className="text-center">Advertências</TableHead>
                    <TableHead>Situação</TableHead><TableHead>Mensagem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewRows.map((r) => (
                    <TableRow key={`${r.line}-${r.cod_funcionario}`}>
                      <TableCell className="text-xs">{r.line}</TableCell>
                      <TableCell className="text-xs">{r.cod_funcionario || '—'}</TableCell>
                      <TableCell className="text-xs font-medium">{r.nome || '—'}</TableCell>
                      <TableCell className="text-center text-xs">{r.faltas}</TableCell>
                      <TableCell className="text-center text-xs">{r.advertencias}</TableCell>
                      <TableCell><span className={cn('rounded-full px-2 py-0.5 text-[11px] font-medium', STATUS_META[r.status].className)}>{STATUS_META[r.status].label}</span></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.mensagem || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" className="gap-1.5" onClick={() => setStep('arquivo')}><ChevronLeft className="h-4 w-4" /> Corrigir arquivo</Button>
              <Button className="gap-1.5" onClick={() => setStep('confirmacao')} disabled={summary.validos === 0}>Continuar <ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}

        {step === 'confirmacao' && !merged && (
          <div className="space-y-4">
            <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/[0.05] p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-xs text-muted-foreground">
                Serão trazidos para o rascunho da apuração <span className="font-medium text-foreground">{summary.validos} funcionário(s) válido(s)</span>.
                {summary.invalidos + summary.duplicados + summary.alertas > 0 && ` ${summary.invalidos + summary.duplicados} linha(s) inválida(s)/duplicada(s) e ${summary.alertas} alerta(s) serão ignorados.`}
                {' '}A importação ainda não é salva — revise no Lançamento Mensal e clique em Salvar apuração para confirmar no banco.
              </p>
            </div>
            <div className="flex items-center justify-between">
              {summary.invalidos + summary.duplicados > 0 && (
                <Button variant="outline" size="sm" className="gap-1.5" onClick={downloadErrorReport}><Download className="h-3.5 w-3.5" /> Baixar relatório de erros</Button>
              )}
              <div className="ml-auto flex gap-2">
                <Button variant="outline" onClick={() => { reset(); }}>Cancelar</Button>
                <Button onClick={handleConfirmImport} disabled={summary.validos === 0}>Importar apenas válidos</Button>
              </div>
            </div>
          </div>
        )}

        {step === 'confirmacao' && merged && (
          <div className="space-y-3">
            <div className="rounded-lg border border-success/20 bg-success/[0.05] p-4 text-sm text-foreground">
              {summary.validos} funcionário(s) trazido(s) para o rascunho da apuração de {competenciaLabelLong(competencia)}.
              Vá até <strong>Lançamento Mensal</strong> para revisar e salvar.
            </div>
            <Button variant="outline" onClick={() => { reset(); setMerged(false); }}>Importar outro arquivo</Button>
          </div>
        )}

        {isParsing && <Progress value={undefined} className="mt-2" />}
      </SectionCard>

      <AlertDialog open={confirmOverwrite} onOpenChange={setConfirmOverwrite}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Há edições manuais não salvas</AlertDialogTitle>
            <AlertDialogDescription>
              Existem {draft.diff.totalFuncionariosAlterados} funcionário(s) com alterações feitas no Lançamento Mensal ainda não salvas.
              Importar agora pode sobrescrever os valores desses funcionários no rascunho, caso também estejam no arquivo. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { doMerge(); setConfirmOverwrite(false); }}>Continuar mesmo assim</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
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
