import { useMemo } from 'react';
import { Progress } from '@/components/ui/progress';
import { formatPercentBR } from '@/lib/formatters';
import type { RewardResult } from '../types/rewards-processing.types';

// Critérios (notas 0-1) que podem existir no resultado. Análise = média das notas.
const CRITERIOS: { key: keyof RewardResult; label: string }[] = [
  { key: 'nota_producao', label: 'Produção' },
  { key: 'nota_faturamento', label: 'Faturamento' },
  { key: 'nota_epi', label: 'EPI' },
  { key: 'nota_dss', label: 'DSS' },
  { key: 'nota_faltas', label: 'Faltas' },
  { key: 'nota_advertencias', label: 'Advertências' },
  { key: 'nota_itens_nc', label: 'Identificação de NC' },
  { key: 'nota_tratamento_nc', label: 'Tratamento de NC' },
  { key: 'nota_hora_maquina', label: 'Hora Máquina' },
  { key: 'nota_operacao_segura', label: 'Operação Segura' },
  { key: 'nota_limpeza', label: 'Limpeza' },
];

/**
 * Análise por critério — média das NOTAS reais (0-100%) entre os funcionários.
 * Não é um waterfall de perdas: o resultado do motor não permite decompor o
 * impacto financeiro por critério de forma segura, então NÃO distribuímos a
 * diferença artificialmente. Mostramos as notas médias observadas.
 */
export function RewardsLossBreakdown({ employees }: { employees: RewardResult[] }) {
  const medias = useMemo(() => {
    return CRITERIOS.map(c => {
      const vals = employees.map(e => e[c.key] as number | undefined).filter((v): v is number => typeof v === 'number');
      if (vals.length === 0) return null;
      return { label: c.label, media: (vals.reduce((s, v) => s + v, 0) / vals.length) * 100, n: vals.length };
    }).filter((x): x is { label: string; media: number; n: number } => x != null)
      .sort((a, b) => a.media - b.media);
  }, [employees]);

  if (medias.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">Sem notas para analisar.</p>;

  return (
    <div className="space-y-2.5">
      <p className="text-xs text-muted-foreground">Nota média por critério (menor = maior perda relativa). Análise observacional — não decompõe o valor financeiro.</p>
      {medias.map(m => (
        <div key={m.label}>
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="truncate text-foreground">{m.label}</span>
            <span className={`shrink-0 tabular-nums font-medium ${m.media >= 100 ? 'text-success' : m.media >= 90 ? 'text-status-warning' : 'text-destructive'}`}>{formatPercentBR(m.media, 1)}</span>
          </div>
          <Progress value={Math.min(m.media, 100)} className="mt-1 h-1.5" />
        </div>
      ))}
    </div>
  );
}
