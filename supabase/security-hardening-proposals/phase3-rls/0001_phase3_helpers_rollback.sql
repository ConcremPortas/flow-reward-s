-- ROLLBACK LOTE 0001 (helpers). Rodar DEPOIS de reverter os lotes 0002-0005
-- (as policies deles dependem destas funcoes).
drop function if exists public.can_write_module(text);
drop function if exists public.can_read_module(text);
drop function if exists public.has_secao(text);
drop function if exists public.has_perfil(text[]);
drop function if exists public.is_admin();
drop function if exists public.current_secoes();
