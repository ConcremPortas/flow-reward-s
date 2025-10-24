-- Criar tabela de indicadores por setor
CREATE TABLE concrem_indicadores_setor (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setor_id uuid REFERENCES concrem_setores(id),
  competencia date NOT NULL,
  
  -- Indicadores
  hora_maquina_meta numeric,
  hora_maquina_realizado numeric,
  hora_maquina_percentual numeric,
  
  identificacao_nc_meta numeric,
  identificacao_nc_realizado numeric,
  identificacao_nc_percentual numeric,
  
  limpeza_meta numeric,
  limpeza_realizado numeric,
  limpeza_percentual numeric,
  
  tratamento_nc_meta numeric,
  tratamento_nc_realizado numeric,
  tratamento_nc_percentual numeric,
  
  operacao_segura_meta numeric,
  operacao_segura_realizado numeric,
  operacao_segura_percentual numeric,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE concrem_indicadores_setor ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Allow all operations on indicadores_setor" 
ON concrem_indicadores_setor 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Create trigger for timestamps
CREATE TRIGGER update_indicadores_setor_updated_at
BEFORE UPDATE ON concrem_indicadores_setor
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();