-- 0004_tables_premiacao.sql
-- Tabelas de premiacao (formulas, config kits, resultados)
-- Projeto NOVO Supabase (Reforma V2). Gerado por introspeccao em 2026-07-07 do projeto ctntlgvoefdbjxvfkahp.
-- Revisar antes de aplicar. Aplicar em ordem 0001..0010.

create table if not exists public.concremrh_formulas_calculo (
  id uuid default gen_random_uuid(),
  categoria_id uuid,
  base_premiacao_id uuid,
  nome text,
  descricao text,
  peso_producao_setor numeric default 0,
  peso_epi numeric default 0,
  peso_faltas numeric default 0,
  peso_advertencias numeric default 0,
  peso_dss numeric default 0,
  ativo boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  peso_faturamento numeric default 0,
  peso_itens_nc numeric default 0,
  peso_tratamento_nc numeric default 0,
  peso_hora_maquina numeric default 0,
  peso_operacao_segura numeric default 0,
  peso_limpeza numeric default 0,
  multiplicador_kits numeric default 1.0
);
alter table public.concremrh_formulas_calculo add constraint concremrh_formulas_calculo_pkey PRIMARY KEY (id);

create table if not exists public.concremrh_configuracoes_kits (
  id uuid default gen_random_uuid(),
  vigencia_inicio text,
  minimo_kits integer default 10000,
  incremento_faixa integer default 250,
  max_faixas integer default 44,
  bonus_base numeric default 100,
  bonus_por_faixa numeric default 25,
  ativo boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
alter table public.concremrh_configuracoes_kits add constraint concremrh_configuracoes_kits_pkey PRIMARY KEY (id);
alter table public.concremrh_configuracoes_kits add constraint concremrh_configuracoes_kits_vigencia_uq UNIQUE (vigencia_inicio);

create table if not exists public.concremrh_resultados_premiacao (
  id uuid default gen_random_uuid(),
  mes_competencia date,
  base_premiacao_id uuid,
  funcionario_id uuid,
  cod_funcionario text,
  nome text,
  setor text,
  funcao text,
  categoria text,
  faixa text,
  valor_faixa numeric,
  percentual_producao numeric,
  nota_producao numeric,
  nota_epi numeric default 0,
  nota_faltas numeric default 0,
  nota_advertencias numeric default 0,
  nota_dss numeric default 0,
  nota_faturamento numeric(5,4),
  nota_itens_nc numeric(5,4),
  nota_tratamento_nc numeric(5,4),
  nota_hora_maquina numeric(5,4),
  nota_operacao_segura numeric(5,4),
  nota_limpeza numeric(5,4),
  valor_kits numeric,
  nota_geral numeric,
  bonus_possivel numeric,
  bonus_alcancado numeric,
  valor_fixo numeric(10,2),
  valor_ajustado numeric(10,2),
  observacao_ajuste text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
alter table public.concremrh_resultados_premiacao add constraint concremrh_resultados_premiaca_mes_competencia_base_premiaca_key UNIQUE (mes_competencia, base_premiacao_id, funcionario_id);
alter table public.concremrh_resultados_premiacao add constraint concremrh_resultados_premiacao_pkey PRIMARY KEY (id);

