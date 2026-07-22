// Leitura gerencial — motor de insights DETERMINÍSTICOS (regras puras, sem IA).
import type { GeneralIndicatorCardData, GeneralInsight } from '../types/general-indicators.types';
import { resolveIndicatorDefinition } from './indicatorDefinitions';
import { formatIndicatorValue } from './indicatorFormatting';
import { formatPercentBR, formatNumberBR } from '@/lib/formatters';
import { hasAnomaly } from './indicatorDataQuality';

const SEVERITY_ORDER: Record<GeneralInsight['severity'], number> = { alta: 0, media: 1, baixa: 2 };

/** Limiares de variação (documentados) para gerar insights de crescimento/queda. */
export const INSIGHT_VAR_REALIZADO = 5;   // % de variação do realizado
export const INSIGHT_VAR_PP = 3;          // pontos percentuais de atingimento

/** Gera insights para uma competência a partir dos cards já montados. */
export function buildInsights(cards: GeneralIndicatorCardData[]): GeneralInsight[] {
  const out: GeneralInsight[] = [];

  for (const card of cards) {
    const def = resolveIndicatorDefinition(card.codigo, card.nome);
    const base = { indicatorCode: card.codigo, indicatorLabel: card.nome, actionTipoId: card.tipoId, competencia: card.atual?.competencia ?? '' };

    if (!card.atual) {
      out.push({ ...base, code: 'sem_dados', type: 'informativo', severity: 'media', title: `${card.nome} sem dados`, message: 'Não há registro para a competência selecionada.', value: null });
      continue;
    }

    const { atual } = card;

    if (atual.meta === 0) {
      out.push({ ...base, code: 'meta_zero', type: 'atencao', severity: 'alta', title: `${card.nome} com meta zerada`, message: 'Meta igual a zero impede a leitura de atingimento.', value: 0 });
    }

    if (hasAnomaly(card.quality)) {
      out.push({ ...base, code: 'inconsistencia', type: 'atencao', severity: 'alta', title: `Possível inconsistência em ${card.nome}`, message: card.quality.find((q) => q.severity === 'warning')?.message ?? 'Valor potencialmente atípico.', value: atual.realizado });
    }

    if (atual.situacao === 'abaixo') {
      out.push({ ...base, code: 'abaixo', type: 'negativo', severity: 'alta', title: `${card.nome} abaixo da meta`, message: `Atingimento de ${formatPercentBR(atual.atingimento ?? 0, 1)} (realizado ${formatIndicatorValue(atual.realizado, def, { compact: true })} vs. meta ${formatIndicatorValue(atual.meta, def, { compact: true })}).`, value: atual.atingimento });
    } else if (atual.situacao === 'superada') {
      out.push({ ...base, code: 'superada', type: 'positivo', severity: 'media', title: `${card.nome} superou a meta`, message: `Atingimento de ${formatPercentBR(atual.atingimento ?? 0, 1)}.`, value: atual.atingimento });
    } else if (atual.situacao === 'atingida') {
      out.push({ ...base, code: 'atingida', type: 'positivo', severity: 'baixa', title: `${card.nome} atingiu a meta`, message: `Atingimento de ${formatPercentBR(atual.atingimento ?? 0, 1)}.`, value: atual.atingimento });
    }

    if (card.variacaoRealizado != null) {
      if (card.variacaoRealizado >= INSIGHT_VAR_REALIZADO) {
        out.push({ ...base, code: 'crescimento', type: 'positivo', severity: 'baixa', title: `${card.nome} cresceu vs. mês anterior`, message: `Realizado ${formatNumberBR(card.variacaoRealizado, 1)}% acima da competência anterior.`, value: card.variacaoRealizado });
      } else if (card.variacaoRealizado <= -INSIGHT_VAR_REALIZADO) {
        out.push({ ...base, code: 'queda', type: 'negativo', severity: 'alta', title: `${card.nome} caiu vs. mês anterior`, message: `Realizado ${formatNumberBR(Math.abs(card.variacaoRealizado), 1)}% abaixo da competência anterior.`, value: card.variacaoRealizado });
      }
    }

    if (card.variacaoPP != null) {
      if (card.variacaoPP >= INSIGHT_VAR_PP) {
        out.push({ ...base, code: 'melhora_ating', type: 'positivo', severity: 'baixa', title: `${card.nome}: atingimento melhorou`, message: `+${formatNumberBR(card.variacaoPP, 1)} p.p. de atingimento vs. mês anterior.`, value: card.variacaoPP });
      } else if (card.variacaoPP <= -INSIGHT_VAR_PP) {
        out.push({ ...base, code: 'piora_ating', type: 'atencao', severity: 'media', title: `${card.nome}: atingimento piorou`, message: `${formatNumberBR(card.variacaoPP, 1)} p.p. de atingimento vs. mês anterior.`, value: card.variacaoPP });
      }
    }
  }

  return out.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}
