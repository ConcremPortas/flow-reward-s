-- Remover colunas de valor_minimo e valor_maximo e adicionar valor
ALTER TABLE concrem_faixas 
DROP COLUMN IF EXISTS valor_minimo,
DROP COLUMN IF EXISTS valor_maximo,
ADD COLUMN IF NOT EXISTS valor numeric NOT NULL DEFAULT 0;