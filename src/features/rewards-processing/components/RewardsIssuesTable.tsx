import { useNavigate } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/app/StatusBadge';
import { competenciaShortLabelBR } from '../domain/rewardsProcessingScope';
import type { Issue } from '../types/rewards-processing.types';

export function RewardsIssuesTable({ issues }: { issues: Issue[] }) {
  const navigate = useNavigate();
  return (
    <div className="max-h-[600px] overflow-auto rounded-xl border border-border/70">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50 [&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:bg-muted/95">
            <TableHead>Severidade</TableHead>
            <TableHead>Situação</TableHead>
            <TableHead>Origem</TableHead>
            <TableHead>Impacto</TableHead>
            <TableHead>Competência</TableHead>
            <TableHead className="text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {issues.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">Nenhuma inconsistência detectada.</TableCell></TableRow>
          ) : issues.map((i, idx) => (
            <TableRow key={`${i.code}-${idx}`}>
              <TableCell>{i.severity === 'bloqueio' ? <StatusBadge variant="danger">Bloqueio</StatusBadge> : <StatusBadge variant="warning">Atenção</StatusBadge>}</TableCell>
              <TableCell className="text-sm">
                <span className="font-medium text-foreground">{i.title}</span>
                <span className="block text-xs text-muted-foreground">{i.description}</span>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{i.origin}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{i.entidade}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{i.competencia ? competenciaShortLabelBR(i.competencia) : '—'}</TableCell>
              <TableCell className="text-right">
                {i.action && <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => navigate(i.action!.to)}>{i.action.label} <ArrowUpRight className="h-3.5 w-3.5" /></Button>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
