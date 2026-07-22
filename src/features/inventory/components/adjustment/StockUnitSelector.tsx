import { Info } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/app/StatusBadge';
import { formatNumberBR } from '@/lib/formatters';
import { minimoEfetivo, statusEstoque, STOCK_STATUS_LABEL } from '../../domain/stockStatus';
import type { FardamentoRow, UnidadeRow } from '../../types/db.types';
import type { StockStatus } from '../../types/inventory.types';

const VAR: Record<StockStatus, 'success' | 'warning' | 'danger'> = { NORMAL: 'success', ALERTA: 'warning', SEM_ESTOQUE: 'danger' };

interface Props { fardamento: FardamentoRow | null; unidades: UnidadeRow[]; value: string; onChange: (id: string) => void; unidadeUnica: boolean; disabled?: boolean }

function dadosUnidade(f: FardamentoRow | null, unidadeId: string) {
  const s = f?.saldos.find((x) => x.unidadeId === unidadeId);
  const qtd = s?.quantidade ?? 0;
  const min = s ? s.minimoEfetivo : minimoEfetivo(null, f?.variante.estoque_minimo_padrao ?? null);
  return { qtd, min, status: statusEstoque(qtd, min) };
}

export function StockUnitSelector({ fardamento, unidades, value, onChange, unidadeUnica, disabled }: Props) {
  if (unidadeUnica && unidades[0]) {
    const d = dadosUnidade(fardamento, unidades[0].id);
    return (
      <div className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div><div className="text-sm font-medium text-foreground">{unidades[0].nome}</div><div className="text-xs text-muted-foreground">Única unidade — selecionada automaticamente</div></div>
          {fardamento && <StatusBadge variant={VAR[d.status]}>Saldo {formatNumberBR(d.qtd)}</StatusBadge>}
        </div>
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="h-auto min-h-[3rem] py-2" aria-label="Selecionar unidade"><SelectValue placeholder="Selecione a unidade" /></SelectTrigger>
      <SelectContent>
        {unidades.map((u) => {
          const d = dadosUnidade(fardamento, u.id);
          return (
            <SelectItem key={u.id} value={u.id} className="py-2">
              <span className="flex flex-col">
                <span className="font-medium text-foreground">{u.nome}</span>
                {fardamento
                  ? <span className="text-xs text-muted-foreground">Saldo {formatNumberBR(d.qtd)} · mín. {formatNumberBR(d.min)} · {STOCK_STATUS_LABEL[d.status]}</span>
                  : <span className="text-xs text-muted-foreground">{u.codigo}</span>}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

export function UnitHint() {
  return <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Info className="h-3.5 w-3.5" /> O ajuste afeta somente a unidade selecionada.</p>;
}
