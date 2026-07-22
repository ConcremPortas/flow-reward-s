import { Search, X, ListFilter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { SITUACOES, SITUACAO_LABEL, type Situacao } from './situacao';
import { contarFiltrosAtivos, type Filtros } from './filtros';
import type { OpcaoFiltro } from '../../hooks/useInventoryScreen';

const ALL = '__all__';

interface Props {
  filtros: Filtros;
  buscaRaw: string;
  opcoes: { categorias: OpcaoFiltro[]; modelos: OpcaoFiltro[]; tamanhos: OpcaoFiltro[]; unidades: OpcaoFiltro[] };
  resultado: number;
  total: number;
  onSetBusca: (v: string) => void;
  onSetFiltro: <K extends keyof Filtros>(key: K, value: Filtros[K]) => void;
  onLimpar: () => void;
}

export function FardamentosFilters({ filtros, buscaRaw, opcoes, resultado, total, onSetBusca, onSetFiltro, onLimpar }: Props) {
  const ativos = contarFiltrosAtivos(filtros);
  const temFiltro = ativos > 0 || filtros.busca.trim() !== '';

  const unidadeNome = opcoes.unidades.find((u) => u.id === filtros.unidadeId)?.nome ?? '';
  const chips: { rot: string; onRemove: () => void }[] = [];
  if (filtros.situacao) chips.push({ rot: `Situação: ${SITUACAO_LABEL[filtros.situacao]}`, onRemove: () => onSetFiltro('situacao', '') });
  if (filtros.categoria) chips.push({ rot: `Categoria: ${filtros.categoria}`, onRemove: () => onSetFiltro('categoria', '') });
  if (filtros.modelo) chips.push({ rot: `Modelo: ${filtros.modelo}`, onRemove: () => onSetFiltro('modelo', '') });
  if (filtros.tamanho) chips.push({ rot: `Tamanho: ${filtros.tamanho}`, onRemove: () => onSetFiltro('tamanho', '') });
  if (filtros.unidadeId) chips.push({ rot: `Local: ${unidadeNome}`, onRemove: () => onSetFiltro('unidadeId', '') });
  if (filtros.incluirInativos) chips.push({ rot: 'Incluindo inativos', onRemove: () => onSetFiltro('incluirInativos', false) });

  const controles = (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <SelectFiltro label="Situação" value={filtros.situacao || ALL} onChange={(v) => onSetFiltro('situacao', (v === ALL ? '' : v) as Situacao | '')}
        options={SITUACOES.map((s) => ({ id: s, nome: SITUACAO_LABEL[s] }))} placeholder="Todas" />
      <SelectFiltro label="Categoria" value={filtros.categoria || ALL} onChange={(v) => onSetFiltro('categoria', v === ALL ? '' : v)} options={opcoes.categorias} placeholder="Todas" />
      <SelectFiltro label="Modelo" value={filtros.modelo || ALL} onChange={(v) => onSetFiltro('modelo', v === ALL ? '' : v)} options={opcoes.modelos} placeholder="Todos" />
      <SelectFiltro label="Tamanho" value={filtros.tamanho || ALL} onChange={(v) => onSetFiltro('tamanho', v === ALL ? '' : v)} options={opcoes.tamanhos} placeholder="Todos" />
      <SelectFiltro label="Local de estoque" value={filtros.unidadeId || ALL} onChange={(v) => onSetFiltro('unidadeId', v === ALL ? '' : v)} options={opcoes.unidades} placeholder="Todos" />
      <label className="flex h-9 cursor-pointer items-center gap-2 text-sm text-foreground">
        <Checkbox checked={filtros.incluirInativos} onCheckedChange={(v) => onSetFiltro('incluirInativos', Boolean(v))} /> Incluir inativos
      </label>
    </div>
  );

  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-card p-3.5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={buscaRaw} onChange={(e) => onSetBusca(e.target.value)} placeholder="Buscar por item, código, categoria, modelo ou tamanho..." className="pl-9" aria-label="Buscar fardamentos" />
        </div>

        {/* Filtros avançados no mobile → Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="shrink-0 gap-2 md:hidden" aria-label="Abrir filtros">
              <ListFilter className="h-4 w-4" /> Filtros{ativos > 0 && <Badge variant="secondary" className="ml-1">{ativos}</Badge>}
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[88vw] max-w-sm">
            <SheetHeader><SheetTitle>Filtros</SheetTitle></SheetHeader>
            <div className="mt-4">{controles}</div>
            {temFiltro && <Button variant="ghost" className="mt-4 gap-1.5" onClick={onLimpar}><X className="h-4 w-4" /> Limpar filtros</Button>}
          </SheetContent>
        </Sheet>

        {temFiltro && (
          <Button variant="ghost" className="hidden shrink-0 gap-1.5 md:inline-flex" onClick={onLimpar}><X className="h-4 w-4" /> Limpar</Button>
        )}
      </div>

      {/* Inline no desktop */}
      <div className="hidden md:block">{controles}</div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-xs text-muted-foreground">{resultado} de {total} {total === 1 ? 'item' : 'itens'}</span>
        {chips.map((c, i) => (
          <button key={i} type="button" onClick={c.onRemove}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-xs text-foreground hover:bg-muted"
            aria-label={`Remover filtro ${c.rot}`}>
            {c.rot} <X className="h-3 w-3" />
          </button>
        ))}
      </div>
    </div>
  );
}

function SelectFiltro({ label, value, onChange, options, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; options: OpcaoFiltro[]; placeholder: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 w-full sm:w-44"><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>{placeholder}</SelectItem>
          {options.map((o) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
