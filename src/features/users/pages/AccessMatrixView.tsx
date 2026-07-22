import { ShieldCheck, Pencil } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { Button } from '@/components/ui/button';
import { PERMISSION_DEFS } from '../domain/permissionDefinitions';
import { userCanAccess } from '../domain/userAccess';
import { AccessMatrixCell, type MatrixCellState } from '../components/AccessMatrixCell';
import { UsersEmptyState } from '../components/UsersEmptyState';
import { UserProfileBadge } from '../components/UserProfileBadge';
import type { UserRow } from '../types/user.types';
import type { SectionKey } from '@/contexts/AuthContext';

interface Props { rows: UserRow[]; onEditAccess: (r: UserRow) => void }

function cellState(row: UserRow, section: SectionKey): MatrixCellState {
  if (row.perfil === 'admin') return 'total';
  return userCanAccess(row.perfil, row.secoes, section) ? 'concedido' : 'negado';
}

/** Matriz de consulta Usuários × Seções. Edição via "Editar acessos" por usuário. */
export function AccessMatrixView({ rows, onEditAccess }: Props) {
  if (rows.length === 0) {
    return <UsersEmptyState icon={ShieldCheck} title="Nenhum usuário" description="Cadastre usuários para visualizar a matriz de acessos." />;
  }
  return (
    <SectionCard title="Matriz de acessos" description="Consulta de permissões por seção. Administradores têm acesso total. Edite os acessos por usuário.">
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-y-1">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 bg-card px-2 py-1 text-left text-xs font-medium text-muted-foreground">Usuário</th>
              {PERMISSION_DEFS.map(d => <th key={d.key} className="px-2 py-1 text-center text-[11px] font-medium text-foreground">{d.label}</th>)}
              <th className="px-2 py-1 text-right text-xs font-medium text-muted-foreground">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id} className="hover:bg-muted/30">
                <td className="sticky left-0 z-10 bg-card px-2 py-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-foreground">{r.nome ?? r.email}</span>
                    <UserProfileBadge perfil={r.perfil} />
                    {!r.ativo && <span className="text-[10px] text-muted-foreground">inativo</span>}
                  </div>
                </td>
                {PERMISSION_DEFS.map(d => (
                  <td key={d.key} className="px-2 py-1 text-center">
                    <AccessMatrixCell state={cellState(r, d.key)} />
                  </td>
                ))}
                <td className="px-2 py-1 text-right">
                  <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2 text-xs" onClick={() => onEditAccess(r)}><Pencil className="h-3.5 w-3.5" /> Editar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Legenda: escudo dourado = acesso total (admin); ✓ = concedido pelas seções; ✕ = negado. ⚠ indica permissões não reconhecidas no usuário.</p>
    </SectionCard>
  );
}
