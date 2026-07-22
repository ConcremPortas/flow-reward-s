// Modelo de acesso derivado — PURO. Espelha AuthContext.canAccess: admin =
// acesso total (ignora secoes); demais = secoes.includes(section). NÃO há herança
// de perfil. Seções fora do registro oficial são "desconhecidas" (sinalizar, nunca
// remover).
import { KNOWN_SECTIONS, isKnownSection, sectionLabel } from './permissionDefinitions';
import type { SectionKey } from '@/contexts/AuthContext';

export type AccessKind = 'total' | 'personalizado' | 'sem_acesso';

export interface UserAccess {
  kind: AccessKind;
  secoes: string[];              // valor persistido (bruto)
  conhecidas: SectionKey[];      // seções reconhecidas
  desconhecidas: string[];       // seções fora do registro (revisar)
  totalSecoes: number;           // nº de seções efetivas (conhecidas + desconhecidas)
}

export function deriveUserAccess(perfil: string, secoes: string[] | null | undefined): UserAccess {
  const list = Array.isArray(secoes) ? secoes : [];
  const conhecidas = list.filter(isKnownSection) as SectionKey[];
  const desconhecidas = list.filter(s => !isKnownSection(s));
  if (perfil === 'admin') {
    return { kind: 'total', secoes: list, conhecidas, desconhecidas, totalSecoes: list.length };
  }
  const kind: AccessKind = list.length === 0 ? 'sem_acesso' : 'personalizado';
  return { kind, secoes: list, conhecidas, desconhecidas, totalSecoes: list.length };
}

/** Um usuário efetivamente acessa a seção? (mesma regra do AuthContext.) */
export function userCanAccess(perfil: string, secoes: string[], section: SectionKey): boolean {
  if (perfil === 'admin') return true;
  return secoes.includes(section);
}

/** Resumo textual curto para a tabela. */
export function accessSummary(access: UserAccess): string {
  if (access.kind === 'total') return 'Acesso total';
  if (access.kind === 'sem_acesso') return 'Sem acesso';
  const nomes = access.conhecidas.slice(0, 2).map(sectionLabel);
  const resto = access.totalSecoes - nomes.length;
  return resto > 0 ? `${nomes.join(', ')} +${resto}` : nomes.join(', ');
}

export { KNOWN_SECTIONS };
