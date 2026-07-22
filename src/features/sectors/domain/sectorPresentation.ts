// Decisões de APRESENTAÇÃO do setor — puras. Não alteram o dado persistido.

/** Normaliza para comparação (trim, minúsculas, sem acentos, espaços colapsados). */
export function normalizeStr(s: string | null | undefined): string {
  return (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Decide como exibir a descrição:
 * - vazia → não exibe (o chamador mostra "Sem descrição");
 * - igual ao nome (normalizada) → não repete visualmente;
 * - caso contrário → exibe o texto original.
 */
export function descricaoDisplay(nome: string, descricao: string | null | undefined): { show: boolean; text: string } {
  const desc = (descricao ?? '').trim();
  if (!desc) return { show: false, text: '' };
  if (normalizeStr(desc) === normalizeStr(nome)) return { show: false, text: '' };
  return { show: true, text: desc };
}
