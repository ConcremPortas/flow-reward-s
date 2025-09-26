-- Adicionar campo base_premiacao_id na tabela funcionários
ALTER TABLE public.concrem_funcionarios 
ADD COLUMN base_premiacao_id uuid REFERENCES public.concrem_base_premiacao(id);