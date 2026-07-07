-- 0002_tables_core.sql
-- Tabelas de organizacao (empresas, setores, funcionarios, etc.)
-- Projeto NOVO Supabase (Reforma V2). Gerado por introspeccao em 2026-07-07 do projeto ctntlgvoefdbjxvfkahp.
-- Revisar antes de aplicar. Aplicar em ordem 0001..0010.

create table if not exists public.concremrh_empresas (
  id uuid default gen_random_uuid(),
  nome text,
  cnpj character varying(18),
  email text,
  telefone character varying(20),
  endereco text,
  ativo boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
alter table public.concremrh_empresas add constraint concremrh_empresas_cnpj_key UNIQUE (cnpj);
alter table public.concremrh_empresas add constraint concremrh_empresas_pkey PRIMARY KEY (id);

create table if not exists public.concremrh_setores (
  id uuid default gen_random_uuid(),
  nome text,
  descricao text,
  empresa_id uuid,
  supervisor_id uuid,
  encarregado_id uuid,
  ativo boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
alter table public.concremrh_setores add constraint concremrh_setores_pkey PRIMARY KEY (id);

create table if not exists public.concremrh_funcoes (
  id uuid default gen_random_uuid(),
  nome text,
  descricao text,
  nivel_hierarquico integer default 1,
  ativo boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
alter table public.concremrh_funcoes add constraint concremrh_funcoes_pkey PRIMARY KEY (id);

create table if not exists public.concremrh_categorias (
  id uuid default gen_random_uuid(),
  nome text,
  descricao text,
  cor character varying(7),
  ativo boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
alter table public.concremrh_categorias add constraint concremrh_categorias_pkey PRIMARY KEY (id);

create table if not exists public.concremrh_faixas (
  id uuid default gen_random_uuid(),
  nome text,
  valor numeric default 0,
  categoria_id uuid,
  ativo boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
alter table public.concremrh_faixas add constraint concremrh_faixas_pkey PRIMARY KEY (id);

create table if not exists public.concremrh_base_premiacao (
  id uuid default gen_random_uuid(),
  nome text,
  descricao text,
  valor_base numeric(10,2),
  tipo character varying(20) default 'percentual'::character varying,
  ativo boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
alter table public.concremrh_base_premiacao add constraint concremrh_base_premiacao_pkey PRIMARY KEY (id);

create table if not exists public.concremrh_hr_applications (
  id uuid default gen_random_uuid(),
  code character varying(50),
  name text,
  description text,
  icon text,
  color character varying(20),
  route text,
  is_active boolean default true,
  display_order integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
alter table public.concremrh_hr_applications add constraint concremrh_hr_applications_code_key UNIQUE (code);
alter table public.concremrh_hr_applications add constraint concremrh_hr_applications_pkey PRIMARY KEY (id);

create table if not exists public.concremrh_funcionarios (
  id uuid default gen_random_uuid(),
  user_id uuid,
  nome text,
  cpf character varying(14),
  email text,
  telefone character varying(20),
  data_nascimento date,
  data_admissao date,
  data_demissao date,
  salario numeric(10,2),
  empresa_id uuid,
  setor_id uuid,
  funcao_id uuid,
  categoria_id uuid,
  base_premiacao_id uuid,
  faixa_id uuid,
  local_dss_id uuid,
  status character varying(50) default 'Ativo'::character varying,
  valor_fixo numeric(10,2),
  ativo boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  setor_ids uuid[]
);
alter table public.concremrh_funcionarios add constraint concremrh_funcionarios_cpf_key UNIQUE (cpf);
alter table public.concremrh_funcionarios add constraint concremrh_funcionarios_pkey PRIMARY KEY (id);
CREATE INDEX idx_concremrh_funcionarios_faixa_id ON public.concremrh_funcionarios USING btree (faixa_id);
CREATE INDEX idx_concremrh_funcionarios_local_dss_id ON public.concremrh_funcionarios USING btree (local_dss_id);

create table if not exists public.concremrh_funcionarios_setores (
  funcionario_id uuid,
  setor_id uuid,
  created_at timestamp with time zone default now()
);
alter table public.concremrh_funcionarios_setores add constraint concremrh_funcionarios_setores_pkey PRIMARY KEY (funcionario_id, setor_id);
CREATE INDEX concremrh_funcionarios_setores_setor_id_idx ON public.concremrh_funcionarios_setores USING btree (setor_id);

