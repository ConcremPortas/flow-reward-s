import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Categoria {
  id: string;
  nome: string;
  descricao?: string;
  cor?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export const useCategorias = () => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCategorias = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('concrem_categorias')
        .select('*')
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setCategorias(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as categorias",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCategoria = async (categoria: Omit<Categoria, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('concrem_categorias')
        .insert([categoria])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Categoria criada com sucesso",
      });

      fetchCategorias();
      return data;
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a categoria",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteCategoria = async (id: string) => {
    try {
      const { error } = await supabase
        .from('concrem_categorias')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Categoria removida com sucesso",
      });

      fetchCategorias();
    } catch (error) {
      console.error('Erro ao remover categoria:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a categoria",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchCategorias();
  }, []);

  return {
    categorias,
    loading,
    createCategoria,
    deleteCategoria,
    refetch: fetchCategorias
  };
};