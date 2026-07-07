-- 0005_tables_cargos_rh.sql
-- Tabelas de cargos e RH
-- Projeto NOVO Supabase (Reforma V2). Gerado por introspeccao em 2026-07-07 do projeto ctntlgvoefdbjxvfkahp.
-- Revisar antes de aplicar. Aplicar em ordem 0001..0010.

create table if not exists public.concremrh_cargos (
  id uuid default gen_random_uuid(),
  nome text,
  setor_id uuid,
  nivel_hierarquico integer,
  missao text,
  responsabilidades text[],
  atividades text[],
  competencias text[],
  requisitos text,
  salario_minimo numeric,
  salario_maximo numeric,
  observacoes text,
  ativo boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
alter table public.concremrh_cargos add constraint concremrh_cargos_pkey PRIMARY KEY (id);
CREATE INDEX idx_concremrh_cargos_ativo ON public.concremrh_cargos USING btree (ativo);
CREATE INDEX idx_concremrh_cargos_nome ON public.concremrh_cargos USING btree (nome);
CREATE INDEX idx_concremrh_cargos_setor ON public.concremrh_cargos USING btree (setor_id);

create table if not exists public.concremrh_plano_carreira (
  id uuid default gen_random_uuid(),
  cargo_origem_id uuid,
  cargo_destino_id uuid,
  tipo_progressao character varying(50),
  tempo_minimo_meses integer,
  requisitos text[],
  competencias_necessarias text[],
  descricao text,
  ativo boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
alter table public.concremrh_plano_carreira add constraint concremrh_plano_carreira_cargo_origem_id_cargo_destino_id_key UNIQUE (cargo_origem_id, cargo_destino_id);
alter table public.concremrh_plano_carreira add constraint concremrh_plano_carreira_pkey PRIMARY KEY (id);
CREATE INDEX idx_concremrh_plano_carreira_destino ON public.concremrh_plano_carreira USING btree (cargo_destino_id);
CREATE INDEX idx_concremrh_plano_carreira_origem ON public.concremrh_plano_carreira USING btree (cargo_origem_id);
CREATE INDEX idx_concremrh_plano_carreira_tipo ON public.concremrh_plano_carreira USING btree (tipo_progressao);

create table if not exists public.concremrh_historico_cargos (
  id uuid default gen_random_uuid(),
  funcionario_id uuid,
  cargo_id uuid,
  cargo_anterior_id uuid,
  salario_anterior numeric,
  salario_novo numeric,
  data_mudanca date,
  tipo_mudanca character varying(50),
  motivo text,
  aprovado_por uuid,
  observacoes text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
alter table public.concremrh_historico_cargos add constraint concremrh_historico_cargos_pkey PRIMARY KEY (id);
CREATE INDEX idx_concremrh_historico_cargos_data ON public.concremrh_historico_cargos USING btree (data_mudanca DESC);
CREATE INDEX idx_concremrh_historico_cargos_funcionario ON public.concremrh_historico_cargos USING btree (funcionario_id);
CREATE INDEX idx_concremrh_historico_cargos_tipo ON public.concremrh_historico_cargos USING btree (tipo_mudanca);

create table if not exists public.concremrh_avaliacoes_desempenho (
  id uuid default gen_random_uuid(),
  funcionario_id uuid,
  avaliador_id uuid,
  data_avaliacao date,
  periodo_inicio date,
  periodo_fim date,
  nota_geral numeric(3,2),
  competencias_avaliadas jsonb,
  pontos_fortes text[],
  pontos_melhoria text[],
  objetivos_alcancados text[],
  comentarios text,
  elegivel_promocao boolean default false,
  status character varying(50) default 'em_andamento'::character varying,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
alter table public.concremrh_avaliacoes_desempenho add constraint concremrh_avaliacoes_desempenho_pkey PRIMARY KEY (id);
CREATE INDEX idx_concremrh_avaliacoes_data ON public.concremrh_avaliacoes_desempenho USING btree (data_avaliacao DESC);
CREATE INDEX idx_concremrh_avaliacoes_funcionario ON public.concremrh_avaliacoes_desempenho USING btree (funcionario_id);
CREATE INDEX idx_concremrh_avaliacoes_status ON public.concremrh_avaliacoes_desempenho USING btree (status);

create table if not exists public.concremrh_estrutura_hierarquica (
  id uuid default gen_random_uuid(),
  cargo_id uuid,
  cargo_superior_id uuid,
  nivel_hierarquico integer default 0,
  pode_aprovar_mudancas boolean default false,
  quantidade_subordinados_diretos integer default 0,
  ativo boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
alter table public.concremrh_estrutura_hierarquica add constraint concremrh_estrutura_hierarquica_cargo_id_key UNIQUE (cargo_id);
alter table public.concremrh_estrutura_hierarquica add constraint concremrh_estrutura_hierarquica_pkey PRIMARY KEY (id);
CREATE INDEX idx_concremrh_estrutura_hierarquica_cargo ON public.concremrh_estrutura_hierarquica USING btree (cargo_id);
CREATE INDEX idx_concremrh_estrutura_hierarquica_nivel ON public.concremrh_estrutura_hierarquica USING btree (nivel_hierarquico);
CREATE INDEX idx_concremrh_estrutura_hierarquica_superior ON public.concremrh_estrutura_hierarquica USING btree (cargo_superior_id);

