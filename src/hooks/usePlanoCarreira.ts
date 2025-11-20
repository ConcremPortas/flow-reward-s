import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PlanoCarreira {
  id: string;
  cargo_origem_id: string;
  cargo_destino_id: string;
  tipo_progressao: string;
  tempo_minimo_meses?: number;
  requisitos?: string[];
  competencias_necessarias?: string[];
  descricao?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  cargo_origem?: {
    id: string;
    nome: string;
  };
  cargo_destino?: {
    id: string;
    nome: string;
  };
}

export const usePlanoCarreira = (cargoId?: string) => {
  const [planos, setPlanos] = useState<PlanoCarreira[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPlanos = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('concrem_plano_carreira')
        .select(`
          *,
          cargo_origem:concrem_cargos!concrem_plano_carreira_cargo_origem_id_fkey (
            id,
            nome
          ),
          cargo_destino:concrem_cargos!concrem_plano_carreira_cargo_destino_id_fkey (
            id,
            nome
          )
        `)
        .eq('ativo', true);

      if (cargoId) {
        query = query.or(`cargo_origem_id.eq.${cargoId},cargo_destino_id.eq.${cargoId}`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPlanos(data || []);
    } catch (error) {
      console.error('Erro ao carregar plano de carreira:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o plano de carreira",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createPlano = async (plano: Omit<PlanoCarreira, 'id' | 'created_at' | 'updated_at' | 'cargo_origem' | 'cargo_destino'>) => {
    try {
      const { data, error } = await supabase
        .from('concrem_plano_carreira')
        .insert([plano])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Plano de carreira criado com sucesso",
      });

      fetchPlanos();
      return data;
    } catch (error) {
      console.error('Erro ao criar plano de carreira:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o plano de carreira",
        variant: "destructive",
      });
      return null;
    }
  };

  const updatePlano = async (id: string, plano: Partial<PlanoCarreira>) => {
    try {
      const { error } = await supabase
        .from('concrem_plano_carreira')
        .update(plano)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Plano de carreira atualizado com sucesso",
      });

      fetchPlanos();
    } catch (error) {
      console.error('Erro ao atualizar plano de carreira:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o plano de carreira",
        variant: "destructive",
      });
    }
  };

  const deletePlano = async (id: string) => {
    try {
      const { error } = await supabase
        .from('concrem_plano_carreira')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Plano de carreira removido com sucesso",
      });

      fetchPlanos();
    } catch (error) {
      console.error('Erro ao remover plano de carreira:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o plano de carreira",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchPlanos();
  }, [cargoId]);

  return {
    planos,
    loading,
    createPlano,
    updatePlano,
    deletePlano,
    refetch: fetchPlanos
  };
};
