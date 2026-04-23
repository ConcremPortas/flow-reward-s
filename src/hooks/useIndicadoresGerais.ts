import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface IndicadorGeral {
  id: string;
  tipo_indicador_id: string;
  competencia: string;
  meta: number;
  realizado: number;
  percentual: number;
  created_at: string;
  updated_at: string;
  tipo_indicador?: {
    id: string;
    nome: string;
    codigo: string;
    descricao?: string;
  };
}

export const useIndicadoresGerais = () => {
  const [indicadores, setIndicadores] = useState<IndicadorGeral[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchIndicadores = async () => {
    try {
      const { data, error } = await supabase
        .from('concremrh_indicadores_gerais')
        .select(`
          *,
          tipo_indicador:concremrh_tipos_indicadores_gerais(id, nome, codigo, descricao)
        `)
        .order('competencia', { ascending: false });

      if (error) throw error;
      setIndicadores(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar indicadores",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createIndicador = async (data: Omit<IndicadorGeral, 'id' | 'created_at' | 'updated_at' | 'percentual' | 'tipo_indicador'>) => {
    try {
      const percentual = Math.round((data.realizado / data.meta) * 100);
      
      const { error } = await supabase
        .from('concremrh_indicadores_gerais')
        .insert([{ ...data, percentual }]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Indicador criado com sucesso",
      });

      await fetchIndicadores();
    } catch (error: any) {
      toast({
        title: "Erro ao criar indicador",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const updateIndicador = async (id: string, data: Partial<IndicadorGeral>) => {
    try {
      const updateData = { ...data };
      
      // Recalcular percentual se meta ou realizado mudaram
      if (data.meta !== undefined || data.realizado !== undefined) {
        const indicadorAtual = indicadores.find(i => i.id === id);
        if (indicadorAtual) {
          const meta = data.meta ?? indicadorAtual.meta;
          const realizado = data.realizado ?? indicadorAtual.realizado;
          updateData.percentual = Math.round((realizado / meta) * 100);
        }
      }

      const { error } = await supabase
        .from('concremrh_indicadores_gerais')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Indicador atualizado com sucesso",
      });

      await fetchIndicadores();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar indicador",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteIndicador = async (id: string) => {
    try {
      const { error } = await supabase
        .from('concremrh_indicadores_gerais')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Indicador excluído com sucesso",
      });

      await fetchIndicadores();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir indicador",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchIndicadores();
  }, []);

  return {
    indicadores,
    loading,
    createIndicador,
    updateIndicador,
    deleteIndicador,
    refetch: fetchIndicadores,
  };
};