import { useMemo, useState } from 'react';
import { Calculator } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { competenciaLabelLong } from '@/features/dashboard/utils/dates';
import { KitsBonusBreakdown } from './KitsBonusBreakdown';
import { KitsConfigStatus } from './KitsConfigStatus';
import { KitsConfigEmptyState } from './KitsConfigEmptyState';
import type { KitsConfigRow } from '../types/kits-config.types';

interface Props { rows: KitsConfigRow[]; initialConfigId?: string | null }

/** Simulador independente — usa a função real do domínio (via breakdown). */
export function KitsBonusSimulator({ rows, initialConfigId }: Props) {
  const [configId, setConfigId] = useState<string>(initialConfigId ?? rows.find(r => r.state.state === 'atual')?.id ?? rows[0]?.id ?? '');
  const [kitsInput, setKitsInput] = useState('12000');

  const config = useMemo(() => rows.find(r => r.id === configId) ?? null, [rows, configId]);
  const kits = useMemo(() => { const n = Number(kitsInput.replace(/\./g, '').replace(',', '.')); return Number.isFinite(n) && n >= 0 ? n : 0; }, [kitsInput]);

  if (rows.length === 0) {
    return <KitsConfigEmptyState icon={Calculator} title="Sem configurações" description="Cadastre uma configuração para simular o bônus por kits." />;
  }

  return (
    <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-2">
      <SectionCard title="Simulador" description="Escolha a regra e informe a quantidade de kits.">
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Configuração</Label>
            <Select value={configId} onValueChange={setConfigId}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {rows.map(r => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.sentinela ? 'Regra inicial' : competenciaLabelLong(r.vigenciaInicio)} · {r.state.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sim-kits">Quantidade de kits</Label>
            <Input id="sim-kits" inputMode="numeric" value={kitsInput} onChange={(e) => setKitsInput(e.target.value.replace(/[^\d.,]/g, ''))} placeholder="Ex: 12000" className="tabular-nums" />
          </div>
          {config && (
            <div className="rounded-lg border border-border/70 bg-muted/20 p-2 text-xs text-muted-foreground">
              Regra: mínimo {config.minimoKits.toLocaleString('pt-BR')} · incremento {config.incrementoFaixa.toLocaleString('pt-BR')} · base {config.bonusBase.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} · faixa {config.bonusPorFaixa.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Detalhamento" description="Cálculo pelo motor de premiação.">
        {config ? (
          <>
            <div className="mb-2"><KitsConfigStatus state={config.state} /></div>
            <KitsBonusBreakdown kits={kits} config={{ minimoKits: config.minimoKits, incrementoFaixa: config.incrementoFaixa, bonusBase: config.bonusBase, bonusPorFaixa: config.bonusPorFaixa, maxFaixas: config.maxFaixas }} />
          </>
        ) : <p className="text-sm text-muted-foreground">Selecione uma configuração.</p>}
      </SectionCard>
    </div>
  );
}
