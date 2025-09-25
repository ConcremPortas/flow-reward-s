import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Funcao {
  id: string;
  nome: string;
  descricao?: string;
  nivel_hierarquico?: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export const useFuncoes = () => {
  const [funcoes, setFuncoes] = useState<Funcao[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFuncoes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('concrem_funcoes')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setFuncoes(data || []);
    } catch (error) {
      console.error('Erro ao carregar funções:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as funções",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createFuncao = async (funcao: Omit<Funcao, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('concrem_funcoes')
        .insert([funcao])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Função criada com sucesso",
      });

      fetchFuncoes();
      return data;
    } catch (error) {
      console.error('Erro ao criar função:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a função",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteFuncao = async (id: string) => {
    try {
      const { error } = await supabase
        .from('concrem_funcoes')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Função removida com sucesso",
      });

      fetchFuncoes();
    } catch (error) {
      console.error('Erro ao remover função:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a função",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchFuncoes();
  }, []);

  return {
    funcoes,
    loading,
    createFuncao,
    deleteFuncao,
    refetch: fetchFuncoes
  };
};