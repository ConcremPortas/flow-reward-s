import { useEffect, useMemo, useState } from 'react';
import { Loader2, ArrowRight, AlertTriangle, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/app/StatusBadge';
import { formatCurrencyBRL, formatNumberBR } from '@/lib/formatters';
import type { Cargo } from '@/hooks/useCargos';
import { calcularPosicaoSalarial, SALARY_POSITION_LABEL } from '../domain/employeeSalaryPosition';
import type { JobEmployeeRow } from '../types/job-employee.types';

interface Props {
  /** Colaboradores a enquadrar (1 = individual; N = em lote). */
  alvos: JobEmployeeRow[] | null;
  cargos: Cargo[];
  autorizadoSalario: boolean;
  saving: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: (cargo: Cargo, alvos: JobEmployeeRow[], motivo: string) => void;
}

/**
 * Diálogo de vínculo/alteração de cargo (individual ou em lote). Grava apenas o
 * ENQUADRAMENTO (histórico de cargos) — não altera a função operacional nem o
 * salário automaticamente. Mostra o impacto antes de confirmar.
 */
export function EmployeeJobAssignmentDialog({ alvos, cargos, autorizadoSalario, saving, onOpenChange, onConfirm }: Props) {
  const [cargoId, setCargoId] = useState('');
  const [motivo, setMotivo] = useState('');

  useEffect(() => { if (alvos) { setCargoId(''); setMotivo(''); } }, [alvos]);

  const cargo = cargos.find((c) => c.id === cargoId) ?? null;
  const emLote = (alvos?.length ?? 0) > 1;

  // Impacto salarial: quantos ficariam fora da faixa do novo cargo (só se autorizado).
  const impacto = useMemo(() => {
    if (!cargo || !alvos || !autorizadoSalario) return null;
    let fora = 0; let semSalario = 0;
    for (const a of alvos) {
      const pos = calcularPosicaoSalarial(cargo, a.salario, true);
      if (pos === 'abaixo' || pos === 'acima') fora++;
      if (pos === 'sem_salario') semSalario++;
    }
    return { fora, semSalario };
  }, [cargo, alvos, autorizadoSalario]);

  const conflitos = useMemo(() => (alvos ?? []).filter((a) => a.cargo && a.cargo.id !== cargoId), [alvos, cargoId]);

  if (!alvos) return null;

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{emLote ? `Enquadrar ${formatNumberBR(alvos.length)} colaboradores` : `Enquadrar ${alvos[0].funcionario.nome}`}</DialogTitle>
          <DialogDescription>Define o cargo estruturado. A função do cadastro de RH é preservada e o salário não é alterado.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {cargos.length === 0 ? (
            <div className="flex items-start gap-2 rounded-lg border border-status-warning/40 bg-status-warning/5 p-3 text-sm text-muted-foreground">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-warning" /> Nenhum cargo estruturado disponível. Cadastre um cargo antes de enquadrar.
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Cargo estruturado</Label>
                <Select value={cargoId} onValueChange={setCargoId}>
                  <SelectTrigger><SelectValue placeholder="Selecione o cargo" /></SelectTrigger>
                  <SelectContent>{cargos.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}{c.nivel_hierarquico != null ? ` · Nível ${c.nivel_hierarquico}` : ''}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              {cargo && (
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3 text-sm">
                  <p className="font-medium text-foreground">{cargo.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {cargo.nivel_hierarquico != null ? `Nível ${cargo.nivel_hierarquico}` : 'Sem nível'} ·{' '}
                    {autorizadoSalario
                      ? (typeof cargo.salario_minimo === 'number' && typeof cargo.salario_maximo === 'number'
                          ? `Faixa ${formatCurrencyBRL(cargo.salario_minimo)}–${formatCurrencyBRL(cargo.salario_maximo)}`
                          : 'Faixa não definida')
                      : 'Faixa: acesso restrito'}
                  </p>
                </div>
              )}

              {cargo && (
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground"><Info className="h-4 w-4 text-muted-foreground" /> Impacto</p>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>{formatNumberBR(alvos.length)} colaborador(es) serão vinculados a este cargo.</li>
                    <li>A função operacional é preservada; o salário não é alterado.</li>
                    {conflitos.length > 0 && <li className="text-status-warning">{formatNumberBR(conflitos.length)} já possuem outro cargo e serão realocados (registrado no histórico).</li>}
                    {impacto && impacto.fora > 0 && <li className="text-status-warning">{formatNumberBR(impacto.fora)} ficariam com salário fora da nova faixa — revisar remuneração.</li>}
                    {impacto && impacto.semSalario > 0 && <li>{formatNumberBR(impacto.semSalario)} sem salário informado.</li>}
                    {!autorizadoSalario && <li>Posição salarial: acesso restrito.</li>}
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="motivo-enq">Motivo (opcional)</Label>
                <Textarea id="motivo-enq" rows={2} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex.: enquadramento inicial no plano de cargos" />
              </div>

              {emLote && (
                <div className="max-h-32 overflow-y-auto rounded-lg border border-border/50 p-2">
                  <div className="flex flex-wrap gap-1.5">
                    {alvos.slice(0, 40).map((a) => <StatusBadge key={a.funcionario.id} variant="neutral">{a.funcionario.nome}</StatusBadge>)}
                    {alvos.length > 40 && <span className="text-xs text-muted-foreground">+{formatNumberBR(alvos.length - 40)}</span>}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 border-t border-border/60 pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button disabled={!cargo || saving} onClick={() => cargo && onConfirm(cargo, alvos, motivo)}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirmar enquadramento <ArrowRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
