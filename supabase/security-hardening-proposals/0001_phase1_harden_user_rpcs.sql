-- ============================================================================
-- PROPOSTA (Fase 1) — NÃO APLICAR AINDA
-- Endurece as RPCs criticas de gestao de usuario (risco C1 do SECURITY_AUDIT_V2.md)
-- SEM depender de Supabase Auth: exige RE-AUTENTICACAO de um admin (email+senha)
-- validada dentro da funcao SECURITY DEFINER antes de qualquer escrita.
--
-- Efeito: mesmo sendo executavel por `anon`, a funcao so age se o chamador
-- provar ser um admin ativo (senha conferida via bcrypt). Fecha:
--   - concremrh_create_user  -> anon nao consegue mais criar admin
--   - concremrh_update_user_password -> anon nao consegue mais resetar senha
--
-- Reversivel: ver 0001_phase1_rollback.sql (restaura as assinaturas/definicoes originais).
-- Requer: extensao pgcrypto (ja presente). Pareia com a mudanca de frontend proposta
-- em SECURITY_HARDENING_PLAN_V2.md (§ Impacto no frontend).
-- ============================================================================

-- Remove as assinaturas ANTIGAS (sem authz). Novas assinaturas incluem credenciais do admin.
drop function if exists public.concremrh_create_user(text, text, text, text, jsonb);
drop function if exists public.concremrh_update_user_password(uuid, text);

-- ---------------------------------------------------------------------------
-- create_user com checagem de admin (re-autenticacao)
-- Nova assinatura: (p_admin_email, p_admin_password, p_nome, p_email, p_senha, p_perfil, p_secoes)
-- ---------------------------------------------------------------------------
create or replace function public.concremrh_create_user(
  p_admin_email text,
  p_admin_password text,
  p_nome text,
  p_email text,
  p_senha text,
  p_perfil text,
  p_secoes jsonb
) returns jsonb
  language plpgsql
  security definer
  set search_path = public
as $function$
declare
  v_admin record;
  new_id uuid;
begin
  -- authz: o chamador precisa provar que e um admin ativo
  select id, perfil, senha_hash into v_admin
  from concremrh_usuarios
  where email = p_admin_email and ativo = true and senha_hash is not null;

  if not found
     or v_admin.senha_hash <> crypt(p_admin_password, v_admin.senha_hash)
     or v_admin.perfil <> 'admin' then
    return jsonb_build_object('ok', false, 'error', 'Não autorizado');
  end if;

  insert into concremrh_usuarios (nome, email, senha_hash, perfil, secoes, ativo)
  values (p_nome, p_email, crypt(p_senha, gen_salt('bf')), p_perfil, p_secoes, true)
  returning id into new_id;

  return jsonb_build_object('ok', true, 'id', new_id::text);
exception when unique_violation then
  return jsonb_build_object('ok', false, 'error', 'E-mail já cadastrado');
end;
$function$;

-- ---------------------------------------------------------------------------
-- update_user_password com checagem de admin (re-autenticacao)
-- Nova assinatura: (p_admin_email, p_admin_password, p_id, p_senha)
-- Retorna jsonb (antes era void) para reportar autorizacao.
-- ---------------------------------------------------------------------------
create or replace function public.concremrh_update_user_password(
  p_admin_email text,
  p_admin_password text,
  p_id uuid,
  p_senha text
) returns jsonb
  language plpgsql
  security definer
  set search_path = public
as $function$
declare
  v_admin record;
begin
  select id, perfil, senha_hash into v_admin
  from concremrh_usuarios
  where email = p_admin_email and ativo = true and senha_hash is not null;

  if not found
     or v_admin.senha_hash <> crypt(p_admin_password, v_admin.senha_hash)
     or v_admin.perfil <> 'admin' then
    return jsonb_build_object('ok', false, 'error', 'Não autorizado');
  end if;

  update concremrh_usuarios
  set senha_hash = crypt(p_senha, gen_salt('bf')), updated_at = now()
  where id = p_id;

  return jsonb_build_object('ok', true);
end;
$function$;

-- NOTA (defesa em profundidade, Fase 2): apos migrar para Supabase Auth e o app
-- passar a chamar como `authenticated`, avaliar tambem:
--   revoke execute on function public.concremrh_create_user(text,text,text,text,text,text,jsonb) from anon;
--   revoke execute on function public.concremrh_update_user_password(text,text,uuid,text) from anon;
-- (NAO fazer isso enquanto o app ainda chamar como anon — quebraria a gestao de usuario.)
