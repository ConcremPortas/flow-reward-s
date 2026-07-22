import { AlertTriangle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { pluralizeBR } from '@/lib/formatters';
import { formatParameter } from '../domain/rewardBaseFormatting';
import { RewardBaseTipoBadge } from './RewardBaseParameter';
import { RewardBaseStatus } from './RewardBaseStatus';
import { RewardBaseUsage } from './RewardBaseUsage';
import { RewardBaseActionsMenu } from './RewardBaseActionsMenu';
import type { RewardBaseRow } from '../types/reward-base.types';

export interface RewardBaseRowHandlers {
  onOpen: (r: RewardBaseRow) => void;
  onEdit: (r: RewardBaseRow) => void;
  onVinculos: (r: RewardBaseRow) => void;
  onConfiguracoes: (r: RewardBaseRow) => void;
  onProcessamentos: (r: RewardBaseRow) => void;
  onDelete: (r: RewardBaseRow) => void;
}

function BaseCell({ row }: { row: RewardBaseRow }) {
  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{row.nome}</span>
          {row.nameAnalysis.state === 'diferente' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex items-center gap-1 rounded-full bg-status-warning/10 px-1.5 py-0.5 text-[11px] font-medium text-status-warning"><AlertTriangle className="h-3 w-3" /> Verificar</span>
              </TooltipTrigger>
              <TooltipContent className="max-w-[280px]">O nome contém {row.nameAnalysis.percentualNoNome}%, enquanto o parâmetro é {formatParameter(row.tipo, row.valorBase)}. A diferença pode ser intencional.</TooltipContent>
            </Tooltip>
          )}
        </div>
        {row.descricao && row.descricao.trim() && row.descricao.trim().toLowerCase() !== row.nome.trim().toLowerCase() && (
          <p className="truncate text-xs text-muted-foreground">{row.descricao}</p>
        )}
      </div>
    </div>
  );
}

export function RewardBasesTable({ rows, handlers }: { rows: RewardBaseRow[]; handlers: RewardBaseRowHandlers }) {
  const menu = (r: RewardBaseRow) => (
    <RewardBaseActionsMenu
      baseNome={r.nome} isKits={r.engine.behavior === 'kits'}
      onDetails={() => handlers.onOpen(r)} onEdit={() => handlers.onEdit(r)} onVinculos={() => handlers.onVinculos(r)}
      onConfiguracoes={() => handlers.onConfiguracoes(r)} onProcessamentos={() => handlers.onProcessamentos(r)} onDelete={() => handlers.onDelete(r)}
    />
  );
  const vinculos = (r: RewardBaseRow) => r.usage.emUso
    ? `${pluralizeBR(r.usage.funcionarios, 'funcionário', 'funcionários')}${r.usage.formulas > 0 ? ` · ${pluralizeBR(r.usage.formulas, 'fórmula', 'fórmulas')}` : ''}`
    : '—';

  return (
    <>
      <div className="hidden max-h-[600px] overflow-auto rounded-xl border border-border/70 md:block">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50 [&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:bg-muted/95">
              <TableHead>Base</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Parâmetro</TableHead>
              <TableHead>Utilização</TableHead>
              <TableHead>Vínculos</TableHead>
              <TableHead>Situação</TableHead>
              <TableHead className="w-10 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">Nenhuma base encontrada para os filtros selecionados.</TableCell></TableRow>
            ) : rows.map(r => (
              <TableRow key={r.id} className="cursor-pointer hover:bg-muted/40" onClick={() => handlers.onOpen(r)}>
                <TableCell><BaseCell row={r} /></TableCell>
                <TableCell><RewardBaseTipoBadge tipo={r.tipo} /></TableCell>
                <TableCell className="text-right text-sm">{formatParameter(r.tipo, r.valorBase)}</TableCell>
                <TableCell><RewardBaseUsage usage={r.usage} /></TableCell>
                <TableCell className="text-sm text-muted-foreground">{vinculos(r)}</TableCell>
                <TableCell><RewardBaseStatus status={r.status} /></TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>{menu(r)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile — cards */}
      <div className="space-y-2.5 md:hidden">
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Nenhuma base encontrada.</p>
        ) : rows.map(r => (
          <div key={r.id} className="rounded-xl border border-border/70 bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <button type="button" onClick={() => handlers.onOpen(r)} className="min-w-0 text-left"><BaseCell row={r} /></button>
              <div onClick={(e) => e.stopPropagation()}>{menu(r)}</div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2"><RewardBaseTipoBadge tipo={r.tipo} /><span className="text-sm font-semibold tabular-nums text-[#7a5f16]">{formatParameter(r.tipo, r.valorBase)}</span></div>
              <RewardBaseStatus status={r.status} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground"><RewardBaseUsage usage={r.usage} /> · {vinculos(r)}</p>
          </div>
        ))}
      </div>
    </>
  );
}
