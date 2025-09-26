-- Criar tabela para armazenar resultados das premiações
CREATE TABLE public.concrem_resultados_premiacao (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mes_competencia date NOT NULL,
  base_premiacao_id uuid REFERENCES public.concrem_base_premiacao(id),
  funcionario_id uuid REFERENCES public.concrem_funcionarios(id),
  cod_funcionario text,
  nome text NOT NULL,
  setor text,
  funcao text,
  categoria text,
  faixa text,
  valor_faixa numeric,
  nota_producao numeric,
  nota_epi numeric NOT NULL DEFAULT 0,
  nota_faltas numeric NOT NULL DEFAULT 0,
  nota_advertencias numeric NOT NULL DEFAULT 0,
  nota_dss numeric NOT NULL DEFAULT 0,
  valor_kits numeric,
  nota_geral numeric NOT NULL,
  bonus_possivel numeric NOT NULL,
  bonus_alcancado numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(mes_competencia, base_premiacao_id, funcionario_id)
);

-- Enable RLS
ALTER TABLE public.concrem_resultados_premiacao ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations on resultados_premiacao" 
ON public.concrem_resultados_premiacao 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create trigger for timestamps
CREATE TRIGGER update_resultados_premiacao_updated_at
BEFORE UPDATE ON public.concrem_resultados_premiacao
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();