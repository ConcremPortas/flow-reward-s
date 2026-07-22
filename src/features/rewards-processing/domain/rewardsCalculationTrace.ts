// Memória de cálculo OBSERVACIONAL a partir de um resultado SALVO. Deriva apenas
// das colunas persistidas (notas e valores) — não recalcula nada. Usado no drawer
// de processamentos históricos, onde os insumos intermediários não são recuperáveis.
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
import { formatCurrencyBRL } from '@/lib/formatters';
import type { TraceEntry } from '../types/rewards-processing.types';

const round = (n: number | null | undefined) => (n == null ? null : Number(n.toFixed(4)));

/** Trace observacional derivado das colunas de um `concremrh_resultados_premiacao`. */
export function traceFromResultado(r: ResultadoPremiacao): TraceEntry[] {
  const notas: [string, string, number | null | undefined][] = [
    ['producao', 'Produção', r.nota_producao],
    ['faturamento', 'Faturamento', r.nota_faturamento],
    ['epi', 'EPI', r.nota_epi],
    ['dss', 'DSS', r.nota_dss],
    ['faltas', 'Faltas', r.nota_faltas],
    ['advertencias', 'Advertências', r.nota_advertencias],
    ['itens_nc', 'Identificação de NC', r.nota_itens_nc],
    ['tratamento_nc', 'Tratamento de NC', r.nota_tratamento_nc],
    ['hora_maquina', 'Hora Máquina', r.nota_hora_maquina],
    ['operacao_segura', 'Operação Segura', r.nota_operacao_segura],
    ['limpeza', 'Limpeza', r.nota_limpeza],
  ];

  const trace: TraceEntry[] = [];
  for (const [key, label, nota] of notas) if (nota != null) trace.push({ key, label, nota: round(nota) });
  trace.push({ key: 'nota_geral', label: 'Nota geral', nota: round(r.nota_geral), observacao: 'Valor salvo (motor de premiação).' });
  if (r.valor_faixa != null) trace.push({ key: 'valor_faixa', label: 'Valor da faixa', entrada: formatCurrencyBRL(r.valor_faixa) });
  if (r.valor_fixo != null) trace.push({ key: 'valor_fixo', label: 'Valor fixo', entrada: formatCurrencyBRL(r.valor_fixo) });
  if (r.valor_kits != null) trace.push({ key: 'valor_kits', label: 'Comissão de kits', entrada: formatCurrencyBRL(r.valor_kits) });
  trace.push({ key: 'bonus_possivel', label: 'Bônus possível', entrada: formatCurrencyBRL(r.bonus_possivel) });
  trace.push({ key: 'bonus_alcancado', label: 'Bônus alcançado', entrada: formatCurrencyBRL(r.bonus_alcancado) });
  return trace;
}
