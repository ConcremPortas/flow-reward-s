import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ProducaoSetor {
  id: string;
  setor_id: string;
  data_producao: string;
  meta_diaria: number;
  producao_realizada: number;
  unidade_medida: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  // Dados relacionados
  setor?: { nome: string; empresa?: { nome: string } };
}

export const useProducaoSetor = () => {
  const [registros, setRegistros] = useState<ProducaoSetor[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRegistros = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('concrem_producao_setor')
        .select(`
          *,
          setor:concrem_setores(
            nome,
            empresa:concrem_empresas(nome)
          )
        `)
        .order('data_producao', { ascending: false });

      if (error) throw error;
      setRegistros(data || []);
    } catch (error) {
      console.error('Erro ao carregar produção por setor:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados de produção",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createRegistro = async (registro: Omit<ProducaoSetor, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('concrem_producao_setor')
        .insert([registro])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Registro de produção criado com sucesso",
      });

      fetchRegistros();
      return data;
    } catch (error) {
      console.error('Erro ao criar registro de produção:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o registro de produção",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateRegistro = async (id: string, registro: Partial<ProducaoSetor>) => {
    try {
      const { data, error } = await supabase
        .from('concrem_producao_setor')
        .update(registro)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Registro de produção atualizado com sucesso",
      });

      fetchRegistros();
      return data;
    } catch (error) {
      console.error('Erro ao atualizar registro de produção:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o registro de produção",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteRegistro = async (id: string) => {
    try {
      const { error } = await supabase
        .from('concrem_producao_setor')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Registro de produção removido com sucesso",
      });

      fetchRegistros();
    } catch (error) {
      console.error('Erro ao remover registro de produção:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o registro de produção",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchRegistros();
  }, []);

  return {
    registros,
    loading,
    createRegistro,
    updateRegistro,
    deleteRegistro,
    refetch: fetchRegistros
  };
};