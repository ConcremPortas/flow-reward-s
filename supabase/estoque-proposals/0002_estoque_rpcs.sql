-- ============================================================================
-- PROPOSTA — módulo Controle de Estoque
-- 0002_estoque_rpcs.sql  ·  RPCs transacionais + helpers de identidade/permissão
--
-- ⚠️  NÃO APLICAR AUTOMATICAMENTE. Aplicar manualmente APÓS o 0001, em homologação
--     primeiro, no projeto real da app. Requer o gate de auth fechado (auth.uid()).
--
-- Princípios (Fase 2C/2D):
--   • SECURITY DEFINER + search_path fixo; owner deve ser role privilegiado (postgres).
--   • Identidade SEMPRE do servidor via auth.uid() → concremrh_usuarios (ativo).
--     NUNCA confiar em usuario_id/empresa/unidade vindos do cliente.
--   • Guard atômico de saldo: UPDATE ... WHERE quantidade >= :q (nunca negativo).
--   • Idempotência por operacao_id: sucesso persiste CONCLUIDA; falha faz ROLLBACK
--     (a linha EM_ANDAMENTO some), permitindo retry — falha nunca vira "sucesso".
--   • Ajuste = por unidade explícita (regra nova, corrige bug legado).
--   • Locks em ordem determinística (variante_id, unidade_id) p/ evitar deadlock.
--   • revoke public + grant authenticated no final.
--
-- Requer: pgcrypto NÃO necessário (usa md5 nativo p/ hash de parâmetros).
-- Texto legal do termo: PLACEHOLDER — substituir pelo texto aprovado (não inventar).
-- ============================================================================

begin;
set local check_function_bodies = off;

-- ─────────────────────────────────────────────────────────────────────────
-- HELPERS DE IDENTIDADE / PERMISSÃO
-- ─────────────────────────────────────────────────────────────────────────

-- id do usuário corporativo da sessão (via auth.uid()); null se sem sessão/inativo.
create or replace function public.estoque_usuario_atual()
returns uuid language sql stable security definer set search_path = public as $$
  select u.id from public.concremrh_usuarios u
  where u.auth_user_id = auth.uid() and u.ativo = true
  limit 1;
$$;

-- Acesso ao módulo: admin OU seção 'estoque'. (Sem RBAC paralelo — usa secoes/perfil.)
create or replace function public.estoque_tem_acesso()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.concremrh_usuarios u
    where u.auth_user_id = auth.uid() and u.ativo = true
      and (u.perfil = 'admin' or coalesce(u.secoes, '[]'::jsonb) ? 'estoque')
  );
$$;

-- Guarda padrão reutilizada no início de cada RPC de mutação.
create or replace function public.estoque__assert()
returns uuid language plpgsql stable security definer set search_path = public as $$
declare v_uid uuid;
begin
  if auth.uid() is null then raise exception 'NAO_AUTENTICADO' using errcode = '28000'; end if;
  v_uid := public.estoque_usuario_atual();
  if v_uid is null then raise exception 'SEM_PERFIL_CORPORATIVO' using errcode = '42501'; end if;
  if not public.estoque_tem_acesso() then raise exception 'SEM_PERMISSAO' using errcode = '42501'; end if;
  return v_uid;
end $$;

