import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Empresa {
  id: string;
  nome: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export const useEmpresas = () => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEmpresas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('concrem_empresas')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setEmpresas(data || []);
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as empresas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createEmpresa = async (empresa: Omit<Empresa, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('concrem_empresas')
        .insert([empresa])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Empresa criada com sucesso",
      });

      fetchEmpresas();
      return data;
    } catch (error) {
      console.error('Erro ao criar empresa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a empresa",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateEmpresa = async (id: string, empresa: Partial<Empresa>) => {
    try {
      const { data, error } = await supabase
        .from('concrem_empresas')
        .update(empresa)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Empresa atualizada com sucesso",
      });

      fetchEmpresas();
      return data;
    } catch (error) {
      console.error('Erro ao atualizar empresa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a empresa",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteEmpresa = async (id: string) => {
    try {
      const { error } = await supabase
        .from('concrem_empresas')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Empresa removida com sucesso",
      });

      fetchEmpresas();
    } catch (error) {
      console.error('Erro ao remover empresa:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a empresa",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchEmpresas();
  }, []);

  return {
    empresas,
    loading,
    createEmpresa,
    updateEmpresa,
    deleteEmpresa,
    refetch: fetchEmpresas
  };
};