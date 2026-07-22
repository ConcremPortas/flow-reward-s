import { AlertTriangle, ShieldAlert, Users, Percent, Building2, TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SectionCard } from '@/components/app/SectionCard';
import { StatCard } from '@/components/dashboard/StatCard';
import { shiftCompetencia } from '@/features/dashboard/utils/dates';
import {
  computePeriodTotals, aggregateBySetor, computeConcentracao, buildMonthlyEvolution,
} from '@/features/occurrences/domain/occurrenceCalculations';
import { percentVariation } from '@/features/occurrences/domain/occurrenceComparison';
import type { OccurrencePageProps } from './_shared';

export function PeriodAnalysisView({ data, competencia }: OccurrencePageProps) {
  const { registros, funcionariosAtivos } = data;
  const anterior = shiftCompetencia(competencia, -1);

  const atual = computePeriodTotals(registros, competencia);
  const prev = computePeriodTotals(registros, anterior);
  const totalOcorrencias = atual.totalFaltas + atual.totalAdvertencias;
  const pctQuadro = funcionariosAtivos.length > 0 ? (atual.pessoasComOcorrencia / funcionariosAtivos.length) * 100 : 0;
  const variacaoTotal = percentVariation(totalOcorrencias, prev.totalFaltas + prev.totalAdvertencias);

  const setorMap = new Map(funcionariosAtivos.map((f) => [f.id, f.setor?.nome || null]));
  const porSetor = aggregateBySetor(registros, competencia, setorMap);
  const setorMaisAfetado = porSetor[0]?.setor ?? '—';

  const evolucao = buildMonthlyEvolution(registros, competencia, 12);
  const concentracao = computeConcentracao(registros, competencia, 8);
  const nomeOf = (id: string) => funcionariosAtivos.find((f) => f.id === id)?.nome || id;

  return (
    <div className="space-y-[18px]">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Total de faltas" value={String(atual.totalFaltas)} hint="no período" icon={AlertTriangle} status={atual.totalFaltas > 0 ? 'warning' : 'positive'} />
        <StatCard title="Total de advertências" value={String(atual.totalAdvertencias)} hint="no período" icon={ShieldAlert} status={atual.totalAdvertencias > 0 ? 'critical' : 'positive'} />
        <StatCard title="Pessoas com ocorrência" value={String(atual.pessoasComOcorrencia)} hint="funcionário(s)" icon={Users} />
        <StatCard title="% do quadro afetado" value={`${pctQuadro.toFixed(1)}%`} hint={`de ${funcionariosAtivos.length} ativos`} icon={Percent} status={pctQuadro > 20 ? 'warning' : 'positive'} />
        <StatCard title="Setor mais afetado" value={setorMaisAfetado} hint="por total de ocorrências" icon={Building2} />
        <StatCard
          title="Variação vs. mês anterior"
          value={variacaoTotal == null ? '—' : `${variacaoTotal > 0 ? '+' : ''}${variacaoTotal.toFixed(0)}%`}
          hint="ocorrências totais"
          icon={TrendingUp}
          status={variacaoTotal == null ? 'neutral' : variacaoTotal > 0 ? 'warning' : 'positive'}
        />
      </div>

      <SectionCard title="Evolução de 12 meses" description="Faltas e advertências totais por competência">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={evolucao} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'hsl(var(--border))' }} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={32} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 12 }} />
              <Line type="monotone" dataKey="totalFaltas" name="Faltas" stroke="hsl(var(--status-warning))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="totalAdvertencias" name="Advertências" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-2">
        <SectionCard title="Ranking de Setores" description="Ocorrências totais no período">
          {porSetor.length === 0 ? <p className="text-sm text-muted-foreground">Sem ocorrências no período.</p> : (
            <div className="space-y-2.5">
              {porSetor.slice(0, 8).map((s, i) => {
                const max = Math.max(1, porSetor[0].faltas + porSetor[0].advertencias);
                const total = s.faltas + s.advertencias;
                return (
                  <div key={s.setor}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{i + 1}. {s.setor} <span className="text-muted-foreground/70">({s.pessoas} pessoa(s))</span></span>
                      <span className="font-medium text-foreground">{total}</span>
                    </div>
                    <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-status-warning" style={{ width: `${(total / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Concentração por Funcionário" description="Maiores volumes de ocorrência no período">
          {concentracao.length === 0 ? <p className="text-sm text-muted-foreground">Sem ocorrências no período.</p> : (
            <div className="space-y-2.5">
              {concentracao.map((c, i) => {
                const max = Math.max(1, concentracao[0].total);
                return (
                  <div key={c.funcionarioId}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{i + 1}. {nomeOf(c.funcionarioId)}</span>
                      <span className="font-medium text-foreground">{c.total}</span>
                    </div>
                    <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-destructive" style={{ width: `${(c.total / max) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Distribuição das Ocorrências" description="Proporção entre faltas e advertências no período">
        {totalOcorrencias === 0 ? (
          <p className="text-sm text-muted-foreground">Sem ocorrências no período.</p>
        ) : (
          <div className="space-y-2">
            <div className="flex h-4 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-status-warning" style={{ width: `${(atual.totalFaltas / totalOcorrencias) * 100}%` }} />
              <div className="h-full bg-destructive" style={{ width: `${(atual.totalAdvertencias / totalOcorrencias) * 100}%` }} />
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-status-warning" /> Faltas ({atual.totalFaltas})</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-destructive" /> Advertências ({atual.totalAdvertencias})</span>
            </div>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
