import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TipoIndicadorGeral {
  id: string;
  nome: string;
  codigo: string;
  descricao?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export const useTiposIndicadoresGerais = () => {
  const [tiposIndicadores, setTiposIndicadores] = useState<TipoIndicadorGeral[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTiposIndicadores = async () => {
    try {
      const { data, error } = await supabase
        .from('concrem_tipos_indicadores_gerais')
        .select('*')
        .order('nome');

      if (error) throw error;
      setTiposIndicadores(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar tipos de indicadores",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createTipoIndicador = async (data: Omit<TipoIndicadorGeral, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { error } = await supabase
        .from('concrem_tipos_indicadores_gerais')
        .insert([data]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Tipo de indicador criado com sucesso",
      });

      await fetchTiposIndicadores();
    } catch (error: any) {
      toast({
        title: "Erro ao criar tipo de indicador",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateTipoIndicador = async (id: string, data: Partial<TipoIndicadorGeral>) => {
    try {
      const { error } = await supabase
        .from('concrem_tipos_indicadores_gerais')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Tipo de indicador atualizado com sucesso",
      });

      await fetchTiposIndicadores();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar tipo de indicador",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteTipoIndicador = async (id: string) => {
    try {
      const { error } = await supabase
        .from('concrem_tipos_indicadores_gerais')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Tipo de indicador excluído com sucesso",
      });

      await fetchTiposIndicadores();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir tipo de indicador",
        description: error.message,
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
    refetch: fetchTiposIndicadores,
  };
};