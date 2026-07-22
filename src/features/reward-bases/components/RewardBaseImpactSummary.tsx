import { pluralizeBR } from '@/lib/formatters';
import { formatParameter } from '../domain/rewardBaseFormatting';
import type { RewardBaseRow, RewardBaseTipo } from '../types/reward-base.types';

interface Props {
  base: RewardBaseRow;
  novoNome: string;
  novoTipo: RewardBaseTipo;
  novoValor: number;
}

/**
 * Resumo de impacto da edição. IMPORTANTE (auditado): o motor deriva o
 * comportamento do NOME (não de tipo/valor_base). Portanto o impacto real no
 * cálculo vem de alterar o NOME; alterar tipo/valor_base não afeta o cálculo.
 * Resultados já processados são snapshots — não são recalculados.
 */
export function RewardBaseImpactSummary({ base, novoNome, novoTipo, novoValor }: Props) {
  const u = base.usage;
  const nomeMudou = novoNome.trim() !== base.nome.trim();
  const tipoMudou = novoTipo !== base.tipo;
  const valorMudou = Math.abs(novoValor - base.valorBase) > 0.001;

  return (
    <div className="rounded-xl border border-border/70 bg-muted/20 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Impacto da alteração</p>
      <ul className="mt-1.5 space-y-0.5 text-sm text-foreground">
        {u.categorias > 0 && <li>{pluralizeBR(u.categorias, 'categoria relacionada', 'categorias relacionadas')}</li>}
        {u.funcionarios > 0 && <li>{pluralizeBR(u.funcionarios, 'funcionário vinculado', 'funcionários vinculados')}</li>}
        {u.formulas > 0 && <li>{pluralizeBR(u.formulas, 'fórmula relacionada', 'fórmulas relacionadas')}</li>}
        {u.resultadosHistoricos > 0 && <li>{pluralizeBR(u.resultadosHistoricos, 'processamento histórico', 'processamentos históricos')}</li>}
      </ul>

      {(tipoMudou || valorMudou) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {valorMudou && <span>Parâmetro: <strong className="tabular-nums">{formatParameter(base.tipo, base.valorBase)}</strong> → <strong className="tabular-nums text-[#7a5f16]">{formatParameter(novoTipo, novoValor)}</strong></span>}
          {tipoMudou && <span>Tipo: <strong>{base.tipo}</strong> → <strong>{novoTipo}</strong></span>}
        </div>
      )}

      {nomeMudou && base.engine.behavior !== 'outra' && (
        <p className="mt-2 text-xs text-status-warning">Alterar o NOME muda o comportamento no motor ({base.engine.label}). Reveja com atenção.</p>
      )}
      {(tipoMudou || valorMudou) && !nomeMudou && (
        <p className="mt-2 text-xs text-muted-foreground">Tipo e valor base não são usados diretamente no cálculo (o motor usa o nome). A alteração afeta apenas a exibição/classificação.</p>
      )}

      {u.resultadosHistoricos > 0 && (
        <p className="mt-2 text-xs text-muted-foreground">A alteração afetará novos processamentos. Resultados já salvos não serão recalculados automaticamente.</p>
      )}
    </div>
  );
}
