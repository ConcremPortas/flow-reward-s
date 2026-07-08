#!/usr/bin/env node
// PROPOSTA (Fase 2) — NÃO EXECUTAR AINDA.
// Cria um usuario no Supabase Auth para cada concremrh_usuarios que ainda nao
// tem auth_user_id, e grava o vinculo. NAO define a senha real do usuario — a
// senha e migrada no primeiro login pelo bridge (auth-bridge). Aqui usamos uma
// senha aleatoria temporaria so para criar a conta no Auth.
//
// SEGURANCA:
//   - NAO contem credenciais. Le SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY do ambiente.
//   - service_role e SECRETO: rodar apenas em ambiente controlado; nunca commitar.
//
// USO (exemplo, quando aprovado):
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node link-migrate-users.mjs --dry-run
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node link-migrate-users.mjs
//
// Requer: npm i @supabase/supabase-js (ja e dependencia do projeto).

import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';

const URL = process.env.SUPABASE_URL;
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY = process.argv.includes('--dry-run');
if (!URL || !SERVICE) {
  console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.');
  process.exit(1);
}

const admin = createClient(URL, SERVICE, { auth: { autoRefreshToken: false, persistSession: false } });

(async () => {
  // service_role bypassa RLS -> consegue ler todos os usuarios da app
  const { data: usuarios, error } = await admin
    .from('concremrh_usuarios')
    .select('id, email, nome, perfil, auth_user_id, ativo');
  if (error) { console.error('Erro ao ler usuarios:', error.message); process.exit(1); }

  let created = 0, skipped = 0;
  for (const u of usuarios) {
    if (u.auth_user_id) { skipped++; console.log(`= ${u.email}: ja vinculado (${u.auth_user_id})`); continue; }
    if (DRY) { console.log(`~ ${u.email}: criaria auth user + vincularia (dry-run)`); continue; }

    // Senha aleatoria temporaria — o usuario NAO a usa; a senha real e definida no bridge.
    const tempPassword = randomBytes(24).toString('base64url');
    const { data: authUser, error: cErr } = await admin.auth.admin.createUser({
      email: u.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { migrated_from: 'concremrh_usuarios', perfil: u.perfil },
    });
    if (cErr) { console.error(`! ${u.email}: falha ao criar auth user -> ${cErr.message}`); continue; }

    const { error: uErr } = await admin
      .from('concremrh_usuarios')
      .update({ auth_user_id: authUser.user.id })
      .eq('id', u.id);
    if (uErr) { console.error(`! ${u.email}: falha ao gravar auth_user_id -> ${uErr.message}`); continue; }

    created++;
    console.log(`+ ${u.email}: auth user ${authUser.user.id} criado e vinculado`);
  }

  console.log(`\nConcluido. criados=${created} pulados=${skipped} total=${usuarios.length}${DRY ? ' (dry-run)' : ''}`);
})().catch(e => { console.error('FALHA:', e.message); process.exit(1); });
