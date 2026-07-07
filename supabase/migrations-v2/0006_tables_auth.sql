-- 0006_tables_auth.sql
-- Tabelas de autenticacao (usuarios, roles, permissoes)
-- Projeto NOVO Supabase (Reforma V2). Gerado por introspeccao em 2026-07-07 do projeto ctntlgvoefdbjxvfkahp.
-- Revisar antes de aplicar. Aplicar em ordem 0001..0010.

create table if not exists public.concremrh_usuarios (
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
alter table public.concremrh_usuarios add constraint concremrh_usuarios_auth_user_id_key UNIQUE (auth_user_id);
alter table public.concremrh_usuarios add constraint concremrh_usuarios_email_key UNIQUE (email);
alter table public.concremrh_usuarios add constraint concremrh_usuarios_perfil_check CHECK ((perfil = ANY (ARRAY['admin'::text, 'rh'::text, 'sesmt'::text, 'producao'::text])));
alter table public.concremrh_usuarios add constraint concremrh_usuarios_pkey PRIMARY KEY (id);

create table if not exists public.concremrh_user_roles (
  id uuid default gen_random_uuid(),
  user_id uuid,
  role app_role,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
alter table public.concremrh_user_roles add constraint concremrh_user_roles_pkey PRIMARY KEY (id);
alter table public.concremrh_user_roles add constraint concremrh_user_roles_user_id_role_key UNIQUE (user_id, role);

create table if not exists public.concremrh_user_application_permissions (
  id uuid default gen_random_uuid(),
  user_id uuid,
  application_id uuid,
  granted_by uuid,
  granted_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);
alter table public.concremrh_user_application_permissions add constraint concremrh_user_application_permissio_user_id_application_id_key UNIQUE (user_id, application_id);
alter table public.concremrh_user_application_permissions add constraint concremrh_user_application_permissions_pkey PRIMARY KEY (id);

