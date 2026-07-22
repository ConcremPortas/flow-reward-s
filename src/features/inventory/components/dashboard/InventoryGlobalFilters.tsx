import { X, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatDateTimeBR } from '@/lib/dateTime';
import { SITUACOES, SITUACAO_LABEL, type Situacao } from '../fardamentos/situacao';
import { PERIODO_LABEL, GRUPO_LABEL, type Periodo, type GrupoMov, type DashFiltros } from './derive';
import type { OpcaoFiltro } from '../../hooks/useInventoryScreen';

const ALL = '__all__';
const PERIODOS: Periodo[] = ['hoje', '7d', '30d', 'mes', 'mes_anterior'];
const GRUPOS: GrupoMov[] = ['ENTRADA', 'ENTREGA', 'DEVOLUCAO', 'AJUSTE', 'ESTORNO'];

interface Props {
  filtros: DashFiltros;
  opcoes: { categorias: OpcaoFiltro[]; unidades: OpcaoFiltro[] };
  atualizadoEm: Date;
  itens: number;
  onSetFiltro: <K extends keyof DashFiltros>(k: K, v: DashFiltros[K]) => void;
  onLimpar: () => void;
  onAtualizar: () => void;
}

export function InventoryGlobalFilters({ filtros, opcoes, atualizadoEm, itens, onSetFiltro, onLimpar, onAtualizar }: Props) {
  const unidadeNome = opcoes.unidades.find((u) => u.id === filtros.unidadeId)?.nome ?? '';
  const chips: { rot: string; onRemove: () => void }[] = [];
  if (filtros.unidadeId) chips.push({ rot: `Local: ${unidadeNome}`, onRemove: () => onSetFiltro('unidadeId', '') });
  if (filtros.categoria) chips.push({ rot: `Categoria: ${filtros.categoria}`, onRemove: () => onSetFiltro('categoria', '') });
  if (filtros.grupo) chips.push({ rot: `Movimentação: ${GRUPO_LABEL[filtros.grupo]}`, onRemove: () => onSetFiltro('grupo', '') });
  if (filtros.situacao) chips.push({ rot: `Situação: ${SITUACAO_LABEL[filtros.situacao]}`, onRemove: () => onSetFiltro('situacao', '') });
  const temFiltro = chips.length > 0 || filtros.periodo !== '30d';

  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-card p-3.5 shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
        {/* Períodos rápidos */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Período</Label>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Período de análise">
            {PERIODOS.map((p) => (
              <button key={p} type="button" onClick={() => onSetFiltro('periodo', p)}
                aria-pressed={filtros.periodo === p}
                className={cn('rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                  filtros.periodo === p ? 'bg-primary text-primary-foreground' : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground')}>
                {PERIODO_LABEL[p]}
              </button>
            ))}
          </div>
        </div>

        <SelectFiltro label="Local de estoque" value={filtros.unidadeId || ALL} onChange={(v) => onSetFiltro('unidadeId', v === ALL ? '' : v)} options={opcoes.unidades} placeholder="Todos" />
        <SelectFiltro label="Categoria" value={filtros.categoria || ALL} onChange={(v) => onSetFiltro('categoria', v === ALL ? '' : v)} options={opcoes.categorias} placeholder="Todas" />
        <SelectFiltro label="Movimentação" value={filtros.grupo || ALL} onChange={(v) => onSetFiltro('grupo', (v === ALL ? '' : v) as GrupoMov | '')} options={GRUPOS.map((g) => ({ id: g, nome: GRUPO_LABEL[g] }))} placeholder="Todas" />
        <SelectFiltro label="Situação" value={filtros.situacao || ALL} onChange={(v) => onSetFiltro('situacao', (v === ALL ? '' : v) as Situacao | '')} options={SITUACOES.map((s) => ({ id: s, nome: SITUACAO_LABEL[s] }))} placeholder="Todas" />

        <div className="ml-auto flex items-center gap-2">
          {temFiltro && <Button variant="ghost" size="sm" className="gap-1.5" onClick={onLimpar}><X className="h-4 w-4" /> Limpar</Button>}
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onAtualizar} aria-label="Atualizar dados"><RefreshCw className="h-4 w-4" /> Atualizar</Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <span className="mr-1">{itens} {itens === 1 ? 'item analisado' : 'itens analisados'}</span>
        {chips.map((c, i) => (
          <button key={i} type="button" onClick={c.onRemove} className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-foreground hover:bg-muted" aria-label={`Remover ${c.rot}`}>
            {c.rot} <X className="h-3 w-3" />
          </button>
        ))}
        <span className="ml-auto">Atualizado {formatDateTimeBR(atualizadoEm.toISOString())}</span>
      </div>
    </div>
  );
}

function SelectFiltro({ label, value, onChange, options, placeholder }: { label: string; value: string; onChange: (v: string) => void; options: OpcaoFiltro[]; placeholder: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 w-full lg:w-40"><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{placeholder}</SelectItem>
          {options.map((o) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
