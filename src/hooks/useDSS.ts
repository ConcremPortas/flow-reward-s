import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface DSS {
  id: string;
  titulo: string;
  descricao?: string;
  data_realizacao: string;
  setor_id?: string;
  responsavel_id?: string;
  local_dss_id?: string;
  participantes_ids?: string[];
  topics?: string[];
  observacoes?: string;
  created_at: string;
  updated_at: string;
  // Dados relacionados
  local_dss?: { nome: string };
}

export const useDSS = () => {
  const [dssRecords, setDssRecords] = useState<DSS[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDSS = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('concrem_dss')
        .select(`
          *,
          local_dss:concrem_locais_dss(nome)
        `)
        .order('data_realizacao', { ascending: false });

      if (error) throw error;
      setDssRecords((data as any) || []);
    } catch (error) {
      console.error('Erro ao carregar DSS:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os registros de DSS",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createDSS = async (dss: Omit<DSS, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('concrem_dss')
        .insert([dss])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "DSS registrado com sucesso",
      });

      fetchDSS();
      return data;
    } catch (error) {
      console.error('Erro ao criar DSS:', error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar o DSS",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateDSS = async (id: string, dss: Partial<Omit<DSS, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      const { data, error } = await supabase
        .from('concrem_dss')
        .update(dss)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "DSS atualizado com sucesso",
      });

      fetchDSS();
      return data;
    } catch (error) {
      console.error('Erro ao atualizar DSS:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o DSS",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteDSS = async (id: string) => {
    try {
      const { error } = await supabase
        .from('concrem_dss')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "DSS excluído com sucesso",
      });

      fetchDSS();
      return true;
    } catch (error) {
      console.error('Erro ao excluir DSS:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o DSS",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchDSS();
  }, []);

  return {
    dssRecords,
    loading,
    createDSS,
    updateDSS,
    deleteDSS,
    refetch: fetchDSS
  };
};