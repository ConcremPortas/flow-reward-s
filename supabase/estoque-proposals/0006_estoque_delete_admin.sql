-- ============================================================================
-- PROPOSTA — Controle de Estoque · 0006_estoque_delete_admin.sql
-- Exclusão (DELETE) de CADASTROS restrita a ADMINISTRADORES.
--
-- ⚠️  NÃO APLICAR AUTOMATICAMENTE. Aplicar após 0001–0003, em homologação primeiro.
--
--   • Cria helper `estoque_e_admin()` (perfil='admin' via auth.uid()).
--   • Adiciona policy de DELETE (só admin) nas 6 tabelas de cadastro.
--   • As FKs `on delete restrict` continuam protegendo: registros com vínculos
--     (ex.: variante com saldo/movimento, categoria com modelos) NÃO podem ser
--     apagados — o banco recusa e a UI orienta a inativar.
--   • Tabelas transacionais (saldos/movimentações/entregas/…) permanecem SEM
--     DELETE (nem admin apaga pelo cliente) — histórico é imutável.
-- ============================================================================

begin;

create or replace function public.estoque_e_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.concremrh_usuarios u
    where u.auth_user_id = auth.uid() and u.ativo = true and u.perfil = 'admin'
  );
$$;
revoke all on function public.estoque_e_admin() from public, anon;
grant execute on function public.estoque_e_admin() to authenticated;

do $$
declare t text;
begin
  foreach t in array array[
    'concremrh_estoque_categorias','concremrh_estoque_modelos','concremrh_estoque_tamanhos',
    'concremrh_estoque_variantes','concremrh_estoque_unidades','concremrh_estoque_fornecedores'
  ]
  loop
    execute format('drop policy if exists %1$s_del on public.%1$s;', t);
    execute format('create policy %1$s_del on public.%1$s for delete to authenticated using (public.estoque_e_admin());', t);
  end loop;
end $$;

commit;

-- ROLLBACK (transação separada):
--   drop policy if exists concremrh_estoque_categorias_del on public.concremrh_estoque_categorias;
--   ... (idem para modelos, tamanhos, variantes, unidades, fornecedores)
--   drop function if exists public.estoque_e_admin();
