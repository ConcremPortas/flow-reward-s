import { useMemo } from 'react';
import { Link2, RefreshCw, Briefcase, ExternalLink, Building2, Layers, Wallet, AlertTriangle, History, Lock } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/app/StatusBadge';
import { formatCurrencyBRL } from '@/lib/formatters';
import { formatDateBR } from '@/lib/dateTime';
import type { HistoricoCargo } from '@/hooks/useHistoricoCargos';
import { EmployeeJobStatus } from './EmployeeJobStatus';
import { EmployeeSalaryPosition } from './EmployeeSalaryPosition';
import { SITUACAO_LABEL } from '../domain/employeeJobStatus';
import { CADASTRO_ORIGEM, FUNCAO_HELP, CARGO_HELP } from '../domain/employeeDataSource';
import type { JobEmployeeRow } from '../types/job-employee.types';

interface Props {
  row: JobEmployeeRow | null;
  autorizadoSalario: boolean;
  temCargos: boolean;
  historico: HistoricoCargo[];
  onClose: () => void;
  onAssign: (r: JobEmployeeRow) => void;
  onViewCargo: (r: JobEmployeeRow) => void;
  onOpenRh: (r: JobEmployeeRow) => void;
}

export function JobEmployeeDrawer({ row, autorizadoSalario, temCargos, historico, onClose, onAssign, onViewCargo, onOpenRh }: Props) {
  const historicoColab = useMemo(
    () => (row ? historico.filter((h) => h.funcionario_id === row.funcionario.id).slice(0, 8) : []),
    [row, historico],
  );

  const salarioLabel = (): string => {
    if (!autorizadoSalario) return 'Acesso restrito';
    if (row?.salario == null) return 'Não informado';
    return formatCurrencyBRL(row.salario);
  };
  const faixaLabel = (): string => {
    if (!autorizadoSalario) return 'Acesso restrito';
    const c = row?.cargo;
    if (!c || typeof c.salario_minimo !== 'number' || typeof c.salario_maximo !== 'number') return 'Não definida';
    return `${formatCurrencyBRL(c.salario_minimo)} – ${formatCurrencyBRL(c.salario_maximo)}`;
  };

  const f = row?.funcionario;
  return (
    <Sheet open={!!row} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {row && f && (
          <>
            <SheetHeader><SheetTitle className="pr-8 text-left">{f.nome}</SheetTitle></SheetHeader>
            <div className="mt-4 space-y-6">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge variant={row.ativo ? 'success' : 'neutral'}>{row.ativo ? 'Ativo' : 'Inativo'}</StatusBadge>
                <EmployeeJobStatus situacao={row.situacao} />
              </div>

              <Grid>
                {f.cpf && <Field label="Código" value={f.cpf} />}
                <Field icon={Building2} label="Empresa" value={row.empresaNome ?? 'Não informada'} />
                <Field icon={Building2} label="Setor" value={row.setorNome ?? 'Sem setor'} />
                <Field label="Categoria" value={f.categoria?.nome ?? 'Não informada'} />
              </Grid>

              <Section title="Cadastro operacional (RH)" help={FUNCAO_HELP}>
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <p className="text-sm"><span className="text-muted-foreground">Função atual: </span><span className="font-medium text-foreground">{row.funcaoNome ?? '—'}</span></p>
                  <p className="mt-1 text-xs text-muted-foreground">Origem: {CADASTRO_ORIGEM}</p>
                </div>
              </Section>

              <Section title="Enquadramento organizacional" help={CARGO_HELP}>
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3 space-y-1.5">
                  <p className="text-sm"><span className="text-muted-foreground">Cargo estruturado: </span><span className="font-medium text-foreground">{row.cargo ? row.cargo.nome : 'Não vinculado'}</span></p>
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><Layers className="h-3.5 w-3.5" /> {row.cargo?.nivel_hierarquico != null ? `Nível ${row.cargo.nivel_hierarquico}` : 'Nível não definido'}</p>
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><Wallet className="h-3.5 w-3.5" /> Faixa: {faixaLabel()}</p>
                </div>
              </Section>

              <Section title="Remuneração">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
                    {!autorizadoSalario && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                    Salário: <span className="font-medium">{salarioLabel()}</span>
                  </span>
                  <EmployeeSalaryPosition posicao={row.posicaoSalarial} />
                </div>
              </Section>

              {row.pendencias.length > 0 && (
                <Section title="Pendências" icon={AlertTriangle}>
                  <div className="flex flex-wrap gap-1.5">{row.pendencias.map((p) => <StatusBadge key={p} variant="warning">{SITUACAO_LABEL[p]}</StatusBadge>)}</div>
                </Section>
              )}

              {historicoColab.length > 0 && (
                <Section title="Histórico" icon={History}>
                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                    {historicoColab.map((h) => (
                      <li key={h.id} className="flex justify-between gap-3">
                        <span>{h.tipo_mudanca}{h.cargo?.nome ? ` → ${h.cargo.nome}` : ''}</span>
                        <span className="shrink-0 text-xs tabular-nums">{formatDateBR(h.data_mudanca)}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
                {temCargos && (
                  <Button size="sm" onClick={() => onAssign(row)}>
                    {row.cargo ? <><RefreshCw className="mr-1.5 h-4 w-4" /> Alterar cargo</> : <><Link2 className="mr-1.5 h-4 w-4" /> Vincular cargo</>}
                  </Button>
                )}
                {row.cargo && <Button size="sm" variant="outline" onClick={() => onViewCargo(row)}><Briefcase className="mr-1.5 h-4 w-4" /> Ver cargo</Button>}
                <Button size="sm" variant="outline" onClick={() => onOpenRh(row)}><ExternalLink className="mr-1.5 h-4 w-4" /> Abrir no RH</Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Grid({ children }: { children: React.ReactNode }) { return <div className="grid grid-cols-2 gap-3">{children}</div>; }
function Field({ icon: Icon, label, value }: { icon?: typeof Building2; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">{Icon && <Icon className="h-3.5 w-3.5" />}{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
function Section({ title, help, icon: Icon, children }: { title: string; help?: string; icon?: typeof Building2; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">{Icon && <Icon className="h-3.5 w-3.5" />}{title}</p>
      {children}
      {help && <p className="mt-1 text-[11px] text-muted-foreground/80">{help}</p>}
    </div>
  );
}
