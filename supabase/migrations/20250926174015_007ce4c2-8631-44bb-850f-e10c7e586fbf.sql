-- Criar todas as tabelas com prefixo remuneracaoconrem_

-- Tabela de empresas
CREATE TABLE public.remuneracaoconrem_empresas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cnpj VARCHAR,
  email TEXT,
  telefone VARCHAR,
  endereco TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de setores
CREATE TABLE public.remuneracaoconrem_setores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  empresa_id UUID,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de funções
CREATE TABLE public.remuneracaoconrem_funcoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  nivel_hierarquico INTEGER DEFAULT 1,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de categorias
CREATE TABLE public.remuneracaoconrem_categorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  cor VARCHAR,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de faixas
CREATE TABLE public.remuneracaoconrem_faixas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  valor_minimo NUMERIC,
  valor_maximo NUMERIC,
  categoria_id UUID,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de base premiação
CREATE TABLE public.remuneracaoconrem_base_premiacao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  valor_base NUMERIC NOT NULL,
  tipo VARCHAR DEFAULT 'percentual',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de funcionários
CREATE TABLE public.remuneracaoconrem_funcionarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  cpf VARCHAR,
  email TEXT,
  telefone VARCHAR,
  data_nascimento DATE,
  data_admissao DATE,
  data_demissao DATE,
  salario NUMERIC,
  empresa_id UUID,
  setor_id UUID,
  funcao_id UUID,
  categoria_id UUID,
  base_premiacao_id UUID,
  user_id UUID,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de tipos indicadores
CREATE TABLE public.remuneracaoconrem_tipos_indicadores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo VARCHAR NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de tipos indicadores gerais
CREATE TABLE public.remuneracaoconrem_tipos_indicadores_gerais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo VARCHAR NOT NULL,
  nome TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de indicadores gerais
