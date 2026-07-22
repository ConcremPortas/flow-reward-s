// Formatação de CNPJ — pura. Exibe "12.345.678/0001-90". Aceita entrada com ou
// sem máscara. NÃO consulta serviços externos.

/** Só os dígitos (até 14). */
export function onlyDigits(v: string | null | undefined): string {
  return (v ?? '').replace(/\D/g, '').slice(0, 14);
}

/** Formata para 12.345.678/0001-90 (defensivo: formata a partir dos dígitos). */
export function formatCNPJ(v: string | null | undefined): string {
  const d = onlyDigits(v);
  if (d.length !== 14) return (v ?? '').trim(); // incompleto: devolve como está
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
}

/** Máscara progressiva para digitação. */
export function maskCNPJInput(v: string): string {
  const d = onlyDigits(v);
  let out = d.slice(0, 2);
  if (d.length > 2) out += '.' + d.slice(2, 5);
  if (d.length > 5) out += '.' + d.slice(5, 8);
  if (d.length > 8) out += '/' + d.slice(8, 12);
  if (d.length > 12) out += '-' + d.slice(12, 14);
  return out;
}
