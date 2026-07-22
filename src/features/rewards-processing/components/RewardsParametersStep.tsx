import { ChevronDown, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CompetenciaPicker } from '@/components/dashboard/CompetenciaPicker';
import { SectionCard } from '@/components/app/SectionCard';
import type { BasePremiacao } from '@/hooks/useBasePremiacao';
import type { Categoria } from '@/hooks/useCategorias';
import { RewardsParametersSummary, type ParametersSummaryData } from './RewardsParametersSummary';

interface Props {
  competencia: string;
  baseIds: string[];
  categoriaIds: string[];
  bases: BasePremiacao[];
  categorias: Categoria[];
  summary: ParametersSummaryData;
  onChange: (patch: { competencia?: string; baseIds?: string[]; categoriaIds?: string[] }) => void;
  onNext: () => void;
  canNext: boolean;
}

/** Etapa 1 — parâmetros (competência, base, categoria) + resumo dinâmico (12 col). */
export function RewardsParametersStep({ competencia, baseIds, categoriaIds, bases, categorias, summary, onChange, onNext, canNext }: Props) {
  const toggleBase = (id: string) => onChange({ baseIds: baseIds.includes(id) ? baseIds.filter(x => x !== id) : [...baseIds, id] });
  const toggleCategoria = (id: string) => onChange({ categoriaIds: categoriaIds.includes(id) ? categoriaIds.filter(x => x !== id) : [...categoriaIds, id] });

  const basesLabel = baseIds.length === 0 ? 'Selecione bases...' : baseIds.length === 1 ? bases.find(b => b.id === baseIds[0])?.nome ?? '1 base' : `${baseIds.length} bases selecionadas`;
  const categoriasLabel = categoriaIds.length === 0 ? 'Todas as categorias' : categoriaIds.length === 1 ? categorias.find(c => c.id === categoriaIds[0])?.nome ?? '1 categoria' : `${categoriaIds.length} categorias`;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div className="lg:col-span-8">
        <SectionCard title="Parâmetros do processamento" description="Defina a competência, a base e as categorias. Nada é calculado ou salvo nesta etapa.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Competência *</Label>
              <CompetenciaPicker value={competencia} onChange={(v) => onChange({ competencia: v })} className="w-full" />
            </div>

            <div className="space-y-2">
              <Label>Base de premiação *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal">
                    <span className="truncate">{basesLabel}</span><ChevronDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-2" align="start">
                  <div className="max-h-60 space-y-1 overflow-y-auto">
                    {bases.map(b => (
                      <div key={b.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted" onClick={() => toggleBase(b.id)}>
                        <Checkbox checked={baseIds.includes(b.id)} onCheckedChange={() => toggleBase(b.id)} />
                        <span className="text-sm">{b.nome}</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Categoria</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal">
                    <span className="truncate">{categoriasLabel}</span><ChevronDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2" align="start">
                  <div className="space-y-1">
                    <div className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted" onClick={() => onChange({ categoriaIds: [] })}>
                      <Checkbox checked={categoriaIds.length === 0} onCheckedChange={() => onChange({ categoriaIds: [] })} />
                      <span className="text-sm">Todas</span>
                    </div>
                    {categorias.map(c => (
                      <div key={c.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted" onClick={() => toggleCategoria(c.id)}>
                        <Checkbox checked={categoriaIds.includes(c.id)} onCheckedChange={() => toggleCategoria(c.id)} />
                        <span className="text-sm">{c.nome}</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <Button className="gap-1.5" onClick={onNext} disabled={!canNext}>Validar processamento <ArrowRight className="h-4 w-4" /></Button>
          </div>
        </SectionCard>
      </div>

      <div className="lg:col-span-4">
        <RewardsParametersSummary data={summary} />
      </div>
    </div>
  );
}
