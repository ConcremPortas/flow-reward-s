// Validação/normalização de usuário — PURA. NÃO lida com senha aqui (senha só
// trafega pelos fluxos seguros/RPC; nunca é logada ou persistida em estado).
export function normalizeEmail(email: string | null | undefined): string {
  return (email ?? '').trim().toLowerCase();
}

export function normalizeNome(nome: string | null | undefined): string {
  return (nome ?? '').trim().replace(/\s+/g, ' ');
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(normalizeEmail(email));
}

export function isValidNome(nome: string): boolean {
  return normalizeNome(nome).length > 0;
}

/** Duplicidade de e-mail (case-insensitive, trim) na base carregada — pré-checagem
 *  de UX; a unicidade real é validada no provedor/RPC no servidor. */
export function emailEmUso(email: string, usuarios: { id: string; email: string }[], exceptId?: string): boolean {
  const e = normalizeEmail(email);
  return usuarios.some(u => u.id !== exceptId && normalizeEmail(u.email) === e);
}
