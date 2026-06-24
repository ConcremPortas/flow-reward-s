-- Tabela de configurações de comissão de Kits com vigência por mês
-- Permite ajustar os parâmetros de cálculo sem afetar premiações anteriores
create table if not exists concremrh_configuracoes_kits (
  id uuid default gen_random_uuid() primary key,
  vigencia_inicio text not null, -- formato YYYY-MM (mês a partir do qual esta config vale)
  minimo_kits integer not null default 10000,
  incremento_faixa integer not null default 250,
  bonus_base numeric not null default 100,
  bonus_por_faixa numeric not null default 25,
  ativo boolean not null default true,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  constraint concremrh_configuracoes_kits_vigencia_uq unique (vigencia_inicio)
);

-- Configuração padrão (regra original, sem data de início = vale desde sempre)
insert into concremrh_configuracoes_kits (vigencia_inicio, minimo_kits, incremento_faixa, bonus_base, bonus_por_faixa)
values ('2000-01', 10000, 250, 100, 25);

-- RLS
alter table concremrh_configuracoes_kits enable row level security;

create policy "Acesso total para usuários autenticados"
  on concremrh_configuracoes_kits
  for all
  using (true)
  with check (true);
