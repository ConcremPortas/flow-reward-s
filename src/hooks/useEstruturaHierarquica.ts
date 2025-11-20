import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EstruturaHierarquica {
  id: string;
  cargo_id: string;
  cargo_superior_id?: string;
  nivel_hierarquico: number;
  pode_aprovar_mudancas: boolean;
  quantidade_subordinados_diretos: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  concrem_cargos?: {
    id: string;
    nome: string;
  };
  cargo_superior?: {
    id: string;
    nome: string;
  };
}

export const useEstruturaHierarquica = () => {
  const [estrutura, setEstrutura] = useState<EstruturaHierarquica[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEstrutura = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('concrem_estrutura_hierarquica')
        .select(`
          *,
          concrem_cargos!concrem_estrutura_hierarquica_cargo_id_fkey (
            id,
            nome
          ),
          cargo_superior:concrem_cargos!concrem_estrutura_hierarquica_cargo_superior_id_fkey (
            id,
            nome
          )
        `)
        .eq('ativo', true)
        .order('nivel_hierarquico');

      if (error) throw error;
      setEstrutura(data || []);
    } catch (error) {
      console.error('Erro ao carregar estrutura hierárquica:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a estrutura hierárquica",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createEstrutura = async (estrutura: Omit<EstruturaHierarquica, 'id' | 'created_at' | 'updated_at' | 'concrem_cargos' | 'cargo_superior'>) => {
    try {
      const { data, error } = await supabase
        .from('concrem_estrutura_hierarquica')
        .insert([estrutura])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Estrutura hierárquica criada com sucesso",
      });

      fetchEstrutura();
      return data;
    } catch (error) {
      console.error('Erro ao criar estrutura hierárquica:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a estrutura hierárquica",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateEstrutura = async (id: string, estrutura: Partial<EstruturaHierarquica>) => {
    try {
      const { error } = await supabase
        .from('concrem_estrutura_hierarquica')
        .update(estrutura)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Estrutura hierárquica atualizada com sucesso",
      });

      fetchEstrutura();
    } catch (error) {
      console.error('Erro ao atualizar estrutura hierárquica:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a estrutura hierárquica",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchEstrutura();
  }, []);

  return {
    estrutura,
    loading,
    createEstrutura,
    updateEstrutura,
    refetch: fetchEstrutura
  };
};
