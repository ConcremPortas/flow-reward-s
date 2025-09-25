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
  participantes_ids?: string[];
  topics?: string[];
  observacoes?: string;
  created_at: string;
  updated_at: string;
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
        .select('*')
        .order('data_realizacao', { ascending: false });

      if (error) throw error;
      setDssRecords(data || []);
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

  useEffect(() => {
    fetchDSS();
  }, []);

  return {
    dssRecords,
    loading,
    createDSS,
    refetch: fetchDSS
  };
};