import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { SectionCard } from '@/components/app/SectionCard';
import { EpiAuditSummary } from './EpiAuditSummary';
import type { EpiAuditFormData } from '@/features/epi/types/epi.types';
import type { StepValidation } from '@/features/epi/domain/epiValidation';
import type { EpiAuditGroupEnriched } from '@/features/epi/domain/epiCalculations';

interface Props {
  data: EpiAuditFormData;
  errors: StepValidation['errors'];
  onChange: (p: Partial<EpiAuditFormData>) => void;
  ativosCount: number;
  setoresCount: number;
  ultimaAuditoria: EpiAuditGroupEnriched | null;
}

/** Etapa 1 — Configuração. Grid 12 colunas: formulário (8) + resumo (4). */
export function EpiAuditConfiguration({ data, errors, onChange, ativosCount, setoresCount, ultimaAuditoria }: Props) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <SectionCard title="Configuração da Auditoria" className="xl:col-span-8">
        <div className="max-w-xs space-y-1.5">
          <Label htmlFor="epi-data">Data da Auditoria *</Label>
          <Input id="epi-data" type="date" value={data.dataAuditoria} onChange={(e) => onChange({ dataAuditoria: e.target.value })} />
          {errors.dataAuditoria && <p className="text-xs text-destructive">{errors.dataAuditoria}</p>}
        </div>
      </SectionCard>

      <div className="xl:col-span-4">
        <EpiAuditSummary ativosCount={ativosCount} setoresCount={setoresCount} ultimaAuditoria={ultimaAuditoria} />
      </div>
    </div>
  );
}
