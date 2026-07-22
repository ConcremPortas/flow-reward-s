import { useRef, useState } from 'react';
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { DSS } from '@/hooks/useDSS';
import { EMPTY_DSS_FORM, type DssFormData, type DssWizardStep } from '../types';
import { validateInformationStep } from '../domain/dssValidation';
import { useDssAttendance } from './useDssAttendance';

interface Args {
  funcionarios: Funcionario[];
  createDSS: (dss: Record<string, unknown>) => Promise<{ id: string } | null>;
  updateDSS: (id: string, dss: Record<string, unknown>) => Promise<unknown>;
  onSaved?: (id: string | null) => void;
}

/**
 * Wizard de 3 etapas (Informações → Presença → Revisão). Mantém EXATAMENTE o
 * payload persistido pelo fluxo anterior: titulo=tema, descricao derivada,
 * topics=[tema], participantes_ids=presentes, observacoes derivada da contagem.
 */
export function useDssRegistration({ funcionarios, createDSS, updateDSS, onSaved }: Args) {
  const [step, setStep] = useState<DssWizardStep>(0);
  const [data, setData] = useState<DssFormData>(EMPTY_DSS_FORM);
  const [editing, setEditing] = useState<DSS | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const initialSnapshot = useRef(JSON.stringify(EMPTY_DSS_FORM));

  const attendance = useDssAttendance({
    localDssId: data.localDssId,
    funcionarios,
    initialParticipantIds: editing?.participantes_ids,
  });

  const isEditing = !!editing;
  // Dirty = dados do formulário mudaram em relação ao snapshot inicial (vazio
  // para novo DSS, ou os dados carregados para edição) OU a presença mudou.
  const isDirty = JSON.stringify(data) !== initialSnapshot.current || attendance.isDirty;

  const patch = (p: Partial<DssFormData>) => setData((prev) => ({ ...prev, ...p }));

  const reset = () => {
    setStep(0);
    setData(EMPTY_DSS_FORM);
    initialSnapshot.current = JSON.stringify(EMPTY_DSS_FORM);
    setEditing(null);
    setTouched(false);
    setSaveError(null);
  };

  const startNew = () => reset();

  const startEdit = (dss: DSS) => {
    const next: DssFormData = { localDssId: dss.local_dss_id || '', dataRealizacao: dss.data_realizacao, tema: dss.titulo };
    setEditing(dss);
    setData(next);
    initialSnapshot.current = JSON.stringify(next);
    setStep(0);
    setTouched(false);
    setSaveError(null);
  };

  /**
   * Duplicar como novo: pré-preenche local e tema de um DSS existente, mas
   * SEM data (o usuário escolhe uma nova) e SEM os participantes antigos —
   * a presença começa do zero (todos presentes da população atual), como um
   * cadastro novo. Nada é persistido até o usuário salvar explicitamente.
   */
  const startDuplicate = (dss: DSS) => {
    const next: DssFormData = { localDssId: dss.local_dss_id || '', dataRealizacao: '', tema: dss.titulo };
    setEditing(null);
    setData(next);
    initialSnapshot.current = JSON.stringify(EMPTY_DSS_FORM);
    setStep(0);
    setTouched(false);
    setSaveError(null);
  };

  const stepValid = step === 0 ? validateInformationStep(data).valid : true;
  const stepErrors = step === 0 && touched ? validateInformationStep(data).errors : {};

  const goNext = () => {
    if (step === 0 && !stepValid) { setTouched(true); return; }
    if (step < 2) setStep((s) => (s + 1) as DssWizardStep);
  };
  const goBack = () => { if (step > 0) setStep((s) => (s - 1) as DssWizardStep); };

  const submit = async (): Promise<boolean> => {
    if (!validateInformationStep(data).valid) { setStep(0); setTouched(true); return false; }
    setSaving(true);
    setSaveError(null);
    try {
      const participantesPresentes = attendance.presentes.map((f) => f.id);
      const payload = {
        titulo: data.tema,
        descricao: `DSS realizado sobre: ${data.tema}`,
        data_realizacao: data.dataRealizacao,
        local_dss_id: data.localDssId,
        participantes_ids: participantesPresentes,
        topics: [data.tema],
        observacoes: `${participantesPresentes.length} funcionários presentes`,
      };

      if (isEditing && editing) {
        const result = await updateDSS(editing.id, payload);
        if (!result) { setSaveError('Não foi possível salvar as alterações.'); return false; }
        onSaved?.(editing.id);
      } else {
        const result = await createDSS(payload);
        if (!result) { setSaveError('Não foi possível registrar o DSS.'); return false; }
        onSaved?.(result.id);
      }
      reset();
      return true;
    } finally {
      setSaving(false);
    }
  };

  return {
    step, setStep, goNext, goBack, stepValid, stepErrors,
    data, patch, isEditing, editing, isDirty, saving, saveError, submit,
    startNew, startEdit, startDuplicate, reset,
    attendance,
  };
}

export type UseDssRegistrationReturn = ReturnType<typeof useDssRegistration>;
