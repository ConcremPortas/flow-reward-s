import { useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/app/StatusBadge';
import { formatNumberBR } from '@/lib/formatters';
import type { FardamentoRow, UnidadeRow } from '../../types/db.types';

interface Props { fardamentos: FardamentoRow[]; unidades: UnidadeRow[]; value: string; onChange: (id: string) => void; unidadeUnica: boolean; disabled?: boolean }

function resumoUnidades(fardamentos: FardamentoRow[]) {
  const m = new Map<string, { itens: number; saldo: number }>();
  for (const f of fardamentos) for (const s of f.saldos) {
    const r = m.get(s.unidadeId) ?? { itens: 0, saldo: 0 };
    if (s.quantidade > 0) r.itens += 1; r.saldo += s.quantidade; m.set(s.unidadeId, r);
  }
  return m;
}

export function StockLocationSelector({ fardamentos, unidades, value, onChange, unidadeUnica, disabled }: Props) {
  const resumo = useMemo(() => resumoUnidades(fardamentos), [fardamentos]);

  if (unidadeUnica && unidades[0]) {
    const r = resumo.get(unidades[0].id) ?? { itens: 0, saldo: 0 };
    return (
      <div className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div><div className="text-sm font-medium text-foreground">{unidades[0].nome}</div><div className="text-xs text-muted-foreground">Única unidade — selecionada automaticamente</div></div>
          <StatusBadge variant="neutral">{formatNumberBR(r.saldo)} pç · {formatNumberBR(r.itens)} itens</StatusBadge>
        </div>
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="h-auto min-h-[3rem] py-2" aria-label="Selecionar unidade de estoque"><SelectValue placeholder="Selecione a unidade de estoque" /></SelectTrigger>
      <SelectContent>
        {unidades.map((u) => {
          const r = resumo.get(u.id) ?? { itens: 0, saldo: 0 };
          return (
            <SelectItem key={u.id} value={u.id} className="py-2">
              <span className="flex flex-col"><span className="font-medium text-foreground">{u.nome}</span>
                <span className="text-xs text-muted-foreground">{u.codigo} · {formatNumberBR(r.itens)} itens · saldo {formatNumberBR(r.saldo)}</span></span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
