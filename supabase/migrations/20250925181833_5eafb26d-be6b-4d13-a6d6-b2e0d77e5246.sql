-- Adicionar campo quantidade na tabela de faltas e advertências
ALTER TABLE concrem_faltas_advertencias 
ADD COLUMN quantidade integer DEFAULT 1;