import { Info } from 'lucide-react';
import { formatPercentBR } from '@/lib/formatters';
import { calcularNotaGeral, isProducaoBase, isKitsBase } from '@/domain/premiacao/calculoPremiacao';
import type { WeightMap } from '../domain/rewardFormulaWeights';

interface Props { weights: WeightMap; baseNome: string | null }

/**
 * Prévia usando o MOTOR REAL (`calcularNotaGeral`), sem duplicar regra. Com todas
 * as notas parciais em 100%, mostra a nota geral resultante — evidenciando como os
 * pesos compõem o resultado para o modo da base (produção/kits). Não calcula bônus.
 */
export function RewardFormulaPreview({ weights, baseNome }: Props) {
  const isProducaoGeracao = isProducaoBase(baseNome ?? undefined);
  const isKits = isKitsBase(baseNome ?? undefined);
  const modo = isProducaoGeracao ? 'Produção' : isKits ? 'Kits' : 'Padrão';

  // Todas as notas parciais = 1.0 (100%). Reutiliza o motor; não recalcula regra.
  const notas = {
    notaProducao: 1, notaEpi: 1, notaFaltas: 1, notaDss: 1, notaAdvertencias: 1,
    notaFaturamento: 1, notaItensNC: 1, notaTratamentoNC: 1, notaHoraMaquina: 1,
    notaOperacaoSegura: 1, notaLimpeza: 1,
  };
  const nota = calcularNotaGeral({ notas, formula: weights, isProducaoGeracao, isSupervisorOrEncarregado: false });

  return (
    <div className="rounded-xl border border-[#c8a83f]/40 bg-[#f7f0d7]/40 p-3">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#8a6d1f]"><Info className="h-3.5 w-3.5" /> Prévia (motor real)</p>
      <p className="mt-1 text-sm text-foreground">
        Com todas as notas parciais em 100%, a nota geral resultante seria{' '}
        <strong className="tabular-nums text-[#7a5f16]">{formatPercentBR(nota * 100, 1)}</strong>{' '}
        no modo <strong>{modo}</strong>.
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">Cálculo pelo motor de premiação (funcionário comum). Supervisores/encarregados em produção usam critérios adicionais.</p>
    </div>
  );
}
