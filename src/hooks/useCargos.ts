import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Cargo {
  id: string;
  nome: string;
  setor_id?: string;
  nivel_hierarquico?: number;
  missao?: string;
  responsabilidades?: string[];
  atividades?: string[];
  competencias?: string[];
  requisitos?: string;
  salario_minimo?: number;
  salario_maximo?: number;
  observacoes?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  concremrh_setores?: {
    id: string;
    nome: string;
  };
}

export const useCargos = () => {
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCargos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('concremrh_cargos')
        .select(`
          *,
          concremrh_setores (
            id,
            nome
          )
        `)
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setCargos(data || []);
    } catch (error) {
      console.error('Erro ao carregar cargos:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os cargos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCargo = async (cargo: Omit<Cargo, 'id' | 'created_at' | 'updated_at' | 'concremrh_setores'>) => {
    try {
      const { data, error } = await supabase
        .from('concremrh_cargos')
        .insert([cargo])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Cargo cadastrado com sucesso",
      });

      fetchCargos();
      return data;
    } catch (error) {
      console.error('Erro ao criar cargo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível cadastrar o cargo",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateCargo = async (id: string, cargo: Partial<Cargo>) => {
    try {
      const { error } = await supabase
        .from('concremrh_cargos')
        .update(cargo)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Cargo atualizado com sucesso",
      });

      fetchCargos();
    } catch (error) {
      console.error('Erro ao atualizar cargo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o cargo",
        variant: "destructive",
      });
    }
  };

  const deleteCargo = async (id: string) => {
    try {
      // Verificar se há funcionários vinculados
      const { data: funcionarios, error: checkError } = await supabase
        .from('concremrh_funcionarios')
        .select('id')
        .eq('funcao_id', id)
        .eq('ativo', true);

      if (checkError) throw checkError;

      if (funcionarios && funcionarios.length > 0) {
        toast({
          title: "Atenção",
          description: "Não é possível excluir um cargo com funcionários vinculados",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('concremrh_cargos')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Cargo removido com sucesso",
      });

      fetchCargos();
    } catch (error) {
      console.error('Erro ao remover cargo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o cargo",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchCargos();
  }, []);

  return {
    cargos,
    loading,
    createCargo,
    updateCargo,
    deleteCargo,
    refetch: fetchCargos
  };
};
