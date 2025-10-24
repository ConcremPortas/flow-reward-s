-- Adicionar colunas para indicadores de supervisor/encarregado na tabela de resultados de premiação
ALTER TABLE concrem_resultados_premiacao
ADD COLUMN IF NOT EXISTS nota_faturamento DECIMAL(5,4),
ADD COLUMN IF NOT EXISTS nota_itens_nc DECIMAL(5,4),
ADD COLUMN IF NOT EXISTS nota_tratamento_nc DECIMAL(5,4),
ADD COLUMN IF NOT EXISTS nota_hora_maquina DECIMAL(5,4),
ADD COLUMN IF NOT EXISTS nota_operacao_segura DECIMAL(5,4),
ADD COLUMN IF NOT EXISTS nota_limpeza DECIMAL(5,4);

-- Comentários para documentação
COMMENT ON COLUMN concrem_resultados_premiacao.nota_faturamento IS 'Nota do indicador de faturamento (0-1) para supervisores/encarregados';
COMMENT ON COLUMN concrem_resultados_premiacao.nota_itens_nc IS 'Nota do indicador de identificação de não conformidades (0-1) para supervisores/encarregados';
COMMENT ON COLUMN concrem_resultados_premiacao.nota_tratamento_nc IS 'Nota do indicador de tratamento de não conformidades (0-1) para supervisores/encarregados';
COMMENT ON COLUMN concrem_resultados_premiacao.nota_hora_maquina IS 'Nota do indicador de hora máquina (0-1) para supervisores/encarregados';
COMMENT ON COLUMN concrem_resultados_premiacao.nota_operacao_segura IS 'Nota do indicador de operação segura (0-1) para supervisores/encarregados';
COMMENT ON COLUMN concrem_resultados_premiacao.nota_limpeza IS 'Nota do indicador de limpeza (0-1) para supervisores/encarregados';