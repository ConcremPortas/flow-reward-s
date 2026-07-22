import { ShieldCheck, Percent, AlertTriangle, Repeat, Building2, ClipboardCheck, Lightbulb } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SectionCard } from '@/components/app/SectionCard';
import { StatCard } from '@/components/dashboard/StatCard';
import { CompetenciaPicker } from '@/components/dashboard/CompetenciaPicker';
import { competenciaLabelLong } from '@/features/dashboard/utils/dates';
import type { EpiPageProps } from './_shared';

export function EpiIndicatorsView({ indicators }: EpiPageProps) {
  return (
    <div className="space-y-[18px]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Indicadores de {competenciaLabelLong(indicators.competencia)}</p>
        <CompetenciaPicker value={indicators.competencia} onChange={indicators.setCompetencia} />
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <StatCard title="Auditorias realizadas" value={String(indicators.auditoriasRealizadas)} hint="no período" icon={ClipboardCheck} />
        <StatCard title="Taxa de conformidade" value={indicators.taxaConformidade != null ? `${indicators.taxaConformidade.toFixed(1)}%` : '—'} hint="calculável" icon={ShieldCheck} status={indicators.taxaConformidade == null ? 'neutral' : indicators.taxaConformidade >= 90 ? 'positive' : 'warning'} />
        <StatCard
          title="Variação"
          value={indicators.variacaoTaxa == null ? '—' : `${indicators.variacaoTaxa > 0 ? '+' : ''}${indicators.variacaoTaxa.toFixed(0)}%`}
          hint="vs. mês anterior" icon={Percent}
          status={indicators.variacaoTaxa == null ? 'neutral' : indicators.variacaoTaxa >= 0 ? 'positive' : 'warning'}
        />
        <StatCard title="Não conformidades" value={String(indicators.naoConformes)} hint="no período" icon={AlertTriangle} status={indicators.naoConformes > 0 ? 'warning' : 'positive'} />
        <StatCard title="Reincidentes" value={String(indicators.reincidentes)} hint="2+ em 3 auditorias" icon={Repeat} status={indicators.reincidentes > 0 ? 'critical' : 'positive'} />
        <StatCard title="Setores abaixo da referência" value={String(indicators.setoresAbaixoReferencia)} hint="< 90% no mês" icon={Building2} status={indicators.setoresAbaixoReferencia > 0 ? 'critical' : 'positive'} />
      </div>

      <SectionCard title="Evolução de 12 meses" description="Conformidade, auditados, conformes e não conformes">
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={indicators.evolucao12Meses} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ stroke: 'hsl(var(--border))' }} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={32} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 12 }} />
              <Line type="monotone" dataKey="auditorias" name="Auditorias realizadas" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="conformes" name="Conformes" stroke="hsl(var(--success))" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="naoConformes" name="Não conformes" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-2">
        <SectionCard title="Comparação por Setor" description={`Referência ≥ 90% em ${competenciaLabelLong(indicators.competencia)}`}>
          {indicators.comparacaoPorSetor.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem auditorias com setor identificável no período.</p>
          ) : (
            <div className="space-y-2.5">
              {[...indicators.comparacaoPorSetor].sort((a, b) => (a.taxaConformidade ?? 0) - (b.taxaConformidade ?? 0)).map((s) => {
                const pct = s.taxaConformidade ?? 0;
                return (
                  <div key={s.setorId}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{s.setorNome} {s.tendencia === 'subindo' ? '↑' : s.tendencia === 'descendo' ? '↓' : ''}</span>
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
          <p className="mt-3 text-[11px] text-muted-foreground">
            Só considera funcionários auditados a partir do novo formato de auditoria (com vínculo real de setor); auditorias legadas não têm setor recuperável.
          </p>
        </SectionCard>

        <SectionCard title="Reincidência" description="Funcionários com 2+ não conformidades nas últimas 3 auditorias">
          {indicators.naoConformidadesLista.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma não conformidade registrada.</p>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="text-muted-foreground">
                  <tr className="text-left"><th className="pb-2">Funcionário</th><th className="pb-2 text-center">Ocorrências</th><th className="pb-2 text-center">Reincidente</th></tr>
                </thead>
                <tbody>
                  {indicators.naoConformidadesLista.map((r) => (
                    <tr key={r.funcionarioId ?? r.nome} className="border-t border-border/60">
                      <td className="py-1.5 font-medium text-foreground">{r.nome}</td>
                      <td className="py-1.5 text-center text-muted-foreground">{r.ocorrencias}</td>
                      <td className="py-1.5 text-center">{r.reincidente ? <span className="font-semibold text-destructive">Sim</span> : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Insights Gerenciais" description="Regras determinísticas — sem geração de texto livre">
        <ul className="space-y-2">
          {indicators.insights.map((insight) => (
            <li key={insight} className="flex items-start gap-2 text-sm text-foreground">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {insight}
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}
