import { useMemo } from 'react';
import { Users } from 'lucide-react';
import { SectionCard } from '@/components/app/SectionCard';
import { useUserFilters } from '../hooks/useUserFilters';
import { computeUsersContext } from '../domain/userFilters';
import { UsersContext } from '../components/UsersContext';
import { UsersFilters } from '../components/UsersFilters';
import { UsersTable, type UserRowHandlers } from '../components/UsersTable';
import { UsersEmptyState } from '../components/UsersEmptyState';
import type { UserRow } from '../types/user.types';
import type { UserSecInput } from '../domain/userSecurityRules';

interface Props { rows: UserRow[]; secInputs: UserSecInput[]; currentUserId: string | null; handlers: UserRowHandlers }

export function UsersView({ rows, secInputs, currentUserId, handlers }: Props) {
  const state = useUserFilters(rows);
  const ctx = useMemo(() => computeUsersContext(rows), [rows]);

  if (rows.length === 0) {
    return <UsersEmptyState icon={Users} title="Nenhum usuário cadastrado" description="Cadastre o primeiro usuário para dar acesso ao sistema." />;
  }

  return (
    <div className="space-y-[18px]">
      <UsersContext ctx={ctx} />
      <SectionCard title="Usuários" description="Contas, perfis, acessos e status.">
        <div className="space-y-4">
          <UsersFilters filters={state.filters} onChange={state.setFilters} onReset={state.resetFilters} searchInput={state.searchInput} onSearchChange={state.setSearchInput} activeCount={state.activeCount} />
          <UsersTable rows={state.filtered} secInputs={secInputs} currentUserId={currentUserId} handlers={handlers} />
          <p className="text-xs text-muted-foreground">Mostrando {state.filtered.length} de {rows.length} usuários.</p>
        </div>
      </SectionCard>
    </div>
  );
}
