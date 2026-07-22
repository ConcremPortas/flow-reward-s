// Filtros e faixa de contexto — puros.
import { normalizeEmail } from './userValidation';
import { perfilLabel, sectionLabel } from './permissionDefinitions';
import type { UserFilters, UserRow } from '../types/user.types';

const norm = (s: string | null | undefined) => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

function haystack(row: UserRow): string {
  const secs = row.access.secoes.map(sectionLabel).join(' ');
  return `${norm(row.nome)} ${normalizeEmail(row.email)} ${norm(perfilLabel(row.perfil))} ${norm(secs)}`;
}

export function matchesUserFilters(row: UserRow, f: UserFilters): boolean {
  if (f.search && !haystack(row).includes(norm(f.search))) return false;
  if (f.perfil !== 'todos' && row.perfil !== f.perfil) return false;
  if (f.status === 'ativo' && !row.ativo) return false;
  if (f.status === 'inativo' && row.ativo) return false;
  if (f.acesso === 'total' && row.access.kind !== 'total') return false;
  if (f.acesso === 'personalizado' && row.access.kind !== 'personalizado') return false;
  if (f.acesso === 'sem_acesso' && row.access.kind !== 'sem_acesso') return false;
  if (f.acesso === 'desconhecida' && row.access.desconhecidas.length === 0) return false;
  return true;
}

export function countActiveUserFilters(f: UserFilters): number {
  return [f.perfil !== 'todos', f.status !== 'todos', f.acesso !== 'todos'].filter(Boolean).length;
}

export interface UsersContextCounts {
  total: number;
  ativos: number;
  inativos: number;
  administradoresAtivos: number;
  acessosPersonalizados: number;
  comPermissaoDesconhecida: number;
  soUmAdmin: boolean;
}

export function computeUsersContext(rows: UserRow[]): UsersContextCounts {
  const administradoresAtivos = rows.filter(r => r.perfil === 'admin' && r.ativo).length;
  return {
    total: rows.length,
    ativos: rows.filter(r => r.ativo).length,
    inativos: rows.filter(r => !r.ativo).length,
    administradoresAtivos,
    acessosPersonalizados: rows.filter(r => r.access.kind === 'personalizado').length,
    comPermissaoDesconhecida: rows.filter(r => r.access.desconhecidas.length > 0).length,
    soUmAdmin: administradoresAtivos === 1,
  };
}
