import { useNavigate } from 'react-router-dom';
import { Pencil, ArrowRight, AlertTriangle } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { FaltaAdvertencia } from '@/hooks/useFaltasAdvertencias';
import type { EPI } from '@/hooks/useEPI';
import type { DSS } from '@/hooks/useDSS';
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
import { checkEmployeeCompletion } from '@/features/employees/domain/employeeCompletion';
import { getEmployeeEligibility } from '@/features/employees/domain/employeeEligibility';
import { formatTenure } from '@/features/employees/domain/tenure';
import { formatDateBR } from '@/lib/dateTime';
import { formatCurrencyBRL } from '@/lib/formatters';
import { EmployeeStatusBadge } from './EmployeeStatusBadge';
import { EmployeeEligibilityBadge } from './EmployeeEligibilityBadge';

const initialsOf = (nome: string) => nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('') || '?';
const fmtDate = (d?: string | null) => formatDateBR(d);
const fmtCurrency = (v?: number) => (v ? formatCurrencyBRL(v) : 'Não informado');

interface EmployeeDetailsDrawerProps {
  funcionario: Funcionario | null;
  onClose: () => void;
  onEdit: (f: Funcionario) => void;
  faltas: FaltaAdvertencia[];
  epi: EPI[];
  dss: DSS[];
  resultados: ResultadoPremiacao[];
}

/** Drawer de perfil do funcionário — dados de vínculo, elegibilidade, pendências e histórico relacionado. */
export function EmployeeDetailsDrawer({ funcionario: f, onClose, onEdit, faltas, epi, dss, resultados }: EmployeeDetailsDrawerProps) {
  const navigate = useNavigate();
  if (!f) return <Sheet open={false} onOpenChange={() => {}}><SheetContent /></Sheet>;

  const completion = checkEmployeeCompletion(f);
  const eligibility = getEmployeeEligibility(f);
  const tenure = formatTenure(f.data_admissao);

  const faltasDoFunc = faltas.filter((r) => r.funcionario_id === f.id && r.tipo === 'falta');
  const advertenciasDoFunc = faltas.filter((r) => r.funcionario_id === f.id && r.tipo === 'advertencia');
  const epiDoFunc = epi.filter((r) => r.funcionario_id === f.id);
  const epiNaoConforme = epiDoFunc.filter((r) => r.status === 'nao_conforme').length;
  const dssParticipou = dss.filter((d) => d.participantes_ids?.includes(f.id)).length;
  const premiacoesRecentes = resultados
    .filter((r) => r.funcionario_id === f.id)
    .sort((a, b) => (a.mes_competencia < b.mes_competencia ? 1 : -1))
    .slice(0, 3);

  const field = (label: string, value: React.ReactNode, hint?: string) => (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );

  return (
    <Sheet open={!!f} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="sr-only">Perfil do funcionário</SheetTitle>
        </SheetHeader>

        <div className="mt-2 flex items-center gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">{initialsOf(f.nome)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-bold text-foreground">{f.nome}</p>
            <p className="text-xs text-muted-foreground">{f.cpf || 'sem código'}</p>
          </div>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onEdit(f)}>
            <Pencil className="h-3.5 w-3.5" /> Editar
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <EmployeeStatusBadge status={f.status} />
          <EmployeeEligibilityBadge status={eligibility} />
        </div>

        {!completion.complete && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/[0.05] p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Cadastro incompleto:</span> {completion.missing.join(', ')}.</p>
          </div>
        )}

        <div className="mt-5 grid grid-cols-2 gap-4">
          {field('Empresa', f.empresa?.nome || '—')}
          {field('Setor', f.setor?.nome || 'Sem setor')}
          {field('Função', f.funcao?.nome || '—')}
          {field('Categoria', f.categoria?.nome || '—')}
          {field('Admissão', fmtDate(f.data_admissao))}
          {field('Tempo de empresa', tenure || '—')}
          {field('Base de Premiação', f.base_premiacao?.nome || '—')}
          {field('Faixa', f.faixa?.nome || '—')}
          {field('Local DSS', f.local_dss?.nome || '—')}
          {field('Valor Fixo', fmtCurrency(f.valor_fixo))}
        </div>

        <div className="mt-6 border-t border-border/60 pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resumo operacional</p>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => navigate('/premiacoes/faltas-advertencias')} className="rounded-lg border border-border/70 p-3 text-left hover:bg-muted/40">
              <p className="text-lg font-bold text-foreground">{faltasDoFunc.length}</p>
              <p className="text-xs text-muted-foreground">Faltas registradas</p>
            </button>
            <button type="button" onClick={() => navigate('/premiacoes/faltas-advertencias')} className="rounded-lg border border-border/70 p-3 text-left hover:bg-muted/40">
              <p className="text-lg font-bold text-foreground">{advertenciasDoFunc.length}</p>
              <p className="text-xs text-muted-foreground">Advertências</p>
            </button>
            <button type="button" onClick={() => navigate('/premiacoes/epi')} className="rounded-lg border border-border/70 p-3 text-left hover:bg-muted/40">
              <p className="text-lg font-bold text-foreground">{epiNaoConforme}<span className="text-xs font-normal text-muted-foreground"> / {epiDoFunc.length}</span></p>
              <p className="text-xs text-muted-foreground">Não conformidades EPI</p>
            </button>
            <button type="button" onClick={() => navigate('/premiacoes/dss')} className="rounded-lg border border-border/70 p-3 text-left hover:bg-muted/40">
              <p className="text-lg font-bold text-foreground">{dssParticipou}</p>
              <p className="text-xs text-muted-foreground">Participações em DSS</p>
            </button>
          </div>
        </div>

        <div className="mt-5 border-t border-border/60 pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Premiações recentes</p>
          {premiacoesRecentes.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum resultado de premiação encontrado para este funcionário.</p>
          ) : (
            <div className="space-y-1.5">
              {premiacoesRecentes.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2 text-xs">
                  <span className="text-muted-foreground">{r.mes_competencia?.slice(0, 7)}</span>
                  <span className="font-medium text-foreground">{fmtCurrency(r.bonus_alcancado)}</span>
                </div>
              ))}
            </div>
          )}
          <button
            type="button"
            onClick={() => navigate('/premiacoes/relatorio-premiacoes')}
            className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            Ver relatório completo <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <p className="mt-5 text-[11px] text-muted-foreground">
          Histórico de alterações cadastrais ainda não é registrado pelo sistema (sem tabela de auditoria).
        </p>
      </SheetContent>
    </Sheet>
  );
}
