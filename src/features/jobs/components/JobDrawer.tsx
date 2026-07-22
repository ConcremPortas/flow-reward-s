import { useMemo } from 'react';
import { Pencil, Users, Wallet, PowerOff, Power, Building2, Layers, Target, AlertTriangle, History } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/app/StatusBadge';
import { formatNumberBR } from '@/lib/formatters';
import { formatDateBR } from '@/lib/dateTime';
import type { HistoricoCargo } from '@/hooks/useHistoricoCargos';
import type { EstruturaHierarquica } from '@/hooks/useEstruturaHierarquica';
import type { Enquadramento } from '@/features/jobs-salaries/types/jobsSalaries.types';
import { JobSituacaoBadge } from './JobSituacaoBadge';
import { JobSalaryRange } from './JobSalaryRange';
import { SITUACAO_LABEL } from '../domain/jobStatus';
import { levantarDependencias } from '../domain/jobDependencies';
import type { JobRow } from '../types/job.types';

interface Props {
  row: JobRow | null;
  autorizadoSalario: boolean;
  enquadramentos: Map<string, Enquadramento>;
  historico: HistoricoCargo[];
  estrutura: EstruturaHierarquica[];
  onClose: () => void;
  onEdit: (r: JobRow) => void;
  onViewEmployees: (r: JobRow) => void;
  onManageSalary: (r: JobRow) => void;
  onActivate: (r: JobRow) => void;
  onDeactivate: (r: JobRow) => void;
}

export function JobDrawer(props: Props) {
  const { row, autorizadoSalario, enquadramentos, historico, estrutura, onClose } = props;

  const deps = useMemo(
    () => (row ? levantarDependencias(row.cargo, enquadramentos, historico, estrutura) : null),
    [row, enquadramentos, historico, estrutura],
  );
  const historicoCargo = useMemo(
    () => (row ? historico.filter((h) => h.cargo_id === row.cargo.id || h.cargo_anterior_id === row.cargo.id).slice(0, 8) : []),
    [row, historico],
  );

  const cargo = row?.cargo;
  return (
    <Sheet open={!!row} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {row && cargo && deps && (
          <>
            <SheetHeader>
              <SheetTitle className="pr-8 text-left">{cargo.nome}</SheetTitle>
            </SheetHeader>

            <div className="mt-4 space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge variant={cargo.ativo ? 'success' : 'neutral'}>{cargo.ativo ? 'Ativo' : 'Inativo'}</StatusBadge>
                <JobSituacaoBadge situacao={row.situacao} />
                <StatusBadge variant={row.ocupantes > 0 ? 'info' : 'neutral'}>{formatNumberBR(row.ocupantes)} colaborador(es)</StatusBadge>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field icon={Layers} label="Nível hierárquico" value={row.semNivel ? 'Não definido' : `Nível ${cargo.nivel_hierarquico}`} />
                <Field icon={Building2} label="Setor" value={cargo.concremrh_setores?.nome ?? 'Não definido'} />
              </div>

              <div>
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Wallet className="h-3.5 w-3.5" /> Faixa salarial</p>
                <JobSalaryRange cargo={cargo} autorizado={autorizadoSalario} comPontoMedio />
                {autorizadoSalario && row.ocupantesForaDaFaixa != null && row.ocupantesForaDaFaixa > 0 && (
                  <p className="mt-1 text-xs text-destructive">{formatNumberBR(row.ocupantesForaDaFaixa)} ocupante(s) com salário fora da faixa.</p>
                )}
              </div>

              {cargo.missao && (
                <Section icon={Target} title="Missão"><p className="text-sm text-muted-foreground">{cargo.missao}</p></Section>
              )}
              {cargo.responsabilidades && cargo.responsabilidades.length > 0 && (
                <Section icon={Target} title="Responsabilidades">
                  <ul className="space-y-1 text-sm text-muted-foreground">{cargo.responsabilidades.map((r2, i) => <li key={i} className="flex gap-2"><span className="text-primary">•</span>{r2}</li>)}</ul>
                </Section>
              )}

              {row.lacunas.length > 0 && (
                <Section icon={AlertTriangle} title="Inconsistências">
                  <div className="flex flex-wrap gap-1.5">{row.lacunas.map((l) => <StatusBadge key={l} variant="warning">{SITUACAO_LABEL[l]}</StatusBadge>)}</div>
                </Section>
              )}

              <Section icon={Users} title="Vínculos">
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>{formatNumberBR(deps.ocupantesAtuais)} colaborador(es) enquadrado(s) atualmente</li>
                  <li>{formatNumberBR(deps.registrosHistorico)} registro(s) no histórico de cargos</li>
                  <li>{formatNumberBR(deps.subordinadosDiretos)} cargo(s) subordinado(s) na estrutura</li>
                </ul>
              </Section>

              {historicoCargo.length > 0 && (
                <Section icon={History} title="Histórico recente">
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {historicoCargo.map((h) => (
                      <li key={h.id} className="flex justify-between gap-3">
                        <span>{h.tipo_mudanca}{h.concremrh_funcionarios?.nome ? ` — ${h.concremrh_funcionarios.nome}` : ''}</span>
                        <span className="shrink-0 tabular-nums text-xs">{formatDateBR(h.data_mudanca)}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
                <Button size="sm" onClick={() => props.onEdit(row)}><Pencil className="mr-1.5 h-4 w-4" /> Editar</Button>
                <Button size="sm" variant="outline" onClick={() => props.onViewEmployees(row)}><Users className="mr-1.5 h-4 w-4" /> Colaboradores</Button>
                {autorizadoSalario && <Button size="sm" variant="outline" onClick={() => props.onManageSalary(row)}><Wallet className="mr-1.5 h-4 w-4" /> Faixa</Button>}
                {cargo.ativo
                  ? <Button size="sm" variant="outline" onClick={() => props.onDeactivate(row)}><PowerOff className="mr-1.5 h-4 w-4" /> Inativar</Button>
                  : <Button size="sm" variant="outline" onClick={() => props.onActivate(row)}><Power className="mr-1.5 h-4 w-4" /> Reativar</Button>}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Field({ icon: Icon, label, value }: { icon: typeof Layers; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
function Section({ icon: Icon, title, children }: { icon: typeof Layers; title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Icon className="h-3.5 w-3.5" /> {title}</p>
      {children}
    </div>
  );
}
