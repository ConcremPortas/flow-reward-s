import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Funcionario } from '@/hooks/useFuncionarios';
import { EMPTY_FORM_DATA, type EmployeeFormData } from '../types';
import { validateIdentification } from '../domain/employeeValidation';

export const WIZARD_STEPS = ['Identificação', 'Estrutura', 'Premiação', 'Revisão'] as const;
export type WizardStep = 0 | 1 | 2 | 3;

interface UseEmployeeFormArgs {
  createFuncionario: (data: Record<string, unknown>) => Promise<{ id: string } | null>;
  updateFuncionario: (id: string, data: Record<string, unknown>) => Promise<unknown>;
}

/**
 * Wizard de identificação/estrutura/premiação/revisão.
 * Mantém EXATAMENTE a mesma persistência do formulário anterior:
 * createFuncionario/updateFuncionario + RPC update_funcionario_setor_ids.
 */
export function useEmployeeForm({ createFuncionario, updateFuncionario }: UseEmployeeFormArgs) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<WizardStep>(0);
  const [data, setData] = useState<EmployeeFormData>(EMPTY_FORM_DATA);
  const [editing, setEditing] = useState<Funcionario | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [touched, setTouched] = useState(false);
  const initialSnapshot = useState({ current: JSON.stringify(EMPTY_FORM_DATA) })[0];

  const isEditing = !!editing;
  const isDirty = JSON.stringify(data) !== initialSnapshot.current;

  const openCreate = () => {
    setEditing(null);
    setData(EMPTY_FORM_DATA);
    initialSnapshot.current = JSON.stringify(EMPTY_FORM_DATA);
    setStep(0);
    setTouched(false);
    setOpen(true);
  };

  const openEdit = (f: Funcionario) => {
    const next: EmployeeFormData = {
      cod_funcionario: f.cpf || '',
      nome: f.nome,
      data_admissao: f.data_admissao || '',
      empresa_id: f.empresa_id || '',
      setor_id: f.setor_id || '',
      funcao_id: f.funcao_id || '',
      categoria_id: f.categoria_id || '',
      base_premiacao_id: f.base_premiacao_id || '',
      faixa_id: f.faixa_id || '',
      local_dss_id: f.local_dss_id || '',
      status: f.status || 'Ativo',
      valor_fixo: String(f.valor_fixo || ''),
      setor_ids: f.setor_ids && f.setor_ids.length > 0 ? f.setor_ids : (f.setor_id ? [f.setor_id] : []),
    };
    setEditing(f);
    setData(next);
    initialSnapshot.current = JSON.stringify(next);
    setStep(0);
    setTouched(false);
    setOpen(true);
  };

  const patch = (p: Partial<EmployeeFormData>) => setData((prev) => ({ ...prev, ...p }));

  const requestClose = () => {
    if (isDirty) setConfirmDiscard(true);
    else setOpen(false);
  };
  const confirmDiscardAndClose = () => { setConfirmDiscard(false); setOpen(false); };
  const cancelDiscard = () => setConfirmDiscard(false);

  const stepValid = step === 0 ? validateIdentification(data).valid : true;
  // Erros só aparecem depois de uma tentativa de avançar (não no primeiro render do campo vazio).
  const stepErrors = step === 0 && touched ? validateIdentification(data).errors : {};

  const goNext = () => {
    if (!stepValid) { setTouched(true); return; }
    if (step < 3) { setStep((s) => (s + 1) as WizardStep); setTouched(false); }
  };
  const goBack = () => { if (step > 0) setStep((s) => (s - 1) as WizardStep); };

  const submit = async () => {
    if (!validateIdentification(data).valid) { setStep(0); return; }
    setSaving(true);
    try {
      const payload = {
        nome: data.nome.trim(),
        cpf: data.cod_funcionario.trim() || undefined,
        data_admissao: data.data_admissao || undefined,
        empresa_id: data.empresa_id || undefined,
        setor_id: data.setor_ids[0] || undefined,
        funcao_id: data.funcao_id || undefined,
        categoria_id: data.categoria_id || undefined,
        base_premiacao_id: data.base_premiacao_id || undefined,
        faixa_id: data.faixa_id || undefined,
        local_dss_id: data.local_dss_id || undefined,
        status: data.status,
        valor_fixo: parseFloat(data.valor_fixo) || undefined,
      };

      if (isEditing && editing) {
        await updateFuncionario(editing.id, {
          ...payload,
          ativo: data.status.toLowerCase() !== 'rescisão' && data.status.toLowerCase() !== 'rescisao',
        });
        await supabase.rpc('update_funcionario_setor_ids', {
          p_id: editing.id,
          p_setor_ids: data.setor_ids.length > 0 ? data.setor_ids.join(',') : '',
        });
      } else {
        const novo = await createFuncionario({ ...payload, ativo: true });
        if (novo?.id && data.setor_ids.length > 0) {
          await supabase.rpc('update_funcionario_setor_ids', {
            p_id: novo.id,
            p_setor_ids: data.setor_ids.join(','),
          });
        }
      }
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return {
    open, setOpen, openCreate, openEdit, requestClose,
    step, setStep, goNext, goBack, stepValid, stepErrors,
    data, patch, isEditing, editing, saving, submit,
    confirmDiscard, confirmDiscardAndClose, cancelDiscard,
  };
}
