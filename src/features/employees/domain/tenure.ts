// Tempo de empresa — cálculo puro a partir de data_admissao.
export function formatTenure(dataAdmissao?: string, now: Date = new Date()): string | null {
  if (!dataAdmissao) return null;
  const start = new Date(`${dataAdmissao}T12:00:00`);
  if (Number.isNaN(start.getTime())) return null;
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months -= 1;
  if (months < 0) return null;
  const years = Math.floor(months / 12);
  const rem = months % 12;
  if (years === 0) return `${rem}m`;
  if (rem === 0) return `${years}a`;
  return `${years}a ${rem}m`;
}
