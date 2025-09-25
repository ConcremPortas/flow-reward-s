import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EPI {
  id: string;
  funcionario_id?: string;
  tipo_epi: string;
  numero_ca?: string;
  data_entrega: string;
  data_vencimento?: string;
  status?: string;
  descricao?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export const useEPI = () => {
  const [epiRecords, setEpiRecords] = useState<EPI[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEPI = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('concrem_epi')
        .select('*')
        .order('data_entrega', { ascending: false });

      if (error) throw error;
      setEpiRecords(data || []);
    } catch (error) {
      console.error('Erro ao carregar EPI:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os registros de EPI",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createEPI = async (epi: Omit<EPI, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('concrem_epi')
        .insert([epi])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Registro de EPI criado com sucesso",
      });

      fetchEPI();
      return data;
    } catch (error) {
      console.error('Erro ao criar registro de EPI:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o registro de EPI",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateEPI = async (id: string, epi: Partial<Omit<EPI, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      const { data, error } = await supabase
        .from('concrem_epi')
        .update(epi)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Registro de EPI atualizado com sucesso",
      });

      fetchEPI();
      return data;
    } catch (error) {
      console.error('Erro ao atualizar EPI:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o registro de EPI",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteEPI = async (id: string) => {
    try {
      const { error } = await supabase
        .from('concrem_epi')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Registro de EPI excluído com sucesso",
      });

      fetchEPI();
      return true;
    } catch (error) {
      console.error('Erro ao excluir EPI:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o registro de EPI",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchEPI();
  }, []);

  return {
    epiRecords,
    loading,
    createEPI,
    updateEPI,
    deleteEPI,
    refetch: fetchEPI
  };
};