-- ─────────────────────────────────────────────────────────────────────────
-- IDEMPOTÊNCIA (op_begin retorna resultado anterior p/ replay; null p/ processar)
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.estoque__op_begin(p_op uuid, p_tipo text, p_uid uuid, p_hash text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_row public.concremrh_estoque_operacoes;
begin
  insert into public.concremrh_estoque_operacoes(operacao_id, tipo, usuario_id, params_hash, status)
  values (p_op, p_tipo, p_uid, p_hash, 'EM_ANDAMENTO')
  on conflict (operacao_id) do nothing;
  if found then return null; end if;                      -- inserida agora → processar

  select * into v_row from public.concremrh_estoque_operacoes where operacao_id = p_op;
  if v_row.params_hash <> p_hash then raise exception 'OPERACAO_CONFLITO' using errcode = '40001'; end if;
  if v_row.status = 'CONCLUIDA' then return v_row.resultado; end if;    -- replay idempotente
  if v_row.status = 'EM_ANDAMENTO' then raise exception 'OPERACAO_EM_ANDAMENTO' using errcode = '55000'; end if;
  return null;                                            -- status ERRO → reprocessar
end $$;

create or replace function public.estoque__op_finish(p_op uuid, p_result jsonb)
returns void language sql security definer set search_path = public as $$
  update public.concremrh_estoque_operacoes
  set status = 'CONCLUIDA', resultado = p_result, concluido_em = now()
  where operacao_id = p_op;
$$;

-- Geração de número/recibo legível e único.
create or replace function public.estoque__numero(p_prefixo text)
returns text language sql volatile as $$
  select p_prefixo || '-' || to_char(now() at time zone 'America/Sao_Paulo', 'YYYYMMDDHH24MISS')
         || '-' || upper(substr(md5(random()::text), 1, 5));
$$;

-- Auditoria (mesma transação).
create or replace function public.estoque__audit(p_entidade text, p_id uuid, p_acao text, p_uid uuid,
                                                  p_op uuid, p_antes jsonb, p_depois jsonb, p_motivo text)
returns void language sql security definer set search_path = public as $$
  insert into public.concremrh_estoque_auditoria(entidade, entidade_id, acao, usuario_id, correlacao_op, dados_antes, dados_depois, motivo)
  values (p_entidade, p_id, p_acao, p_uid, p_op, p_antes, p_depois, p_motivo);
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- INTERNOS DE SALDO (sem idempotência; usados pelas RPCs públicas e pela troca)
-- ─────────────────────────────────────────────────────────────────────────

-- Incrementa (cria saldo se não existir). Retorna {anterior, posterior}.
create or replace function public.estoque__saldo_incrementa(p_variante uuid, p_unidade uuid, p_qtd int, p_uid uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_ant int; v_pos int;
begin
  insert into public.concremrh_estoque_saldos(variante_id, unidade_id, quantidade, updated_by)
  values (p_variante, p_unidade, 0, p_uid)
  on conflict (variante_id, unidade_id) do nothing;

  select quantidade into v_ant from public.concremrh_estoque_saldos
    where variante_id = p_variante and unidade_id = p_unidade for update;

  update public.concremrh_estoque_saldos
    set quantidade = quantidade + p_qtd, updated_at = now(), updated_by = p_uid
    where variante_id = p_variante and unidade_id = p_unidade
    returning quantidade into v_pos;

  return jsonb_build_object('anterior', v_ant, 'posterior', v_pos);
end $$;

-- Baixa com guard atômico (nunca negativo). Retorna {anterior, posterior} ou levanta.
create or replace function public.estoque__saldo_baixa(p_variante uuid, p_unidade uuid, p_qtd int, p_uid uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_pos int; v_ant int;
begin
  update public.concremrh_estoque_saldos
    set quantidade = quantidade - p_qtd, updated_at = now(), updated_by = p_uid
    where variante_id = p_variante and unidade_id = p_unidade and quantidade >= p_qtd
    returning quantidade into v_pos;
  if not found then
    raise exception 'SALDO_INSUFICIENTE' using errcode = 'P0001',
      detail = 'Estoque insuficiente para a variante nesta unidade.';
  end if;
  v_ant := v_pos + p_qtd;
  return jsonb_build_object('anterior', v_ant, 'posterior', v_pos);
end $$;

-- ─────────────────────────────────────────────────────────────────────────
-- RPC: ENTRADA (multi-item)
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.estoque_registrar_entrada(
  p_operacao_id uuid, p_unidade_id uuid, p_data_entrada date,
  p_itens jsonb,                      -- [{variante_id, quantidade}]
  p_fornecedor_id uuid default null, p_observacao text default null,
  p_documento jsonb default null      -- {nome_original,nome_interno,storage_key,mime_type,tamanho}
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_prev jsonb; v_hash text; v_mov uuid; v_item jsonb;
        v_var uuid; v_qtd int; v_saldo jsonb; v_result jsonb; v_itens jsonb := '[]'::jsonb;
begin
  v_uid := public.estoque__assert();
  v_hash := md5(jsonb_build_object('u',p_unidade_id,'d',p_data_entrada,'i',p_itens,'f',p_fornecedor_id,'o',p_observacao)::text);
  v_prev := public.estoque__op_begin(p_operacao_id, 'ENTRADA', v_uid, v_hash);
  if v_prev is not null then return v_prev; end if;

  if p_itens is null or jsonb_array_length(p_itens) = 0 then raise exception 'SEM_ITENS'; end if;
  if p_data_entrada > (now() at time zone 'America/Sao_Paulo')::date then raise exception 'DATA_FUTURA'; end if;
  if not exists (select 1 from public.concremrh_estoque_unidades where id = p_unidade_id and ativo) then raise exception 'UNIDADE_INVALIDA'; end if;

  insert into public.concremrh_estoque_movimentacoes(numero, tipo, unidade_id, operacao_id, referencia_tipo, observacao, created_by)
  values (public.estoque__numero('ENT'), 'ENTRADA', p_unidade_id, p_operacao_id, 'ENTRADA', p_observacao, v_uid)
  returning id into v_mov;

  -- agrega duplicadas por variante
  for v_item in
    select jsonb_build_object('variante_id', (e->>'variante_id')::uuid, 'quantidade', sum((e->>'quantidade')::int))
    from jsonb_array_elements(p_itens) e group by (e->>'variante_id')
  loop
    v_var := (v_item->>'variante_id')::uuid; v_qtd := (v_item->>'quantidade')::int;
    if v_qtd is null or v_qtd <= 0 then raise exception 'QTD_INVALIDA'; end if;
    if not exists (select 1 from public.concremrh_estoque_variantes where id = v_var and ativo and deletado_em is null) then raise exception 'VARIANTE_INVALIDA'; end if;
    v_saldo := public.estoque__saldo_incrementa(v_var, p_unidade_id, v_qtd, v_uid);
    insert into public.concremrh_estoque_movimentacao_itens(movimentacao_id, variante_id, quantidade, direcao, saldo_anterior, saldo_posterior)
    values (v_mov, v_var, v_qtd, 'IN', (v_saldo->>'anterior')::int, (v_saldo->>'posterior')::int);
    v_itens := v_itens || jsonb_build_object('variante_id', v_var, 'anterior', v_saldo->'anterior', 'posterior', v_saldo->'posterior');
  end loop;

  if p_documento is not null then
    insert into public.concremrh_estoque_entrada_documentos(movimentacao_id, nome_original, nome_interno, storage_key, mime_type, tamanho, enviado_por)
    values (v_mov, p_documento->>'nome_original', p_documento->>'nome_interno', p_documento->>'storage_key',
            p_documento->>'mime_type', (p_documento->>'tamanho')::int, v_uid);
  end if;

  v_result := jsonb_build_object('ok', true, 'movimentacao_id', v_mov, 'itens', v_itens);
  perform public.estoque__audit('ENTRADA', v_mov, 'ENTRADA', v_uid, p_operacao_id, null, v_result, p_observacao);
  perform public.estoque__op_finish(p_operacao_id, v_result);
  return v_result;
end $$;

-- ─────────────────────────────────────────────────────────────────────────
-- INTERNO: aplica ENTREGA (usado pela RPC de entrega e pela troca)
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.estoque__aplicar_entrega(
  p_uid uuid, p_op uuid, p_funcionario uuid, p_unidade uuid, p_tipo text,
  p_motivo text, p_valor_compra numeric, p_itens jsonb
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_entrega uuid; v_mov uuid; v_item jsonb; v_var uuid; v_qtd int; v_saldo jsonb;
        v_func record; v_und record; v_snapshot jsonb;
begin
  select f.id, f.nome, f.ativo, f.status, f.empresa_id, f.setor_id into v_func
    from public.concremrh_funcionarios f where f.id = p_funcionario;
  if v_func.id is null then raise exception 'FUNCIONARIO_INEXISTENTE'; end if;
  if v_func.ativo is false then raise exception 'FUNCIONARIO_INATIVO'; end if;
  if upper(coalesce(v_func.status,'')) in ('DESLIGADO','RESCISAO','RESCISÃO','EXCLUIDO') then raise exception 'FUNCIONARIO_DESLIGADO'; end if;

  select id, empresa_id, ativo into v_und from public.concremrh_estoque_unidades where id = p_unidade;
  if v_und.id is null or v_und.ativo is false then raise exception 'UNIDADE_INVALIDA'; end if;
  if v_func.empresa_id is not null and v_und.empresa_id is not null and v_func.empresa_id <> v_und.empresa_id then
    raise exception 'EMPRESA_INCOMPATIVEL';   -- D-6: bloqueia por padrão
  end if;
  if p_tipo = 'COMPRA' and (p_valor_compra is null or p_valor_compra <= 0) then raise exception 'VALOR_COMPRA_OBRIGATORIO'; end if;
  if p_itens is null or jsonb_array_length(p_itens) = 0 then raise exception 'SEM_ITENS'; end if;

  insert into public.concremrh_estoque_entregas(recibo, funcionario_id, unidade_id, tipo, motivo, valor_compra, operador_id, operacao_id)
  values (public.estoque__numero('REC'), p_funcionario, p_unidade, p_tipo, coalesce(p_motivo,''),
          case when p_tipo = 'COMPRA' then p_valor_compra else null end, p_uid, p_op)
  returning id into v_entrega;

  insert into public.concremrh_estoque_movimentacoes(numero, tipo, unidade_id, operacao_id, referencia_tipo, referencia_id, created_by)
  values (public.estoque__numero('SAI'), 'ENTREGA', p_unidade, p_op, 'ENTREGA', v_entrega, p_uid)
  returning id into v_mov;

  for v_item in select * from jsonb_array_elements(p_itens) loop
    v_var := (v_item->>'variante_id')::uuid; v_qtd := (v_item->>'quantidade')::int;
    if v_qtd is null or v_qtd <= 0 then raise exception 'QTD_INVALIDA'; end if;
    if not exists (select 1 from public.concremrh_estoque_variantes where id = v_var and ativo and deletado_em is null) then raise exception 'VARIANTE_INVALIDA'; end if;
    v_saldo := public.estoque__saldo_baixa(v_var, p_unidade, v_qtd, p_uid);   -- guard atômico
    insert into public.concremrh_estoque_entrega_itens(entrega_id, variante_id, quantidade) values (v_entrega, v_var, v_qtd);
    insert into public.concremrh_estoque_movimentacao_itens(movimentacao_id, variante_id, quantidade, direcao, saldo_anterior, saldo_posterior)
    values (v_mov, v_var, v_qtd, 'OUT', (v_saldo->>'anterior')::int, (v_saldo->>'posterior')::int);
  end loop;

  -- Termo (snapshot imutável). TEXTO LEGAL = PLACEHOLDER (substituir pelo aprovado).
  v_snapshot := jsonb_build_object(
    'colaborador', jsonb_build_object('id', v_func.id, 'nome', v_func.nome, 'empresa_id', v_func.empresa_id, 'setor_id', v_func.setor_id),
    'entrega_id', v_entrega, 'tipo', p_tipo,
    'itens', (select coalesce(jsonb_agg(jsonb_build_object('variante_id', variante_id, 'quantidade', quantidade)), '[]'::jsonb)
              from public.concremrh_estoque_entrega_itens where entrega_id = v_entrega));
  insert into public.concremrh_estoque_termos(entrega_id, numero, versao, status, snapshot, texto_declaracao, emitido_em)
  values (v_entrega, public.estoque__numero('TERMO'), 1, 'EMITIDO', v_snapshot,
          '[PLACEHOLDER — inserir texto legal aprovado do termo de responsabilidade]', now());

  perform public.estoque__audit('ENTREGA', v_entrega, p_tipo, p_uid, p_op, null,
           jsonb_build_object('entrega_id', v_entrega, 'movimentacao_id', v_mov), p_motivo);
  return v_entrega;
end $$;

-- RPC pública de entrega (embrulha idempotência).
create or replace function public.estoque_registrar_entrega(
  p_operacao_id uuid, p_funcionario_id uuid, p_unidade_id uuid, p_tipo text,
  p_itens jsonb, p_motivo text default '', p_valor_compra numeric default null
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_prev jsonb; v_hash text; v_entrega uuid; v_result jsonb;
begin
  v_uid := public.estoque__assert();
  v_hash := md5(jsonb_build_object('f',p_funcionario_id,'u',p_unidade_id,'t',p_tipo,'i',p_itens,'m',p_motivo,'v',p_valor_compra)::text);
  v_prev := public.estoque__op_begin(p_operacao_id, 'ENTREGA', v_uid, v_hash);
  if v_prev is not null then return v_prev; end if;

  v_entrega := public.estoque__aplicar_entrega(v_uid, p_operacao_id, p_funcionario_id, p_unidade_id, p_tipo, p_motivo, p_valor_compra, p_itens);
  v_result := jsonb_build_object('ok', true, 'entrega_id', v_entrega);
  perform public.estoque__op_finish(p_operacao_id, v_result);
  return v_result;
end $$;

-- ─────────────────────────────────────────────────────────────────────────
-- INTERNO: aplica DEVOLUÇÃO (usado pela RPC e pela troca)
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.estoque__aplicar_devolucao(
  p_uid uuid, p_op uuid, p_entrega uuid, p_variante uuid, p_unidade uuid, p_qtd int,
  p_condicao text, p_destino text, p_motivo text
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_dev uuid; v_entregue int; v_devolvido int; v_disp int; v_reestoca boolean; v_saldo jsonb; v_mov uuid; v_func uuid;
begin
  select funcionario_id into v_func from public.concremrh_estoque_entregas where id = p_entrega and status = 'CONFIRMADA';
  if v_func is null then raise exception 'ENTREGA_INVALIDA'; end if;

  -- trava e recomputa disponível (anti-race entre duas devoluções)
  perform 1 from public.concremrh_estoque_entrega_itens where entrega_id = p_entrega and variante_id = p_variante for update;
  select coalesce(sum(quantidade),0) into v_entregue from public.concremrh_estoque_entrega_itens where entrega_id = p_entrega and variante_id = p_variante;
  select coalesce(sum(quantidade),0) into v_devolvido from public.concremrh_estoque_devolucoes where entrega_id = p_entrega and variante_id = p_variante and status = 'ATIVA';
  v_disp := v_entregue - v_devolvido;
  if p_qtd is null or p_qtd <= 0 then raise exception 'QTD_INVALIDA'; end if;
  if p_qtd > v_disp then raise exception 'QTD_MAIOR_QUE_DISPONIVEL' using detail = 'Disponível: ' || v_disp; end if;

  v_reestoca := (p_destino = 'ESTOQUE' and p_condicao in ('NOVO','BOM','USADO'));   -- regra preservada

  insert into public.concremrh_estoque_devolucoes(entrega_id, funcionario_id, variante_id, quantidade, condicao, destino, motivo, responsavel_id, reestocado, operacao_id)
  values (p_entrega, v_func, p_variante, p_qtd, p_condicao, p_destino, coalesce(p_motivo,''), p_uid, v_reestoca, p_op)
  returning id into v_dev;

  if v_reestoca then
    v_saldo := public.estoque__saldo_incrementa(p_variante, p_unidade, p_qtd, p_uid);
    insert into public.concremrh_estoque_movimentacoes(numero, tipo, unidade_id, operacao_id, referencia_tipo, referencia_id, created_by)
    values (public.estoque__numero('DEV'), 'DEVOLUCAO', p_unidade, p_op, 'DEVOLUCAO', v_dev, p_uid) returning id into v_mov;
    insert into public.concremrh_estoque_movimentacao_itens(movimentacao_id, variante_id, quantidade, direcao, saldo_anterior, saldo_posterior)
    values (v_mov, p_variante, p_qtd, 'IN', (v_saldo->>'anterior')::int, (v_saldo->>'posterior')::int);
  end if;

  perform public.estoque__audit('DEVOLUCAO', v_dev, 'DEVOLUCAO', p_uid, p_op, null,
           jsonb_build_object('devolucao_id', v_dev, 'reestocado', v_reestoca), p_motivo);
  return v_dev;
end $$;

create or replace function public.estoque_registrar_devolucao(
  p_operacao_id uuid, p_entrega_id uuid, p_variante_id uuid, p_unidade_id uuid, p_quantidade int,
  p_condicao text, p_destino text, p_motivo text default ''
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_prev jsonb; v_hash text; v_dev uuid; v_result jsonb;
begin
  v_uid := public.estoque__assert();
  v_hash := md5(jsonb_build_object('e',p_entrega_id,'v',p_variante_id,'u',p_unidade_id,'q',p_quantidade,'c',p_condicao,'d',p_destino,'m',p_motivo)::text);
  v_prev := public.estoque__op_begin(p_operacao_id, 'DEVOLUCAO', v_uid, v_hash);
  if v_prev is not null then return v_prev; end if;
  v_dev := public.estoque__aplicar_devolucao(v_uid, p_operacao_id, p_entrega_id, p_variante_id, p_unidade_id, p_quantidade, p_condicao, p_destino, p_motivo);
  v_result := jsonb_build_object('ok', true, 'devolucao_id', v_dev);
  perform public.estoque__op_finish(p_operacao_id, v_result);
  return v_result;
end $$;

-- ─────────────────────────────────────────────────────────────────────────
-- RPC: TROCA (uma transação; devolução BOM/ESTOQUE + nova entrega). Rollback integral.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.estoque_registrar_troca(
  p_operacao_id uuid, p_entrega_original_id uuid, p_unidade_id uuid,
  p_variante_devolvida uuid, p_variante_nova uuid, p_quantidade int, p_motivo text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_prev jsonb; v_hash text; v_func uuid; v_dev uuid; v_nova uuid; v_troca uuid; v_result jsonb;
begin
  v_uid := public.estoque__assert();
  v_hash := md5(jsonb_build_object('eo',p_entrega_original_id,'u',p_unidade_id,'vd',p_variante_devolvida,'vn',p_variante_nova,'q',p_quantidade,'m',p_motivo)::text);
  v_prev := public.estoque__op_begin(p_operacao_id, 'TROCA', v_uid, v_hash);
  if v_prev is not null then return v_prev; end if;

  select funcionario_id into v_func from public.concremrh_estoque_entregas where id = p_entrega_original_id and status = 'CONFIRMADA';
  if v_func is null then raise exception 'ENTREGA_INVALIDA'; end if;

  -- 1) devolve item antigo (reentra no estoque)
  v_dev := public.estoque__aplicar_devolucao(v_uid, p_operacao_id, p_entrega_original_id, p_variante_devolvida, p_unidade_id, p_quantidade, 'BOM', 'ESTOQUE', p_motivo);
  -- 2) nova entrega (baixa a variante nova) — falha aqui desfaz TUDO
  v_nova := public.estoque__aplicar_entrega(v_uid, p_operacao_id, v_func, p_unidade_id, 'TROCA_TAMANHO', p_motivo, null,
              jsonb_build_array(jsonb_build_object('variante_id', p_variante_nova, 'quantidade', p_quantidade)));
  -- 3) vínculo
  insert into public.concremrh_estoque_trocas(entrega_original_id, devolucao_id, nova_entrega_id, motivo, operacao_id)
  values (p_entrega_original_id, v_dev, v_nova, p_motivo, p_operacao_id) returning id into v_troca;

  v_result := jsonb_build_object('ok', true, 'troca_id', v_troca, 'devolucao_id', v_dev, 'nova_entrega_id', v_nova);
  perform public.estoque__audit('TROCA', v_troca, 'TROCA', v_uid, p_operacao_id, null, v_result, p_motivo);
  perform public.estoque__op_finish(p_operacao_id, v_result);
  return v_result;
end $$;

-- ─────────────────────────────────────────────────────────────────────────
-- RPC: AJUSTE (regra NOVA — por variante + unidade explícita; nunca agregado/negativo)
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.estoque_ajustar_saldo(
  p_operacao_id uuid, p_variante_id uuid, p_unidade_id uuid, p_saldo_contado int, p_motivo text
) returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_prev jsonb; v_hash text; v_atual int; v_dif int; v_dir text; v_tipo text; v_mov uuid; v_result jsonb;
begin
  v_uid := public.estoque__assert();
  if p_saldo_contado is null or p_saldo_contado < 0 then raise exception 'AJUSTE_NEGATIVO'; end if;
  if coalesce(trim(p_motivo),'') = '' then raise exception 'MOTIVO_OBRIGATORIO'; end if;
  v_hash := md5(jsonb_build_object('v',p_variante_id,'u',p_unidade_id,'s',p_saldo_contado,'m',p_motivo)::text);
  v_prev := public.estoque__op_begin(p_operacao_id, 'AJUSTE', v_uid, v_hash);
  if v_prev is not null then return v_prev; end if;

  -- garante linha + trava SOMENTE a unidade informada (nunca agregado entre unidades)
  insert into public.concremrh_estoque_saldos(variante_id, unidade_id, quantidade, updated_by)
  values (p_variante_id, p_unidade_id, 0, v_uid) on conflict (variante_id, unidade_id) do nothing;
  select quantidade into v_atual from public.concremrh_estoque_saldos
    where variante_id = p_variante_id and unidade_id = p_unidade_id for update;

  if p_saldo_contado = v_atual then raise exception 'AJUSTE_SEM_ALTERACAO'; end if;
  v_dif := p_saldo_contado - v_atual;
  v_dir := case when v_dif > 0 then 'IN' else 'OUT' end;
  v_tipo := case when v_dif > 0 then 'AJUSTE_ENTRADA' else 'AJUSTE_SAIDA' end;

  update public.concremrh_estoque_saldos set quantidade = p_saldo_contado, updated_at = now(), updated_by = v_uid
    where variante_id = p_variante_id and unidade_id = p_unidade_id;

  insert into public.concremrh_estoque_movimentacoes(numero, tipo, unidade_id, operacao_id, referencia_tipo, observacao, created_by)
  values (public.estoque__numero('ADJ'), v_tipo, p_unidade_id, p_operacao_id, 'AJUSTE', p_motivo, v_uid) returning id into v_mov;
  insert into public.concremrh_estoque_movimentacao_itens(movimentacao_id, variante_id, quantidade, direcao, saldo_anterior, saldo_posterior)
  values (v_mov, p_variante_id, abs(v_dif), v_dir, v_atual, p_saldo_contado);

  v_result := jsonb_build_object('ok', true, 'saldo_anterior', v_atual, 'saldo_novo', p_saldo_contado, 'diferenca', v_dif);
  perform public.estoque__audit('AJUSTE', p_variante_id, v_tipo, v_uid, p_operacao_id, jsonb_build_object('quantidade', v_atual), v_result, p_motivo);
  perform public.estoque__op_finish(p_operacao_id, v_result);
  return v_result;
end $$;

-- ─────────────────────────────────────────────────────────────────────────
-- RPC: CANCELAR ENTREGA (estorna saldo; bloqueia se há devolução ATIVA vinculada)
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.estoque_cancelar_entrega(p_operacao_id uuid, p_entrega_id uuid, p_motivo text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_prev jsonb; v_hash text; v_row record; v_it record; v_mov uuid; v_saldo jsonb; v_result jsonb;
begin
  v_uid := public.estoque__assert();
  if coalesce(trim(p_motivo),'') = '' then raise exception 'MOTIVO_OBRIGATORIO'; end if;
  v_hash := md5(jsonb_build_object('e',p_entrega_id,'m',p_motivo)::text);
  v_prev := public.estoque__op_begin(p_operacao_id, 'CANCELAR_ENTREGA', v_uid, v_hash);
  if v_prev is not null then return v_prev; end if;

  select * into v_row from public.concremrh_estoque_entregas where id = p_entrega_id for update;
  if v_row.id is null then raise exception 'ENTREGA_INEXISTENTE'; end if;
  if v_row.status = 'CANCELADA' then raise exception 'JA_CANCELADA'; end if;
  if exists (select 1 from public.concremrh_estoque_devolucoes where entrega_id = p_entrega_id and status = 'ATIVA') then
    raise exception 'POSSUI_DEVOLUCOES_VINCULADAS';
  end if;

  insert into public.concremrh_estoque_movimentacoes(numero, tipo, unidade_id, operacao_id, referencia_tipo, referencia_id, observacao, created_by)
  values (public.estoque__numero('EST'), 'ESTORNO_ENTREGA', v_row.unidade_id, p_operacao_id, 'ENTREGA', p_entrega_id, p_motivo, v_uid) returning id into v_mov;
  for v_it in select variante_id, quantidade from public.concremrh_estoque_entrega_itens where entrega_id = p_entrega_id order by variante_id loop
    v_saldo := public.estoque__saldo_incrementa(v_it.variante_id, v_row.unidade_id, v_it.quantidade, v_uid);
    insert into public.concremrh_estoque_movimentacao_itens(movimentacao_id, variante_id, quantidade, direcao, saldo_anterior, saldo_posterior)
    values (v_mov, v_it.variante_id, v_it.quantidade, 'IN', (v_saldo->>'anterior')::int, (v_saldo->>'posterior')::int);
  end loop;

  update public.concremrh_estoque_entregas set status = 'CANCELADA', cancelado_em = now(), motivo_cancelamento = p_motivo where id = p_entrega_id;
  update public.concremrh_estoque_termos set status = 'CANCELADO', cancelado_em = now(), motivo_cancelamento = p_motivo where entrega_id = p_entrega_id and status <> 'CANCELADO';

  v_result := jsonb_build_object('ok', true, 'entrega_id', p_entrega_id, 'movimentacao_id', v_mov);
  perform public.estoque__audit('ENTREGA', p_entrega_id, 'CANCEL_ENTREGA', v_uid, p_operacao_id, null, v_result, p_motivo);
  perform public.estoque__op_finish(p_operacao_id, v_result);
  return v_result;
end $$;

-- ─────────────────────────────────────────────────────────────────────────
-- RPC: ESTORNAR DEVOLUÇÃO (reverte reestocagem com guard; bloqueia 2º estorno)
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.estoque_estornar_devolucao(p_operacao_id uuid, p_devolucao_id uuid, p_unidade_id uuid, p_motivo text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid; v_prev jsonb; v_hash text; v_row record; v_mov uuid; v_saldo jsonb; v_result jsonb;
begin
  v_uid := public.estoque__assert();
  if coalesce(trim(p_motivo),'') = '' then raise exception 'MOTIVO_OBRIGATORIO'; end if;
  v_hash := md5(jsonb_build_object('d',p_devolucao_id,'u',p_unidade_id,'m',p_motivo)::text);
  v_prev := public.estoque__op_begin(p_operacao_id, 'ESTORNAR_DEVOLUCAO', v_uid, v_hash);
  if v_prev is not null then return v_prev; end if;

  select * into v_row from public.concremrh_estoque_devolucoes where id = p_devolucao_id for update;
  if v_row.id is null then raise exception 'DEVOLUCAO_INEXISTENTE'; end if;
  if v_row.status = 'ESTORNADA' then raise exception 'JA_ESTORNADA'; end if;

  if v_row.reestocado then
    insert into public.concremrh_estoque_movimentacoes(numero, tipo, unidade_id, operacao_id, referencia_tipo, referencia_id, observacao, created_by)
    values (public.estoque__numero('EST'), 'ESTORNO_DEVOLUCAO', p_unidade_id, p_operacao_id, 'DEVOLUCAO', p_devolucao_id, p_motivo, v_uid) returning id into v_mov;
    v_saldo := public.estoque__saldo_baixa(v_row.variante_id, p_unidade_id, v_row.quantidade, v_uid);  -- guard: impede negativo
    insert into public.concremrh_estoque_movimentacao_itens(movimentacao_id, variante_id, quantidade, direcao, saldo_anterior, saldo_posterior)
    values (v_mov, v_row.variante_id, v_row.quantidade, 'OUT', (v_saldo->>'anterior')::int, (v_saldo->>'posterior')::int);
  end if;

  update public.concremrh_estoque_devolucoes set status = 'ESTORNADA', estornado_em = now(), motivo_estorno = p_motivo where id = p_devolucao_id;
  v_result := jsonb_build_object('ok', true, 'devolucao_id', p_devolucao_id);
  perform public.estoque__audit('DEVOLUCAO', p_devolucao_id, 'ESTORNO_DEVOLUCAO', v_uid, p_operacao_id, null, v_result, p_motivo);
  perform public.estoque__op_finish(p_operacao_id, v_result);
  return v_result;
end $$;

-- ─────────────────────────────────────────────────────────────────────────
-- GRANTS: revogar público; conceder só a authenticated (RPC gatada por auth.uid()).
-- service_role já tem acesso total. Internos (__*) não são concedidos a authenticated.
-- ─────────────────────────────────────────────────────────────────────────
do $$
declare fn text;
begin
  foreach fn in array array[
    'estoque_registrar_entrada(uuid,uuid,date,jsonb,uuid,text,jsonb)',
    'estoque_registrar_entrega(uuid,uuid,uuid,text,jsonb,text,numeric)',
    'estoque_registrar_devolucao(uuid,uuid,uuid,uuid,integer,text,text,text)',
    'estoque_registrar_troca(uuid,uuid,uuid,uuid,uuid,integer,text)',
    'estoque_ajustar_saldo(uuid,uuid,uuid,integer,text)',
    'estoque_cancelar_entrega(uuid,uuid,text)',
    'estoque_estornar_devolucao(uuid,uuid,uuid,text)',
    'estoque_usuario_atual()','estoque_tem_acesso()'
  ]
  loop
    execute format('revoke all on function public.%s from public, anon;', fn);
    execute format('grant execute on function public.%s to authenticated;', fn);
  end loop;
end $$;

commit;

-- ============================================================================
-- ROLLBACK (transação separada):
--   drop function if exists public.estoque_registrar_entrada(uuid,uuid,date,jsonb,uuid,text,jsonb);
--   drop function if exists public.estoque_registrar_entrega(uuid,uuid,uuid,text,jsonb,text,numeric);
--   drop function if exists public.estoque_registrar_devolucao(uuid,uuid,uuid,uuid,integer,text,text,text);
--   drop function if exists public.estoque_registrar_troca(uuid,uuid,uuid,uuid,uuid,integer,text);
--   drop function if exists public.estoque_ajustar_saldo(uuid,uuid,uuid,integer,text);
--   drop function if exists public.estoque_cancelar_entrega(uuid,uuid,text);
--   drop function if exists public.estoque_estornar_devolucao(uuid,uuid,uuid,text);
--   drop function if exists public.estoque__aplicar_entrega(uuid,uuid,uuid,uuid,text,text,numeric,jsonb);
--   drop function if exists public.estoque__aplicar_devolucao(uuid,uuid,uuid,uuid,uuid,integer,text,text,text);
--   drop function if exists public.estoque__saldo_incrementa(uuid,uuid,integer,uuid);
--   drop function if exists public.estoque__saldo_baixa(uuid,uuid,integer,uuid);
--   drop function if exists public.estoque__op_begin(uuid,text,uuid,text);
--   drop function if exists public.estoque__op_finish(uuid,jsonb);
--   drop function if exists public.estoque__audit(text,uuid,text,uuid,uuid,jsonb,jsonb,text);
--   drop function if exists public.estoque__numero(text);
--   drop function if exists public.estoque__assert();
--   drop function if exists public.estoque_usuario_atual();
--   drop function if exists public.estoque_tem_acesso();
-- ============================================================================
