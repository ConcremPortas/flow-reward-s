-- Criar tabela para tipos de indicadores gerais
CREATE TABLE public.concrem_tipos_indicadores_gerais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  codigo VARCHAR(10) NOT NULL UNIQUE,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.concrem_tipos_indicadores_gerais ENABLE ROW LEVEL SECURITY;

-- Criar políticas para permitir todas as operações
CREATE POLICY "Allow all operations on tipos_indicadores_gerais" 
ON public.concrem_tipos_indicadores_gerais 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Adicionar trigger para updated_at
CREATE TRIGGER update_tipos_indicadores_gerais_updated_at
BEFORE UPDATE ON public.concrem_tipos_indicadores_gerais
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir dados iniciais
INSERT INTO public.concrem_tipos_indicadores_gerais (nome, codigo, descricao) VALUES
('Faturamento', 'FAT', 'Indicador de faturamento mensal da empresa'),
('Quantidade de Kits', 'KITS', 'Quantidade de kits produzidos/vendidos');