import { useRef, useState } from 'react';
import { Download, UploadCloud, FileSpreadsheet, ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, XCircle, Loader2, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/app/SectionCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/app/StatusBadge';
import { formatNumberBR } from '@/lib/formatters';
import { competenciaShortLabelBR } from '../domain/productionCalculations';
import type { UseProductionImportReturn } from '../hooks/useProductionImport';
import type { ImportRowStatus } from '../types/production-entry.types';

interface Props {
  imp: UseProductionImportReturn;
}

const STEP_LABELS = ['Arquivo', 'Validação', 'Confirmação'] as const;
const STATUS_VARIANT: Record<ImportRowStatus, 'success' | 'warning' | 'danger'> = {
  valido: 'success', alerta: 'warning', invalido: 'danger',
};
const STATUS_LABEL: Record<ImportRowStatus, string> = {
  valido: 'Válido', alerta: 'Alerta', invalido: 'Inválido',
};

export function ProductionImportWizard({ imp }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const stepIndex = imp.step === 'arquivo' ? 0 : imp.step === 'validacao' ? 1 : 2;

  return (
    <div className="space-y-[18px]">
      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEP_LABELS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center gap-2">
            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${i < stepIndex ? 'bg-primary text-primary-foreground' : i === stepIndex ? 'bg-primary/15 text-primary ring-2 ring-primary/30' : 'bg-muted text-muted-foreground'}`}>
              {i + 1}
            </div>
            <span className={`text-xs font-medium ${i === stepIndex ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
            {i < STEP_LABELS.length - 1 && <div className="h-px flex-1 bg-border" />}
          </div>
        ))}
      </div>

      {imp.error && (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/[0.06] p-3">
          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{imp.error}</p>
        </div>
      )}

      {/* Etapa 1 — Arquivo */}
      {imp.step === 'arquivo' && (
        <SectionCard title="Selecionar arquivo" description="Baixe o modelo, preencha competência (AAAA-MM), meta mensal e produção realizada, depois envie.">
          <div className="space-y-4">
            <Button variant="outline" className="gap-2" onClick={imp.downloadTemplate}>
              <Download className="h-4 w-4" /> Baixar modelo
            </Button>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault(); setDragOver(false);
                const f = e.dataTransfer.files?.[0];
                if (f) imp.setFile(f);
              }}
              className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${dragOver ? 'border-primary bg-primary/[0.04]' : 'border-border'}`}
            >
              <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-foreground">{imp.file ? imp.file.name : 'Arraste o arquivo aqui ou selecione'}</p>
              <p className="text-xs text-muted-foreground">Formatos aceitos: .xlsx, .xls</p>
              <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={(e) => imp.setFile(e.target.files?.[0] || null)} />
              <Button variant="outline" size="sm" className="mt-1" onClick={() => fileRef.current?.click()}>Selecionar arquivo</Button>
            </div>

            <div className="flex justify-end">
              <Button className="gap-2" onClick={() => imp.validate()} disabled={!imp.file || imp.parsing}>
                {imp.parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                Validar
              </Button>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Etapa 2 — Validação */}
      {imp.step === 'validacao' && imp.summary && (
        <SectionCard title="Validação" description="Confira os problemas antes de importar. Nada é gravado nesta etapa.">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <SummaryTile icon={CheckCircle2} label="Válidos" value={imp.summary.validos} variant="success" />
              <SummaryTile icon={AlertTriangle} label="Alertas" value={imp.summary.alertas} variant="warning" />
              <SummaryTile icon={XCircle} label="Inválidos" value={imp.summary.invalidos} variant="danger" />
            </div>

            <div className="max-h-[400px] overflow-auto rounded-lg border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50 [&>th]:sticky [&>th]:top-0 [&>th]:bg-muted/95">
                    <TableHead>Linha</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Competência</TableHead>
                    <TableHead className="text-right">Meta</TableHead>
                    <TableHead className="text-right">Realizado</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead>Problema</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {imp.rows.map((r) => (
                    <TableRow key={r.linha}>
                      <TableCell className="text-sm text-muted-foreground">{r.linha}</TableCell>
                      <TableCell className="text-sm">{r.setorNome || '—'}</TableCell>
                      <TableCell className="text-sm">{r.competencia ? competenciaShortLabelBR(r.competencia) : '—'}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{r.meta != null ? formatNumberBR(r.meta) : '—'}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{r.realizado != null ? formatNumberBR(r.realizado) : '—'}</TableCell>
                      <TableCell><StatusBadge variant={STATUS_VARIANT[r.status]}>{STATUS_LABEL[r.status]}</StatusBadge></TableCell>
                      <TableCell className="text-xs text-muted-foreground">{r.problema || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-2">
                <Button variant="outline" className="gap-1.5" onClick={() => imp.setStep('arquivo')}><ArrowLeft className="h-4 w-4" /> Voltar</Button>
                {(imp.summary.invalidos > 0 || imp.summary.alertas > 0) && (
                  <Button variant="outline" className="gap-1.5" onClick={imp.downloadErrorReport}><FileDown className="h-4 w-4" /> Baixar relatório de erros</Button>
                )}
              </div>
              <Button className="gap-1.5" onClick={imp.confirmImport} disabled={imp.summary.validos === 0 || imp.importing}>
                {imp.importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                Importar {imp.summary.validos} válido(s)
              </Button>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Etapa 3 — Confirmação */}
      {imp.step === 'confirmacao' && (
        <SectionCard title="Importação concluída">
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-success" />
            <p className="text-lg font-semibold text-foreground">{imp.insertedCount} registro(s) importado(s)</p>
            <p className="text-sm text-muted-foreground">
              {imp.summary ? `${imp.summary.alertas} ignorado(s) por alerta · ${imp.summary.invalidos} inválido(s)` : ''}
            </p>
            <Button variant="outline" className="mt-2" onClick={imp.reset}>Nova importação</Button>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function SummaryTile({ icon: Icon, label, value, variant }: { icon: typeof CheckCircle2; label: string; value: number; variant: 'success' | 'warning' | 'danger' }) {
  const tint = variant === 'success' ? 'text-success' : variant === 'warning' ? 'text-status-warning' : 'text-destructive';
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/70 p-3">
      <Icon className={`h-5 w-5 ${tint}`} />
      <div>
        <p className="text-lg font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
