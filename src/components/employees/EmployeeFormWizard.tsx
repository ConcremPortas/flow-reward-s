import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import type { Empresa } from '@/hooks/useEmpresas';
import type { Setor } from '@/hooks/useSetores';
import type { Funcao } from '@/hooks/useFuncoes';
import type { Categoria } from '@/hooks/useCategorias';
import type { BasePremiacao } from '@/hooks/useBasePremiacao';
import type { Faixa } from '@/hooks/useFaixas';
import type { LocalDSS } from '@/hooks/useLocaisDSS';
import type { useEmployeeForm } from '@/features/employees/hooks/useEmployeeForm';
import { checkEmployeeCompletion } from '@/features/employees/domain/employeeCompletion';

const STEP_LABELS = ['Identificação', 'Estrutura', 'Premiação', 'Revisão'];
const STATUS_OPTIONS = ['Ativo', 'Férias', 'Licença', 'Rescisão'];

interface EmployeeFormWizardProps {
  form: ReturnType<typeof useEmployeeForm>;
  empresas: Empresa[];
  setores: Setor[];
  funcoes: Funcao[];
  categorias: Categoria[];
  bases: BasePremiacao[];
  faixas: Faixa[];
  locaisDSS: LocalDSS[];
}

/** Modal de cadastro/edição por etapas. Persistência idêntica ao formulário anterior (ver useEmployeeForm). */
export function EmployeeFormWizard({ form, empresas, setores, funcoes, categorias, bases, faixas, locaisDSS }: EmployeeFormWizardProps) {
  const { open, requestClose, step, setStep, goNext, goBack, stepValid, stepErrors, data, patch, isEditing, saving, submit, confirmDiscard, confirmDiscardAndClose, cancelDiscard } = form;
  const [setorPopoverOpen, setSetorPopoverOpen] = useState(false);
  const [setorSearch, setSetorSearch] = useState('');
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && step === 0) setTimeout(() => firstFieldRef.current?.focus(), 50);
  }, [open, step]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
      e.preventDefault();
      if (step < 3) goNext();
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) requestClose(); }}>
        <DialogContent className="max-w-[800px]" onKeyDown={handleKeyDown}>
          <DialogHeader>
            <DialogTitle>{isEditing ? 'Editar Funcionário' : 'Novo Funcionário'}</DialogTitle>
          </DialogHeader>

          {/* Indicador de etapas */}
          <div className="flex items-center gap-2 pb-2">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex flex-1 items-center gap-2">
                <button
                  type="button"
                  onClick={() => { if (i <= step || stepValid) setStep(i as 0 | 1 | 2 | 3); }}
                  className={cn(
                    'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                    i < step ? 'bg-primary text-primary-foreground' : i === step ? 'bg-primary/15 text-primary ring-2 ring-primary/30' : 'bg-muted text-muted-foreground',
                  )}
                >
                  {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </button>
                <span className={cn('hidden text-xs font-medium sm:block', i === step ? 'text-foreground' : 'text-muted-foreground')}>{label}</span>
                {i < STEP_LABELS.length - 1 && <div className="h-px flex-1 bg-border" />}
              </div>
            ))}
          </div>

          <div className="max-h-[55vh] overflow-y-auto py-2">
            {step === 0 && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Cód. Funcionário" required error={stepErrors.cod_funcionario}>
                  <Input ref={firstFieldRef} value={data.cod_funcionario} onChange={(e) => patch({ cod_funcionario: e.target.value })} placeholder="Código do funcionário" />
                </Field>
                <Field label="Nome do Funcionário" required error={stepErrors.nome}>
                  <Input value={data.nome} onChange={(e) => patch({ nome: e.target.value })} placeholder="Nome completo" />
                </Field>
                <Field label="Data de Admissão">
                  <Input type="date" value={data.data_admissao} onChange={(e) => patch({ data_admissao: e.target.value })} />
                </Field>
                <Field label="Empresa">
                  <Select value={data.empresa_id} onValueChange={(v) => patch({ empresa_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecionar empresa" /></SelectTrigger>
                    <SelectContent>{empresas.map((e) => <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Status">
                  <Select value={data.status} onValueChange={(v) => patch({ status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              </div>
            )}

            {step === 1 && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Setor" className="md:col-span-2">
                  <Popover open={setorPopoverOpen} onOpenChange={setSetorPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="h-9 w-full justify-between font-normal">
                        <span className="truncate text-left">
                          {data.setor_ids.length > 0
                            ? data.setor_ids.map((id) => setores.find((s) => s.id === id)?.nome).filter(Boolean).join(', ')
                            : <span className="text-muted-foreground">Selecionar setor</span>}
                        </span>
                        <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[420px] p-0" align="start">
                      <div className="border-b p-2"><Input placeholder="Buscar setor..." value={setorSearch} onChange={(e) => setSetorSearch(e.target.value)} className="h-8" /></div>
                      <div className="max-h-52 overflow-y-auto">
                        {setores.filter((s) => !setorSearch || s.nome.toLowerCase().includes(setorSearch.toLowerCase())).map((setor) => {
                          const selected = data.setor_ids.includes(setor.id);
                          return (
                            <div
                              key={setor.id}
                              className={cn('flex cursor-pointer items-center gap-2 px-3 py-2 text-sm hover:bg-accent', selected && 'bg-accent/30')}
                              onClick={() => patch({ setor_ids: selected ? data.setor_ids.filter((id) => id !== setor.id) : [...data.setor_ids, setor.id] })}
                            >
                              <Check className={cn('h-4 w-4 shrink-0', selected ? 'opacity-100' : 'opacity-0')} /> {setor.nome}
                            </div>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>
                </Field>
                <Field label="Função">
                  <Select value={data.funcao_id} onValueChange={(v) => patch({ funcao_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecionar função" /></SelectTrigger>
                    <SelectContent>{funcoes.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Categoria">
                  <Select value={data.categoria_id} onValueChange={(v) => patch({ categoria_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecionar categoria" /></SelectTrigger>
                    <SelectContent>{categorias.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Base Premiação">
                  <Select value={data.base_premiacao_id} onValueChange={(v) => patch({ base_premiacao_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecionar base de premiação" /></SelectTrigger>
                    <SelectContent>{bases.map((b) => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Faixa">
                  <Select value={data.faixa_id} onValueChange={(v) => patch({ faixa_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecionar faixa" /></SelectTrigger>
                    <SelectContent>{faixas.map((f) => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Local DSS">
                  <Select value={data.local_dss_id} onValueChange={(v) => patch({ local_dss_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecionar local DSS" /></SelectTrigger>
                    <SelectContent>{locaisDSS.map((l) => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Valor Fixo (R$)">
                  <Input type="number" min="0" step="0.01" placeholder="0,00" value={data.valor_fixo} onChange={(e) => patch({ valor_fixo: e.target.value })} />
                </Field>
              </div>
            )}

            {step === 3 && <ReviewStep data={data} empresas={empresas} setores={setores} funcoes={funcoes} categorias={categorias} bases={bases} faixas={faixas} locaisDSS={locaisDSS} />}
          </div>

          <div className="flex items-center justify-between border-t border-border/60 pt-4">
            <Button variant="outline" onClick={requestClose}>Cancelar</Button>
            <div className="flex items-center gap-2">
              {step > 0 && <Button variant="outline" className="gap-1.5" onClick={goBack}><ChevronLeft className="h-4 w-4" /> Voltar</Button>}
              {step < 3 ? (
                <Button className="gap-1.5" onClick={goNext}>Continuar <ChevronRight className="h-4 w-4" /></Button>
              ) : (
                <Button onClick={submit} disabled={saving}>{saving ? 'Salvando...' : 'Salvar funcionário'}</Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDiscard} onOpenChange={(o) => { if (!o) cancelDiscard(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>Você tem alterações não salvas neste cadastro. Se sair agora, elas serão perdidas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDiscard}>Continuar editando</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDiscardAndClose} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Descartar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Field({ label, required, error, className, children }: { label: string; required?: boolean; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label>{label}{required && ' *'}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function ReviewStep({ data, empresas, setores, funcoes, categorias, bases, faixas, locaisDSS }: {
  data: ReturnType<typeof useEmployeeForm>['data'];
  empresas: Empresa[]; setores: Setor[]; funcoes: Funcao[]; categorias: Categoria[]; bases: BasePremiacao[]; faixas: Faixa[]; locaisDSS: LocalDSS[];
}) {
  const nameOf = <T extends { id: string; nome: string }>(list: T[], id: string) => list.find((x) => x.id === id)?.nome;
  const rows: [string, string][] = [
    ['Código', data.cod_funcionario || '—'],
    ['Nome', data.nome || '—'],
    ['Admissão', data.data_admissao || '—'],
    ['Empresa', nameOf(empresas, data.empresa_id) || '—'],
    ['Status', data.status],
    ['Setor', data.setor_ids.map((id) => nameOf(setores, id)).filter(Boolean).join(', ') || 'Não informado'],
    ['Função', nameOf(funcoes, data.funcao_id) || 'Não informado'],
    ['Categoria', nameOf(categorias, data.categoria_id) || 'Não informado'],
    ['Base de Premiação', nameOf(bases, data.base_premiacao_id) || 'Não informado'],
    ['Faixa', nameOf(faixas, data.faixa_id) || 'Não informado'],
    ['Local DSS', nameOf(locaisDSS, data.local_dss_id) || 'Não informado'],
    ['Valor Fixo', data.valor_fixo ? `R$ ${data.valor_fixo}` : 'Não informado'],
  ];
  const missing = rows.filter(([, v]) => v === 'Não informado').map(([k]) => k);

  return (
    <div className="space-y-4">
      {missing.length > 0 && (
        <div className="flex items-start gap-2 rounded-lg border border-status-warning/30 bg-status-warning/[0.06] p-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-status-warning" />
          <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Campos não preenchidos:</span> {missing.join(', ')}. O cadastro será salvo mesmo assim, mas pode ficar pendente para a premiação.</p>
        </div>
      )}
      <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-medium text-foreground">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
