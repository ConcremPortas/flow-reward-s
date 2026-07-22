import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useUsers } from '../hooks/useUsers';
import { normalizeUsersView } from '../views';
import type { UsersView as ViewKey, UserRow } from '../types/user.types';
import type { SectionKey } from '@/contexts/AuthContext';
import { UsersHeader } from './UsersHeader';
import { UsersNavigation } from './UsersNavigation';
import { UsersSkeleton } from './UsersSkeleton';
import { UserDrawer } from './UserDrawer';
import { UserEditor } from './UserEditor';
import { UserAccessDialog } from './UserAccessDialog';
import { UserStatusDialog } from './UserStatusDialog';
import { UserPasswordResetDialog } from './UserPasswordResetDialog';
import { UsersView } from '../pages/UsersView';
import { AccessMatrixView } from '../pages/AccessMatrixView';
import type { UserRowHandlers } from './UsersTable';

/**
 * Central de Usuários e Acessos — 2 visões (?view=usuarios|acessos). Shell único:
 * dados uma vez; hospeda editor (criação em 2 etapas + edição), acessos,
 * status e redefinição de senha. Reusa o hook seguro `useUsuarios` (RPCs
 * endurecidas + reautenticação server-side). Não altera AuthContext/RLS/motor;
 * nunca lê/expõe senha_hash. Guardas de UI para último admin/autodesativação.
 */
export function UsersShell() {
  const data = useUsers();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = normalizeUsersView(searchParams.get('view'));

  const [drawer, setDrawer] = useState<UserRow | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);
  const [accessTarget, setAccessTarget] = useState<UserRow | null>(null);
  const [statusTarget, setStatusTarget] = useState<{ row: UserRow; action: 'ativar' | 'desativar' } | null>(null);
  const [pwdTarget, setPwdTarget] = useState<UserRow | null>(null);

  const setView = (v: ViewKey) => { const sp = new URLSearchParams(searchParams); sp.set('view', v); setSearchParams(sp); };

  const openNovo = () => { setEditing(null); setEditorOpen(true); };
  const openEdit = (r: UserRow) => { setDrawer(null); setEditing(r); setEditorOpen(true); };

  const handlers: UserRowHandlers = {
    onOpen: setDrawer,
    onEdit: openEdit,
    onEditAccess: (r) => { setDrawer(null); setAccessTarget(r); },
    onResetPassword: (r) => { setDrawer(null); setPwdTarget(r); },
    onActivate: (r) => { setDrawer(null); setStatusTarget({ row: r, action: 'ativar' }); },
    onDeactivate: (r) => { setDrawer(null); setStatusTarget({ row: r, action: 'desativar' }); },
  };

  const usuariosParaDup = data.rows.map(r => ({ id: r.id, email: r.email }));

  if (data.loading && data.rows.length === 0) return <UsersSkeleton />;

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-[18px]">
      <UsersHeader onNovoUsuario={openNovo}>
        <UsersNavigation active={view} onChange={setView} />
      </UsersHeader>

      <div key={view} className="animate-in fade-in slide-in-from-right-2 duration-200 motion-reduce:animate-none">
        {view === 'acessos' ? (
          <AccessMatrixView rows={data.rows} onEditAccess={(r) => setAccessTarget(r)} />
        ) : (
          <UsersView rows={data.rows} secInputs={data.secInputs} currentUserId={data.currentUserId} handlers={handlers} />
        )}
      </div>

      <UserDrawer
        row={drawer} secInputs={data.secInputs} currentUserId={data.currentUserId} onClose={() => setDrawer(null)}
        onEdit={openEdit} onEditAccess={(r) => { setDrawer(null); setAccessTarget(r); }}
        onResetPassword={(r) => { setDrawer(null); setPwdTarget(r); }}
        onActivate={(r) => { setDrawer(null); setStatusTarget({ row: r, action: 'ativar' }); }}
        onDeactivate={(r) => { setDrawer(null); setStatusTarget({ row: r, action: 'desativar' }); }}
      />

      <UserEditor
        open={editorOpen} onOpenChange={setEditorOpen} editing={editing}
        usuarios={usuariosParaDup} secInputs={data.secInputs} currentUserId={data.currentUserId} adminEmail={data.adminEmail}
        onCreate={async (p) => { await data.createUsuario({ nome: p.nome, email: p.email, senha: p.senha, perfil: p.perfil as never, secoes: p.secoes as SectionKey[], adminEmail: data.adminEmail, adminSenha: p.adminSenha }); }}
        onUpdate={async (id, p) => { await data.updateUsuario(id, { nome: p.nome, perfil: p.perfil as never, secoes: p.secoes as SectionKey[] | undefined }); }}
      />

      <UserAccessDialog
        row={accessTarget} onOpenChange={(o) => { if (!o) setAccessTarget(null); }}
        onSave={async (id, secoes) => { await data.updateUsuario(id, { secoes: secoes as SectionKey[] }); }}
      />

      <UserStatusDialog
        target={statusTarget} secInputs={data.secInputs} currentUserId={data.currentUserId}
        onOpenChange={(o) => { if (!o) setStatusTarget(null); }}
        onConfirm={async (r, ativo) => { await data.toggleAtivo(r.id, ativo); }}
      />

      <UserPasswordResetDialog
        row={pwdTarget} adminEmail={data.adminEmail} onOpenChange={(o) => { if (!o) setPwdTarget(null); }}
        onConfirm={async (id, novaSenha, adminSenha) => { await data.updateSenha(id, novaSenha, data.adminEmail, adminSenha); }}
      />
    </div>
  );
}
