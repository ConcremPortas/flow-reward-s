-- ============================================================================
-- PROPOSTA — módulo Controle de Estoque (Gestão de Fardamentos)
-- 0001_estoque_schema.sql  ·  Schema base `concremrh_estoque_*`
--
-- ⚠️  NÃO APLICAR AUTOMATICAMENTE. Este arquivo fica FORA de supabase/migrations/
--     de propósito (não entra no `supabase db push`/CI). Aplicar manualmente,
--     por um operador, no projeto REAL da app (ewfebwljhmcvuopopqpb), SOMENTE
--     após o gate de autenticação estar fechado (VITE_AUTH_MODE=supabase efetivo).
--
-- Decisões aplicadas (Fases 2B–2D):
--   • Mesmo banco da app; sem migração de dados (tabelas nascem vazias).
--   • Reuso por FK das entidades corporativas (funcionarios/empresas/setores/usuarios).
--   • Timestamps no padrão do banco: created_at/updated_at + trigger update_updated_at_column.
--   • tamanhos: UNIQUE(tipo, lower(rotulo)); unicidade textual com lower() onde aplicável.
--   • devolucoes.responsavel_id = usuario (não texto livre).
--   • saldo NUNCA negativo (CHECK) — mutação só via RPC (0002, futura).
--   • RLS habilitada (deny-all por padrão até as policies do 0003, futuro).
--   • Enums = text + CHECK (evolutivo).
--
-- Ordem: criar tabelas nesta ordem (dependências). ROLLBACK ao final (ordem inversa).
-- Executar como role com privilégio de DDL. NÃO cria RPCs, policies nem bucket.
-- ============================================================================

begin;

-- ─────────────────────────────────────────────────────────────────────────
-- CADASTROS
-- ─────────────────────────────────────────────────────────────────────────

-- Unidade de estoque (depósito/almoxarifado). NÃO é a empresa; empresa 1—N unidades.
create table if not exists public.concremrh_estoque_unidades (
  id           uuid primary key default gen_random_uuid(),
  codigo       text not null,
  nome         text not null,
  empresa_id   uuid not null references public.concremrh_empresas(id) on delete restrict,
  setor_id     uuid references public.concremrh_setores(id) on delete set null,
  descricao    text,
  ativo        boolean not null default true,
  created_at   timestamp with time zone not null default now(),
  updated_at   timestamp with time zone not null default now(),
  created_by   uuid references public.concremrh_usuarios(id) on delete set null,
  updated_by   uuid references public.concremrh_usuarios(id) on delete set null
);
comment on table public.concremrh_estoque_unidades is 'Ponto físico/lógico de estoque (depósito). Empresa 1-N unidades.';
create unique index if not exists uq_estoque_unidade_codigo
  on public.concremrh_estoque_unidades (empresa_id, lower(codigo));
create index if not exists ix_estoque_unidade_empresa on public.concremrh_estoque_unidades (empresa_id);

-- Fornecedores (entidade própria do módulo — não existe no ERP).
create table if not exists public.concremrh_estoque_fornecedores (
  id               uuid primary key default gen_random_uuid(),
  razao_social     text not null,
  nome_fantasia    text,
  cnpj             text,
  email            text,
  telefone         text,
  endereco         text,
  contato          text,
  categorias       text,
  prazo_entrega_dias integer check (prazo_entrega_dias is null or prazo_entrega_dias >= 0),
  observacoes      text,
  ativo            boolean not null default true,
  created_at       timestamp with time zone not null default now(),
  updated_at       timestamp with time zone not null default now(),
  created_by       uuid references public.concremrh_usuarios(id) on delete set null,
  updated_by       uuid references public.concremrh_usuarios(id) on delete set null
);
create unique index if not exists uq_estoque_fornecedor_cnpj
  on public.concremrh_estoque_fornecedores (cnpj) where cnpj is not null;

-- Catálogo de fardamentos: categoria → modelo → variante (SKU); tamanhos à parte.
create table if not exists public.concremrh_estoque_categorias (
  id         uuid primary key default gen_random_uuid(),
  nome       text not null,
  ativo      boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);
create unique index if not exists uq_estoque_categoria_nome
  on public.concremrh_estoque_categorias (lower(nome));

