import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, X, AlertTriangle, CheckCircle2, Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/app/StatusBadge';
import { formatCurrencyBRL, formatNumberBR } from '@/lib/formatters';
import type { Cargo } from '@/hooks/useCargos';
import type { CargoInput } from '../hooks/useJobsCrud';
import { detectarDuplicidade, validarCampos, podeSalvar } from '../domain/jobValidation';
import type { JobRow } from '../types/job.types';

const SEM_SETOR = '__sem__';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: JobRow | null;
  setores: Array<{ id: string; nome: string }>;
  cargos: Cargo[];
  autorizadoSalario: boolean;
  saving: boolean;
  /** Etapa inicial ao abrir (ex.: 2 para "Gerenciar faixa"). Padrão 1. */
  initialStep?: 1 | 2 | 3;
  onCreate: (input: CargoInput) => Promise<Cargo | null>;
  onUpdate: (id: string, patch: Partial<CargoInput>) => Promise<boolean>;
}

interface FormState {
  nome: string; missao: string; requisitos: string; observacoes: string;
  responsabilidades: string[]; atividades: string[]; competencias: string[];
  setor_id: string; nivel: string; salarioMin: string; salarioMax: string; ativo: boolean;
}

const emptyForm: FormState = {
  nome: '', missao: '', requisitos: '', observacoes: '',
  responsabilidades: [], atividades: [], competencias: [],
  setor_id: '', nivel: '', salarioMin: '', salarioMax: '', ativo: true,
};

function fromCargo(c: Cargo): FormState {
  return {
    nome: c.nome ?? '', missao: c.missao ?? '', requisitos: c.requisitos ?? '', observacoes: c.observacoes ?? '',
    responsabilidades: c.responsabilidades ?? [], atividades: c.atividades ?? [], competencias: c.competencias ?? [],
    setor_id: c.setor_id ?? '', nivel: c.nivel_hierarquico != null ? String(c.nivel_hierarquico) : '',
    salarioMin: c.salario_minimo != null ? String(c.salario_minimo) : '', salarioMax: c.salario_maximo != null ? String(c.salario_maximo) : '',
    ativo: c.ativo,
  };
}

