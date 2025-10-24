-- Adicionar coluna percentual_producao para armazenar o percentual real de produção (pode ser > 100%)
ALTER TABLE concrem_resultados_premiacao 
ADD COLUMN percentual_producao numeric;