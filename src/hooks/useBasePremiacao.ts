import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface BasePremiacao {
  id: string;
  nome: string;
  descricao?: string;
  valor_base: number;
  tipo: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export const useBasePremiacao = () => {
  const [bases, setBases] = useState<BasePremiacao[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBases = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('concremrh_base_premiacao')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setBases(data || []);
    } catch (error) {
      console.error('Erro ao carregar bases de premiação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as bases de premiação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createBase = async (base: Omit<BasePremiacao, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('concremrh_base_premiacao')
        .insert([base])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Base de premiação criada com sucesso",
      });

      fetchBases();
      return data;
    } catch (error) {
      console.error('Erro ao criar base de premiação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a base de premiação",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateBase = async (id: string, base: Partial<Omit<BasePremiacao, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      const { error } = await supabase
        .from('concremrh_base_premiacao')
        .update(base)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Base de premiação atualizada com sucesso",
      });

      fetchBases();
    } catch (error) {
      console.error('Erro ao atualizar base de premiação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a base de premiação",
        variant: "destructive",
      });
    }
  };

  const deleteBase = async (id: string) => {
    try {
      const { error } = await supabase
        .from('concremrh_base_premiacao')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Base de premiação removida com sucesso",
      });

      fetchBases();
    } catch (error) {
      console.error('Erro ao remover base de premiação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a base de premiação",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchBases();
  }, []);

  return {
    bases,
    loading,
    createBase,
    updateBase,
    deleteBase,
    refetch: fetchBases
  };
};