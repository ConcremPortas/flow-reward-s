/**
 * Validação de PDF no cliente (defesa antes do upload; a RLS/Storage 0004 também
 * limita MIME e tamanho). Verifica: extensão/MIME, magic bytes `%PDF` e tamanho.
 */
export const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB (espelha o limite do bucket)

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46]; // "%PDF"

export interface PdfValidacao { ok: boolean; erro?: string }

export async function validarPdf(file: File): Promise<PdfValidacao> {
  if (file.size <= 0) return { ok: false, erro: 'Arquivo vazio.' };
  if (file.size > MAX_PDF_BYTES) return { ok: false, erro: 'O PDF excede o limite de 10 MB.' };
  if (file.type && file.type !== 'application/pdf') return { ok: false, erro: 'Selecione um arquivo PDF.' };

  try {
    const buf = new Uint8Array(await file.slice(0, 4).arrayBuffer());
    const ok = PDF_MAGIC.every((b, i) => buf[i] === b);
    if (!ok) return { ok: false, erro: 'O arquivo não é um PDF válido.' };
  } catch {
    return { ok: false, erro: 'Não foi possível ler o arquivo.' };
  }
  return { ok: true };
}
