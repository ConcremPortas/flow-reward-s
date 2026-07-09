-- ============================================================================
-- ROLLBACK LOTE 0001 (Fase 5A) — restaura a leitura de tabela inteira e remove
-- as views. ⚠️ Reabre salario/data_nascimento/telefone para todo `authenticated`.
-- ============================================================================

-- Restaura SELECT de tabela inteira para authenticated (estado pre-5A).
grant select on public.concremrh_funcionarios to authenticated;

-- (Opcional) remover os grants por coluna e nao deixa lixo — o grant de tabela
-- inteira acima ja cobre tudo; os grants por coluna tornam-se redundantes.

-- Remove as views criadas pela Fase 5A.
drop view if exists public.concremrh_funcionarios_resumo;
drop view if exists public.concremrh_funcionarios_sensivel;

-- NOTA: recarregar o schema cache do PostgREST se necessario:
--   NOTIFY pgrst, 'reload schema';
