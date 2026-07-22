import { Award } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatNumberBR, pluralizeBR } from '@/lib/formatters';
import { CategoryUsage } from './CategoryUsage';
import { CategoryActionsMenu } from './CategoryActionsMenu';
import type { CategoryRow } from '../types/category.types';

export interface CategoryRowHandlers {
  onOpen: (r: CategoryRow) => void;
  onEdit: (r: CategoryRow) => void;
  onVerFuncionarios: (r: CategoryRow) => void;
  onVerPremiacao: (r: CategoryRow) => void;
  onDelete: (r: CategoryRow) => void;
}

function CategoriaCell({ row }: { row: CategoryRow }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-foreground">{row.nome}</span>
      {row.usage.premiavelPorNome && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary"><Award className="h-3 w-3" /> Premiável</span>
          </TooltipTrigger>
          <TooltipContent className="max-w-[260px]">O nome desta categoria é usado em regras de elegibilidade da premiação.</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

export function CategoriesTable({ rows, handlers }: { rows: CategoryRow[]; handlers: CategoryRowHandlers }) {
  const menu = (r: CategoryRow) => (
    <CategoryActionsMenu
      categoriaNome={r.nome}
      temPremiacao={r.usage.usadaEmPremiacao}
      onDetails={() => handlers.onOpen(r)}
      onEdit={() => handlers.onEdit(r)}
      onVerFuncionarios={() => handlers.onVerFuncionarios(r)}
      onVerPremiacao={() => handlers.onVerPremiacao(r)}
      onDelete={() => handlers.onDelete(r)}
    />
  );
  const funcLabel = (r: CategoryRow) => r.usage.funcionarios > 0 ? pluralizeBR(r.usage.funcionarios, 'funcionário', 'funcionários') : 'Nenhum funcionário';

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border border-border/70 md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Funcionários</TableHead>
              <TableHead className="text-right">Faixas</TableHead>
              <TableHead>Utilização</TableHead>
              <TableHead className="w-10 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">Nenhuma categoria encontrada para os filtros selecionados.</TableCell></TableRow>
            ) : rows.map(r => (
              <TableRow key={r.id} className="cursor-pointer hover:bg-muted/40" onClick={() => handlers.onOpen(r)}>
                <TableCell><CategoriaCell row={r} /></TableCell>
                <TableCell className="text-right text-sm tabular-nums">{r.usage.funcionarios > 0 ? formatNumberBR(r.usage.funcionarios) : <span className="text-muted-foreground">0</span>}</TableCell>
                <TableCell className="text-right text-sm tabular-nums text-muted-foreground">{formatNumberBR(r.usage.faixas)}</TableCell>
                <TableCell><CategoryUsage utilizacao={r.utilizacao} /></TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>{menu(r)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile — cards */}
      <div className="space-y-2.5 md:hidden">
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma categoria encontrada.</p>
        ) : rows.map(r => (
          <div key={r.id} className="rounded-xl border border-border/70 bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <button type="button" onClick={() => handlers.onOpen(r)} className="min-w-0 text-left"><CategoriaCell row={r} /></button>
              <div onClick={(e) => e.stopPropagation()}>{menu(r)}</div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{funcLabel(r)}</span>
              <CategoryUsage utilizacao={r.utilizacao} />
            </div>
            {r.usage.faixas > 0 && <p className="mt-1 text-xs text-muted-foreground">{pluralizeBR(r.usage.faixas, 'faixa relacionada', 'faixas relacionadas')}</p>}
          </div>
        ))}
      </div>
    </>
  );
}
