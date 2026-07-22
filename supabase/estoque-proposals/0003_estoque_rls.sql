-- ============================================================================
-- PROPOSTA — módulo Controle de Estoque
-- 0003_estoque_rls.sql  ·  Policies RLS
--
-- ⚠️  NÃO APLICAR AUTOMATICAMENTE. Aplicar APÓS 0001 e 0002, em homologação primeiro.
--
-- Modelo (Fase 2C §15/§21):
--   • RLS já habilitada no 0001 (deny-all). Aqui adicionamos APENAS as policies.
--   • LEITURA (SELECT): authenticated COM acesso ao módulo (`estoque_tem_acesso()`
--     = admin OU seção 'estoque'). Nada para anon.
--   • CADASTROS (unidades/fornecedores/categorias/modelos/tamanhos/variantes/
--     funcionario_medidas): INSERT/UPDATE direto permitido a quem tem acesso.
--     DELETE físico NÃO é concedido (usar ativo/soft-delete).
--   • TRANSACIONAIS (saldos, operacoes, movimentacoes(+itens), entrada_documentos,
--     entregas(+itens), devolucoes, trocas, termos, auditoria): SOMENTE SELECT ao
--     cliente. INSERT/UPDATE/DELETE diretos ficam SEM policy → NEGADOS. A escrita
--     ocorre exclusivamente pelas RPCs SECURITY DEFINER (owner postgres) do 0002,
--     que contornam a RLS após validar auth.uid()/permissão no servidor.
--   • Nenhuma policy usa USING(true). Nada confia em dados do cliente.
--
-- Idempotente: derruba a policy antes de recriar.
-- ============================================================================

begin;

-- 1) SELECT para TODAS as tabelas do módulo (leitura gatada por acesso ao estoque).
do $$
declare t text;
begin
  foreach t in array array[
    'concremrh_estoque_unidades','concremrh_estoque_fornecedores','concremrh_estoque_categorias',
    'concremrh_estoque_modelos','concremrh_estoque_tamanhos','concremrh_estoque_variantes',
    'concremrh_estoque_funcionario_medidas','concremrh_estoque_saldos','concremrh_estoque_operacoes',
    'concremrh_estoque_movimentacoes','concremrh_estoque_movimentacao_itens','concremrh_estoque_entrada_documentos',
    'concremrh_estoque_entregas','concremrh_estoque_entrega_itens','concremrh_estoque_devolucoes',
    'concremrh_estoque_trocas','concremrh_estoque_termos','concremrh_estoque_auditoria'
  ]
  loop
    execute format('drop policy if exists %1$s_sel on public.%1$s;', t);
    execute format($p$create policy %1$s_sel on public.%1$s for select to authenticated
                    using (public.estoque_tem_acesso());$p$, t);
  end loop;
end $$;

-- 2) Escrita DIRETA apenas nos CADASTROS (INSERT/UPDATE). DELETE não concedido.
do $$
declare t text;
begin
  foreach t in array array[
    'concremrh_estoque_unidades','concremrh_estoque_fornecedores','concremrh_estoque_categorias',
    'concremrh_estoque_modelos','concremrh_estoque_tamanhos','concremrh_estoque_variantes',
    'concremrh_estoque_funcionario_medidas'
  ]
  loop
    execute format('drop policy if exists %1$s_ins on public.%1$s;', t);
    execute format($p$create policy %1$s_ins on public.%1$s for insert to authenticated
                    with check (public.estoque_tem_acesso());$p$, t);
    execute format('drop policy if exists %1$s_upd on public.%1$s;', t);
    execute format($p$create policy %1$s_upd on public.%1$s for update to authenticated
                    using (public.estoque_tem_acesso()) with check (public.estoque_tem_acesso());$p$, t);
  end loop;
end $$;

-- 3) TRANSACIONAIS: nenhuma policy de INSERT/UPDATE/DELETE (permanecem NEGADAS ao
--    cliente). Escrita só via RPCs SECURITY DEFINER do 0002. (Nada a criar aqui —
--    documentado explicitamente para revisão.)

commit;

-- ============================================================================
-- OBSERVAÇÕES
--   • Auditoria: por ora legível por qualquer acesso ao módulo. Se for exigido
--     restringir à visão administrativa, trocar o USING por uma checagem de perfil
--     (ex.: perfil='admin') — decisão pendente (granularidade de permissão).
--   • Escopo por empresa/unidade: se necessário limitar leitura à empresa/unidade
--     do usuário, estender o USING com um join a concremrh_usuarios/estoque_unidades.
--     Mantido amplo (acesso ao módulo) no MVP; endurecer é aditivo.
--
-- ROLLBACK (transação separada): drop das policies criadas, ex.:
--   drop policy if exists concremrh_estoque_saldos_sel on public.concremrh_estoque_saldos;
--   ... (repetir para *_sel de todas as 18 tabelas e *_ins/*_upd dos 7 cadastros)
--   -- a RLS em si (ENABLE) foi ligada no 0001; para reverter totalmente:
--   -- alter table public.<t> disable row level security;  (por tabela)
-- ============================================================================
