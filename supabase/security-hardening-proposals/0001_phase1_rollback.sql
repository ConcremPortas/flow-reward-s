-- ============================================================================
-- ROLLBACK da Fase 1 — restaura as RPCs ORIGINAIS (sem authz) de 0008_functions_rpc.sql
-- Use apenas se precisar reverter 0001_phase1_harden_user_rpcs.sql.
-- ATENCAO: reverter reabre o risco critico C1 (anon cria admin / reseta senha).
-- ============================================================================

-- Remove as assinaturas ENDURECIDAS (com credenciais de admin)
drop function if exists public.concremrh_create_user(text, text, text, text, text, text, jsonb);
drop function if exists public.concremrh_update_user_password(text, text, uuid, text);

-- Restaura create_user original (identico ao 0008)
create or replace function public.concremrh_create_user(
  p_nome text, p_email text, p_senha text, p_perfil text, p_secoes jsonb
) returns jsonb
  language plpgsql
  security definer
as $function$
declare new_id uuid;
begin
  insert into concremrh_usuarios (nome, email, senha_hash, perfil, secoes, ativo)
  values (p_nome, p_email, crypt(p_senha, gen_salt('bf')), p_perfil, p_secoes, true)
  returning id into new_id;
  return jsonb_build_object('ok', true, 'id', new_id::text);
exception when unique_violation then
  return jsonb_build_object('ok', false, 'error', 'E-mail já cadastrado');
end;
$function$;

-- Restaura update_user_password original (identico ao 0008)
create or replace function public.concremrh_update_user_password(
  p_id uuid, p_senha text
) returns void
  language plpgsql
  security definer
as $function$
begin
  update concremrh_usuarios
  set senha_hash = crypt(p_senha, gen_salt('bf')), updated_at = now()
  where id = p_id;
end;
$function$;
