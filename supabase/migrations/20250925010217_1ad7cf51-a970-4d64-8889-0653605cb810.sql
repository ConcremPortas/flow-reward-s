-- Criar tabela de empresas
CREATE TABLE public.concrem_empresas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cnpj VARCHAR(18) UNIQUE,
  email TEXT,
  telefone VARCHAR(20),
  endereco TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de setores
CREATE TABLE public.concrem_setores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  empresa_id UUID REFERENCES public.concrem_empresas(id) ON DELETE CASCADE,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de funções
CREATE TABLE public.concrem_funcoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  nivel_hierarquico INTEGER DEFAULT 1,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de categorias
CREATE TABLE public.concrem_categorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  cor VARCHAR(7), -- Para cores hex
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de faixas
CREATE TABLE public.concrem_faixas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  valor_minimo DECIMAL(10,2),
  valor_maximo DECIMAL(10,2),
  categoria_id UUID REFERENCES public.concrem_categorias(id) ON DELETE SET NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de base premiação
CREATE TABLE public.concrem_base_premiacao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  valor_base DECIMAL(10,2) NOT NULL,
  tipo VARCHAR(20) DEFAULT 'percentual', -- percentual, valor_fixo
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de funcionários
CREATE TABLE public.concrem_funcionarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  nome TEXT NOT NULL,
  cpf VARCHAR(14) UNIQUE,
  email TEXT,
  telefone VARCHAR(20),
  data_nascimento DATE,
  data_admissao DATE,
  data_demissao DATE,
  salario DECIMAL(10,2),
  empresa_id UUID REFERENCES public.concrem_empresas(id) ON DELETE CASCADE,
  setor_id UUID REFERENCES public.concrem_setores(id) ON DELETE SET NULL,
  funcao_id UUID REFERENCES public.concrem_funcoes(id) ON DELETE SET NULL,
  categoria_id UUID REFERENCES public.concrem_categorias(id) ON DELETE SET NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de EPI
CREATE TABLE public.concrem_epi (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funcionario_id UUID REFERENCES public.concrem_funcionarios(id) ON DELETE CASCADE,
  tipo_epi TEXT NOT NULL,
  descricao TEXT,
  numero_ca VARCHAR(20), -- Certificado de Aprovação
  data_entrega DATE NOT NULL,
  data_vencimento DATE,
  status VARCHAR(20) DEFAULT 'entregue', -- entregue, vencido, devolvido
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de DSS (Diálogo Semanal de Segurança)
CREATE TABLE public.concrem_dss (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_realizacao DATE NOT NULL,
  setor_id UUID REFERENCES public.concrem_setores(id) ON DELETE SET NULL,
  responsavel_id UUID REFERENCES public.concrem_funcionarios(id) ON DELETE SET NULL,
  participantes_ids UUID[], -- Array de IDs dos funcionários participantes
  topics TEXT[], -- Tópicos abordados
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de faltas e advertências
CREATE TABLE public.concrem_faltas_advertencias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funcionario_id UUID REFERENCES public.concrem_funcionarios(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL, -- falta, advertencia
  motivo TEXT NOT NULL,
  descricao TEXT,
  data_ocorrencia DATE NOT NULL,
  gravidade VARCHAR(20) DEFAULT 'leve', -- leve, media, grave
  aplicado_por UUID REFERENCES public.concrem_funcionarios(id) ON DELETE SET NULL,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de produção por setor
CREATE TABLE public.concrem_producao_setor (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setor_id UUID REFERENCES public.concrem_setores(id) ON DELETE CASCADE,
  data_producao DATE NOT NULL,
  meta_diaria DECIMAL(10,2),
  producao_realizada DECIMAL(10,2),
  unidade_medida VARCHAR(20) DEFAULT 'unidades',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.concrem_empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concrem_setores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concrem_funcoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concrem_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concrem_faixas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concrem_base_premiacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concrem_funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concrem_epi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concrem_dss ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concrem_faltas_advertencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concrem_producao_setor ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS básicas (permitir acesso público por enquanto)
CREATE POLICY "Allow all operations on empresas" ON public.concrem_empresas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on setores" ON public.concrem_setores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on funcoes" ON public.concrem_funcoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on categorias" ON public.concrem_categorias FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on faixas" ON public.concrem_faixas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on base_premiacao" ON public.concrem_base_premiacao FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on funcionarios" ON public.concrem_funcionarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on epi" ON public.concrem_epi FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on dss" ON public.concrem_dss FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on faltas_advertencias" ON public.concrem_faltas_advertencias FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on producao_setor" ON public.concrem_producao_setor FOR ALL USING (true) WITH CHECK (true);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Criar triggers para atualizar updated_at
CREATE TRIGGER update_concrem_empresas_updated_at BEFORE UPDATE ON public.concrem_empresas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_concrem_setores_updated_at BEFORE UPDATE ON public.concrem_setores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_concrem_funcoes_updated_at BEFORE UPDATE ON public.concrem_funcoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_concrem_categorias_updated_at BEFORE UPDATE ON public.concrem_categorias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_concrem_faixas_updated_at BEFORE UPDATE ON public.concrem_faixas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_concrem_base_premiacao_updated_at BEFORE UPDATE ON public.concrem_base_premiacao FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_concrem_funcionarios_updated_at BEFORE UPDATE ON public.concrem_funcionarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_concrem_epi_updated_at BEFORE UPDATE ON public.concrem_epi FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_concrem_dss_updated_at BEFORE UPDATE ON public.concrem_dss FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_concrem_faltas_advertencias_updated_at BEFORE UPDATE ON public.concrem_faltas_advertencias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_concrem_producao_setor_updated_at BEFORE UPDATE ON public.concrem_producao_setor FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();