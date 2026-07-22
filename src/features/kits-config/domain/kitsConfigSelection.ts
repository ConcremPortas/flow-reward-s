// Seleção da configuração vigente por competência — PURA. Espelha
// `useConfiguracoesKits.getConfigParaCompetencia` (maior vigência ≤ competência).
// Não recalcula bônus (isso é do motor).

export interface HasVigencia { vigenciaInicio: string }

/** Config vigente para a competência ('YYYY-MM'): maior vigência ≤ competência. */
export function selectConfigForCompetencia<T extends HasVigencia>(configs: T[], competencia: string): T | null {
  const mes = (competencia ?? '').slice(0, 7);
  const elegiveis = configs
    .filter(c => c.vigenciaInicio <= mes)
    .sort((a, b) => b.vigenciaInicio.localeCompare(a.vigenciaInicio));
  return elegiveis[0] ?? null;
}

/** Sentinela: vigência muito antiga que funciona como "regra inicial" (desde sempre). */
export function isSentinela(vigenciaInicio: string): boolean {
  return (vigenciaInicio ?? '') <= '2000-12';
}
