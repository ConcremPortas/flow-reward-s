-- Tabela de histórico de cargos e salários dos funcionários
CREATE TABLE public.concrem_historico_cargos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funcionario_id UUID NOT NULL REFERENCES public.concrem_funcionarios(id) ON DELETE CASCADE,
  cargo_id UUID REFERENCES public.concrem_cargos(id),
  cargo_anterior_id UUID REFERENCES public.concrem_cargos(id),
  salario_anterior NUMERIC,
  salario_novo NUMERIC,
  data_mudanca DATE NOT NULL,
  tipo_mudanca VARCHAR(50) NOT NULL, -- 'promocao', 'transferencia', 'ajuste_salarial', 'admissao', 'desligamento'
  motivo TEXT,
  aprovado_por UUID REFERENCES public.concrem_funcionarios(id),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.concrem_historico_cargos ENABLE ROW LEVEL SECURITY;

-- Criar política de acesso
CREATE POLICY "Allow all operations on historico_cargos" 
ON public.concrem_historico_cargos 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Criar trigger para updated_at
CREATE TRIGGER update_historico_cargos_updated_at
BEFORE UPDATE ON public.concrem_historico_cargos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar índices
CREATE INDEX idx_historico_cargos_funcionario ON public.concrem_historico_cargos(funcionario_id);
CREATE INDEX idx_historico_cargos_data ON public.concrem_historico_cargos(data_mudanca DESC);
CREATE INDEX idx_historico_cargos_tipo ON public.concrem_historico_cargos(tipo_mudanca);

-- Tabela de estrutura hierárquica (relação entre cargos)
CREATE TABLE public.concrem_estrutura_hierarquica (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cargo_id UUID NOT NULL REFERENCES public.concrem_cargos(id) ON DELETE CASCADE,
  cargo_superior_id UUID REFERENCES public.concrem_cargos(id) ON DELETE SET NULL,
  nivel_hierarquico INTEGER NOT NULL DEFAULT 0,
  pode_aprovar_mudancas BOOLEAN DEFAULT false,
  quantidade_subordinados_diretos INTEGER DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(cargo_id)
);

-- Habilitar RLS
ALTER TABLE public.concrem_estrutura_hierarquica ENABLE ROW LEVEL SECURITY;

-- Criar política de acesso
CREATE POLICY "Allow all operations on estrutura_hierarquica" 
ON public.concrem_estrutura_hierarquica 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Criar trigger para updated_at
CREATE TRIGGER update_estrutura_hierarquica_updated_at
BEFORE UPDATE ON public.concrem_estrutura_hierarquica
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar índices
CREATE INDEX idx_estrutura_hierarquica_cargo ON public.concrem_estrutura_hierarquica(cargo_id);
CREATE INDEX idx_estrutura_hierarquica_superior ON public.concrem_estrutura_hierarquica(cargo_superior_id);
CREATE INDEX idx_estrutura_hierarquica_nivel ON public.concrem_estrutura_hierarquica(nivel_hierarquico);

-- Tabela de plano de carreira (progressão entre cargos)
CREATE TABLE public.concrem_plano_carreira (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cargo_origem_id UUID NOT NULL REFERENCES public.concrem_cargos(id) ON DELETE CASCADE,
  cargo_destino_id UUID NOT NULL REFERENCES public.concrem_cargos(id) ON DELETE CASCADE,
  tipo_progressao VARCHAR(50) NOT NULL, -- 'vertical', 'horizontal', 'diagonal'
  tempo_minimo_meses INTEGER,
  requisitos TEXT[],
  competencias_necessarias TEXT[],
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(cargo_origem_id, cargo_destino_id)
);

-- Habilitar RLS
ALTER TABLE public.concrem_plano_carreira ENABLE ROW LEVEL SECURITY;

-- Criar política de acesso
CREATE POLICY "Allow all operations on plano_carreira" 
ON public.concrem_plano_carreira 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Criar trigger para updated_at
CREATE TRIGGER update_plano_carreira_updated_at
BEFORE UPDATE ON public.concrem_plano_carreira
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar índices
CREATE INDEX idx_plano_carreira_origem ON public.concrem_plano_carreira(cargo_origem_id);
CREATE INDEX idx_plano_carreira_destino ON public.concrem_plano_carreira(cargo_destino_id);
CREATE INDEX idx_plano_carreira_tipo ON public.concrem_plano_carreira(tipo_progressao);

-- Tabela de avaliações de desempenho (para futuro uso em promoções)
CREATE TABLE public.concrem_avaliacoes_desempenho (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funcionario_id UUID NOT NULL REFERENCES public.concrem_funcionarios(id) ON DELETE CASCADE,
  avaliador_id UUID REFERENCES public.concrem_funcionarios(id),
  data_avaliacao DATE NOT NULL,
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  nota_geral NUMERIC(3,2), -- 0.00 a 10.00
  competencias_avaliadas JSONB, -- {competencia: nota}
  pontos_fortes TEXT[],
  pontos_melhoria TEXT[],
  objetivos_alcancados TEXT[],
  comentarios TEXT,
  elegivel_promocao BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'em_andamento', -- 'em_andamento', 'concluida', 'aprovada'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.concrem_avaliacoes_desempenho ENABLE ROW LEVEL SECURITY;

-- Criar política de acesso
CREATE POLICY "Allow all operations on avaliacoes_desempenho" 
ON public.concrem_avaliacoes_desempenho 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Criar trigger para updated_at
CREATE TRIGGER update_avaliacoes_desempenho_updated_at
BEFORE UPDATE ON public.concrem_avaliacoes_desempenho
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar índices
CREATE INDEX idx_avaliacoes_funcionario ON public.concrem_avaliacoes_desempenho(funcionario_id);
CREATE INDEX idx_avaliacoes_data ON public.concrem_avaliacoes_desempenho(data_avaliacao DESC);
CREATE INDEX idx_avaliacoes_status ON public.concrem_avaliacoes_desempenho(status);

-- Comentários nas tabelas
COMMENT ON TABLE public.concrem_historico_cargos IS 'Registro histórico de mudanças de cargo e salário dos funcionários';
COMMENT ON TABLE public.concrem_estrutura_hierarquica IS 'Estrutura hierárquica da organização definindo relações entre cargos';
COMMENT ON TABLE public.concrem_plano_carreira IS 'Definição de caminhos de progressão de carreira entre cargos';
COMMENT ON TABLE public.concrem_avaliacoes_desempenho IS 'Avaliações de desempenho dos funcionários para gestão de carreira';