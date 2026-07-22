import { useState } from 'react';
import { ChevronsUpDown, Check, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { StatusBadge } from '@/components/app/StatusBadge';
import { cn } from '@/lib/utils';
import { formatNumberBR } from '@/lib/formatters';
import type { FardamentoRow } from '../../types/db.types';

interface Props {
  fardamentos: FardamentoRow[]; value: string; onChange: (id: string) => void; disabled?: boolean;
  placeholder?: string;
  /** Se fornecido, exibe o saldo daquele contexto (ex.: na unidade) em vez do saldo total. */
  saldoDe?: (f: FardamentoRow) => number;
  /** Ids a ocultar (ex.: itens já adicionados). */
  ocultarIds?: Set<string>;
}

export function StockItemSelector({ fardamentos, value, onChange, disabled, placeholder, saldoDe, ocultarIds }: Props) {
  const [open, setOpen] = useState(false);
  const lista = ocultarIds ? fardamentos.filter((f) => !ocultarIds.has(f.variante.id)) : fardamentos;
  const sel = fardamentos.find((f) => f.variante.id === value) ?? null;
  const saldo = (f: FardamentoRow) => (saldoDe ? saldoDe(f) : f.saldoTotal);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} aria-label="Selecionar item" disabled={disabled}
          className="h-auto min-h-[3rem] w-full justify-between px-3 py-2 text-left font-normal">
          {sel ? (
            <span className="min-w-0">
              <span className="block truncate font-medium text-foreground">{sel.variante.nome}</span>
              <span className="block truncate text-xs text-muted-foreground">{sel.variante.codigo_interno} · saldo {formatNumberBR(saldo(sel))}</span>
            </span>
          ) : <span className="flex items-center gap-2 text-muted-foreground"><Package className="h-4 w-4" /> {placeholder ?? 'Buscar item por nome, código, categoria...'}</span>}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command filter={(v, s) => (v.includes(s.toLowerCase()) ? 1 : 0)}>
          <CommandInput placeholder="Buscar item..." />
          <CommandList>
            <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
            <CommandGroup>
              {lista.map((f) => {
                const busca = [f.variante.nome, f.variante.codigo_interno, f.variante.codigo_barras, f.categoriaNome, f.modeloNome, f.tamanhoRotulo].filter(Boolean).join(' ').toLowerCase();
                const q = saldo(f);
                return (
                  <CommandItem key={f.variante.id} value={busca} onSelect={() => { onChange(f.variante.id); setOpen(false); }} className="flex items-start gap-2">
                    <Check className={cn('mt-0.5 h-4 w-4 shrink-0', value === f.variante.id ? 'opacity-100 text-primary' : 'opacity-0')} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5"><span className="truncate font-medium text-foreground">{f.variante.nome}</span></span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {f.variante.codigo_interno}{f.categoriaNome ? ` · ${f.categoriaNome}` : ''}{f.modeloNome ? ` · ${f.modeloNome}` : ''}{f.tamanhoRotulo ? ` · ${f.tamanhoRotulo}` : ''}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <StatusBadge variant={q > 0 ? 'success' : 'neutral'}>{formatNumberBR(q)}</StatusBadge>
                      <span className="mt-0.5 block text-[10px] text-muted-foreground">{saldoDe ? 'na unidade' : 'saldo total'}</span>
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