CREATE TABLE public.remuneracaoconrem_indicadores_gerais (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_indicador_id UUID NOT NULL,
  competencia DATE NOT NULL,
  meta NUMERIC NOT NULL,
  realizado NUMERIC NOT NULL,
  percentual NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de produção por setor
CREATE TABLE public.remuneracaoconrem_producao_setor (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setor_id UUID,
  data_producao DATE NOT NULL,
  meta_diaria NUMERIC,
  producao_realizada NUMERIC,
  unidade_medida VARCHAR DEFAULT 'unidades',
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de DSS
CREATE TABLE public.remuneracaoconrem_dss (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  data_realizacao DATE NOT NULL,
  setor_id UUID,
  responsavel_id UUID,
  participantes_ids UUID[],
  topics TEXT[],
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de EPI
CREATE TABLE public.remuneracaoconrem_epi (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funcionario_id UUID,
  tipo_epi TEXT NOT NULL,
  numero_ca VARCHAR,
  data_entrega DATE NOT NULL,
  data_vencimento DATE,
  status VARCHAR DEFAULT 'entregue',
  descricao TEXT,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de faltas e advertências
CREATE TABLE public.remuneracaoconrem_faltas_advertencias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funcionario_id UUID,
  tipo VARCHAR NOT NULL,
  motivo TEXT NOT NULL,
  descricao TEXT,
  data_ocorrencia DATE NOT NULL,
  quantidade INTEGER DEFAULT 1,
  gravidade VARCHAR DEFAULT 'leve',
  aplicado_por UUID,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de fórmulas de cálculo
CREATE TABLE public.remuneracaoconrem_formulas_calculo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  base_premiacao_id UUID,
  categoria_id UUID,
  peso_producao_setor NUMERIC DEFAULT 0,
  peso_epi NUMERIC DEFAULT 0,
  peso_faltas NUMERIC DEFAULT 0,
  peso_advertencias NUMERIC DEFAULT 0,
  peso_dss NUMERIC DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de resultados de premiação
CREATE TABLE public.remuneracaoconrem_resultados_premiacao (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mes_competencia DATE NOT NULL,
  base_premiacao_id UUID,
  funcionario_id UUID,
  cod_funcionario TEXT,
  nome TEXT NOT NULL,
  setor TEXT,
  funcao TEXT,
  categoria TEXT,
  faixa TEXT,
  valor_faixa NUMERIC,
  nota_producao NUMERIC,
  nota_epi NUMERIC NOT NULL DEFAULT 0,
  nota_faltas NUMERIC NOT NULL DEFAULT 0,
  nota_advertencias NUMERIC NOT NULL DEFAULT 0,
  nota_dss NUMERIC NOT NULL DEFAULT 0,
  valor_kits NUMERIC,
  nota_geral NUMERIC NOT NULL,
  bonus_possivel NUMERIC NOT NULL,
  bonus_alcancado NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.remuneracaoconrem_empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remuneracaoconrem_setores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remuneracaoconrem_funcoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remuneracaoconrem_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remuneracaoconrem_faixas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remuneracaoconrem_base_premiacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remuneracaoconrem_funcionarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remuneracaoconrem_tipos_indicadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remuneracaoconrem_tipos_indicadores_gerais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remuneracaoconrem_indicadores_gerais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remuneracaoconrem_producao_setor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remuneracaoconrem_dss ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remuneracaoconrem_epi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remuneracaoconrem_faltas_advertencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remuneracaoconrem_formulas_calculo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remuneracaoconrem_resultados_premiacao ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS (permitir todas as operações por enquanto)
CREATE POLICY "Allow all operations on empresas" ON public.remuneracaoconrem_empresas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on setores" ON public.remuneracaoconrem_setores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on funcoes" ON public.remuneracaoconrem_funcoes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on categorias" ON public.remuneracaoconrem_categorias FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on faixas" ON public.remuneracaoconrem_faixas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on base_premiacao" ON public.remuneracaoconrem_base_premiacao FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on funcionarios" ON public.remuneracaoconrem_funcionarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on tipos_indicadores" ON public.remuneracaoconrem_tipos_indicadores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on tipos_indicadores_gerais" ON public.remuneracaoconrem_tipos_indicadores_gerais FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on indicadores_gerais" ON public.remuneracaoconrem_indicadores_gerais FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on producao_setor" ON public.remuneracaoconrem_producao_setor FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on dss" ON public.remuneracaoconrem_dss FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on epi" ON public.remuneracaoconrem_epi FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on faltas_advertencias" ON public.remuneracaoconrem_faltas_advertencias FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on formulas_calculo" ON public.remuneracaoconrem_formulas_calculo FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on resultados_premiacao" ON public.remuneracaoconrem_resultados_premiacao FOR ALL USING (true) WITH CHECK (true);

-- Criar triggers para updated_at em todas as tabelas
CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON public.remuneracaoconrem_empresas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_setores_updated_at BEFORE UPDATE ON public.remuneracaoconrem_setores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_funcoes_updated_at BEFORE UPDATE ON public.remuneracaoconrem_funcoes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_categorias_updated_at BEFORE UPDATE ON public.remuneracaoconrem_categorias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_faixas_updated_at BEFORE UPDATE ON public.remuneracaoconrem_faixas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_base_premiacao_updated_at BEFORE UPDATE ON public.remuneracaoconrem_base_premiacao FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_funcionarios_updated_at BEFORE UPDATE ON public.remuneracaoconrem_funcionarios FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tipos_indicadores_updated_at BEFORE UPDATE ON public.remuneracaoconrem_tipos_indicadores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tipos_indicadores_gerais_updated_at BEFORE UPDATE ON public.remuneracaoconrem_tipos_indicadores_gerais FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_indicadores_gerais_updated_at BEFORE UPDATE ON public.remuneracaoconrem_indicadores_gerais FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_producao_setor_updated_at BEFORE UPDATE ON public.remuneracaoconrem_producao_setor FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_dss_updated_at BEFORE UPDATE ON public.remuneracaoconrem_dss FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_epi_updated_at BEFORE UPDATE ON public.remuneracaoconrem_epi FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_faltas_advertencias_updated_at BEFORE UPDATE ON public.remuneracaoconrem_faltas_advertencias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_formulas_calculo_updated_at BEFORE UPDATE ON public.remuneracaoconrem_formulas_calculo FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_resultados_premiacao_updated_at BEFORE UPDATE ON public.remuneracaoconrem_resultados_premiacao FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();