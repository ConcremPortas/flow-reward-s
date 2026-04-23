import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface LocalDSS {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export const useLocaisDSS = () => {
  const [locais, setLocais] = useState<LocalDSS[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchLocais = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('concremrh_locais_dss')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setLocais(data || []);
    } catch (error) {
      console.error('Erro ao carregar locais de DSS:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os locais de DSS",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createLocal = async (local: Omit<LocalDSS, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('concremrh_locais_dss')
        .insert([local])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Local de DSS criado com sucesso",
      });

      fetchLocais();
      return data;
    } catch (error) {
      console.error('Erro ao criar local de DSS:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o local de DSS",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateLocal = async (id: string, local: Partial<LocalDSS>) => {
    try {
      const { data, error } = await supabase
        .from('concremrh_locais_dss')
        .update(local)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Local de DSS atualizado com sucesso",
      });

      fetchLocais();
      return data;
    } catch (error) {
      console.error('Erro ao atualizar local de DSS:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o local de DSS",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteLocal = async (id: string) => {
    try {
      const { error } = await supabase
        .from('concremrh_locais_dss')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Local de DSS removido com sucesso",
      });

      fetchLocais();
    } catch (error) {
      console.error('Erro ao remover local de DSS:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o local de DSS",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchLocais();
  }, []);

  return {
    locais,
    loading,
    createLocal,
    updateLocal,
    deleteLocal,
    refetch: fetchLocais
  };
};
