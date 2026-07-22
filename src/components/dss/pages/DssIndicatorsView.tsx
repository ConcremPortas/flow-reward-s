import { CalendarCheck, Gauge, Users, Building2, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SectionCard } from '@/components/app/SectionCard';
import { StatCard } from '@/components/dashboard/StatCard';
import { CompetenciaPicker } from '@/components/dashboard/CompetenciaPicker';
import { competenciaLabelLong } from '@/features/dashboard/utils/dates';
import type { DssPageProps } from './_shared';

export function DssIndicatorsView({ data, indicators }: DssPageProps) {
  const localNome = (id: string) => data.locaisDSS.find((l) => l.id === id)?.nome || id;

  return (
    <div className="space-y-[18px]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Indicadores de {competenciaLabelLong(indicators.competencia)}</p>
        <CompetenciaPicker value={indicators.competencia} onChange={indicators.setCompetencia} />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard title="DSS realizados" value={String(indicators.dssRealizados)} hint="no período" icon={CalendarCheck} />
        <StatCard title="Participação média" value={indicators.participacaoMedia != null ? `${indicators.participacaoMedia.toFixed(1)}%` : '—'} hint="calculável" icon={Gauge} status={indicators.participacaoMedia == null ? 'neutral' : indicators.participacaoMedia >= 90 ? 'positive' : 'warning'} />
        <StatCard title="Pessoas abaixo da meta" value={String(indicators.pessoasAbaixoMeta)} hint="taxa < 70%" icon={Users} status={indicators.pessoasAbaixoMeta > 0 ? 'warning' : 'positive'} />
        <StatCard title="Locais abaixo da referência" value={String(indicators.locaisAbaixoReferencia)} hint="< 90% no mês" icon={Building2} status={indicators.locaisAbaixoReferencia > 0 ? 'critical' : 'positive'} />
        <StatCard title="Total de participações" value={String(indicators.totalParticipacoes)} hint="no período" icon={Activity} />
        <StatCard
          title="Variação vs. mês anterior"
          value={indicators.variacaoParticipacoes == null ? '—' : `${indicators.variacaoParticipacoes > 0 ? '+' : ''}${indicators.variacaoParticipacoes.toFixed(0)}%`}
          hint="participações totais"
          icon={Activity}
          status={indicators.variacaoParticipacoes == null ? 'neutral' : indicators.variacaoParticipacoes >= 0 ? 'positive' : 'warning'}
        />
      </div>

      <SectionCard title="Evolução de 12 meses" description="Quantidade de DSS, participação média, presentes e ausentes">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={indicators.evolucao12Meses} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'hsl(var(--border))' }} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={32} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 12 }} />
              <Line type="monotone" dataKey="quantidade" name="DSS realizados" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="presentes" name="Presentes" stroke="hsl(var(--success))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="ausentes" name="Ausentes" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-2">
        <SectionCard title="Participação por Local" description={`Referência ≥ 90% em ${competenciaLabelLong(indicators.competencia)}`}>
          {indicators.participacaoPorLocalMap.size === 0 ? (
            <p className="text-sm text-muted-foreground">Sem DSS realizados no período.</p>
          ) : (
            <div className="space-y-2.5">
              {[...indicators.participacaoPorLocalMap.entries()].sort((a, b) => a[1] - b[1]).map(([localId, taxa]) => {
                const pct = taxa * 100;
                return (
                  <div key={localId}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{localNome(localId)}</span>
                      <span className="font-medium text-foreground">{pct.toFixed(0)}%</span>
                    </div>
                    <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className={`h-full rounded-full ${pct >= 90 ? 'bg-success' : pct >= 70 ? 'bg-status-warning' : 'bg-destructive'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Funcionários com Baixa Participação" description="Taxa = presenças ÷ DSS vinculados (excluindo antes da admissão)">
          {indicators.baixaParticipacaoLista.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum funcionário abaixo de 70% de participação.</p>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="text-muted-foreground">
                  <tr className="text-left"><th className="pb-2">Funcionário</th><th className="pb-2 text-center">Esperados</th><th className="pb-2 text-center">Presenças</th><th className="pb-2 text-right">Taxa</th></tr>
                </thead>
                <tbody>
                  {indicators.baixaParticipacaoLista.slice(0, 15).map((r) => (
                    <tr key={r.funcionarioId} className="border-t border-border/60">
                      <td className="py-1.5 font-medium text-foreground">{r.nome}</td>
                      <td className="py-1.5 text-center text-muted-foreground">{r.dssEsperados}</td>
                      <td className="py-1.5 text-center text-muted-foreground">{r.presencas}</td>
                      <td className="py-1.5 text-right font-semibold text-destructive">{r.taxa.toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-3 text-[11px] text-muted-foreground">
            Limitação: assume que o local atual do funcionário já era o vínculo em eventos passados (sem histórico de mudança de local).
          </p>
        </SectionCard>
      </div>

      <SectionCard title="Distribuição de Temas" description="Temas do DSS no período — agrupados pelo título cadastrado">
        {indicators.distribuicaoTemas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem DSS realizados no período.</p>
        ) : (
          <div className="space-y-2">
            {indicators.distribuicaoTemas.slice(0, 10).map((t) => {
              const max = indicators.distribuicaoTemas[0].quantidade;
              return (
                <div key={t.tema}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate text-muted-foreground">{t.tema}</span>
                    <span className="font-medium text-foreground">{t.quantidade}</span>
                  </div>
                  <div className="mt-0.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(t.quantidade / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>
    </div>
  );
}
