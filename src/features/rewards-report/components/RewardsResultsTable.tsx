import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/app/StatusBadge';
import { cn } from '@/lib/utils';
import { formatCurrencyBRL, formatPercentBR } from '@/lib/formatters';
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
import { valorFinal, diferenca } from '../domain/rewardsReportMetrics';
import { classifyByKey } from '../domain/rewardsCriterionState';
import { RewardCriterionCell } from './RewardCriterionCell';
import type { CriterionKey, ResultView } from '../types/rewards-report.types';

interface Props {
  view: ResultView;
  rows: ResultadoPremiacao[];
  hasAjustes: boolean;
  onOpen: (r: ResultadoPremiacao) => void;
}

const initials = (nome: string) => nome.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('') || '?';
const CRIT_ORDER: CriterionKey[] = ['producao', 'epi', 'faltas', 'advertencias', 'dss', 'faturamento', 'itens_nc', 'tratamento_nc', 'hora_maquina', 'operacao_segura', 'limpeza'];
const CRIT_LABEL: Record<CriterionKey, string> = { producao: 'Produção', epi: 'EPI', faltas: 'Faltas', advertencias: 'Adv.', dss: 'DSS', faturamento: 'Faturam.', itens_nc: 'Itens NC', tratamento_nc: 'Trat. NC', hora_maquina: 'H. Máq.', operacao_segura: 'Op. Seg.', limpeza: 'Limpeza' };

function Funcionario({ r }: { r: ResultadoPremiacao }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">{initials(r.nome ?? '')}</span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-medium text-foreground">{r.nome}</span>
        <span className="block truncate text-xs text-muted-foreground">{r.cod_funcionario}</span>
      </span>
    </div>
  );
}

export function RewardsResultsTable({ view, rows, hasAjustes, onOpen }: Props) {
  const empty = (cols: number) => <TableRow><TableCell colSpan={cols} className="py-10 text-center text-sm text-muted-foreground">Nenhum resultado para os filtros selecionados.</TableCell></TableRow>;
  const stickyFirst = view === 'criterios';

  return (
    <div className={cn('max-h-[600px] overflow-auto rounded-xl border border-border/70', view !== 'criterios' && 'overflow-x-hidden')}>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50 [&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:bg-muted/95">
            <TableHead className={cn(stickyFirst && 'left-0 z-20 min-w-[200px] bg-muted/95')}>Funcionário</TableHead>
            {view === 'resultado' && <>
              <TableHead>Setor</TableHead><TableHead>Categoria</TableHead>
              <TableHead className="text-right">Nota</TableHead><TableHead>Faixa</TableHead>
              <TableHead className="text-right">Bônus final</TableHead><TableHead>Situação</TableHead>
            </>}
            {view === 'criterios' && <>
              {CRIT_ORDER.map(k => <TableHead key={k} className="text-center text-xs">{CRIT_LABEL[k]}</TableHead>)}
              <TableHead className="text-right">Nota</TableHead>
            </>}
            {view === 'financeiro' && <>
              <TableHead className="text-right">Bônus possível</TableHead><TableHead className="text-right">Bônus alcançado</TableHead>
              {hasAjustes && <TableHead className="text-right">Ajustes</TableHead>}
              <TableHead className="text-right">Valor final</TableHead><TableHead className="text-right">Diferença</TableHead>
            </>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? empty(view === 'resultado' ? 7 : view === 'criterios' ? CRIT_ORDER.length + 2 : hasAjustes ? 6 : 5) : rows.map(r => {
            const vf = valorFinal(r); const dif = diferenca(r); const ajuste = vf - (r.bonus_alcancado ?? 0);
            return (
              <TableRow key={r.id} className="cursor-pointer hover:bg-muted/40" onClick={() => onOpen(r)}>
                <TableCell className={cn(stickyFirst && 'left-0 z-10 bg-card')}><Funcionario r={r} /></TableCell>
                {view === 'resultado' && <>
                  <TableCell className="text-sm"><span className="text-foreground">{r.setor || '—'}</span>{r.funcao && <span className="block text-xs text-muted-foreground">{r.funcao}</span>}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.categoria || '—'}</TableCell>
                  <TableCell className={cn('text-right text-sm font-medium tabular-nums', r.nota_geral < 1 ? 'text-status-warning' : 'text-success')}>{formatPercentBR(r.nota_geral * 100, 1)}</TableCell>
                  <TableCell>{r.faixa ? <StatusBadge variant="neutral" dot={false}>{r.faixa}</StatusBadge> : '—'}</TableCell>
                  <TableCell className="text-right text-sm font-semibold tabular-nums">{formatCurrencyBRL(vf)}</TableCell>
                  <TableCell>{vf > 0 ? <StatusBadge variant="success">Com bônus</StatusBadge> : <StatusBadge variant="neutral">Sem bônus</StatusBadge>}</TableCell>
                </>}
                {view === 'criterios' && <>
                  {CRIT_ORDER.map(k => <TableCell key={k} className="text-center"><RewardCriterionCell state={classifyByKey(r, k)} /></TableCell>)}
                  <TableCell className="text-right text-sm font-medium tabular-nums">{formatPercentBR(r.nota_geral * 100, 1)}</TableCell>
                </>}
                {view === 'financeiro' && <>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">{formatCurrencyBRL(r.bonus_possivel || 0)}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{formatCurrencyBRL(r.bonus_alcancado || 0)}</TableCell>
                  {hasAjustes && <TableCell className={cn('text-right text-sm tabular-nums', ajuste !== 0 ? 'text-foreground' : 'text-muted-foreground')}>{ajuste !== 0 ? `${ajuste > 0 ? '+' : '−'}${formatCurrencyBRL(Math.abs(ajuste))}` : '—'}</TableCell>}
                  <TableCell className="text-right text-sm font-semibold tabular-nums">{formatCurrencyBRL(vf)}</TableCell>
                  <TableCell className={cn('text-right text-sm font-medium tabular-nums', dif < 0 ? 'text-destructive' : dif > 0 ? 'text-success' : 'text-muted-foreground')}>{formatCurrencyBRL(dif)}</TableCell>
                </>}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
