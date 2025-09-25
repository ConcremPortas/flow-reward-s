-- Criar tabela para tipos de indicadores dos setores
CREATE TABLE public.concrem_tipos_indicadores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo VARCHAR(10) NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(codigo)
);

-- Enable RLS
ALTER TABLE public.concrem_tipos_indicadores ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations on tipos_indicadores" 
ON public.concrem_tipos_indicadores 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_tipos_indicadores_updated_at
BEFORE UPDATE ON public.concrem_tipos_indicadores
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default indicator types
INSERT INTO public.concrem_tipos_indicadores (codigo, nome, descricao) VALUES
('ID', 'Identificação Não Conformidades', 'Indicador para controle de identificação de não conformidades'),
('NC', 'Tratamento Não Conformidades', 'Indicador para controle de tratamento de não conformidades'),
('HM', 'Hora Máquina', 'Indicador de controle de horas de máquina'),
('OPC', 'Operação Segura', 'Indicador de operações seguras realizadas'),
('L', 'Limpeza', 'Indicador de controle de limpeza e organização');