import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AvaliacaoDesempenho {
  id: string;
  funcionario_id: string;
  avaliador_id?: string;
  data_avaliacao: string;
  periodo_inicio: string;
  periodo_fim: string;
  nota_geral?: number;
  competencias_avaliadas?: any;
  pontos_fortes?: string[];
  pontos_melhoria?: string[];
  objetivos_alcancados?: string[];
  comentarios?: string;
  elegivel_promocao: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  concremrh_funcionarios?: {
    id: string;
    nome: string;
  };
  avaliador?: {
    id: string;
    nome: string;
  };
}

export const useAvaliacoesDesempenho = (funcionarioId?: string) => {
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoDesempenho[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAvaliacoes = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('concremrh_avaliacoes_desempenho')
        .select(`
          *,
          concremrh_funcionarios!concremrh_avaliacoes_desempenho_funcionario_id_fkey (
            id,
            nome
          ),
          avaliador:concremrh_funcionarios!concremrh_avaliacoes_desempenho_avaliador_id_fkey (
            id,
            nome
          )
        `)
        .order('data_avaliacao', { ascending: false });

      if (funcionarioId) {
        query = query.eq('funcionario_id', funcionarioId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAvaliacoes(data || []);
    } catch (error) {
      console.error('Erro ao carregar avaliações:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as avaliações",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createAvaliacao = async (avaliacao: Omit<AvaliacaoDesempenho, 'id' | 'created_at' | 'updated_at' | 'concremrh_funcionarios' | 'avaliador'>) => {
    try {
      const { data, error } = await supabase
        .from('concremrh_avaliacoes_desempenho')
        .insert([avaliacao])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Avaliação criada com sucesso",
      });

      fetchAvaliacoes();
      return data;
    } catch (error) {
      console.error('Erro ao criar avaliação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a avaliação",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateAvaliacao = async (id: string, avaliacao: Partial<AvaliacaoDesempenho>) => {
    try {
      const { error } = await supabase
        .from('concremrh_avaliacoes_desempenho')
        .update(avaliacao)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Avaliação atualizada com sucesso",
      });

      fetchAvaliacoes();
    } catch (error) {
      console.error('Erro ao atualizar avaliação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a avaliação",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAvaliacoes();
  }, [funcionarioId]);

  return {
    avaliacoes,
    loading,
    createAvaliacao,
    updateAvaliacao,
    refetch: fetchAvaliacoes
  };
};