create table if not exists public.concremrh_estoque_modelos (
  id           uuid primary key default gen_random_uuid(),
  nome         text not null,
  descricao    text,
  categoria_id uuid not null references public.concremrh_estoque_categorias(id) on delete restrict,
  ativo        boolean not null default true,
  created_at   timestamp with time zone not null default now(),
  updated_at   timestamp with time zone not null default now()
);
create index if not exists ix_estoque_modelo_categoria on public.concremrh_estoque_modelos (categoria_id);

create table if not exists public.concremrh_estoque_tamanhos (
  id         uuid primary key default gen_random_uuid(),
  rotulo     text not null,
  tipo       text not null check (tipo in ('ROUPA','CALCADO')),
  ordem      integer not null default 0,
  ativo      boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);
-- UNIQUE(tipo, rotulo) case-insensitive (ajuste aprovado).
create unique index if not exists uq_estoque_tamanho_tipo_rotulo
  on public.concremrh_estoque_tamanhos (tipo, lower(rotulo));

create table if not exists public.concremrh_estoque_variantes (
  id                    uuid primary key default gen_random_uuid(),
  codigo_interno        text not null,
  codigo_barras         text,
  nome                  text not null,
  descricao             text,
  modelo_id             uuid not null references public.concremrh_estoque_modelos(id) on delete restrict,
  tamanho_id            uuid not null references public.concremrh_estoque_tamanhos(id) on delete restrict,
  fornecedor_id         uuid references public.concremrh_estoque_fornecedores(id) on delete set null,
  genero                text not null default 'UNISSEX',
  cor                   text,
  material              text,
  marca                 text,
  localizacao           text,
  custo_unitario        numeric(12,2) not null default 0 check (custo_unitario >= 0),
  estoque_minimo_padrao integer not null default 0 check (estoque_minimo_padrao >= 0),
  foto_url              text,
  ativo                 boolean not null default true,
  deletado_em           timestamp with time zone,
  deletado_por          uuid references public.concremrh_usuarios(id) on delete set null,
  motivo_delecao        text,
  created_at            timestamp with time zone not null default now(),
  updated_at            timestamp with time zone not null default now(),
  created_by            uuid references public.concremrh_usuarios(id) on delete set null,
  updated_by            uuid references public.concremrh_usuarios(id) on delete set null
);
create unique index if not exists uq_estoque_variante_codigo
  on public.concremrh_estoque_variantes (lower(codigo_interno));
create index if not exists ix_estoque_variante_modelo on public.concremrh_estoque_variantes (modelo_id);

-- Extensão de medidas do colaborador (NÃO altera concremrh_funcionarios). Decisão §13.
create table if not exists public.concremrh_estoque_funcionario_medidas (
  funcionario_id      uuid primary key references public.concremrh_funcionarios(id) on delete cascade,
  tamanho_camisa_id   uuid references public.concremrh_estoque_tamanhos(id) on delete set null,
  tamanho_calca_id    uuid references public.concremrh_estoque_tamanhos(id) on delete set null,
  tamanho_calcado_id  uuid references public.concremrh_estoque_tamanhos(id) on delete set null,
  observacoes         text,
  updated_at          timestamp with time zone not null default now(),
  updated_by          uuid references public.concremrh_usuarios(id) on delete set null
);

-- ─────────────────────────────────────────────────────────────────────────
-- SALDO (variante × unidade) — mutado SOMENTE via RPC (0002). Nunca negativo.
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.concremrh_estoque_saldos (
  id             uuid primary key default gen_random_uuid(),
  variante_id    uuid not null references public.concremrh_estoque_variantes(id) on delete restrict,
  unidade_id     uuid not null references public.concremrh_estoque_unidades(id) on delete restrict,
  quantidade     integer not null default 0 check (quantidade >= 0),
  estoque_minimo integer check (estoque_minimo is null or estoque_minimo >= 0),
  estoque_ideal  integer check (estoque_ideal is null or estoque_ideal >= 0),
  updated_at     timestamp with time zone not null default now(),
  updated_by     uuid references public.concremrh_usuarios(id) on delete set null,
  constraint uq_estoque_saldo unique (variante_id, unidade_id)
);
create index if not exists ix_estoque_saldo_unidade on public.concremrh_estoque_saldos (unidade_id);
-- Suporte à listagem de alertas (qtd <= minimo).
create index if not exists ix_estoque_saldo_alerta
  on public.concremrh_estoque_saldos (unidade_id) where quantidade <= coalesce(estoque_minimo, 0);

