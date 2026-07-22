import { AlertTriangle, Info } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatCurrencyBRL, pluralizeBR } from '@/lib/formatters';
import { BonusTierRegistrationStatus } from './BonusTierRegistrationStatus';
import { BonusTierActionsMenu } from './BonusTierActionsMenu';
import type { BonusTierRow } from '../types/bonus-tier.types';

export interface BonusTierRowHandlers {
  onOpen: (r: BonusTierRow) => void;
  onEdit: (r: BonusTierRow) => void;
  onVinculos: (r: BonusTierRow) => void;
  onDelete: (r: BonusTierRow) => void;
}

function FaixaCell({ row }: { row: BonusTierRow }) {
  const a = row.nameAnalysis;
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-foreground">{row.nome}</span>
      {a.state === 'divergente' && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center gap-1 rounded-full bg-status-warning/10 px-1.5 py-0.5 text-[11px] font-medium text-status-warning"><AlertTriangle className="h-3 w-3" /> Divergência</span>
          </TooltipTrigger>
          <TooltipContent className="max-w-[240px]">O nome indica {formatCurrencyBRL(a.valorNoNome ?? 0)}, mas o valor cadastrado é {formatCurrencyBRL(row.valor)}.</TooltipContent>
        </Tooltip>
      )}
      {a.state === 'consistente' && (
        <Tooltip>
          <TooltipTrigger asChild><Info className="h-3.5 w-3.5 text-muted-foreground/60" /></TooltipTrigger>
          <TooltipContent>O nome cadastrado contém o valor monetário.</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

export function BonusTiersTable({ rows, handlers }: { rows: BonusTierRow[]; handlers: BonusTierRowHandlers }) {
  const menu = (r: BonusTierRow) => (
    <BonusTierActionsMenu faixaNome={r.nome} onDetails={() => handlers.onOpen(r)} onEdit={() => handlers.onEdit(r)} onVinculos={() => handlers.onVinculos(r)} onDelete={() => handlers.onDelete(r)} />
  );
  const vinculos = (r: BonusTierRow) => r.usage.emUso
    ? `${pluralizeBR(r.usage.funcionarios, 'funcionário', 'funcionários')} · ${pluralizeBR(r.usage.categorias, 'categoria', 'categorias')}`
    : '—';

  return (
    <>
      <div className="hidden max-h-[600px] overflow-auto rounded-xl border border-border/70 md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 [&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:bg-muted/95">
              <TableHead>Faixa</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Utilização</TableHead>
              <TableHead>Vínculos</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="w-10 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">Nenhuma faixa encontrada para os filtros selecionados.</TableCell></TableRow>
            ) : rows.map(r => (
              <TableRow key={r.id} className="cursor-pointer hover:bg-muted/40" onClick={() => handlers.onOpen(r)}>
                <TableCell><FaixaCell row={r} /></TableCell>
                <TableCell className="text-right text-sm font-semibold tabular-nums">{formatCurrencyBRL(r.valor)}</TableCell>
                <TableCell className="text-sm">{r.usage.emUso ? 'Em uso' : <span className="text-muted-foreground">Sem vínculo</span>}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{vinculos(r)}</TableCell>
                <TableCell><BonusTierRegistrationStatus status={r.status} /></TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>{menu(r)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile — cards */}
      <div className="space-y-2.5 md:hidden">
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma faixa encontrada.</p>
        ) : rows.map(r => (
          <div key={r.id} className="rounded-xl border border-border/70 bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <button type="button" onClick={() => handlers.onOpen(r)} className="min-w-0 text-left"><FaixaCell row={r} /></button>
              <div onClick={(e) => e.stopPropagation()}>{menu(r)}</div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-lg font-bold tabular-nums text-foreground">{formatCurrencyBRL(r.valor)}</span>
              <BonusTierRegistrationStatus status={r.status} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{r.usage.emUso ? vinculos(r) : 'Sem vínculo'}</p>
          </div>
        ))}
      </div>
    </>
  );
}
