import { Users, UserCheck, UserX, Layers, Building2, AlertTriangle, History } from 'lucide-react';
import { competenciaShortLabelBR } from '../domain/rewardsProcessingScope';

export interface ParametersSummaryData {
  encontrados: number;
  ativos: number;
  elegiveis: number;
  naoElegiveis: number;
  categorias: number;
  setores: number;
  cadastrosIncompletos: number;
  existentes: { competencia: string; baseNome: string }[];
}

/** Resumo dinâmico do processamento — só contagens reais (sem cálculo financeiro). */
export function RewardsParametersSummary({ data }: { data: ParametersSummaryData }) {
  const rows: { icon: typeof Users; label: string; value: string; tone?: 'warn' }[] = [
    { icon: Users, label: 'Funcionários na base', value: String(data.encontrados) },
    { icon: UserCheck, label: 'Ativos', value: String(data.ativos) },
    { icon: UserCheck, label: 'Elegíveis', value: String(data.elegiveis) },
    { icon: UserX, label: 'Não elegíveis', value: String(data.naoElegiveis) },
    { icon: Layers, label: 'Categorias', value: String(data.categorias) },
    { icon: Building2, label: 'Setores', value: String(data.setores) },
    { icon: AlertTriangle, label: 'Cadastros incompletos', value: String(data.cadastrosIncompletos), tone: data.cadastrosIncompletos > 0 ? 'warn' : undefined },
  ];

  return (
    <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
      <p className="text-sm font-semibold text-foreground">Resumo do processamento</p>
      <dl className="mt-3 space-y-2">
        {rows.map(r => (
          <div key={r.label} className="flex items-center justify-between gap-2">
            <dt className="flex items-center gap-2 text-sm text-muted-foreground"><r.icon className="h-4 w-4 opacity-60" /> {r.label}</dt>
            <dd className={`text-sm font-semibold tabular-nums ${r.tone === 'warn' ? 'text-status-warning' : 'text-foreground'}`}>{r.value}</dd>
          </div>
        ))}
      </dl>

      {data.existentes.length > 0 && (
        <div className="mt-3 rounded-lg border border-status-warning/30 bg-status-warning/5 p-2.5">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-status-warning"><History className="h-3.5 w-3.5" /> Processamento existente</p>
          <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
            {data.existentes.map((e, i) => <li key={i}>{e.baseNome} · {competenciaShortLabelBR(e.competencia)}</li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
