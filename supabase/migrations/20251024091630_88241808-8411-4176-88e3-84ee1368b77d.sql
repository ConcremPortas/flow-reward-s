-- Criar tabela de locais de DSS
CREATE TABLE concrem_locais_dss (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  descricao text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Adicionar trigger para atualizar updated_at
CREATE TRIGGER update_locais_dss_updated_at
BEFORE UPDATE ON concrem_locais_dss
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar coluna local_dss_id em funcionários
ALTER TABLE concrem_funcionarios 
ADD COLUMN local_dss_id uuid REFERENCES concrem_locais_dss(id);

-- Adicionar índice para melhor performance
CREATE INDEX idx_funcionarios_local_dss_id ON concrem_funcionarios(local_dss_id);

-- Adicionar coluna local_dss_id em dss
ALTER TABLE concrem_dss 
ADD COLUMN local_dss_id uuid REFERENCES concrem_locais_dss(id);

-- Adicionar índice para melhor performance
CREATE INDEX idx_dss_local_dss_id ON concrem_dss(local_dss_id);

-- Habilitar RLS
ALTER TABLE concrem_locais_dss ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
CREATE POLICY "Allow all operations on locais_dss" 
ON concrem_locais_dss 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Inserir locais padrão
INSERT INTO concrem_locais_dss (nome, descricao) VALUES
  ('Fábrica 01', 'Local de DSS da Fábrica 01'),
  ('Fábrica 02', 'Local de DSS da Fábrica 02');