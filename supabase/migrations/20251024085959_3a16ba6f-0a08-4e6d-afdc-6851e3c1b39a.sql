-- Adicionar coluna faixa_id na tabela concrem_funcionarios
ALTER TABLE concrem_funcionarios 
ADD COLUMN faixa_id uuid REFERENCES concrem_faixas(id);

-- Adicionar índice para melhor performance
CREATE INDEX idx_funcionarios_faixa_id ON concrem_funcionarios(faixa_id);