-- ─────────────────────────────────────────────────────────────────────────
-- IDEMPOTÊNCIA das operações (Fase 2C §11)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.concremrh_estoque_operacoes (
  operacao_id  uuid primary key,
  tipo         text not null check (tipo in (
                 'ENTRADA','ENTREGA','DEVOLUCAO','TROCA','AJUSTE',
                 'CANCELAR_ENTREGA','ESTORNAR_DEVOLUCAO')),
  usuario_id   uuid not null references public.concremrh_usuarios(id) on delete restrict,
  status       text not null default 'EM_ANDAMENTO' check (status in ('EM_ANDAMENTO','CONCLUIDA','ERRO')),
  params_hash  text not null,
  resultado    jsonb,
  erro         text,
  iniciado_em  timestamp with time zone not null default now(),
  concluido_em timestamp with time zone
);

-- ─────────────────────────────────────────────────────────────────────────
-- MOVIMENTAÇÕES (imutáveis) + itens
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.concremrh_estoque_movimentacoes (
  id              uuid primary key default gen_random_uuid(),
  numero          text not null,
  tipo            text not null check (tipo in (
                    'ENTRADA','AJUSTE_ENTRADA','AJUSTE_SAIDA','ENTREGA',
                    'DEVOLUCAO','ESTORNO_ENTREGA','ESTORNO_DEVOLUCAO')),
  unidade_id      uuid not null references public.concremrh_estoque_unidades(id) on delete restrict,
  operacao_id     uuid references public.concremrh_estoque_operacoes(operacao_id) on delete set null,
  referencia_tipo text,
  referencia_id   uuid,
  observacao      text,
  created_by      uuid not null references public.concremrh_usuarios(id) on delete restrict,
  created_at      timestamp with time zone not null default now(),
  constraint uq_estoque_mov_numero unique (numero)
);
create index if not exists ix_estoque_mov_created on public.concremrh_estoque_movimentacoes (created_at desc);
create index if not exists ix_estoque_mov_tipo on public.concremrh_estoque_movimentacoes (tipo);

create table if not exists public.concremrh_estoque_movimentacao_itens (
  id              uuid primary key default gen_random_uuid(),
  movimentacao_id uuid not null references public.concremrh_estoque_movimentacoes(id) on delete restrict,
  variante_id     uuid not null references public.concremrh_estoque_variantes(id) on delete restrict,
  quantidade      integer not null check (quantidade > 0),
  direcao         text not null check (direcao in ('IN','OUT')),
  saldo_anterior  integer not null,
  saldo_posterior integer not null,
  valor_unitario  numeric(12,2)
);
create index if not exists ix_estoque_mov_item_variante on public.concremrh_estoque_movimentacao_itens (variante_id);
create index if not exists ix_estoque_mov_item_mov on public.concremrh_estoque_movimentacao_itens (movimentacao_id);

-- Metadata de NF (arquivo fica no Supabase Storage — bucket privado, 0004 futuro).
create table if not exists public.concremrh_estoque_entrada_documentos (
  id              uuid primary key default gen_random_uuid(),
  movimentacao_id uuid not null references public.concremrh_estoque_movimentacoes(id) on delete restrict,
  nome_original   text not null,
  nome_interno    text not null,
  storage_key     text not null,
  mime_type       text not null,
  tamanho         integer not null check (tamanho > 0),
  enviado_por     uuid not null references public.concremrh_usuarios(id) on delete restrict,
  created_at      timestamp with time zone not null default now(),
  constraint uq_estoque_doc_mov unique (movimentacao_id),
  constraint uq_estoque_doc_key unique (storage_key)
);

