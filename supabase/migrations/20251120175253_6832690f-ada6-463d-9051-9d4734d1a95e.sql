-- Criar tabela de cargos
CREATE TABLE public.concrem_cargos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  setor_id UUID REFERENCES public.concrem_setores(id),
  nivel_hierarquico INTEGER,
  missao TEXT,
  responsabilidades TEXT[],
  atividades TEXT[],
  competencias TEXT[],
  requisitos TEXT,
  salario_minimo NUMERIC,
  salario_maximo NUMERIC,
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.concrem_cargos ENABLE ROW LEVEL SECURITY;

-- Criar política de acesso
CREATE POLICY "Allow all operations on cargos" 
ON public.concrem_cargos 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Criar trigger para updated_at
CREATE TRIGGER update_cargos_updated_at
BEFORE UPDATE ON public.concrem_cargos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar índices para performance
CREATE INDEX idx_cargos_setor ON public.concrem_cargos(setor_id);
CREATE INDEX idx_cargos_ativo ON public.concrem_cargos(ativo);
CREATE INDEX idx_cargos_nome ON public.concrem_cargos(nome);

-- Registrar aplicação no Hub RH
INSERT INTO public.concrem_hr_applications (code, name, description, route, icon, color, display_order, is_active)
VALUES (
  'cargos_salarios',
  'Cargos e Salários',
  'Sistema completo de gestão de cargos e salários, estrutura organizacional e vínculos com colaboradores',
  '/cargos-salarios',
  'Briefcase',
  '#059669',
  2,
  true
)
ON CONFLICT (code) DO NOTHING;