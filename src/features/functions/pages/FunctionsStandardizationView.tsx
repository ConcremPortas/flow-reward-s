import { useMemo, useState } from 'react';
import { Briefcase, CheckCircle2, Unlink, AlertTriangle, GitCompare, Users } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { StatCard } from '@/components/dashboard/StatCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatNumberBR } from '@/lib/formatters';
import { computeFunctionSummary } from '../domain/functionFilters';
import { FunctionRegistrationStatus } from '../components/FunctionRegistrationStatus';
import { FunctionUsage } from '../components/FunctionUsage';
import { FunctionSimilarityGroup } from '../components/FunctionSimilarityGroup';
import { FunctionsEmptyState } from '../components/FunctionsEmptyState';
import type { FunctionRow, SimilarityGroup } from '../types/function.types';

type SortKey = 'funcionarios' | 'setores' | 'sem_vinculo' | 'inconsistencia';

interface Props {
  rows: FunctionRow[];
  similarityGroups: SimilarityGroup[];
  relationsTotals: { funcionarios: number; setores: number; empresas: number };
  onOpen: (r: FunctionRow) => void;
  onCompare: (idA: string, idB: string) => void;
}

const SORT_LABEL: Record<SortKey, string> = {
  funcionarios: 'Mais funcionários',
  setores: 'Mais setores',
  sem_vinculo: 'Sem vínculo',
  inconsistencia: 'Possível inconsistência',
};

function sortRows(rows: FunctionRow[], key: SortKey): FunctionRow[] {
  const copy = [...rows];
  switch (key) {
    case 'funcionarios': return copy.sort((a, b) => b.usage.funcionarios - a.usage.funcionarios);
    case 'setores': return copy.sort((a, b) => b.usage.setores - a.usage.setores);
    case 'sem_vinculo': return copy.sort((a, b) => Number(a.usage.emUso) - Number(b.usage.emUso) || b.usage.resultadosHistoricos - a.usage.resultadosHistoricos);
    case 'inconsistencia': return copy.sort((a, b) => rank(b) - rank(a));
  }
}
const rank = (r: FunctionRow) => (r.status.status === 'possivel_correspondencia' ? 2 : r.status.status === 'revisar' ? 1 : 0);

export function FunctionsStandardizationView({ rows, similarityGroups, relationsTotals, onOpen, onCompare }: Props) {
  const [sort, setSort] = useState<SortKey>('funcionarios');
  const summary = useMemo(() => computeFunctionSummary(rows), [rows]);
  const sorted = useMemo(() => sortRows(rows, sort), [rows, sort]);
  const byId = useMemo(() => new Map(rows.map(r => [r.id, r])), [rows]);

  if (rows.length === 0) {
    return <FunctionsEmptyState icon={Briefcase} title="Nenhuma função cadastrada" description="Cadastre funções para revisar utilização e padronização." />;
  }

  return (
    <div className="space-y-[18px]">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard title="Funções" value={String(summary.total)} icon={Briefcase} />
        <StatCard title="Em utilização" value={String(summary.emUso)} icon={CheckCircle2} status="positive" />
        <StatCard title="Sem vínculo" value={String(summary.semVinculo)} icon={Unlink} status={summary.semVinculo > 0 ? 'warning' : 'positive'} />
        <StatCard title="Para revisão" value={String(summary.aRevisar)} icon={AlertTriangle} status={summary.aRevisar > 0 ? 'warning' : 'positive'} />
        <StatCard title="Grupos semelhantes" value={String(similarityGroups.length)} icon={GitCompare} status={similarityGroups.length > 0 ? 'warning' : 'neutral'} />
      </div>

      <SectionCard title="Grupos de nomes semelhantes" description="Possíveis correspondências detectadas por análise determinística. Revise antes de considerar duplicidade.">
        {similarityGroups.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nenhum grupo de nomes semelhantes detectado.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {similarityGroups.map(g => (
              <FunctionSimilarityGroup key={g.key} group={g} onCompare={onCompare} onOpenFuncao={(id) => { const r = byId.get(id); if (r) onOpen(r); }} />
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Matriz de utilização"
        description="Funcionários e setores por função. Clique em uma função para ver os detalhes."
        actions={
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="h-8 w-[210px]"><SelectValue /></SelectTrigger>
            <SelectContent>{(Object.keys(SORT_LABEL) as SortKey[]).map(k => <SelectItem key={k} value={k}>{SORT_LABEL[k]}</SelectItem>)}</SelectContent>
          </Select>
        }
      >
        <div className="max-h-[560px] overflow-auto rounded-lg border border-border/70">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50 [&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:bg-muted/95">
                <TableHead>Função</TableHead>
                <TableHead className="text-right">Funcionários</TableHead>
                <TableHead className="text-right">Setores</TableHead>
                <TableHead>Utilização</TableHead>
                <TableHead>Situação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map(r => (
                <TableRow key={r.id} className="cursor-pointer hover:bg-muted/40" onClick={() => onOpen(r)}>
                  <TableCell className="text-sm font-medium">{r.nome}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">
                    <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5 text-muted-foreground/60" />{formatNumberBR(r.usage.funcionarios)}</span>
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">{formatNumberBR(r.usage.setores)}</TableCell>
                  <TableCell><FunctionUsage usage={r.usage} /></TableCell>
                  <TableCell><FunctionRegistrationStatus status={r.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">Relações globais: {formatNumberBR(relationsTotals.funcionarios)} funcionários · {formatNumberBR(relationsTotals.setores)} setores · {formatNumberBR(relationsTotals.empresas)} empresas.</p>
      </SectionCard>
    </div>
  );
}
