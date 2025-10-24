-- Adicionar campos supervisor_id e encarregado_id na tabela concrem_setores
ALTER TABLE concrem_setores 
ADD COLUMN supervisor_id uuid REFERENCES concrem_funcionarios(id),
ADD COLUMN encarregado_id uuid REFERENCES concrem_funcionarios(id);