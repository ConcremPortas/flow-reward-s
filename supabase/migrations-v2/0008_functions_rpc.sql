-- 0008_functions_rpc.sql
-- Funcoes/RPCs usadas pelo app (login, criacao de usuario, setor_ids)
-- Projeto NOVO Supabase (Reforma V2). Gerado por introspeccao em 2026-07-07 do projeto ctntlgvoefdbjxvfkahp.
-- Revisar antes de aplicar. Aplicar em ordem 0001..0010.

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.concremrh_create_user(p_nome text, p_email text, p_senha text, p_perfil text, p_secoes jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE new_id UUID;
BEGIN
  INSERT INTO concremrh_usuarios (nome, email, senha_hash, perfil, secoes, ativo)
  VALUES (p_nome, p_email, crypt(p_senha, gen_salt('bf')), p_perfil, p_secoes, true)
  RETURNING id INTO new_id;
  RETURN jsonb_build_object('ok', true, 'id', new_id::text);
EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('ok', false, 'error', 'E-mail já cadastrado');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.concremrh_update_user_password(p_id uuid, p_senha text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE concremrh_usuarios
  SET senha_hash = crypt(p_senha, gen_salt('bf')), updated_at = now()
  WHERE id = p_id;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.concremrh_verify_login(p_email text, p_password text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE rec RECORD;
BEGIN
  SELECT id, email, nome, perfil, secoes, senha_hash INTO rec
  FROM concremrh_usuarios
  WHERE email = p_email AND ativo = true AND senha_hash IS NOT NULL;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false);
  END IF;

  IF rec.senha_hash = crypt(p_password, rec.senha_hash) THEN
    RETURN jsonb_build_object(
      'ok', true, 'id', rec.id::text, 'email', rec.email,
      'nome', rec.nome, 'perfil', rec.perfil, 'secoes', rec.secoes
    );
  END IF;

  RETURN jsonb_build_object('ok', false);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_all_funcionario_setor_ids()
 RETURNS TABLE(funcionario_id uuid, setor_ids text)
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT id, array_to_string(setor_ids, ',') 
  FROM concremrh_funcionarios 
  WHERE setor_ids IS NOT NULL AND array_length(setor_ids, 1) > 0;
$function$
;

CREATE OR REPLACE FUNCTION public.update_funcionario_setor_ids(p_id uuid, p_setor_ids text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE concremrh_funcionarios 
  SET setor_ids = CASE 
    WHEN p_setor_ids IS NULL OR p_setor_ids = '' THEN NULL
    ELSE string_to_array(p_setor_ids, ',')::uuid[]
  END
  WHERE id = p_id;
END;
$function$
;

