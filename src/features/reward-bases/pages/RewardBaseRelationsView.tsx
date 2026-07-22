import { Coins, CheckCircle2, Users, Tag, FunctionSquare } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { StatCard } from '@/components/dashboard/StatCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatNumberBR } from '@/lib/formatters';
import { formatParameter } from '../domain/rewardBaseFormatting';
import { RewardBaseTipoBadge } from '../components/RewardBaseParameter';
import { RewardBaseUsage } from '../components/RewardBaseUsage';
import { RewardBasesEmptyState } from '../components/RewardBasesEmptyState';
import type { RewardBaseRow } from '../types/reward-base.types';

interface Props {
  rows: RewardBaseRow[];
  totals: { funcionarios: number; categorias: number; formulas: number };
  onOpen: (r: RewardBaseRow) => void;
}

/**
 * Utilização e Regras — onde cada base é usada e quais regras dependem dela.
 * Relações reais: funcionários (direto), fórmulas (direto), categorias (indireto).
 * Config de kits é global (sem FK) — não vira coluna. Sem duplicar Fórmulas/Kits.
 */
export function RewardBaseRelationsView({ rows, totals, onOpen }: Props) {
  const emUso = rows.filter(r => r.usage.emUso).length;

  if (rows.length === 0) {
    return <RewardBasesEmptyState icon={Coins} title="Nenhuma base cadastrada" description="Cadastre bases para visualizar seus vínculos." />;
  }

  return (
    <div className="space-y-[18px]">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
        <StatCard title="Bases" value={String(rows.length)} icon={Coins} />
        <StatCard title="Em uso" value={String(emUso)} icon={CheckCircle2} status="positive" />
        <StatCard title="Funcionários" value={formatNumberBR(totals.funcionarios)} hint="vinculados" icon={Users} />
        <StatCard title="Categorias" value={formatNumberBR(totals.categorias)} hint="relacionadas" icon={Tag} />
        <StatCard title="Fórmulas" value={formatNumberBR(totals.formulas)} hint="relacionadas" icon={FunctionSquare} />
      </div>

      <SectionCard title="Utilização por base" description="Vínculos reais. Clique em uma base para ver os detalhes. A configuração de kits é global (por vigência), não por base.">
        <div className="max-h-[600px] overflow-auto rounded-lg border border-border/70">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50 [&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:bg-muted/95">
                <TableHead>Base</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Parâmetro</TableHead>
                <TableHead className="text-right">Categorias</TableHead>
                <TableHead className="text-right">Fórmulas</TableHead>
                <TableHead className="text-right">Funcionários</TableHead>
                <TableHead>Utilização</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.id} className="cursor-pointer hover:bg-muted/40" onClick={() => onOpen(r)}>
                  <TableCell className="text-sm font-medium">{r.nome}</TableCell>
                  <TableCell><RewardBaseTipoBadge tipo={r.tipo} /></TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{formatParameter(r.tipo, r.valorBase)}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">{formatNumberBR(r.usage.categorias)}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">{formatNumberBR(r.usage.formulas)}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{formatNumberBR(r.usage.funcionarios)}</TableCell>
                  <TableCell><RewardBaseUsage usage={r.usage} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </div>
  );
}
