-- ============================================================================
-- PROPOSTA — módulo Controle de Estoque
-- 0004_estoque_storage.sql  ·  Supabase Storage (NF de entrada + PDFs de termo)
--
-- ⚠️  NÃO APLICAR AUTOMATICAMENTE. Aplicar APÓS 0001–0003, em homologação primeiro.
--     A criação de bucket e as policies em storage.objects podem exigir execução
--     via Studio (SQL editor com privilégio) ou pelo owner do schema `storage`.
--
-- Modelo (Fase 2C §17 e ajustes 2D):
--   • Bucket ÚNICO PRIVADO `estoque-documentos` (public=false).
--   • PDF apenas + limite de 10 MB na camada de Storage (defesa adicional; o app
--     também valida MIME + magic bytes %PDF antes do upload).
--   • Paths:
--       notas/{unidade_id}/{ano}/{movimentacao_id}/{uuid}.pdf
--       termos/{ano}/{entrega_id}/{termo_id}/v{versao}.pdf
--   • Leitura SEM URL pública — sempre via URL ASSINADA (createSignedUrl), curta.
--   • Escrita (upload) pelo cliente autenticado COM acesso ao módulo, ANTES da RPC
--     de metadata (a RPC não manipula binário — Fase 2C §7). UPDATE/DELETE do
--     cliente NEGADOS (limpeza de órfãos por rotina com service_role — futuro).
--   • Reuso do helper `public.estoque_tem_acesso()` (0002).
-- ============================================================================

begin;

-- 1) Bucket privado com limites (idempotente).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('estoque-documentos', 'estoque-documentos', false, 10485760, array['application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 2) Policies em storage.objects, escopadas ao bucket (RLS de storage.objects já é
--    habilitada pelo Supabase). Sem USING(true); nada para anon.

-- LEITURA: necessária para gerar/baixar via URL assinada. Acesso ao módulo.
drop policy if exists estoque_doc_select on storage.objects;
create policy estoque_doc_select on storage.objects
  for select to authenticated
  using (bucket_id = 'estoque-documentos' and public.estoque_tem_acesso());

-- UPLOAD: apenas quem tem acesso e apenas nos prefixos válidos (notas/ ou termos/).
drop policy if exists estoque_doc_insert on storage.objects;
create policy estoque_doc_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'estoque-documentos'
    and public.estoque_tem_acesso()
    and (storage.foldername(name))[1] in ('notas', 'termos')
  );

-- UPDATE/DELETE diretos pelo cliente: NÃO concedidos (sem policy → negados).
-- Substituição/limpeza de órfãos deve ocorrer por rotina controlada (service_role).

commit;

-- ============================================================================
-- ESTRATÉGIA DE UPLOAD + ÓRFÃOS (documentação — não é SQL)
--   Fluxo aprovado (Fase 2C §7 / ajuste 2D):
--     1. App valida MIME + magic bytes (%PDF) + tamanho (<=10MB).
--     2. App faz upload autenticado para o caminho final (notas/... ou termos/...).
--     3. App chama a RPC de metadata (estoque_registrar_entrada com p_documento,
--        ou a rotina de termo) passando { storage_key, nome_original, ... }.
--     4. Se a RPC falhar (rollback), o objeto no Storage fica ÓRFÃO.
--   Limpeza de órfãos (rotina futura, service_role):
--     • Listar objetos do bucket cujo `name` NÃO exista em
--       concremrh_estoque_entrada_documentos.storage_key (nem em termos.pdf_path),
--       com idade > N horas, e remover. Agendar (cron/edge). NÃO nesta fase.
--   Alternativa mais estrita (opcional): subir primeiro em `tmp/{uuid}.pdf` e a
--   rotina de confirmação mover para o path final; órfãos ficam confinados a tmp/.
--   Recomendação MVP: caminho final + rotina de limpeza (mais simples).
--
-- ACESSO/RETENÇÃO
--   • Download sempre por createSignedUrl (expiração curta, ex.: 60s). Nunca getPublicUrl.
--   • Exclusão de documento = exclusão lógica no metadata; objeto removido pela
--     rotina controlada. Retenção conforme política (definir — decisão pendente).
--
-- ROLLBACK (transação separada):
--   drop policy if exists estoque_doc_insert on storage.objects;
--   drop policy if exists estoque_doc_select on storage.objects;
--   -- remover o bucket só se vazio:
--   -- delete from storage.buckets where id = 'estoque-documentos';
-- ============================================================================
