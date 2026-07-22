import { useState } from 'react';
import { ChevronsUpDown, Check, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { StatusBadge } from '@/components/app/StatusBadge';
import { cn } from '@/lib/utils';
import { maskCpf } from './cpf';
import type { Funcionario } from '@/hooks/useFuncionarios';

interface Props { funcionarios: Funcionario[]; value: string; onChange: (id: string) => void; disabled?: boolean; loading?: boolean }

export function EmployeeSearch({ funcionarios, value, onChange, disabled, loading }: Props) {
  const [open, setOpen] = useState(false);
  const sel = funcionarios.find((f) => f.id === value) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} aria-label="Selecionar colaborador" disabled={disabled || loading}
          className="h-auto min-h-[3rem] w-full justify-between px-3 py-2 text-left font-normal">
          {sel ? (
            <span className="min-w-0"><span className="block truncate font-medium text-foreground">{sel.nome}</span>
              <span className="block truncate text-xs text-muted-foreground">{[sel.funcao?.nome, sel.setor?.nome, sel.empresa?.nome].filter(Boolean).join(' · ') || maskCpf(sel.cpf)}</span></span>
          ) : <span className="flex items-center gap-2 text-muted-foreground"><User className="h-4 w-4" /> {loading ? 'Carregando colaboradores...' : 'Buscar colaborador por nome, CPF, cargo, setor...'}</span>}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command filter={(v, s) => (v.includes(s.toLowerCase()) ? 1 : 0)}>
          <CommandInput placeholder="Buscar colaborador..." />
          <CommandList>
            <CommandEmpty>Nenhum colaborador elegível encontrado.</CommandEmpty>
            <CommandGroup>
              {funcionarios.map((f) => {
                const busca = [f.nome, f.cpf, f.funcao?.nome, f.setor?.nome, f.empresa?.nome].filter(Boolean).join(' ').toLowerCase();
                return (
                  <CommandItem key={f.id} value={busca} onSelect={() => { onChange(f.id); setOpen(false); }} className="flex items-start gap-2">
                    <Check className={cn('mt-0.5 h-4 w-4 shrink-0', value === f.id ? 'opacity-100 text-primary' : 'opacity-0')} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-foreground">{f.nome}</span>
                      <span className="block truncate text-xs text-muted-foreground">{[f.funcao?.nome, f.setor?.nome].filter(Boolean).join(' · ') || maskCpf(f.cpf)}</span>
                    </span>
                    <span className="shrink-0 text-right"><span className="block text-[11px] text-muted-foreground">{f.empresa?.nome ?? '—'}</span><StatusBadge variant="success">Ativo</StatusBadge></span>
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
