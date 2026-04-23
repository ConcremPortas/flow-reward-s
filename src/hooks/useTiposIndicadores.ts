import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TipoIndicador {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export const useTiposIndicadores = () => {
  const [tiposIndicadores, setTiposIndicadores] = useState<TipoIndicador[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTiposIndicadores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('concremrh_tipos_indicadores')
        .select('*')
        .eq('ativo', true)
        .order('codigo');

      if (error) throw error;
      setTiposIndicadores(data || []);
    } catch (error) {
      console.error('Erro ao carregar tipos de indicadores:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os tipos de indicadores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTipoIndicador = async (tipoIndicador: Omit<TipoIndicador, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('concremrh_tipos_indicadores')
        .insert([tipoIndicador])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Tipo de indicador criado com sucesso",
      });

      fetchTiposIndicadores();
      return data;
    } catch (error) {
      console.error('Erro ao criar tipo de indicador:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o tipo de indicador",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateTipoIndicador = async (id: string, tipoIndicador: Partial<TipoIndicador>) => {
    try {
      const { data, error } = await supabase
        .from('concremrh_tipos_indicadores')
        .update(tipoIndicador)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Tipo de indicador atualizado com sucesso",
      });

      fetchTiposIndicadores();
      return data;
    } catch (error) {
      console.error('Erro ao atualizar tipo de indicador:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o tipo de indicador",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteTipoIndicador = async (id: string) => {
    try {
      const { error } = await supabase
        .from('concremrh_tipos_indicadores')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Tipo de indicador removido com sucesso",
      });

      fetchTiposIndicadores();
    } catch (error) {
      console.error('Erro ao remover tipo de indicador:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o tipo de indicador",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchTiposIndicadores();
  }, []);

  return {
    tiposIndicadores,
    loading,
    createTipoIndicador,
    updateTipoIndicador,
    deleteTipoIndicador,
    refetch: fetchTiposIndicadores
  };
};