import { useState } from 'react';
import { Eraser, Scale, Copy, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CRITERIOS, type WeightKey } from '../domain/rewardFormulaDefinitions';
import type { WeightMap } from '../domain/rewardFormulaWeights';
import type { WeightValidation } from '../domain/rewardFormulaValidation';
import { RewardFormulaWeightField } from './RewardFormulaWeightField';
import { RewardFormulaWeightSummary } from './RewardFormulaWeightSummary';
import type { RewardFormulaRow } from '../types/reward-formula.types';

interface Props {
  weights: WeightMap;
  validation: WeightValidation;
  onSetWeight: (key: WeightKey, value: number) => void;
  onZerar: () => void;
  onDistribuir: (keys: WeightKey[]) => void;
  onCopiarDe: (w: WeightMap) => void;
  copyableFormulas: RewardFormulaRow[];
}

export function RewardFormulaWeightsStep({ weights, validation, onSetWeight, onZerar, onDistribuir, onCopiarDe, copyableFormulas }: Props) {
  const [somenteAtivos, setSomenteAtivos] = useState(false);
  const visiveis = somenteAtivos ? CRITERIOS.filter(c => (weights[c.key] || 0) > 0) : CRITERIOS;

  const distribuirAtivos = () => {
    const ativos = CRITERIOS.filter(c => (weights[c.key] || 0) > 0).map(c => c.key);
    onDistribuir(ativos.length > 0 ? ativos : CRITERIOS.map(c => c.key));
  };

  return (
    <div className="space-y-3">
      <RewardFormulaWeightSummary weights={weights} validation={validation} />

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={distribuirAtivos}><Scale className="h-3.5 w-3.5" /> Distribuir igualmente</Button>
        <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={onZerar}><Eraser className="h-3.5 w-3.5" /> Zerar todos</Button>
        <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => setSomenteAtivos(v => !v)}><Filter className="h-3.5 w-3.5" /> {somenteAtivos ? 'Mostrar todos' : 'Só ativos'}</Button>
        {copyableFormulas.length > 0 && (
          <div className="ml-auto flex items-center gap-1.5">
            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            <Select value="" onValueChange={(id) => { const f = copyableFormulas.find(x => x.id === id); if (f) onCopiarDe(f.weights); }}>
              <SelectTrigger className="h-7 w-[200px] text-xs"><SelectValue placeholder="Copiar pesos de..." /></SelectTrigger>
              <SelectContent>{copyableFormulas.map(f => <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {visiveis.map(c => (
          <RewardFormulaWeightField key={c.key} weightKey={c.key} label={c.label} value={weights[c.key] || 0} onChange={onSetWeight} />
        ))}
      </div>
      {somenteAtivos && visiveis.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">Nenhum critério com peso. Mostre todos para configurar.</p>}
    </div>
  );
}