-- ─────────────────────────────────────────────────────────────────────────
-- ENTREGAS + itens
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.concremrh_estoque_entregas (
  id                  uuid primary key default gen_random_uuid(),
  recibo              text not null,
  funcionario_id      uuid not null references public.concremrh_funcionarios(id) on delete restrict,
  unidade_id          uuid not null references public.concremrh_estoque_unidades(id) on delete restrict,
  tipo                text not null check (tipo in (
                        'ADMISSAO','RENOVACAO','DESGASTE','TROCA_TAMANHO','PERDA',
                        'DANIFICACAO','MUDANCA_SETOR','EXTRAORDINARIA','COMPRA')),
  motivo              text not null default '',
  valor_compra        numeric(12,2) check (valor_compra is null or valor_compra > 0),
  status              text not null default 'CONFIRMADA' check (status in ('CONFIRMADA','CANCELADA')),
  operador_id         uuid not null references public.concremrh_usuarios(id) on delete restrict,
  cancelado_em        timestamp with time zone,
  motivo_cancelamento text,
  operacao_id         uuid references public.concremrh_estoque_operacoes(operacao_id) on delete set null,
  created_at          timestamp with time zone not null default now(),
  constraint uq_estoque_entrega_recibo unique (recibo),
  constraint ck_estoque_entrega_compra check (tipo <> 'COMPRA' or valor_compra is not null)
);
create index if not exists ix_estoque_entrega_func on public.concremrh_estoque_entregas (funcionario_id);
create index if not exists ix_estoque_entrega_unidade on public.concremrh_estoque_entregas (unidade_id);

create table if not exists public.concremrh_estoque_entrega_itens (
  id          uuid primary key default gen_random_uuid(),
  entrega_id  uuid not null references public.concremrh_estoque_entregas(id) on delete restrict,
  variante_id uuid not null references public.concremrh_estoque_variantes(id) on delete restrict,
  quantidade  integer not null check (quantidade > 0)
);
create index if not exists ix_estoque_entrega_item_entrega on public.concremrh_estoque_entrega_itens (entrega_id);

-- ─────────────────────────────────────────────────────────────────────────
-- DEVOLUÇÕES + TROCAS
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.concremrh_estoque_devolucoes (
  id             uuid primary key default gen_random_uuid(),
  entrega_id     uuid not null references public.concremrh_estoque_entregas(id) on delete restrict,
  funcionario_id uuid not null references public.concremrh_funcionarios(id) on delete restrict,
  variante_id    uuid not null references public.concremrh_estoque_variantes(id) on delete restrict,
  quantidade     integer not null check (quantidade > 0),
  condicao       text not null check (condicao in ('NOVO','BOM','USADO','DANIFICADO','SEM_REUSO')),
  destino        text not null check (destino in ('ESTOQUE','HIGIENIZACAO','MANUTENCAO','BAIXA','DESCARTE')),
  motivo         text not null default '',
  responsavel_id uuid not null references public.concremrh_usuarios(id) on delete restrict,
  reestocado     boolean not null default false,
  status         text not null default 'ATIVA' check (status in ('ATIVA','ESTORNADA')),
  estornado_em   timestamp with time zone,
  motivo_estorno text,
  operacao_id    uuid references public.concremrh_estoque_operacoes(operacao_id) on delete set null,
  created_at     timestamp with time zone not null default now()
);
create index if not exists ix_estoque_devolucao_entrega on public.concremrh_estoque_devolucoes (entrega_id, variante_id);

create table if not exists public.concremrh_estoque_trocas (
  id                  uuid primary key default gen_random_uuid(),
  entrega_original_id uuid not null references public.concremrh_estoque_entregas(id) on delete restrict,
  devolucao_id        uuid not null references public.concremrh_estoque_devolucoes(id) on delete restrict,
  nova_entrega_id     uuid not null references public.concremrh_estoque_entregas(id) on delete restrict,
  motivo              text not null,
  operacao_id         uuid references public.concremrh_estoque_operacoes(operacao_id) on delete set null,
  created_at          timestamp with time zone not null default now(),
  constraint uq_estoque_troca_devolucao unique (devolucao_id)
);

-- ─────────────────────────────────────────────────────────────────────────
-- TERMOS de responsabilidade (versionado / imutável após emissão)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.concremrh_estoque_termos (
  id                  uuid primary key default gen_random_uuid(),
  entrega_id          uuid not null references public.concremrh_estoque_entregas(id) on delete restrict,
  numero              text not null,
  versao              integer not null default 1,
  termo_anterior_id   uuid references public.concremrh_estoque_termos(id) on delete set null,
  status              text not null default 'EMITIDO' check (status in ('RASCUNHO','EMITIDO','CONFIRMADO','CANCELADO')),
  snapshot            jsonb not null,
  texto_declaracao    text not null,
  pdf_path            text,
  pdf_hash            text,
  emitido_em          timestamp with time zone not null default now(),
  confirmado_em       timestamp with time zone,
  confirmado_por      uuid references public.concremrh_usuarios(id) on delete set null,
  cancelado_em        timestamp with time zone,
  motivo_cancelamento text,
  constraint uq_estoque_termo_numero unique (numero),
  constraint uq_estoque_termo_versao unique (entrega_id, versao)
);

