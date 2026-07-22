import { Search, X, ListFilter, ArrowUpDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { SEV_LISTAVEIS, SEV_LABEL, type Severidade } from './severity';
import type { AlertFiltros, Ordenacao, Agrupamento } from '../../hooks/useInventoryAlerts';
import type { OpcaoFiltro } from '../../hooks/useInventoryScreen';

const ALL = '__all__';
const ORDENACOES: { k: Ordenacao; l: string }[] = [
  { k: 'urgencia', l: 'Maior urgência' }, { k: 'menor_saldo', l: 'Menor saldo' }, { k: 'maior_falta', l: 'Maior falta p/ mínimo' },
  { k: 'mais_antigo', l: 'Sem movimentação há mais tempo' }, { k: 'ultima_mov', l: 'Última movimentação' }, { k: 'nome', l: 'Nome' },
];
const AGRUPS: { k: Agrupamento; l: string }[] = [{ k: 'item', l: 'Por item' }, { k: 'unidade', l: 'Por unidade' }, { k: 'categoria', l: 'Por categoria' }];

interface Props {
  filtros: AlertFiltros; buscaRaw: string; ordenacao: Ordenacao; agrupamento: Agrupamento;
  opcoes: { categorias: OpcaoFiltro[]; modelos: OpcaoFiltro[]; tamanhos: OpcaoFiltro[]; unidades: OpcaoFiltro[] };
  resultado: number; total: number; ativos: number;
  onSetBusca: (v: string) => void;
  onSetFiltro: <K extends keyof AlertFiltros>(k: K, v: AlertFiltros[K]) => void;
  onSetOrdenacao: (o: Ordenacao) => void; onSetAgrupamento: (a: Agrupamento) => void; onLimpar: () => void;
}

export function InventoryAlertsFilters({ filtros, buscaRaw, ordenacao, agrupamento, opcoes, resultado, total, ativos, onSetBusca, onSetFiltro, onSetOrdenacao, onSetAgrupamento, onLimpar }: Props) {
  const unidadeNome = opcoes.unidades.find((u) => u.id === filtros.unidadeId)?.nome ?? '';
  const chips: { rot: string; onRemove: () => void }[] = [];
  if (filtros.severidade) chips.push({ rot: `Severidade: ${SEV_LABEL[filtros.severidade]}`, onRemove: () => onSetFiltro('severidade', '') });
  if (filtros.unidadeId) chips.push({ rot: `Local: ${unidadeNome}`, onRemove: () => onSetFiltro('unidadeId', '') });
  if (filtros.categoria) chips.push({ rot: `Categoria: ${filtros.categoria}`, onRemove: () => onSetFiltro('categoria', '') });
  if (filtros.modelo) chips.push({ rot: `Modelo: ${filtros.modelo}`, onRemove: () => onSetFiltro('modelo', '') });
  if (filtros.tamanho) chips.push({ rot: `Tamanho: ${filtros.tamanho}`, onRemove: () => onSetFiltro('tamanho', '') });
  if (filtros.incluirInativos) chips.push({ rot: 'Incluindo inativos', onRemove: () => onSetFiltro('incluirInativos', false) });
  const temFiltro = chips.length > 0 || filtros.busca.trim() !== '';

  const controles = (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
      <Sel label="Severidade" value={filtros.severidade || ALL} onChange={(v) => onSetFiltro('severidade', (v === ALL ? '' : v) as Severidade | '')} options={SEV_LISTAVEIS.map((s) => ({ id: s, nome: SEV_LABEL[s] }))} placeholder="Todas" />
      <Sel label="Local de estoque" value={filtros.unidadeId || ALL} onChange={(v) => onSetFiltro('unidadeId', v === ALL ? '' : v)} options={opcoes.unidades} placeholder="Todos" />
      <Sel label="Categoria" value={filtros.categoria || ALL} onChange={(v) => onSetFiltro('categoria', v === ALL ? '' : v)} options={opcoes.categorias} placeholder="Todas" />
      <Sel label="Modelo" value={filtros.modelo || ALL} onChange={(v) => onSetFiltro('modelo', v === ALL ? '' : v)} options={opcoes.modelos} placeholder="Todos" />
      <Sel label="Tamanho" value={filtros.tamanho || ALL} onChange={(v) => onSetFiltro('tamanho', v === ALL ? '' : v)} options={opcoes.tamanhos} placeholder="Todos" />
      <label className="flex h-9 cursor-pointer items-center gap-2 text-sm text-foreground">
        <Checkbox checked={filtros.incluirInativos} onCheckedChange={(v) => onSetFiltro('incluirInativos', Boolean(v))} /> Incluir inativos
      </label>
    </div>
  );

  return (
    <div className="space-y-3 rounded-xl border border-border/70 bg-card p-3.5 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={buscaRaw} onChange={(e) => onSetBusca(e.target.value)} placeholder="Buscar por item, código, categoria, modelo ou local..." className="pl-9" aria-label="Buscar alertas" />
        </div>

        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={ordenacao} onValueChange={(v) => onSetOrdenacao(v as Ordenacao)}>
            <SelectTrigger className="h-9 w-48" aria-label="Ordenar"><SelectValue /></SelectTrigger>
            <SelectContent>{ORDENACOES.map((o) => <SelectItem key={o.k} value={o.k}>{o.l}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="flex rounded-lg border border-border/70 p-0.5" role="group" aria-label="Agrupar">
          {AGRUPS.map((a) => (
            <button key={a.k} type="button" onClick={() => onSetAgrupamento(a.k)} aria-pressed={agrupamento === a.k}
              className={cn('rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors', agrupamento === a.k ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>{a.l}</button>
          ))}
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="shrink-0 gap-2 md:hidden" aria-label="Abrir filtros"><ListFilter className="h-4 w-4" /> Filtros{chips.length > 0 && <Badge variant="secondary" className="ml-1">{chips.length}</Badge>}</Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[88vw] max-w-sm">
            <SheetHeader><SheetTitle>Filtros</SheetTitle></SheetHeader>
            <div className="mt-4">{controles}</div>
            {temFiltro && <Button variant="ghost" className="mt-4 gap-1.5" onClick={onLimpar}><X className="h-4 w-4" /> Limpar filtros</Button>}
          </SheetContent>
        </Sheet>

        {temFiltro && <Button variant="ghost" className="hidden shrink-0 gap-1.5 md:inline-flex" onClick={onLimpar}><X className="h-4 w-4" /> Limpar</Button>}
      </div>

      <div className="hidden md:block">{controles}</div>

      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <span className="mr-1">{resultado} de {ativos} {ativos === 1 ? 'alerta' : 'alertas'} · {total} combinações</span>
        {chips.map((c, i) => (
          <button key={i} type="button" onClick={c.onRemove} className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2.5 py-0.5 text-foreground hover:bg-muted" aria-label={`Remover ${c.rot}`}>{c.rot} <X className="h-3 w-3" /></button>
        ))}
      </div>
    </div>
  );
}

function Sel({ label, value, onChange, options, placeholder }: { label: string; value: string; onChange: (v: string) => void; options: OpcaoFiltro[]; placeholder: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9 w-full sm:w-40"><SelectValue placeholder={placeholder} /></SelectTrigger>
        <SelectContent><SelectItem value={ALL}>{placeholder}</SelectItem>{options.map((o) => <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );
}
