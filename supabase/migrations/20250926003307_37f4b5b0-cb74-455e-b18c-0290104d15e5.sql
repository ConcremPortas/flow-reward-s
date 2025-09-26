-- Criar tabela para fórmulas de cálculo de premiação
CREATE TABLE public.concrem_formulas_calculo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  categoria_id UUID REFERENCES public.concrem_categorias(id),
  base_premiacao_id UUID REFERENCES public.concrem_base_premiacao(id),
  nome TEXT NOT NULL,
  descricao TEXT,
  peso_producao_setor NUMERIC DEFAULT 0,
  peso_epi NUMERIC DEFAULT 0,
  peso_faltas NUMERIC DEFAULT 0,
  peso_advertencias NUMERIC DEFAULT 0,
  peso_dss NUMERIC DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.concrem_formulas_calculo ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations on formulas_calculo" 
ON public.concrem_formulas_calculo 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Add trigger for timestamps
CREATE TRIGGER update_formulas_calculo_updated_at
BEFORE UPDATE ON public.concrem_formulas_calculo
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir as fórmulas iniciais para Auxiliar
INSERT INTO public.concrem_formulas_calculo (
  nome, 
  descricao, 
  peso_producao_setor, 
  peso_epi, 
  peso_faltas, 
  peso_advertencias, 
  peso_dss
) VALUES 
(
  'Auxiliar - PRODUÇÃO', 
  'Fórmula de cálculo para categoria Auxiliar com base PRODUÇÃO',
  60, 15, 10, 5, 10
),
(
  'Auxiliar - KITS', 
  'Fórmula de cálculo para categoria Auxiliar com base KITS',
  0, 35, 25, 15, 25
);