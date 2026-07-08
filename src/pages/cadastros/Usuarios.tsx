import { useState } from 'react';
import { useUsuarios, Usuario } from '@/hooks/useUsuarios';
import { UserPerfil, SectionKey, ALL_SECTIONS, HUB_MODULE_SECTIONS, useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Pencil, UserCheck, UserX, KeyRound } from 'lucide-react';

const PERFIL_LABELS: Record<UserPerfil, string> = {
  admin:    'Administrador',
  rh:       'RH',
  sesmt:    'SESMT',
  producao: 'Produção',
  custom:   'Personalizado',
};

const PERFIL_COLORS: Record<UserPerfil, string> = {
  admin:    'bg-purple-100 text-purple-800',
  rh:       'bg-blue-100 text-blue-800',
  sesmt:    'bg-green-100 text-green-800',
  producao: 'bg-orange-100 text-orange-800',
  custom:   'bg-gray-100 text-gray-800',
};

const SECTION_LABELS: Record<SectionKey, string> = {
  dashboard:       'Dashboard / Hub RH',
  rh:              'RH (Funcionários, Faltas/Advertências)',
  sesmt:           'SESMT (DSS, EPI)',
  producao:        'Produção (Produção, Indicadores)',
  premiacoes:      'Premiações',
  cadastros:       'Cadastros',
  cargos_salarios: 'Cargos e Salários',
};

// Seções padrão por perfil
const PERFIL_SECOES: Record<UserPerfil, SectionKey[]> = {
  admin:    ALL_SECTIONS,
  rh:       ALL_SECTIONS,
  sesmt:    ['sesmt'],
  producao: ['producao'],
  custom:   [],
};

const EMPTY_FORM = {
  nome: '',
  email: '',
  senha: '',
  confirmarSenha: '',
  perfil: 'custom' as UserPerfil,
  secoes: [] as SectionKey[],
};

