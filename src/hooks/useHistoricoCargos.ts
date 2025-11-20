import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface HistoricoCargo {
  id: string;
  funcionario_id: string;
  cargo_id?: string;
  cargo_anterior_id?: string;
  salario_anterior?: number;
  salario_novo?: number;
  data_mudanca: string;
  tipo_mudanca: string;
  motivo?: string;
  aprovado_por?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  concrem_funcionarios?: {
    id: string;
    nome: string;
  };
  cargo?: {
    id: string;
    nome: string;
  };
  cargo_anterior?: {
    id: string;
    nome: string;
  };
}

export const useHistoricoCargos = (funcionarioId?: string) => {
  const [historico, setHistorico] = useState<HistoricoCargo[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchHistorico = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('concrem_historico_cargos')
        .select(`
          *,
          concrem_funcionarios!concrem_historico_cargos_funcionario_id_fkey (
            id,
            nome
          ),
          cargo:concrem_cargos!concrem_historico_cargos_cargo_id_fkey (
            id,
            nome
          ),
          cargo_anterior:concrem_cargos!concrem_historico_cargos_cargo_anterior_id_fkey (
            id,
            nome
          )
        `)
        .order('data_mudanca', { ascending: false });

      if (funcionarioId) {
        query = query.eq('funcionario_id', funcionarioId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setHistorico(data || []);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o histórico",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createHistorico = async (historico: Omit<HistoricoCargo, 'id' | 'created_at' | 'updated_at' | 'concrem_funcionarios' | 'cargo' | 'cargo_anterior'>) => {
    try {
      const { data, error } = await supabase
        .from('concrem_historico_cargos')
        .insert([historico])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Registro de histórico criado com sucesso",
      });

      fetchHistorico();
      return data;
    } catch (error) {
      console.error('Erro ao criar histórico:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o registro de histórico",
        variant: "destructive",
      });
      return null;
    }
  };

  useEffect(() => {
    fetchHistorico();
  }, [funcionarioId]);

  return {
    historico,
    loading,
    createHistorico,
    refetch: fetchHistorico
  };
};
