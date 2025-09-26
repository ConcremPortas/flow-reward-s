-- Criar tabela para indicadores gerais
CREATE TABLE public.concrem_indicadores_gerais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_indicador_id UUID NOT NULL,
  competencia DATE NOT NULL,
  meta NUMERIC NOT NULL,
  realizado NUMERIC NOT NULL,
  percentual NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  FOREIGN KEY (tipo_indicador_id) REFERENCES public.concrem_tipos_indicadores_gerais(id) ON DELETE RESTRICT
);

-- Habilitar RLS
ALTER TABLE public.concrem_indicadores_gerais ENABLE ROW LEVEL SECURITY;

-- Criar políticas para permitir todas as operações
CREATE POLICY "Allow all operations on indicadores_gerais" 
ON public.concrem_indicadores_gerais 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Adicionar trigger para updated_at
CREATE TRIGGER update_indicadores_gerais_updated_at
BEFORE UPDATE ON public.concrem_indicadores_gerais
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar índice único para evitar duplicatas (mesmo tipo + competência)
CREATE UNIQUE INDEX idx_indicadores_gerais_unique 
ON public.concrem_indicadores_gerais (tipo_indicador_id, competencia);