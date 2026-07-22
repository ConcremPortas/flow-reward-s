import { useMemo } from 'react';
import { SectionCard } from '@/components/app/SectionCard';
import { EpiAuditStepper } from '../EpiAuditStepper';
import type { EpiPageProps } from './_shared';

export function EpiNewAuditView({ data, audit, onCancelAudit }: EpiPageProps) {
  const empresasOptions = data.empresas.map((e) => ({ id: e.id, nome: e.nome }));
  const setoresOptions = data.setores.map((s) => ({ id: s.id, nome: s.nome }));

  const setoresCount = useMemo(
    () => new Set(audit.auditaveis.map((f) => f.setor_id).filter(Boolean)).size,
    [audit.auditaveis],
  );
  const ultimaAuditoria = data.auditGroups[0] ?? null;

  return (
    <SectionCard
      title={audit.isEditing ? 'Editar Auditoria de EPI' : 'Nova Auditoria de EPI'}
      description={audit.isEditing ? 'Alterando uma auditoria já salva — as situações atuais foram carregadas.' : 'Registre uma nova auditoria de conformidade de EPI'}
    >
      <EpiAuditStepper
        audit={audit}
        empresas={empresasOptions}
        setores={setoresOptions}
        setoresCount={setoresCount}
        ultimaAuditoria={ultimaAuditoria}
        onCancel={onCancelAudit}
      />
    </SectionCard>
  );
}
