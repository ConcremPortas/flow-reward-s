// Comparação entre a prévia (novo cálculo) e o processamento salvo — pura.
// Compara bônus alcançado por funcionário. NÃO infere causalidade.
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
import type { BasePreview, ComparisonResult, ComparisonRow } from '../types/rewards-processing.types';
import { competenciaToMes } from './rewardsProcessingScope';

/**
 * Compara os resultados salvos (competência+base) com a prévia calculada da
 * mesma base. `anterior` = linhas salvas; `preview` = nova prévia (em memória).
 */
export function compareBasePreview(
  preview: BasePreview,
  resultadosSalvos: ResultadoPremiacao[],
  competencia: string,
): ComparisonResult {
  const mes = competenciaToMes(competencia);
  const anteriores = resultadosSalvos.filter(r => r.mes_competencia === mes && r.base_premiacao_id === preview.baseId);

  const anteriorPorFunc = new Map<string, ResultadoPremiacao>();
  for (const r of anteriores) if (r.funcionario_id) anteriorPorFunc.set(r.funcionario_id, r);

  const novoPorFunc = new Map(preview.employees.map(e => [e.id, e]));
  const ids = new Set<string>([...anteriorPorFunc.keys(), ...novoPorFunc.keys()]);

  const rows: ComparisonRow[] = [];
  for (const id of ids) {
    const ant = anteriorPorFunc.get(id);
    const novo = novoPorFunc.get(id);
    const valorAnterior = ant?.bonus_alcancado ?? null;
    const valorNovo = novo?.bonus_alcancado ?? null;
    const diferenca = valorAnterior != null && valorNovo != null ? valorNovo - valorAnterior
      : valorNovo != null ? valorNovo
      : valorAnterior != null ? -valorAnterior : null;
    rows.push({ funcionarioId: id, nome: novo?.nome ?? ant?.nome ?? '—', valorAnterior, valorNovo, diferenca });
  }

  rows.sort((a, b) => Math.abs(b.diferenca ?? 0) - Math.abs(a.diferenca ?? 0));

  const valorAnterior = anteriores.reduce((s, r) => s + (r.bonus_alcancado || 0), 0);
  const valorNovo = preview.employees.reduce((s, e) => s + (e.bonus_alcancado || 0), 0);

  return {
    baseId: preview.baseId,
    baseNome: preview.baseNome,
    valorAnterior,
    valorNovo,
    diferenca: valorNovo - valorAnterior,
    funcionariosAlterados: rows.filter(r => (r.diferenca ?? 0) !== 0).length,
    rows,
  };
}
