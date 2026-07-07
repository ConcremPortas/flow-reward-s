-- 0003_tables_eventos.sql
-- Tabelas de eventos (dss, epi, faltas, producao, indicadores)
-- Projeto NOVO Supabase (Reforma V2). Gerado por introspeccao em 2026-07-07 do projeto ctntlgvoefdbjxvfkahp.
-- Revisar antes de aplicar. Aplicar em ordem 0001..0010.

create table if not exists public.concremrh_locais_dss (
  id uuid default gen_random_uuid(),
  nome text,
  descricao text,
  ativo boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
alter table public.concremrh_locais_dss add constraint concremrh_locais_dss_pkey PRIMARY KEY (id);

create table if not exists public.concremrh_dss (
  id uuid default gen_random_uuid(),
  titulo text,
  descricao text,
  data_realizacao date,
  setor_id uuid,
  responsavel_id uuid,
  participantes_ids uuid[],
  topics text[],
  observacoes text,
  local_dss_id uuid,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
alter table public.concremrh_dss add constraint concremrh_dss_pkey PRIMARY KEY (id);
CREATE INDEX idx_concremrh_dss_local_dss_id ON public.concremrh_dss USING btree (local_dss_id);

create table if not exists public.concremrh_epi (
  id uuid default gen_random_uuid(),
  funcionario_id uuid,
  tipo_epi text,
  descricao text,
  numero_ca character varying(20),
  data_entrega date,
  data_vencimento date,
  status character varying(20) default 'entregue'::character varying,
  observacoes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
alter table public.concremrh_epi add constraint concremrh_epi_pkey PRIMARY KEY (id);

create table if not exists public.concremrh_faltas_advertencias (
  id uuid default gen_random_uuid(),
  funcionario_id uuid,
  tipo character varying(20),
  motivo text,
  descricao text,
  data_ocorrencia date,
  quantidade integer default 1,
  gravidade character varying(20) default 'leve'::character varying,
  aplicado_por uuid,
  observacoes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
alter table public.concremrh_faltas_advertencias add constraint concremrh_faltas_advertencias_pkey PRIMARY KEY (id);

create table if not exists public.concremrh_producao_setor (
  id uuid default gen_random_uuid(),
  setor_id uuid,
  data_producao date,
  meta_diaria numeric(10,2),
  producao_realizada numeric(10,2),
  unidade_medida character varying(20) default 'unidades'::character varying,
  observacoes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
alter table public.concremrh_producao_setor add constraint concremrh_producao_setor_pkey PRIMARY KEY (id);

create table if not exists public.concremrh_tipos_indicadores (
  id uuid default gen_random_uuid(),
  codigo character varying(10),
  nome text,
  descricao text,
  ativo boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
alter table public.concremrh_tipos_indicadores add constraint concremrh_tipos_indicadores_codigo_key UNIQUE (codigo);
alter table public.concremrh_tipos_indicadores add constraint concremrh_tipos_indicadores_pkey PRIMARY KEY (id);

create table if not exists public.concremrh_tipos_indicadores_gerais (
  id uuid default gen_random_uuid(),
  nome text,
  codigo character varying(10),
  descricao text,
  ativo boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
alter table public.concremrh_tipos_indicadores_gerais add constraint concremrh_tipos_indicadores_gerais_codigo_key UNIQUE (codigo);
alter table public.concremrh_tipos_indicadores_gerais add constraint concremrh_tipos_indicadores_gerais_pkey PRIMARY KEY (id);

create table if not exists public.concremrh_indicadores_setor (
  id uuid default gen_random_uuid(),
  setor_id uuid,
  competencia date,
  hora_maquina_meta numeric,
  hora_maquina_realizado numeric,
  hora_maquina_percentual numeric,
  identificacao_nc_meta numeric,
  identificacao_nc_realizado numeric,
  identificacao_nc_percentual numeric,
  limpeza_meta numeric,
  limpeza_realizado numeric,
  limpeza_percentual numeric,
  tratamento_nc_meta numeric,
  tratamento_nc_realizado numeric,
  tratamento_nc_percentual numeric,
  operacao_segura_meta numeric,
  operacao_segura_realizado numeric,
  operacao_segura_percentual numeric,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
alter table public.concremrh_indicadores_setor add constraint concremrh_indicadores_setor_pkey PRIMARY KEY (id);

create table if not exists public.concremrh_indicadores_gerais (
  id uuid default gen_random_uuid(),
  tipo_indicador_id uuid,
  competencia date,
  meta numeric,
  realizado numeric,
  percentual numeric,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
alter table public.concremrh_indicadores_gerais add constraint concremrh_indicadores_gerais_pkey PRIMARY KEY (id);
CREATE UNIQUE INDEX idx_concremrh_indicadores_gerais_unique ON public.concremrh_indicadores_gerais USING btree (tipo_indicador_id, competencia);