export default function Usuarios() {
  const { usuarios, loading, createUsuario, updateUsuario, updateSenha, toggleAtivo } = useUsuarios();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [senhaOpen, setSenhaOpen] = useState(false);
  const [editing, setEditing] = useState<Usuario | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarNovaSenha, setConfirmarNovaSenha] = useState('');
  // Fase 1 (segurança): senha do admin logado, exigida para criar usuário / resetar senha.
  // Nunca persistida — só vive no estado do diálogo e é limpa após submeter.
  const [adminSenha, setAdminSenha] = useState('');
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setAdminSenha('');
    setOpen(true);
  }

  function openEdit(u: Usuario) {
    setEditing(u);
    setForm({
      nome: u.nome ?? '',
      email: u.email,
      senha: '',
      confirmarSenha: '',
      perfil: u.perfil,
      secoes: u.secoes ?? [],
    });
    setOpen(true);
  }

  function openSenha(u: Usuario) {
    setEditing(u);
    setNovaSenha('');
    setConfirmarNovaSenha('');
    setAdminSenha('');
    setSenhaOpen(true);
  }

  // Mensagem amigável para falha de autorização vinda das RPCs (Fase 1).
  function reportError(e: unknown, fallback: string) {
    const msg = e instanceof Error ? e.message : fallback;
    if (msg === 'Não autorizado') {
      toast.error('Senha de administrador incorreta ou você não tem permissão para esta ação.');
    } else {
      toast.error(msg);
    }
  }

  function handlePerfilChange(perfil: UserPerfil) {
    setForm(f => ({
      ...f,
      perfil,
      // Pré-seleciona seções conforme o perfil
      secoes: perfil === 'admin' ? [] : PERFIL_SECOES[perfil],
    }));
  }

  function toggleSecao(secao: SectionKey) {
    setForm(f => ({
      ...f,
      secoes: f.secoes.includes(secao)
        ? f.secoes.filter(s => s !== secao)
        : [...f.secoes, secao],
    }));
  }

  async function handleSave() {
    if (!form.nome.trim() || !form.email.trim()) {
      toast.error('Nome e e-mail são obrigatórios.');
      return;
    }
    if (!editing && !form.senha) {
      toast.error('Senha é obrigatória para novos usuários.');
      return;
    }
    if (!editing && form.senha !== form.confirmarSenha) {
      toast.error('As senhas não conferem.');
      return;
    }
    if (!editing && form.senha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    // Criar usuário exige confirmação da senha do admin logado (Fase 1).
    if (!editing && !adminSenha) {
      toast.error('Confirme sua senha de administrador para criar o usuário.');
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updateUsuario(editing.id, {
          nome: form.nome,
          perfil: form.perfil,
          secoes: form.perfil === 'admin' ? ALL_SECTIONS : form.secoes,
        });
        toast.success('Usuário atualizado.');
      } else {
        await createUsuario({
          nome: form.nome,
          email: form.email,
          senha: form.senha,
          perfil: form.perfil,
          secoes: form.perfil === 'admin' ? ALL_SECTIONS : form.secoes,
          adminEmail: profile?.email ?? '',
          adminSenha,
        });
        toast.success('Usuário cadastrado com sucesso.');
      }
      setOpen(false);
    } catch (e: unknown) {
      reportError(e, 'Erro ao salvar.');
    } finally {
      setAdminSenha('');
      setSaving(false);
    }
  }

  async function handleSaveSenha() {
    if (!novaSenha) { toast.error('Informe a nova senha.'); return; }
    if (novaSenha !== confirmarNovaSenha) { toast.error('As senhas não conferem.'); return; }
    if (novaSenha.length < 6) { toast.error('Mínimo 6 caracteres.'); return; }
    if (!adminSenha) { toast.error('Confirme sua senha de administrador para redefinir.'); return; }
    setSaving(true);
    try {
      await updateSenha(editing!.id, novaSenha, profile?.email ?? '', adminSenha);
      toast.success('Senha atualizada.');
      setSenhaOpen(false);
    } catch (e: unknown) {
      reportError(e, 'Erro ao atualizar senha.');
    } finally {
      setAdminSenha('');
      setSaving(false);
    }
  }

  async function handleToggle(u: Usuario) {
    try {
      await toggleAtivo(u.id, !u.ativo);
      toast.success(`Usuário ${!u.ativo ? 'ativado' : 'desativado'}.`);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erro ao alterar status.');
    }
  }

  const isAdmin = form.perfil === 'admin';

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie os usuários e seus acessos.</p>
        </div>
        <Button onClick={openCreate} className="bg-green-700 hover:bg-green-800 text-white gap-2">
          <Plus className="w-4 h-4" /> Novo Usuário
        </Button>
      </div>

      <div className="rounded-lg border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Seções de Acesso</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-28">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-400">Carregando...</TableCell>
              </TableRow>
            ) : usuarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-400">Nenhum usuário cadastrado.</TableCell>
              </TableRow>
            ) : (
              usuarios.map((u) => (
                <TableRow key={u.id} className={!u.ativo ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {u.nome ?? '—'}
                      {u.perfil === 'admin' && (
                        <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">{u.email}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${PERFIL_COLORS[u.perfil]}`}>
                      {PERFIL_LABELS[u.perfil]}
                    </span>
                  </TableCell>
                  <TableCell>
                    {u.perfil === 'admin' ? (
                      <span className="text-xs text-purple-700 font-medium">Acesso total</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {(u.secoes ?? []).length === 0 ? (
                          <span className="text-xs text-gray-400">Nenhum acesso</span>
                        ) : (
                          (u.secoes ?? []).map(s => (
                            <span key={s} className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 text-xs">
                              {SECTION_LABELS[s]?.split(' ')[0]}
                            </span>
                          ))
                        )}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Switch checked={u.ativo} onCheckedChange={() => handleToggle(u)} />
                      <span className="text-xs text-gray-500">{u.ativo ? 'Ativo' : 'Inativo'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(u)} title="Editar">
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openSenha(u)} title="Alterar senha">
                        <KeyRound className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal criar/editar */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label>Nome completo</Label>
                <Input
                  placeholder="Nome do usuário"
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  placeholder="email@empresa.com.br"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  disabled={!!editing}
                />
              </div>
              {!editing && (
                <>
                  <div className="space-y-1.5">
                    <Label>Senha</Label>
                    <Input
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={form.senha}
                      onChange={e => setForm(f => ({ ...f, senha: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Confirmar Senha</Label>
                    <Input
                      type="password"
                      placeholder="Repita a senha"
                      value={form.confirmarSenha}
                      onChange={e => setForm(f => ({ ...f, confirmarSenha: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-1.5 col-span-2 border-t pt-3 mt-1">
                    <Label>Confirme sua senha de administrador</Label>
                    <Input
                      type="password"
                      placeholder="Sua senha (para autorizar a criação)"
                      value={adminSenha}
                      onChange={e => setAdminSenha(e.target.value)}
                      autoComplete="off"
                    />
                    <p className="text-xs text-gray-500">
                      Exigida para criar usuários ({profile?.email ?? 'admin'}).
                    </p>
                  </div>
                </>
              )}
              <div className="space-y-1.5 col-span-2">
                <Label>Perfil</Label>
                <Select value={form.perfil} onValueChange={v => handlePerfilChange(v as UserPerfil)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.entries(PERFIL_LABELS) as [UserPerfil, string][]).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Seções de acesso */}
            <div className="space-y-2">
              <Label>Seções de Acesso</Label>
              {isAdmin ? (
                <p className="text-sm text-purple-700 bg-purple-50 border border-purple-200 rounded p-2">
                  Administradores têm acesso total a todas as seções e módulos.
                </p>
              ) : (
                <>
                  <div className="border rounded-lg divide-y">
                    {ALL_SECTIONS.map(secao => (
                      <label
                        key={secao}
                        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50"
                      >
                        <Checkbox
                          checked={form.secoes.includes(secao)}
                          onCheckedChange={() => toggleSecao(secao)}
                        />
                        <span className="text-sm">{SECTION_LABELS[secao]}</span>
                      </label>
                    ))}
                  </div>

                  {/* Preview dos módulos do Hub que serão liberados */}
                  {form.secoes.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 space-y-1">
                      <p className="text-xs font-medium text-blue-800">Módulos do Hub liberados:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(HUB_MODULE_SECTIONS).map(([modulo, secoes]) => {
                          const temAcesso = secoes.some(s => form.secoes.includes(s));
                          if (!temAcesso) return null;
                          const nomes: Record<string, string> = {
                            premiacoes: 'Premiações',
                            cargos_salarios: 'Cargos e Salários',
                            indicadores_rh: 'Indicadores RH',
                          };
                          return (
                            <span key={modulo} className="inline-flex items-center px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-medium">
                              {nomes[modulo] ?? modulo}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-green-700 hover:bg-green-800 text-white">
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal alterar senha */}
      <Dialog open={senhaOpen} onOpenChange={setSenhaOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Alterar Senha — {editing?.nome ?? editing?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label>Nova Senha</Label>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={novaSenha}
                onChange={e => setNovaSenha(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Confirmar Senha</Label>
              <Input
                type="password"
                placeholder="Repita a senha"
                value={confirmarNovaSenha}
                onChange={e => setConfirmarNovaSenha(e.target.value)}
              />
            </div>
            <div className="space-y-1.5 border-t pt-3">
              <Label>Confirme sua senha de administrador</Label>
              <Input
                type="password"
                placeholder="Sua senha (para autorizar a redefinição)"
                value={adminSenha}
                onChange={e => setAdminSenha(e.target.value)}
                autoComplete="off"
              />
              <p className="text-xs text-gray-500">
                Exigida para redefinir senhas ({profile?.email ?? 'admin'}).
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSenhaOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveSenha} disabled={saving} className="bg-green-700 hover:bg-green-800 text-white">
              {saving ? 'Salvando...' : 'Alterar Senha'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
