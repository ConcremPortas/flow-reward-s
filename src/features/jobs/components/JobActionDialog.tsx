import { useMemo } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { HistoricoCargo } from '@/hooks/useHistoricoCargos';
import type { EstruturaHierarquica } from '@/hooks/useEstruturaHierarquica';
import type { Enquadramento } from '@/features/jobs-salaries/types/jobsSalaries.types';
import { levantarDependencias } from '../domain/jobDependencies';
import type { JobRow } from '../types/job.types';

export type JobAction = 'inativar' | 'reativar' | 'excluir';

export interface JobActionTarget { row: JobRow; action: JobAction }

interface Props {
  target: JobActionTarget | null;
  enquadramentos: Map<string, Enquadramento>;
  historico: HistoricoCargo[];
  estrutura: EstruturaHierarquica[];
  saving: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: (target: JobActionTarget) => void;
}

/**
 * Diálogo de inativação/reativação/exclusão. Investiga dependências reais antes
 * de confirmar. Exclusão é bloqueada quando há vínculos (ocupantes, histórico ou
 * estrutura) — nesses casos oferece apenas a inativação, que preserva histórico.
 * Sem window.confirm; o botão fica desabilitado enquanto salva (evita duplo envio).
 */
export function JobActionDialog({ target, enquadramentos, historico, estrutura, saving, onOpenChange, onConfirm }: Props) {
  const deps = useMemo(
    () => (target ? levantarDependencias(target.row.cargo, enquadramentos, historico, estrutura) : null),
    [target, enquadramentos, historico, estrutura],
  );

  if (!target || !deps) return <AlertDialog open={false} onOpenChange={onOpenChange}><AlertDialogContent /></AlertDialog>;

  const nome = target.row.cargo.nome;
  const exclusaoBloqueada = target.action === 'excluir' && !deps.podeExcluir;

  const titulo = target.action === 'reativar' ? `Reativar “${nome}”?` : target.action === 'inativar' ? `Inativar “${nome}”?` : `Excluir “${nome}”?`;
  const descricao = target.action === 'reativar'
    ? 'O cargo voltará a ficar disponível para enquadramento.'
    : target.action === 'inativar'
      ? 'O cargo deixará de aparecer como ativo, mas o histórico e os enquadramentos são preservados.'
      : 'A exclusão é definitiva e só é permitida quando o cargo não possui nenhum vínculo.';

  return (
    <AlertDialog open onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{descricao}</AlertDialogDescription>
        </AlertDialogHeader>

        {deps.motivos.length > 0 && (
          <div className={`rounded-lg border p-3 ${exclusaoBloqueada ? 'border-destructive/30 bg-destructive/5' : 'border-border/60 bg-muted/20'}`}>
            <p className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-foreground">
              {exclusaoBloqueada ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <Info className="h-4 w-4 text-muted-foreground" />}
              Dependências encontradas
            </p>
            <ul className="space-y-0.5 text-xs text-muted-foreground">{deps.motivos.map((m, i) => <li key={i}>• {m}</li>)}</ul>
            {exclusaoBloqueada && <p className="mt-2 text-xs text-destructive">Exclusão bloqueada. Prefira inativar o cargo para preservar o histórico.</p>}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={saving || exclusaoBloqueada}
            onClick={(e) => { e.preventDefault(); onConfirm(target); }}
            className={target.action === 'excluir' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : undefined}
          >
            {target.action === 'reativar' ? 'Reativar' : target.action === 'inativar' ? 'Inativar' : 'Excluir'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
