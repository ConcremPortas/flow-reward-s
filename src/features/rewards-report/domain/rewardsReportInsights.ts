// Leitura gerencial do relatório — insights DETERMINÍSTICOS (regras puras).
import { formatCurrencyBRL, formatPercentBR } from '@/lib/formatters';
import type { GroupRow, FinancialTotals, CriterionImpact, ReportInsight } from '../types/rewards-report.types';

interface Args {
  totals: FinancialTotals;
  porSetor: GroupRow[];
  porBase: GroupRow[];
  impactos: CriterionImpact[];
  faixaMaisFrequente: { faixa: string; count: number } | null;
}

export function buildReportInsights({ totals, porSetor, porBase, impactos, faixaMaisFrequente }: Args): ReportInsight[] {
  const out: ReportInsight[] = [];

  if (totals.atingimento != null) {
    out.push({
      code: 'atingimento',
      type: totals.atingimento >= 95 ? 'positivo' : totals.atingimento >= 85 ? 'atencao' : 'negativo',
      title: `${formatPercentBR(totals.atingimento, 1)} do potencial convertido em valor final`,
      message: `Valor final ${formatCurrencyBRL(totals.final)} de ${formatCurrencyBRL(totals.possivel)} possível.`,
    });
  }

  const piorSetor = [...porSetor].filter(s => s.diferenca < 0).sort((a, b) => a.diferenca - b.diferenca)[0];
  if (piorSetor) out.push({ code: 'pior_setor', type: 'negativo', title: `Maior diferença: ${piorSetor.label}`, message: `${formatCurrencyBRL(piorSetor.diferenca)} vs. o potencial (${piorSetor.resultados} resultado(s)).` });

  const maiorImpacto = impactos[0];
  if (maiorImpacto && maiorImpacto.resultadosImpactados > 0) out.push({ code: 'criterio_impacto', type: 'atencao', title: `Critério com mais impacto: ${maiorImpacto.label}`, message: `${maiorImpacto.resultadosImpactados} resultado(s) abaixo de 100% · ${maiorImpacto.funcionariosUnicos} funcionário(s) único(s).` });

  if (faixaMaisFrequente) out.push({ code: 'faixa', type: 'informativo', title: `Faixa mais frequente: ${faixaMaisFrequente.faixa}`, message: `${faixaMaisFrequente.count} resultado(s) nesta faixa.` });

  const maiorBase = [...porBase].sort((a, b) => b.final - a.final)[0];
  if (maiorBase) out.push({ code: 'maior_base', type: 'informativo', title: `Base com maior valor: ${maiorBase.label}`, message: `${formatCurrencyBRL(maiorBase.final)} em ${maiorBase.resultados} resultado(s).` });

  if (totals.temAjustes) out.push({ code: 'ajustes', type: 'atencao', title: 'Há ajustes manuais aplicados', message: `Ajustes somam ${formatCurrencyBRL(totals.ajustes)} entre bônus alcançado e valor final.` });

  return out;
}
