-- Adicionar coluna status na tabela concrem_funcionarios
ALTER TABLE concrem_funcionarios 
ADD COLUMN status character varying DEFAULT 'Ativo';

-- Adicionar comentário explicativo
COMMENT ON COLUMN concrem_funcionarios.status IS 'Status funcional do funcionário (Ativo, Férias, Licença, Rescisão)';