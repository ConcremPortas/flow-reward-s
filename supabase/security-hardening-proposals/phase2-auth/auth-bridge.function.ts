// PROPOSTA (Fase 2) — Edge Function "auth-bridge" — NÃO IMPLANTAR AINDA.
// Migra a senha do usuario para o Supabase Auth no PRIMEIRO login, sem reset e
// sem que o usuario perceba (estrategia "bridge on first login").
//
// Fluxo:
//   1. Recebe { email, password }.
//   2. Valida a senha contra o hash ANTIGO via RPC concremrh_verify_login.
//   3. Se valida: define essa mesma senha no Supabase Auth (admin.updateUserById),
//      garantindo o vinculo auth_user_id, e responde { ok: true }.
//   4. O cliente entao chama supabase.auth.signInWithPassword({ email, password })
//      normalmente — agora o Auth conhece a senha.
//
// SEGURANCA:
//   - Roda no servidor (Edge) com SUPABASE_SERVICE_ROLE_KEY do ambiente do projeto.
//   - NUNCA expor service_role no frontend. Este arquivo e um esqueleto de referencia.
//   - Idealmente aplicar rate limit (a propria plataforma + verificacao).
//
// Deploy (quando aprovado): supabase functions deploy auth-bridge

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req: Request) => {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return new Response(JSON.stringify({ ok: false, error: 'Dados incompletos' }), { status: 400 });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // 1) valida contra o hash antigo (bcrypt) via RPC existente
    const { data: login } = await admin.rpc('concremrh_verify_login', {
      p_email: email, p_password: password,
    });
    if (!login?.ok) {
      return new Response(JSON.stringify({ ok: false, error: 'Credenciais inválidas' }), { status: 401 });
    }

    // 2) descobre o auth_user_id vinculado
    const { data: usuario } = await admin
      .from('concremrh_usuarios')
      .select('id, auth_user_id')
      .eq('id', login.id)
      .single();

    let authUserId = usuario?.auth_user_id;

    // 3) se ainda nao existe auth user, cria; senao, atualiza a senha p/ a informada
    if (!authUserId) {
      const { data: created, error } = await admin.auth.admin.createUser({
        email, password, email_confirm: true,
      });
      if (error) throw error;
      authUserId = created.user.id;
      await admin.from('concremrh_usuarios').update({ auth_user_id: authUserId }).eq('id', login.id);
    } else {
      const { error } = await admin.auth.admin.updateUserById(authUserId, { password });
      if (error) throw error;
    }

    // 4) ok -> o cliente faz signInWithPassword em seguida
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500 });
  }
});
