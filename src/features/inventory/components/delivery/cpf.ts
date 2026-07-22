/** Mascara o CPF exibindo apenas os 2 últimos dígitos (identificação sem expor dado sensível). */
export const maskCpf = (cpf?: string): string => {
  const d = (cpf ?? '').replace(/\D/g, '');
  return d.length >= 4 ? `•••.•••.•••-${d.slice(-2)}` : '';
};
