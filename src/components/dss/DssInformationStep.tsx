import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SectionCard } from '@/components/app/SectionCard';
import { DssLocationSummary } from './DssLocationSummary';
import type { LocalDSS } from '@/hooks/useLocaisDSS';
import type { DssFormData } from '@/features/dss/types';
import type { StepValidation } from '@/features/dss/domain/dssValidation';
import type { LocationSummary } from '@/features/dss/types';

interface Props {
  data: DssFormData;
  errors: StepValidation['errors'];
  onChange: (p: Partial<DssFormData>) => void;
  locais: LocalDSS[];
  locationSummary: LocationSummary | null;
}

/** Etapa 1 — Informações. Grid 12 colunas: formulário (8) + resumo do local (4). */
export function DssInformationStep({ data, errors, onChange, locais, locationSummary }: Props) {
  const localNome = locais.find((l) => l.id === data.localDssId)?.nome;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
      <SectionCard title="Informações do DSS" className="xl:col-span-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Local do DSS *</Label>
            <Select value={data.localDssId} onValueChange={(v) => onChange({ localDssId: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione o local" /></SelectTrigger>
              <SelectContent>
                {locais.map((l) => <SelectItem key={l.id} value={l.id}>{l.nome}</SelectItem>)}
              </SelectContent>
            </Select>
            {errors.localDssId && <p className="text-xs text-destructive">{errors.localDssId}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dss-data">Data de Realização *</Label>
            <Input id="dss-data" type="date" value={data.dataRealizacao} onChange={(e) => onChange({ dataRealizacao: e.target.value })} />
            {errors.dataRealizacao && <p className="text-xs text-destructive">{errors.dataRealizacao}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dss-tema">Tema do DSS *</Label>
            <Input id="dss-tema" placeholder="Ex: Uso correto de EPIs" value={data.tema} onChange={(e) => onChange({ tema: e.target.value })} />
            {errors.tema && <p className="text-xs text-destructive">{errors.tema}</p>}
          </div>
        </div>
      </SectionCard>

      <div className="xl:col-span-4">
        <DssLocationSummary localSelecionado={!!data.localDssId} localNome={localNome} summary={locationSummary} />
      </div>
    </div>
  );
}
