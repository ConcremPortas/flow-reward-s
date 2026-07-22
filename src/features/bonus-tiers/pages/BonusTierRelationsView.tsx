import { Layers, CheckCircle2, Unlink, Tag, Users, Briefcase } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { StatCard } from '@/components/dashboard/StatCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrencyBRL } from '@/lib/formatters';
import { BonusTierRegistrationStatus } from '../components/BonusTierRegistrationStatus';
import { BonusTiersEmptyState } from '../components/BonusTiersEmptyState';
import type { BonusTierRow } from '../types/bonus-tier.types';

interface Props {
  rows: BonusTierRow[];
  totals: { categorias: number; funcionarios: number; bases: number };
  onOpen: (r: BonusTierRow) => void;
}

/**
 * Vínculos e Utilização — mostra onde as faixas são usadas antes de alterações
 * financeiras. Relação real: faixa → funcionários (direto); categorias/bases
 * indiretas (via funcionários). Sem seletor de agrupamento (uma relação relevante).
 */
export function BonusTierRelationsView({ rows, totals, onOpen }: Props) {
  const utilizadas = rows.filter(r => r.usage.emUso).length;

  if (rows.length === 0) {
    return <BonusTiersEmptyState icon={Layers} title="Nenhuma faixa cadastrada" description="Cadastre faixas para visualizar seus vínculos." />;
  }

  return (
    <div className="space-y-[18px]">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Faixas" value={String(rows.length)} icon={Layers} />
        <StatCard title="Utilizadas" value={String(utilizadas)} icon={CheckCircle2} status="positive" />
        <StatCard title="Sem vínculo" value={String(rows.length - utilizadas)} icon={Unlink} status={rows.length - utilizadas > 0 ? 'warning' : 'positive'} />
        <StatCard title="Categorias" value={String(totals.categorias)} hint="relacionadas" icon={Tag} />
        <StatCard title="Funcionários" value={String(totals.funcionarios)} hint="relacionados" icon={Users} />
        <StatCard title="Bases" value={String(totals.bases)} hint="relacionadas" icon={Briefcase} />
      </div>

      <SectionCard title="Utilização por faixa" description="Vínculos reais. Clique em uma faixa para ver os detalhes.">
        <div className="max-h-[600px] overflow-auto rounded-lg border border-border/70">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50 [&>th]:sticky [&>th]:top-0 [&>th]:z-10 [&>th]:bg-muted/95">
                <TableHead>Faixa</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Categorias</TableHead>
                <TableHead className="text-right">Bases</TableHead>
                <TableHead className="text-right">Funcionários</TableHead>
                <TableHead>Utilização</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(r => (
                <TableRow key={r.id} className="cursor-pointer hover:bg-muted/40" onClick={() => onOpen(r)}>
                  <TableCell className="text-sm font-medium">{r.nome}</TableCell>
                  <TableCell className="text-right text-sm font-semibold tabular-nums">{formatCurrencyBRL(r.valor)}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">{r.usage.categorias}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums text-muted-foreground">{r.usage.bases}</TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{r.usage.funcionarios}</TableCell>
                  <TableCell><BonusTierRegistrationStatus status={r.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionCard>
    </div>
  );
}
