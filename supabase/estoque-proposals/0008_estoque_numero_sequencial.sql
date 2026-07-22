-- ============================================================================
-- PROPOSTA — Controle de Estoque · 0008_estoque_numero_sequencial.sql
-- Numeração SEQUENCIAL por prefixo (ENT-0001, SAI-0001, DEV-0001, ...) no lugar
-- do formato timestamp+aleatório. Facilita a leitura e a busca.
--
-- Rode APÓS o 0002 (create or replace — idempotente). Não altera os números já
-- gerados (ficam no formato antigo); os NOVOS passam a ser sequenciais por prefixo.
-- Prefixos em uso: ENT (entrada), SAI (entrega), DEV (devolução), ADJ (ajuste),
-- EST (estorno), REC (recibo de entrega), TERMO (termo de responsabilidade).
-- ============================================================================

begin;

-- Contador por prefixo (tabela interna; sem acesso pelo cliente).
create table if not exists public.concremrh_estoque_contadores (
  prefixo text primary key,
  ultimo  bigint not null default 0
);
alter table public.concremrh_estoque_contadores enable row level security;
-- Sem policies: o cliente não acessa; as RPCs (SECURITY DEFINER, dono da tabela)
-- ignoram a RLS. Numeração só ocorre dentro das operações transacionais.

-- Geração atômica: incrementa e devolve PREFIXO-000N (zero à esquerda, 4 dígitos;
-- cresce naturalmente além de 9999). O upsert serializa concorrência por prefixo.
create or replace function public.estoque__numero(p_prefixo text)
returns text language plpgsql volatile security definer set search_path = public as $$
declare v_n bigint;
begin
  insert into public.concremrh_estoque_contadores(prefixo, ultimo)
  values (p_prefixo, 1)
  on conflict (prefixo) do update set ultimo = public.concremrh_estoque_contadores.ultimo + 1
  returning ultimo into v_n;
  return p_prefixo || '-' || lpad(v_n::text, 4, '0');
end $$;

commit;

-- Opcional — continuar a contagem a partir dos registros já existentes (evita
-- repetir números). Rode só se quiser; senão o primeiro novo será ENT-0001.
--   insert into public.concremrh_estoque_contadores(prefixo, ultimo)
--   select 'ENT', count(*) from public.concremrh_estoque_movimentacoes where tipo = 'ENTRADA'
--   on conflict (prefixo) do update set ultimo = excluded.ultimo;

-- ROLLBACK (transação separada) — volta ao formato timestamp:
--   create or replace function public.estoque__numero(p_prefixo text)
--   returns text language sql volatile as $$
--     select p_prefixo || '-' || to_char(now() at time zone 'America/Sao_Paulo','YYYYMMDDHH24MISS')
--            || '-' || upper(substr(md5(random()::text),1,5));
--   $$;
--   drop table if exists public.concremrh_estoque_contadores;
