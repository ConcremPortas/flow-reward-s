import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FaltaAdvertencia {
  id: string;
  funcionario_id?: string;
  tipo: string;
  motivo: string;
  descricao?: string;
  gravidade?: string;
  data_ocorrencia: string;
  aplicado_por?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export const useFaltasAdvertencias = () => {
  const [registros, setRegistros] = useState<FaltaAdvertencia[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRegistros = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('concrem_faltas_advertencias')
        .select('*')
        .order('data_ocorrencia', { ascending: false });

      if (error) throw error;
      setRegistros(data || []);
    } catch (error) {
      console.error('Erro ao carregar faltas/advertências:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os registros de faltas/advertências",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createRegistro = async (registro: Omit<FaltaAdvertencia, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('concrem_faltas_advertencias')
        .insert([registro])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Registro de falta/advertência criado com sucesso",
      });

      fetchRegistros();
      return data;
    } catch (error) {
      console.error('Erro ao criar registro:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o registro",
        variant: "destructive",
      });
      return null;
    }
  };

  useEffect(() => {
    fetchRegistros();
  }, []);

  return {
    registros,
    loading,
    createRegistro,
    refetch: fetchRegistros
  };
};