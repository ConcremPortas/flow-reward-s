-- ============================================================================
-- PROPOSTA — Controle de Estoque · 0007_fix_entrada_audit.sql
-- CORREÇÃO: estoque_registrar_entrada passava '' (string vazia) como p_id (uuid)
-- para estoque__audit, causando "invalid input syntax for type uuid: \"\"" ao
-- registrar entrada. Deve passar v_mov (id da movimentação criada).
--
-- Rode ESTE arquivo (create or replace — idempotente, seguro) após já ter
-- aplicado o 0002. Corrige apenas a função de entrada; nada mais muda.
-- ============================================================================

begin;

create or replace function public.estoque_registrar_entrada(
  p_operacao_id uuid, p_unidade_id uuid, p_data_entrada date,
  p_itens jsonb,
  p_fornecedor_id uuid default null, p_observacao text default null,
  p_documento jsonb default null
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
  -- CORRIGIDO: v_mov no lugar de '' (p_id é uuid).
  perform public.estoque__audit('ENTRADA', v_mov, 'ENTRADA', v_uid, p_operacao_id, null, v_result, p_observacao);
  perform public.estoque__op_finish(p_operacao_id, v_result);
  return v_result;
end $$;

commit;
