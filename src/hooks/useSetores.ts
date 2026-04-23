import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Setor {
  id: string;
  nome: string;
  descricao?: string;
  empresa_id?: string;
  supervisor_id?: string;
  encarregado_id?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  // Dados relacionados
  empresa?: { nome: string };
  supervisor?: { nome: string };
  encarregado?: { nome: string };
}

export const useSetores = () => {
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSetores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('concremrh_setores')
        .select(`
          *,
          empresa:concremrh_empresas(nome),
          supervisor:concremrh_funcionarios!supervisor_id(nome),
          encarregado:concremrh_funcionarios!encarregado_id(nome)
        `)
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setSetores(data || []);
    } catch (error) {
      console.error('Erro ao carregar setores:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os setores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createSetor = async (setor: Omit<Setor, 'id' | 'created_at' | 'updated_at' | 'empresa' | 'supervisor' | 'encarregado'>) => {
    try {
      const { data, error } = await supabase
        .from('concremrh_setores')
        .insert([setor])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Setor criado com sucesso",
      });

      fetchSetores();
      return data;
    } catch (error) {
      console.error('Erro ao criar setor:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o setor",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateSetor = async (id: string, setor: Partial<Setor>) => {
    try {
      const { data, error } = await supabase
        .from('concremrh_setores')
        .update(setor)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Setor atualizado com sucesso",
      });

      fetchSetores();
      return data;
    } catch (error) {
      console.error('Erro ao atualizar setor:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o setor",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteSetor = async (id: string) => {
    try {
      const { error } = await supabase
        .from('concremrh_setores')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Setor removido com sucesso",
      });

      fetchSetores();
    } catch (error) {
      console.error('Erro ao remover setor:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o setor",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchSetores();
  }, []);

  return {
    setores,
    loading,
    createSetor,
    updateSetor,
    deleteSetor,
    refetch: fetchSetores
  };
};