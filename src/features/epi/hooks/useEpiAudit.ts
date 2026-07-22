import { useRef, useState } from 'react';
import type { Funcionario } from '@/hooks/useFuncionarios';
import { auditableFuncionarios, validateConfigurationStep } from '../domain/epiValidation';
import { EPI_AUDIT_TIPO, type EpiAuditGroupEnriched } from '../domain/epiCalculations';
import { useEpiInspection } from './useEpiInspection';
import { EMPTY_EPI_FORM, type EpiAuditFormData, type EpiWizardStep, type ComplianceMap } from '../types/epi.types';
import { formatDateBR } from '@/lib/dateTime';

export interface EpiInsertRow {
  funcionario_id: string | null;
  tipo_epi: string;
  data_entrega: string;
  status: string;
  descricao: string;
  observacoes: string;
}

interface Args {
  funcionarios: Funcionario[]; // todos os funcionários — filtrado internamente por auditableFuncionarios
  saveAuditoria: (rows: EpiInsertRow[], deleteIds?: string[]) => Promise<boolean>;
  onSaved?: () => void;
}

/**
 * Wizard de 3 etapas (Configuração → Inspeção → Revisão). Ao salvar, grava 1
 * linha por funcionário auditado (funcionario_id real) + 1 linha-resumo,
 * ligadas por uma tag {"auditoria_id"} em `observacoes` — ver epiCalculations.ts.
 */
