import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Faixa {
  id: string;
  nome: string;
  valor: number;
  categoria_id?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export const useFaixas = () => {
  const [faixas, setFaixas] = useState<Faixa[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFaixas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('concremrh_faixas')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setFaixas(data || []);
    } catch (error) {
      console.error('Erro ao carregar faixas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as faixas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createFaixa = async (faixa: Omit<Faixa, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('concremrh_faixas')
        .insert([faixa])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Faixa criada com sucesso",
      });

      fetchFaixas();
      return data;
    } catch (error) {
      console.error('Erro ao criar faixa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a faixa",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteFaixa = async (id: string) => {
    try {
      const { error } = await supabase
        .from('concremrh_faixas')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Faixa removida com sucesso",
      });

      fetchFaixas();
    } catch (error) {
      console.error('Erro ao remover faixa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a faixa",
        variant: "destructive",
      });
    }
  };

  const updateFaixa = async (id: string, faixa: Partial<Omit<Faixa, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      const { error } = await supabase
        .from('concremrh_faixas')
        .update(faixa)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Faixa atualizada com sucesso",
      });

      fetchFaixas();
    } catch (error) {
      console.error('Erro ao atualizar faixa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a faixa",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchFaixas();
  }, []);

  return {
    faixas,
    loading,
    createFaixa,
    deleteFaixa,
    updateFaixa,
    refetch: fetchFaixas
  };
};
