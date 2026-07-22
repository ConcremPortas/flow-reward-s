-- ============================================================================
-- 0001_turnstile_lockdown.sql  (PROPOSTA — aplicar MANUALMENTE, por último)
-- ----------------------------------------------------------------------------
-- Torna o gate do Turnstile À PROVA DE BYPASS: remove a permissão de o cliente
-- chamar concremrh_verify_login diretamente (com a chave anon). Depois disto, a
-- validação de credenciais só acontece dentro da Edge Function "turnstile-login"
-- (service role), que antes valida o token do Turnstile.
--
-- ⚠️ ORDEM DE APLICAÇÃO OBRIGATÓRIA (senão o login quebra):
--    1. Publicar a função:      supabase functions deploy turnstile-login
--    2. Definir o secret:       supabase secrets set TURNSTILE_SECRET_KEY=<sua_secret>
--    3. Publicar o frontend com VITE_TURNSTILE_SITE_KEY definido
--    4. Validar o login end-to-end em produção
--    5. SÓ ENTÃO aplicar este arquivo
--
-- Projeto real: ewfebwljhmcvuopopqpb. Fora de supabase/migrations/ de propósito
-- (não roda em CI/db push). Rollback ao final.
-- ============================================================================

-- A função é SECURITY DEFINER; o service role sempre pode executá-la.
-- Removemos o acesso de anon/authenticated (assinaturas com e sem argumentos
-- default; ajuste os tipos se a sua assinatura divergir de (text, text)).
revoke execute on function public.concremrh_verify_login(text, text) from anon, authenticated;

-- Garante explicitamente que o service role executa (Edge Function turnstile-login/auth-bridge).
grant execute on function public.concremrh_verify_login(text, text) to service_role;

-- ----------------------------------------------------------------------------
-- ROLLBACK (se precisar voltar ao login direto pela anon key):
--   grant execute on function public.concremrh_verify_login(text, text) to anon, authenticated;
-- ----------------------------------------------------------------------------
