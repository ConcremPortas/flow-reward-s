import { useMemo } from 'react';
import { SectionCard } from '@/components/app/SectionCard';
import { DssRegistrationStepper } from '../DssRegistrationStepper';
import { buildLocationSummary } from '@/features/dss/domain/dssCalculations';
import type { DssPageProps } from './_shared';

export function DssRegistrationView({ data, registration, onCancelRegistration }: DssPageProps) {
  const setoresOptions = data.setores.map((s) => ({ id: s.id, nome: s.nome }));

  const locationSummary = useMemo(() => {
    if (!registration.data.localDssId) return null;
    return buildLocationSummary(data.dssRecords, data.funcionarios, registration.data.localDssId, new Date());
  }, [data.dssRecords, data.funcionarios, registration.data.localDssId]);

  return (
    <SectionCard
      title={registration.isEditing ? 'Editar DSS' : 'Registrar DSS'}
      description={registration.isEditing ? 'Alterando um DSS já salvo — os participantes atuais foram carregados.' : 'Registre a realização de um novo diálogo semanal de segurança'}
    >
      <DssRegistrationStepper
        registration={registration}
        locais={data.locaisDSS}
        setores={setoresOptions}
        locationSummary={locationSummary}
        onCancel={onCancelRegistration}
      />
    </SectionCard>
  );
}
