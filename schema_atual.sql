-- schema_atual.sql — dump autoritativo do projeto ctntlgvoefdbjxvfkahp
-- Gerado por introspecao (pg) em 2026-07-07. Apenas schema public, objetos concremrh_ + helpers.
-- NAO aplicar no banco antigo. Base para as migrations do NOVO projeto.

SET check_function_bodies = off;
create extension if not exists pgcrypto;

-- ============ ENUMS ============
create type public.app_role as enum ('admin', 'rh_manager', 'user');

-- ============ FUNCTIONS / RPCs ============
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

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

-- ============ TABLES ============
create table public.concremrh_avaliacoes_desempenho (
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

create table public.concremrh_base_premiacao (
  id uuid default gen_random_uuid(),
  nome text,
  descricao text,
  valor_base numeric(10,2),
  tipo character varying(20) default 'percentual'::character varying,
  ativo boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.concremrh_cargos (
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

create table public.concremrh_categorias (
  id uuid default gen_random_uuid(),
  nome text,
  descricao text,
  cor character varying(7),
  ativo boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.concremrh_configuracoes_kits (
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

create table public.concremrh_dss (
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

create table public.concremrh_empresas (
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

create table public.concremrh_epi (
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

create table public.concremrh_estrutura_hierarquica (
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

create table public.concremrh_faixas (
  id uuid default gen_random_uuid(),
  nome text,
  valor numeric default 0,
  categoria_id uuid,
  ativo boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.concremrh_faltas_advertencias (
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

create table public.concremrh_formulas_calculo (
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

create table public.concremrh_funcionarios (
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

create table public.concremrh_funcionarios_setores (
  funcionario_id uuid,
  setor_id uuid,
  created_at timestamp with time zone default now()
);

create table public.concremrh_funcoes (
  id uuid default gen_random_uuid(),
  nome text,
  descricao text,
  nivel_hierarquico integer default 1,
  ativo boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.concremrh_historico_cargos (
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

create table public.concremrh_hr_applications (
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

create table public.concremrh_indicadores_gerais (
  id uuid default gen_random_uuid(),
  tipo_indicador_id uuid,
  competencia date,
  meta numeric,
  realizado numeric,
  percentual numeric,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.concremrh_indicadores_setor (
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

create table public.concremrh_locais_dss (
  id uuid default gen_random_uuid(),
  nome text,
  descricao text,
  ativo boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.concremrh_plano_carreira (
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

create table public.concremrh_producao_setor (
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

create table public.concremrh_resultados_premiacao (
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

create table public.concremrh_setores (
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

create table public.concremrh_tipos_indicadores (
  id uuid default gen_random_uuid(),
  codigo character varying(10),
  nome text,
  descricao text,
  ativo boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.concremrh_tipos_indicadores_gerais (
  id uuid default gen_random_uuid(),
  nome text,
  codigo character varying(10),
  descricao text,
  ativo boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.concremrh_user_application_permissions (
  id uuid default gen_random_uuid(),
  user_id uuid,
  application_id uuid,
  granted_by uuid,
  granted_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.concremrh_user_roles (
  id uuid default gen_random_uuid(),
  user_id uuid,
  role app_role,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.concremrh_usuarios (
  id uuid default gen_random_uuid(),
  auth_user_id uuid,
  email text,
  nome text,
  perfil text,
  ativo boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  senha_hash text,
  secoes jsonb default '[]'::jsonb
);

-- ============ CONSTRAINTS (PK/UNIQUE/CHECK, depois FK) ============
alter table public.concremrh_avaliacoes_desempenho add constraint concremrh_avaliacoes_desempenho_pkey PRIMARY KEY (id);
alter table public.concremrh_base_premiacao add constraint concremrh_base_premiacao_pkey PRIMARY KEY (id);
alter table public.concremrh_cargos add constraint concremrh_cargos_pkey PRIMARY KEY (id);
alter table public.concremrh_categorias add constraint concremrh_categorias_pkey PRIMARY KEY (id);
alter table public.concremrh_configuracoes_kits add constraint concremrh_configuracoes_kits_pkey PRIMARY KEY (id);
alter table public.concremrh_configuracoes_kits add constraint concremrh_configuracoes_kits_vigencia_uq UNIQUE (vigencia_inicio);
alter table public.concremrh_dss add constraint concremrh_dss_pkey PRIMARY KEY (id);
alter table public.concremrh_empresas add constraint concremrh_empresas_cnpj_key UNIQUE (cnpj);
alter table public.concremrh_empresas add constraint concremrh_empresas_pkey PRIMARY KEY (id);
alter table public.concremrh_epi add constraint concremrh_epi_pkey PRIMARY KEY (id);
alter table public.concremrh_estrutura_hierarquica add constraint concremrh_estrutura_hierarquica_cargo_id_key UNIQUE (cargo_id);
alter table public.concremrh_estrutura_hierarquica add constraint concremrh_estrutura_hierarquica_pkey PRIMARY KEY (id);
alter table public.concremrh_faixas add constraint concremrh_faixas_pkey PRIMARY KEY (id);
alter table public.concremrh_faltas_advertencias add constraint concremrh_faltas_advertencias_pkey PRIMARY KEY (id);
alter table public.concremrh_formulas_calculo add constraint concremrh_formulas_calculo_pkey PRIMARY KEY (id);
alter table public.concremrh_funcionarios add constraint concremrh_funcionarios_cpf_key UNIQUE (cpf);
alter table public.concremrh_funcionarios add constraint concremrh_funcionarios_pkey PRIMARY KEY (id);
alter table public.concremrh_funcionarios_setores add constraint concremrh_funcionarios_setores_pkey PRIMARY KEY (funcionario_id, setor_id);
alter table public.concremrh_funcoes add constraint concremrh_funcoes_pkey PRIMARY KEY (id);
alter table public.concremrh_historico_cargos add constraint concremrh_historico_cargos_pkey PRIMARY KEY (id);
alter table public.concremrh_hr_applications add constraint concremrh_hr_applications_code_key UNIQUE (code);
alter table public.concremrh_hr_applications add constraint concremrh_hr_applications_pkey PRIMARY KEY (id);
alter table public.concremrh_indicadores_gerais add constraint concremrh_indicadores_gerais_pkey PRIMARY KEY (id);
alter table public.concremrh_indicadores_setor add constraint concremrh_indicadores_setor_pkey PRIMARY KEY (id);
alter table public.concremrh_locais_dss add constraint concremrh_locais_dss_pkey PRIMARY KEY (id);
alter table public.concremrh_plano_carreira add constraint concremrh_plano_carreira_cargo_origem_id_cargo_destino_id_key UNIQUE (cargo_origem_id, cargo_destino_id);
alter table public.concremrh_plano_carreira add constraint concremrh_plano_carreira_pkey PRIMARY KEY (id);
alter table public.concremrh_producao_setor add constraint concremrh_producao_setor_pkey PRIMARY KEY (id);
alter table public.concremrh_resultados_premiacao add constraint concremrh_resultados_premiaca_mes_competencia_base_premiaca_key UNIQUE (mes_competencia, base_premiacao_id, funcionario_id);
alter table public.concremrh_resultados_premiacao add constraint concremrh_resultados_premiacao_pkey PRIMARY KEY (id);
alter table public.concremrh_setores add constraint concremrh_setores_pkey PRIMARY KEY (id);
alter table public.concremrh_tipos_indicadores add constraint concremrh_tipos_indicadores_codigo_key UNIQUE (codigo);
alter table public.concremrh_tipos_indicadores add constraint concremrh_tipos_indicadores_pkey PRIMARY KEY (id);
alter table public.concremrh_tipos_indicadores_gerais add constraint concremrh_tipos_indicadores_gerais_codigo_key UNIQUE (codigo);
alter table public.concremrh_tipos_indicadores_gerais add constraint concremrh_tipos_indicadores_gerais_pkey PRIMARY KEY (id);
alter table public.concremrh_user_application_permissions add constraint concremrh_user_application_permissio_user_id_application_id_key UNIQUE (user_id, application_id);
alter table public.concremrh_user_application_permissions add constraint concremrh_user_application_permissions_pkey PRIMARY KEY (id);
alter table public.concremrh_user_roles add constraint concremrh_user_roles_pkey PRIMARY KEY (id);
alter table public.concremrh_user_roles add constraint concremrh_user_roles_user_id_role_key UNIQUE (user_id, role);
alter table public.concremrh_usuarios add constraint concremrh_usuarios_auth_user_id_key UNIQUE (auth_user_id);
alter table public.concremrh_usuarios add constraint concremrh_usuarios_email_key UNIQUE (email);
alter table public.concremrh_usuarios add constraint concremrh_usuarios_perfil_check CHECK ((perfil = ANY (ARRAY['admin'::text, 'rh'::text, 'sesmt'::text, 'producao'::text])));
alter table public.concremrh_usuarios add constraint concremrh_usuarios_pkey PRIMARY KEY (id);
alter table public.concremrh_avaliacoes_desempenho add constraint concremrh_avaliacoes_desempenho_avaliador_id_fkey FOREIGN KEY (avaliador_id) REFERENCES concremrh_funcionarios(id) ON DELETE SET NULL;
alter table public.concremrh_avaliacoes_desempenho add constraint concremrh_avaliacoes_desempenho_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES concremrh_funcionarios(id) ON DELETE CASCADE;
alter table public.concremrh_cargos add constraint concremrh_cargos_setor_id_fkey FOREIGN KEY (setor_id) REFERENCES concremrh_setores(id) ON DELETE SET NULL;
alter table public.concremrh_dss add constraint concremrh_dss_local_dss_id_fkey FOREIGN KEY (local_dss_id) REFERENCES concremrh_locais_dss(id) ON DELETE SET NULL;
alter table public.concremrh_dss add constraint concremrh_dss_responsavel_id_fkey FOREIGN KEY (responsavel_id) REFERENCES concremrh_funcionarios(id) ON DELETE SET NULL;
alter table public.concremrh_dss add constraint concremrh_dss_setor_id_fkey FOREIGN KEY (setor_id) REFERENCES concremrh_setores(id) ON DELETE SET NULL;
alter table public.concremrh_epi add constraint concremrh_epi_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES concremrh_funcionarios(id) ON DELETE CASCADE;
alter table public.concremrh_estrutura_hierarquica add constraint concremrh_estrutura_hierarquica_cargo_id_fkey FOREIGN KEY (cargo_id) REFERENCES concremrh_cargos(id) ON DELETE CASCADE;
alter table public.concremrh_estrutura_hierarquica add constraint concremrh_estrutura_hierarquica_cargo_superior_id_fkey FOREIGN KEY (cargo_superior_id) REFERENCES concremrh_cargos(id) ON DELETE SET NULL;
alter table public.concremrh_faixas add constraint concremrh_faixas_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES concremrh_categorias(id) ON DELETE SET NULL;
alter table public.concremrh_faltas_advertencias add constraint concremrh_faltas_advertencias_aplicado_por_fkey FOREIGN KEY (aplicado_por) REFERENCES concremrh_funcionarios(id) ON DELETE SET NULL;
alter table public.concremrh_faltas_advertencias add constraint concremrh_faltas_advertencias_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES concremrh_funcionarios(id) ON DELETE CASCADE;
alter table public.concremrh_formulas_calculo add constraint concremrh_formulas_calculo_base_premiacao_id_fkey FOREIGN KEY (base_premiacao_id) REFERENCES concremrh_base_premiacao(id) ON DELETE SET NULL;
alter table public.concremrh_formulas_calculo add constraint concremrh_formulas_calculo_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES concremrh_categorias(id) ON DELETE SET NULL;
alter table public.concremrh_funcionarios add constraint concremrh_funcionarios_base_premiacao_id_fkey FOREIGN KEY (base_premiacao_id) REFERENCES concremrh_base_premiacao(id) ON DELETE SET NULL;
alter table public.concremrh_funcionarios add constraint concremrh_funcionarios_categoria_id_fkey FOREIGN KEY (categoria_id) REFERENCES concremrh_categorias(id) ON DELETE SET NULL;
alter table public.concremrh_funcionarios add constraint concremrh_funcionarios_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES concremrh_empresas(id) ON DELETE CASCADE;
alter table public.concremrh_funcionarios add constraint concremrh_funcionarios_faixa_id_fkey FOREIGN KEY (faixa_id) REFERENCES concremrh_faixas(id) ON DELETE SET NULL;
alter table public.concremrh_funcionarios add constraint concremrh_funcionarios_funcao_id_fkey FOREIGN KEY (funcao_id) REFERENCES concremrh_funcoes(id) ON DELETE SET NULL;
alter table public.concremrh_funcionarios add constraint concremrh_funcionarios_local_dss_id_fkey FOREIGN KEY (local_dss_id) REFERENCES concremrh_locais_dss(id) ON DELETE SET NULL;
alter table public.concremrh_funcionarios add constraint concremrh_funcionarios_setor_id_fkey FOREIGN KEY (setor_id) REFERENCES concremrh_setores(id) ON DELETE SET NULL;
alter table public.concremrh_funcionarios_setores add constraint concremrh_funcionarios_setores_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES concremrh_funcionarios(id) ON DELETE CASCADE;
alter table public.concremrh_funcionarios_setores add constraint concremrh_funcionarios_setores_setor_id_fkey FOREIGN KEY (setor_id) REFERENCES concremrh_setores(id) ON DELETE CASCADE;
alter table public.concremrh_historico_cargos add constraint concremrh_historico_cargos_aprovado_por_fkey FOREIGN KEY (aprovado_por) REFERENCES concremrh_funcionarios(id) ON DELETE SET NULL;
alter table public.concremrh_historico_cargos add constraint concremrh_historico_cargos_cargo_anterior_id_fkey FOREIGN KEY (cargo_anterior_id) REFERENCES concremrh_cargos(id) ON DELETE SET NULL;
alter table public.concremrh_historico_cargos add constraint concremrh_historico_cargos_cargo_id_fkey FOREIGN KEY (cargo_id) REFERENCES concremrh_cargos(id) ON DELETE SET NULL;
alter table public.concremrh_historico_cargos add constraint concremrh_historico_cargos_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES concremrh_funcionarios(id) ON DELETE CASCADE;
alter table public.concremrh_indicadores_gerais add constraint concremrh_indicadores_gerais_tipo_indicador_id_fkey FOREIGN KEY (tipo_indicador_id) REFERENCES concremrh_tipos_indicadores_gerais(id) ON DELETE RESTRICT;
alter table public.concremrh_indicadores_setor add constraint concremrh_indicadores_setor_setor_id_fkey FOREIGN KEY (setor_id) REFERENCES concremrh_setores(id) ON DELETE SET NULL;
alter table public.concremrh_plano_carreira add constraint concremrh_plano_carreira_cargo_destino_id_fkey FOREIGN KEY (cargo_destino_id) REFERENCES concremrh_cargos(id) ON DELETE CASCADE;
alter table public.concremrh_plano_carreira add constraint concremrh_plano_carreira_cargo_origem_id_fkey FOREIGN KEY (cargo_origem_id) REFERENCES concremrh_cargos(id) ON DELETE CASCADE;
alter table public.concremrh_producao_setor add constraint concremrh_producao_setor_setor_id_fkey FOREIGN KEY (setor_id) REFERENCES concremrh_setores(id) ON DELETE CASCADE;
alter table public.concremrh_resultados_premiacao add constraint concremrh_resultados_premiacao_base_premiacao_id_fkey FOREIGN KEY (base_premiacao_id) REFERENCES concremrh_base_premiacao(id) ON DELETE SET NULL;
alter table public.concremrh_resultados_premiacao add constraint concremrh_resultados_premiacao_funcionario_id_fkey FOREIGN KEY (funcionario_id) REFERENCES concremrh_funcionarios(id) ON DELETE SET NULL;
alter table public.concremrh_setores add constraint concremrh_setores_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES concremrh_empresas(id) ON DELETE CASCADE;
alter table public.concremrh_setores add constraint concremrh_setores_encarregado_id_fkey FOREIGN KEY (encarregado_id) REFERENCES concremrh_funcionarios(id) ON DELETE SET NULL;
alter table public.concremrh_setores add constraint concremrh_setores_supervisor_id_fkey FOREIGN KEY (supervisor_id) REFERENCES concremrh_funcionarios(id) ON DELETE SET NULL;
alter table public.concremrh_user_application_permissions add constraint concremrh_user_application_permissions_application_id_fkey FOREIGN KEY (application_id) REFERENCES concremrh_hr_applications(id) ON DELETE CASCADE;

-- ============ INDEXES ============
CREATE INDEX idx_concremrh_avaliacoes_data ON public.concremrh_avaliacoes_desempenho USING btree (data_avaliacao DESC);
CREATE INDEX idx_concremrh_avaliacoes_funcionario ON public.concremrh_avaliacoes_desempenho USING btree (funcionario_id);
CREATE INDEX idx_concremrh_avaliacoes_status ON public.concremrh_avaliacoes_desempenho USING btree (status);
CREATE INDEX idx_concremrh_cargos_ativo ON public.concremrh_cargos USING btree (ativo);
CREATE INDEX idx_concremrh_cargos_nome ON public.concremrh_cargos USING btree (nome);
CREATE INDEX idx_concremrh_cargos_setor ON public.concremrh_cargos USING btree (setor_id);
CREATE INDEX idx_concremrh_dss_local_dss_id ON public.concremrh_dss USING btree (local_dss_id);
CREATE INDEX idx_concremrh_estrutura_hierarquica_cargo ON public.concremrh_estrutura_hierarquica USING btree (cargo_id);
CREATE INDEX idx_concremrh_estrutura_hierarquica_nivel ON public.concremrh_estrutura_hierarquica USING btree (nivel_hierarquico);
CREATE INDEX idx_concremrh_estrutura_hierarquica_superior ON public.concremrh_estrutura_hierarquica USING btree (cargo_superior_id);
CREATE INDEX idx_concremrh_funcionarios_faixa_id ON public.concremrh_funcionarios USING btree (faixa_id);
CREATE INDEX idx_concremrh_funcionarios_local_dss_id ON public.concremrh_funcionarios USING btree (local_dss_id);
CREATE INDEX concremrh_funcionarios_setores_setor_id_idx ON public.concremrh_funcionarios_setores USING btree (setor_id);
CREATE INDEX idx_concremrh_historico_cargos_data ON public.concremrh_historico_cargos USING btree (data_mudanca DESC);
CREATE INDEX idx_concremrh_historico_cargos_funcionario ON public.concremrh_historico_cargos USING btree (funcionario_id);
CREATE INDEX idx_concremrh_historico_cargos_tipo ON public.concremrh_historico_cargos USING btree (tipo_mudanca);
CREATE UNIQUE INDEX idx_concremrh_indicadores_gerais_unique ON public.concremrh_indicadores_gerais USING btree (tipo_indicador_id, competencia);
CREATE INDEX idx_concremrh_plano_carreira_destino ON public.concremrh_plano_carreira USING btree (cargo_destino_id);
CREATE INDEX idx_concremrh_plano_carreira_origem ON public.concremrh_plano_carreira USING btree (cargo_origem_id);
CREATE INDEX idx_concremrh_plano_carreira_tipo ON public.concremrh_plano_carreira USING btree (tipo_progressao);

-- ============ TRIGGERS ============
CREATE TRIGGER update_concremrh_avaliacoes_desempenho_updated_at BEFORE UPDATE ON public.concremrh_avaliacoes_desempenho FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_concremrh_base_premiacao_updated_at BEFORE UPDATE ON public.concremrh_base_premiacao FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_concremrh_cargos_updated_at BEFORE UPDATE ON public.concremrh_cargos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_concremrh_categorias_updated_at BEFORE UPDATE ON public.concremrh_categorias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_concremrh_dss_updated_at BEFORE UPDATE ON public.concremrh_dss FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_concremrh_empresas_updated_at BEFORE UPDATE ON public.concremrh_empresas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_concremrh_epi_updated_at BEFORE UPDATE ON public.concremrh_epi FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_concremrh_estrutura_hierarquica_updated_at BEFORE UPDATE ON public.concremrh_estrutura_hierarquica FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_concremrh_faixas_updated_at BEFORE UPDATE ON public.concremrh_faixas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_concremrh_faltas_advertencias_updated_at BEFORE UPDATE ON public.concremrh_faltas_advertencias FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_concremrh_formulas_calculo_updated_at BEFORE UPDATE ON public.concremrh_formulas_calculo FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_concremrh_funcionarios_updated_at BEFORE UPDATE ON public.concremrh_funcionarios FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_concremrh_funcoes_updated_at BEFORE UPDATE ON public.concremrh_funcoes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_concremrh_historico_cargos_updated_at BEFORE UPDATE ON public.concremrh_historico_cargos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_concremrh_hr_applications_updated_at BEFORE UPDATE ON public.concremrh_hr_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_concremrh_indicadores_gerais_updated_at BEFORE UPDATE ON public.concremrh_indicadores_gerais FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_concremrh_indicadores_setor_updated_at BEFORE UPDATE ON public.concremrh_indicadores_setor FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_concremrh_locais_dss_updated_at BEFORE UPDATE ON public.concremrh_locais_dss FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_concremrh_plano_carreira_updated_at BEFORE UPDATE ON public.concremrh_plano_carreira FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_concremrh_producao_setor_updated_at BEFORE UPDATE ON public.concremrh_producao_setor FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_concremrh_resultados_premiacao_updated_at BEFORE UPDATE ON public.concremrh_resultados_premiacao FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_concremrh_setores_updated_at BEFORE UPDATE ON public.concremrh_setores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_concremrh_tipos_indicadores_updated_at BEFORE UPDATE ON public.concremrh_tipos_indicadores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_concremrh_tipos_indicadores_gerais_updated_at BEFORE UPDATE ON public.concremrh_tipos_indicadores_gerais FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_concremrh_user_application_permissions_updated_at BEFORE UPDATE ON public.concremrh_user_application_permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_concremrh_user_roles_updated_at BEFORE UPDATE ON public.concremrh_user_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============ RLS ENABLE ============
alter table public.concremrh_avaliacoes_desempenho enable row level security;
alter table public.concremrh_base_premiacao enable row level security;
alter table public.concremrh_cargos enable row level security;
alter table public.concremrh_categorias enable row level security;
alter table public.concremrh_configuracoes_kits enable row level security;
alter table public.concremrh_dss enable row level security;
alter table public.concremrh_empresas enable row level security;
alter table public.concremrh_epi enable row level security;
alter table public.concremrh_estrutura_hierarquica enable row level security;
alter table public.concremrh_faixas enable row level security;
alter table public.concremrh_faltas_advertencias enable row level security;
alter table public.concremrh_formulas_calculo enable row level security;
alter table public.concremrh_funcionarios enable row level security;
alter table public.concremrh_funcionarios_setores enable row level security;
alter table public.concremrh_funcoes enable row level security;
alter table public.concremrh_historico_cargos enable row level security;
alter table public.concremrh_hr_applications enable row level security;
alter table public.concremrh_indicadores_gerais enable row level security;
alter table public.concremrh_indicadores_setor enable row level security;
alter table public.concremrh_locais_dss enable row level security;
alter table public.concremrh_plano_carreira enable row level security;
alter table public.concremrh_producao_setor enable row level security;
alter table public.concremrh_resultados_premiacao enable row level security;
alter table public.concremrh_setores enable row level security;
alter table public.concremrh_tipos_indicadores enable row level security;
alter table public.concremrh_tipos_indicadores_gerais enable row level security;
alter table public.concremrh_user_application_permissions enable row level security;
alter table public.concremrh_user_roles enable row level security;
alter table public.concremrh_usuarios enable row level security;

-- ============ POLICIES ============
create policy "allow_all_concremrh_avaliacoes_desempenho" on public.concremrh_avaliacoes_desempenho as permissive for all to public using (true) with check (true);
create policy "allow_all_concremrh_base_premiacao" on public.concremrh_base_premiacao as permissive for all to public using (true) with check (true);
create policy "allow_all_concremrh_cargos" on public.concremrh_cargos as permissive for all to public using (true) with check (true);
create policy "allow_all_concremrh_categorias" on public.concremrh_categorias as permissive for all to public using (true) with check (true);
create policy "Acesso total para usuários autenticados" on public.concremrh_configuracoes_kits as permissive for all to public using (true) with check (true);
create policy "allow_all_concremrh_dss" on public.concremrh_dss as permissive for all to public using (true) with check (true);
create policy "allow_all_concremrh_empresas" on public.concremrh_empresas as permissive for all to public using (true) with check (true);
create policy "allow_all_concremrh_epi" on public.concremrh_epi as permissive for all to public using (true) with check (true);
create policy "allow_all_concremrh_estrutura_hierarquica" on public.concremrh_estrutura_hierarquica as permissive for all to public using (true) with check (true);
create policy "allow_all_concremrh_faixas" on public.concremrh_faixas as permissive for all to public using (true) with check (true);
create policy "allow_all_concremrh_faltas_advertencias" on public.concremrh_faltas_advertencias as permissive for all to public using (true) with check (true);
create policy "allow_all_concremrh_formulas_calculo" on public.concremrh_formulas_calculo as permissive for all to public using (true) with check (true);
create policy "allow_all_concremrh_funcionarios" on public.concremrh_funcionarios as permissive for all to public using (true) with check (true);
create policy "allow_all_concremrh_funcionarios_setores" on public.concremrh_funcionarios_setores as permissive for all to public using (true) with check (true);
create policy "allow_all_concremrh_funcoes" on public.concremrh_funcoes as permissive for all to public using (true) with check (true);
create policy "allow_all_concremrh_historico_cargos" on public.concremrh_historico_cargos as permissive for all to public using (true) with check (true);
create policy "allow_all_concremrh_hr_applications" on public.concremrh_hr_applications as permissive for all to public using (true) with check (true);
create policy "allow_all_concremrh_indicadores_gerais" on public.concremrh_indicadores_gerais as permissive for all to public using (true) with check (true);
create policy "allow_all_concremrh_indicadores_setor" on public.concremrh_indicadores_setor as permissive for all to public using (true) with check (true);
create policy "allow_all_concremrh_locais_dss" on public.concremrh_locais_dss as permissive for all to public using (true) with check (true);
create policy "allow_all_concremrh_plano_carreira" on public.concremrh_plano_carreira as permissive for all to public using (true) with check (true);
create policy "allow_all_concremrh_producao_setor" on public.concremrh_producao_setor as permissive for all to public using (true) with check (true);
create policy "allow_all_concremrh_resultados_premiacao" on public.concremrh_resultados_premiacao as permissive for all to public using (true) with check (true);
create policy "allow_all_concremrh_setores" on public.concremrh_setores as permissive for all to public using (true) with check (true);
create policy "allow_all_concremrh_tipos_indicadores" on public.concremrh_tipos_indicadores as permissive for all to public using (true) with check (true);
create policy "allow_all_concremrh_tipos_indicadores_gerais" on public.concremrh_tipos_indicadores_gerais as permissive for all to public using (true) with check (true);
create policy "allow_all_concremrh_user_application_permissions" on public.concremrh_user_application_permissions as permissive for all to public using (true) with check (true);
create policy "allow_all_concremrh_user_roles" on public.concremrh_user_roles as permissive for all to public using (true) with check (true);
create policy "Admin gerencia usuarios" on public.concremrh_usuarios as permissive for all to authenticated using ((get_my_perfil() = 'admin'::text)) with check ((get_my_perfil() = 'admin'::text));
create policy "Autenticados podem ler" on public.concremrh_usuarios as permissive for select to authenticated using (true);