export function useEpiAudit({ funcionarios, saveAuditoria, onSaved }: Args) {
  const [step, setStep] = useState<EpiWizardStep>(0);
  const [data, setData] = useState<EpiAuditFormData>(EMPTY_EPI_FORM);
  const [editing, setEditing] = useState<EpiAuditGroupEnriched | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const initialSnapshot = useRef(JSON.stringify(EMPTY_EPI_FORM));
  const seedCounter = useRef(0);
  const [seedKey, setSeedKey] = useState('new-0');
  const initialComplianceMapRef = useRef<ComplianceMap | undefined>(undefined);

  const auditaveis = auditableFuncionarios(funcionarios);

  const inspection = useEpiInspection({
    funcionarios: auditaveis,
    initialComplianceMap: initialComplianceMapRef.current,
    seedKey,
  });

  const isEditing = !!editing;
  const isDirty = JSON.stringify(data) !== initialSnapshot.current || inspection.isDirty;

  const patch = (p: Partial<EpiAuditFormData>) => setData((prev) => ({ ...prev, ...p }));

  const bumpSeed = (prefix: string) => {
    seedCounter.current += 1;
    setSeedKey(`${prefix}-${seedCounter.current}`);
  };

  const reset = () => {
    setStep(0);
    setData(EMPTY_EPI_FORM);
    initialSnapshot.current = JSON.stringify(EMPTY_EPI_FORM);
    setEditing(null);
    setTouched(false);
    setSaveError(null);
    initialComplianceMapRef.current = undefined;
    bumpSeed('new');
  };

  const startNew = () => reset();

  const startEdit = (group: EpiAuditGroupEnriched) => {
    const next: EpiAuditFormData = { dataAuditoria: group.data };
    setEditing(group);
    setData(next);
    initialSnapshot.current = JSON.stringify(next);
    setStep(0);
    setTouched(false);
    setSaveError(null);

    const map: ComplianceMap = {};
    if (group.isLegacy) {
      // Auditorias legadas não têm funcionario_id salvo — melhor esforço por nome.
      const byName = new Map(group.membros.map((m) => [m.nome.trim().toLowerCase(), m.conforme]));
      auditaveis.forEach((f) => {
        const found = byName.get(f.nome.trim().toLowerCase());
        if (found != null) map[f.id] = found;
      });
    } else {
      group.membros.forEach((m) => { if (m.funcionarioId) map[m.funcionarioId] = m.conforme; });
    }
    initialComplianceMapRef.current = map;
    bumpSeed('edit');
  };

  /**
   * Duplicar como nova auditoria: pré-preenche as situações da auditoria de
   * origem (ponto de partida conveniente), mas SEM data (o usuário escolhe uma
   * nova) e SEM vínculo de edição — nada na auditoria original é alterado;
   * salvar cria uma auditoria totalmente nova com sua própria auditoria_id.
   */
  const startDuplicate = (group: EpiAuditGroupEnriched) => {
    setEditing(null);
    setData(EMPTY_EPI_FORM);
    initialSnapshot.current = JSON.stringify(EMPTY_EPI_FORM);
    setStep(0);
    setTouched(false);
    setSaveError(null);

    const map: ComplianceMap = {};
    if (group.isLegacy) {
      const byName = new Map(group.membros.map((m) => [m.nome.trim().toLowerCase(), m.conforme]));
      auditaveis.forEach((f) => {
        const found = byName.get(f.nome.trim().toLowerCase());
        if (found != null) map[f.id] = found;
      });
    } else {
      group.membros.forEach((m) => { if (m.funcionarioId) map[m.funcionarioId] = m.conforme; });
    }
    initialComplianceMapRef.current = map;
    bumpSeed('duplicate');
  };

  const stepValid = step === 0 ? validateConfigurationStep(data).valid : true;
  const stepErrors = step === 0 && touched ? validateConfigurationStep(data).errors : {};

  const goNext = () => {
    if (step === 0 && !stepValid) { setTouched(true); return; }
    if (step < 2) setStep((s) => (s + 1) as EpiWizardStep);
  };
  const goBack = () => { if (step > 0) setStep((s) => (s - 1) as EpiWizardStep); };

  const submit = async (): Promise<boolean> => {
    if (!validateConfigurationStep(data).valid) { setStep(0); setTouched(true); return false; }
    setSaving(true);
    setSaveError(null);
    try {
      const auditoriaId = editing && !editing.isLegacy ? editing.auditoriaId : crypto.randomUUID();
      const tituloFmt = `Auditoria de EPI — ${formatDateBR(data.dataAuditoria)}`;
      const currentIds = new Set(auditaveis.map((f) => f.id));

      const detailRows: EpiInsertRow[] = auditaveis.map((f) => {
        const conforme = inspection.draft[f.id] ?? true;
        return {
          funcionario_id: f.id,
          tipo_epi: EPI_AUDIT_TIPO,
          data_entrega: data.dataAuditoria,
          status: conforme ? 'conforme' : 'nao_conforme',
          descricao: tituloFmt,
          observacoes: JSON.stringify({ auditoria_id: auditoriaId }),
        };
      });
      const naoConformesCount = detailRows.filter((r) => r.status === 'nao_conforme').length;
      const summaryRow: EpiInsertRow = {
        funcionario_id: null,
        tipo_epi: EPI_AUDIT_TIPO,
        data_entrega: data.dataAuditoria,
        status: naoConformesCount === 0 ? 'conforme' : 'nao_conforme',
        descricao: tituloFmt,
        observacoes: JSON.stringify({ auditoria_id: auditoriaId, resumo: true }),
      };

      // Não sobrescreve funcionários não exibidos: só apaga as linhas antigas de
      // quem SEGUE elegível hoje (será substituído por uma linha nova abaixo);
      // registros de funcionários desligados/removidos ficam intactos.
      const deleteIds: string[] = [];
      if (editing) {
        if (editing.summaryRecordId) deleteIds.push(editing.summaryRecordId);
        editing.membros.forEach((m) => {
          if (m.recordId && m.funcionarioId && currentIds.has(m.funcionarioId)) deleteIds.push(m.recordId);
        });
      }

      const ok = await saveAuditoria([...detailRows, summaryRow], deleteIds);
      if (!ok) { setSaveError('Não foi possível salvar a auditoria de EPI.'); return false; }
      onSaved?.();
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
    auditaveis, inspection,
  };
}

export type UseEpiAuditReturn = ReturnType<typeof useEpiAudit>;