/** Editor de cargo em 3 etapas (Identificação → Estrutura e Remuneração → Revisão). */
export function JobEditor({ open, onOpenChange, editing, setores, cargos, autorizadoSalario, saving, initialStep = 1, onCreate, onUpdate }: Props) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    if (open) {
      setStep(initialStep);
      setForm(editing ? fromCargo(editing.cargo) : emptyForm);
    }
  }, [open, editing, initialStep]);

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const validacao = useMemo(() => validarCampos({ nome: form.nome, nivel: form.nivel, salarioMin: form.salarioMin, salarioMax: form.salarioMax }), [form]);
  const dup = useMemo(() => detectarDuplicidade(form.nome, cargos, editing?.cargo.id), [form.nome, cargos, editing]);

  const construirInput = (): CargoInput => ({
    nome: form.nome.trim(),
    setor_id: form.setor_id || undefined,
    nivel_hierarquico: form.nivel.trim() !== '' ? Number(form.nivel) : undefined,
    missao: form.missao.trim() || undefined,
    responsabilidades: form.responsabilidades.length ? form.responsabilidades : undefined,
    atividades: form.atividades.length ? form.atividades : undefined,
    competencias: form.competencias.length ? form.competencias : undefined,
    requisitos: form.requisitos.trim() || undefined,
    // Só grava salário quando autorizado (defesa em profundidade na UI).
    salario_minimo: autorizadoSalario && form.salarioMin.trim() !== '' ? Number(form.salarioMin) : undefined,
    salario_maximo: autorizadoSalario && form.salarioMax.trim() !== '' ? Number(form.salarioMax) : undefined,
    observacoes: form.observacoes.trim() || undefined,
    ativo: form.ativo,
  });

  const salvar = async () => {
    if (!podeSalvar(validacao)) return;
    const input = construirInput();
    // Na edição sem permissão salarial, não sobrescrever a faixa existente.
    if (editing) {
      const patch: Partial<CargoInput> = { ...input };
      if (!autorizadoSalario) { delete patch.salario_minimo; delete patch.salario_maximo; }
      const ok = await onUpdate(editing.cargo.id, patch);
      if (ok) onOpenChange(false);
    } else {
      const created = await onCreate(input);
      if (created) onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? 'Editar cargo' : 'Novo cargo'}</DialogTitle>
          <DialogDescription>Etapa {step} de 3 — {step === 1 ? 'Identificação' : step === 2 ? 'Estrutura e remuneração' : 'Revisão'}</DialogDescription>
        </DialogHeader>

        <Stepper step={step} />

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do cargo *</Label>
              <Input id="nome" value={form.nome} onChange={(e) => set({ nome: e.target.value })} placeholder="Ex.: Analista Fiscal" />
              {!validacao.nomeValido && form.nome.length > 0 && <p className="text-xs text-destructive">Informe pelo menos 2 caracteres.</p>}
              {dup.duplicado && dup.existente && (
                <div className="flex items-start gap-2 rounded-lg border border-status-warning/40 bg-status-warning/5 p-2.5 text-xs text-muted-foreground">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-warning" />
                  <span>Já existe um cargo chamado <strong className="text-foreground">{dup.existente.nome}</strong>. Verifique se não é duplicidade (não é bloqueado, pois pode haver contextos distintos).</span>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="missao">Missão / descrição</Label>
              <Textarea id="missao" rows={3} value={form.missao} onChange={(e) => set({ missao: e.target.value })} />
            </div>
            <ChipList label="Responsabilidades" items={form.responsabilidades} onChange={(v) => set({ responsabilidades: v })} />
            <div className="space-y-2">
              <Label htmlFor="req">Requisitos</Label>
              <Textarea id="req" rows={2} value={form.requisitos} onChange={(e) => set({ requisitos: e.target.value })} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Setor</Label>
                <Select value={form.setor_id || SEM_SETOR} onValueChange={(v) => set({ setor_id: v === SEM_SETOR ? '' : v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SEM_SETOR}>Sem setor</SelectItem>
                    {setores.map((s) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Cada cargo pertence a um único setor.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nivel">Nível hierárquico</Label>
                <Input id="nivel" type="number" min={0} value={form.nivel} onChange={(e) => set({ nivel: e.target.value })} />
                {!validacao.nivelValido && <p className="text-xs text-destructive">Use um inteiro não negativo.</p>}
              </div>
            </div>

            {autorizadoSalario ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="smin">Salário mínimo (faixa)</Label>
                  <Input id="smin" type="number" step="0.01" min={0} value={form.salarioMin} onChange={(e) => set({ salarioMin: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="smax">Salário máximo (faixa)</Label>
                  <Input id="smax" type="number" step="0.01" min={0} value={form.salarioMax} onChange={(e) => set({ salarioMax: e.target.value })} />
                </div>
                {!validacao.faixaCoerente && <p className="text-xs text-destructive sm:col-span-2">Faixa inválida: verifique os valores (mínimo ≤ máximo).</p>}
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 p-3 text-sm text-muted-foreground">
                <Lock className="h-4 w-4" /> Faixa salarial: acesso restrito. Você pode salvar o cargo sem alterar a faixa.
              </div>
            )}

            <ChipList label="Atividades" items={form.atividades} onChange={(v) => set({ atividades: v })} />
            <ChipList label="Competências" items={form.competencias} onChange={(v) => set({ competencias: v })} />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <ReviewRow label="Nome" value={form.nome || '—'} />
            <ReviewRow label="Setor" value={setores.find((s) => s.id === form.setor_id)?.nome ?? 'Sem setor'} />
            <ReviewRow label="Nível" value={form.nivel.trim() !== '' ? `Nível ${form.nivel}` : 'Não definido'} />
            <ReviewRow label="Faixa salarial" value={autorizadoSalario ? faixaLabel(form.salarioMin, form.salarioMax) : 'Acesso restrito (inalterada)'} />

            {validacao.erros.length > 0 && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-destructive"><AlertTriangle className="h-4 w-4" /> Corrija antes de salvar</p>
                <ul className="space-y-0.5 text-xs text-muted-foreground">{validacao.erros.map((e, i) => <li key={i}>• {e}</li>)}</ul>
              </div>
            )}
            {dup.duplicado && dup.existente && (
              <p className="text-xs text-status-warning">Atenção: nome equivalente ao cargo existente “{dup.existente.nome}”.</p>
            )}
            {editing && <EditImpact editing={editing} form={form} autorizadoSalario={autorizadoSalario} />}
            {podeSalvar(validacao) && (
              <div className="flex items-center gap-2 rounded-lg border border-success/20 bg-success/5 p-3 text-sm text-foreground">
                <CheckCircle2 className="h-4 w-4 text-success" /> Configuração válida. Pronto para salvar.
              </div>
            )}
          </div>
        )}

        <div className="mt-2 flex items-center justify-between gap-2 border-t border-border/60 pt-4">
          <Button variant="ghost" onClick={() => (step === 1 ? onOpenChange(false) : setStep(step - 1))}>{step === 1 ? 'Cancelar' : 'Voltar'}</Button>
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} disabled={step === 1 && !validacao.nomeValido}>Continuar</Button>
          ) : (
            <Button onClick={salvar} disabled={!podeSalvar(validacao) || saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editing ? 'Salvar alterações' : 'Cadastrar cargo'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function faixaLabel(min: string, max: string): string {
  const nmin = min.trim() !== '' ? formatCurrencyBRL(Number(min)) : '—';
  const nmax = max.trim() !== '' ? formatCurrencyBRL(Number(max)) : '—';
  if (min.trim() === '' && max.trim() === '') return 'Não definida';
  return `${nmin} – ${nmax}`;
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3].map((s) => (
        <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-[#08783e]' : 'bg-muted'}`} />
      ))}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

function EditImpact({ editing, form, autorizadoSalario }: { editing: JobRow; form: FormState; autorizadoSalario: boolean }) {
  const nomeMudou = editing.cargo.nome !== form.nome.trim();
  const foraDaFaixa = editing.ocupantesForaDaFaixa;
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
      <p className="mb-1.5 text-sm font-medium text-foreground">Impacto esperado</p>
      <ul className="space-y-1 text-xs text-muted-foreground">
        <li>{formatNumberBR(editing.ocupantes)} colaborador(es) enquadrado(s) neste cargo.</li>
        {nomeMudou && <li>O vínculo dos colaboradores é por identificador — mudar o nome preserva o enquadramento.</li>}
        {autorizadoSalario && foraDaFaixa != null && foraDaFaixa > 0 && (
          <li className="text-status-warning">{formatNumberBR(foraDaFaixa)} ocupante(s) hoje com salário fora da faixa atual — revise após alterar a faixa.</li>
        )}
      </ul>
    </div>
  );
}

function ChipList({ label, items, onChange }: { label: string; items: string[]; onChange: (v: string[]) => void }) {
  const [value, setValue] = useState('');
  const add = () => { const v = value.trim(); if (v) { onChange([...items, v]); setValue(''); } };
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={`Adicionar ${label.toLowerCase()}`}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} />
        <Button type="button" size="sm" variant="outline" onClick={add}><Plus className="h-4 w-4" /></Button>
      </div>
      {items.length > 0 && (
        <div className="space-y-1">
          {items.map((it, i) => (
            <div key={i} className="flex items-center gap-2 rounded bg-muted p-2 text-sm">
              <span className="flex-1">{it}</span>
              <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label="Remover" className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