-- ─────────────────────────────────────────────────────────────────────────
-- AUDITORIA (módulo)
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.concremrh_estoque_auditoria (
  id            uuid primary key default gen_random_uuid(),
  entidade      text not null,
  entidade_id   uuid,
  acao          text not null,
  usuario_id    uuid references public.concremrh_usuarios(id) on delete set null,
  correlacao_op uuid,
  dados_antes   jsonb,
  dados_depois  jsonb,
  motivo        text,
  contexto      jsonb,
  created_at    timestamp with time zone not null default now()
);
create index if not exists ix_estoque_auditoria_entidade on public.concremrh_estoque_auditoria (entidade, entidade_id);
create index if not exists ix_estoque_auditoria_correlacao on public.concremrh_estoque_auditoria (correlacao_op);

-- ─────────────────────────────────────────────────────────────────────────
-- Triggers updated_at (reuso do util existente public.update_updated_at_column)
-- ─────────────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'concremrh_estoque_unidades','concremrh_estoque_fornecedores','concremrh_estoque_categorias',
    'concremrh_estoque_modelos','concremrh_estoque_tamanhos','concremrh_estoque_variantes',
    'concremrh_estoque_funcionario_medidas','concremrh_estoque_saldos'
  ]
  loop
    execute format('drop trigger if exists update_%1$s_updated_at on public.%1$s;', t);
    execute format('create trigger update_%1$s_updated_at before update on public.%1$s
                    for each row execute function public.update_updated_at_column();', t);
  end loop;
end $$;

-- ─────────────────────────────────────────────────────────────────────────
-- RLS: habilitar em TODAS as tabelas (deny-all até as policies do 0003 futuro).
-- Enquanto não houver policy, nenhum acesso via anon/authenticated — SEGURO por
-- padrão (nada consome estas tabelas ainda). As policies e RPCs virão em migrations
-- separadas, após o gate de auth.
-- ─────────────────────────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'concremrh_estoque_unidades','concremrh_estoque_fornecedores','concremrh_estoque_categorias',
    'concremrh_estoque_modelos','concremrh_estoque_tamanhos','concremrh_estoque_variantes',
    'concremrh_estoque_funcionario_medidas','concremrh_estoque_saldos','concremrh_estoque_operacoes',
    'concremrh_estoque_movimentacoes','concremrh_estoque_movimentacao_itens','concremrh_estoque_entrada_documentos',
    'concremrh_estoque_entregas','concremrh_estoque_entrega_itens','concremrh_estoque_devolucoes',
    'concremrh_estoque_trocas','concremrh_estoque_termos','concremrh_estoque_auditoria'
  ]
  loop
    execute format('alter table public.%1$s enable row level security;', t);
  end loop;
end $$;

commit;

-- ============================================================================
-- ROLLBACK (aplicar em transação separada; ordem inversa das dependências)
-- ============================================================================
-- begin;
--   drop table if exists public.concremrh_estoque_auditoria;
--   drop table if exists public.concremrh_estoque_termos;
--   drop table if exists public.concremrh_estoque_trocas;
--   drop table if exists public.concremrh_estoque_devolucoes;
--   drop table if exists public.concremrh_estoque_entrega_itens;
--   drop table if exists public.concremrh_estoque_entregas;
--   drop table if exists public.concremrh_estoque_entrada_documentos;
--   drop table if exists public.concremrh_estoque_movimentacao_itens;
--   drop table if exists public.concremrh_estoque_movimentacoes;
--   drop table if exists public.concremrh_estoque_operacoes;
--   drop table if exists public.concremrh_estoque_saldos;
--   drop table if exists public.concremrh_estoque_funcionario_medidas;
--   drop table if exists public.concremrh_estoque_variantes;
--   drop table if exists public.concremrh_estoque_tamanhos;
--   drop table if exists public.concremrh_estoque_modelos;
--   drop table if exists public.concremrh_estoque_categorias;
--   drop table if exists public.concremrh_estoque_fornecedores;
--   drop table if exists public.concremrh_estoque_unidades;
-- commit;
-- ============================================================================
