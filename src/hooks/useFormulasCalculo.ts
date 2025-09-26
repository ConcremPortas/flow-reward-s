import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FormulaCalculo {
  id: string;
  categoria_id?: string;
  base_premiacao_id?: string;
  nome: string;
  descricao?: string;
  peso_producao_setor: number;
  peso_epi: number;
  peso_faltas: number;
  peso_advertencias: number;
  peso_dss: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  categoria?: {
    nome: string;
  };
  base_premiacao?: {
    nome: string;
  };
}

export const useFormulasCalculo = () => {
  const [formulas, setFormulas] = useState<FormulaCalculo[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFormulas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('concrem_formulas_calculo')
        .select(`
          *,
          categoria:concrem_categorias(nome),
          base_premiacao:concrem_base_premiacao(nome)
        `)
        .eq('ativo', true)
        .order('nome');

      if (error) throw error;
      setFormulas(data || []);
    } catch (error) {
      console.error('Erro ao carregar fórmulas de cálculo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as fórmulas de cálculo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createFormula = async (formula: Omit<FormulaCalculo, 'id' | 'created_at' | 'updated_at' | 'categoria' | 'base_premiacao'>) => {
    try {
      const { data, error } = await supabase
        .from('concrem_formulas_calculo')
        .insert([formula])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Fórmula de cálculo criada com sucesso",
      });

      fetchFormulas();
      return data;
    } catch (error) {
      console.error('Erro ao criar fórmula de cálculo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a fórmula de cálculo",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateFormula = async (id: string, formula: Partial<Omit<FormulaCalculo, 'id' | 'created_at' | 'updated_at' | 'categoria' | 'base_premiacao'>>) => {
    try {
      const { error } = await supabase
        .from('concrem_formulas_calculo')
        .update(formula)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Fórmula de cálculo atualizada com sucesso",
      });

      fetchFormulas();
    } catch (error) {
      console.error('Erro ao atualizar fórmula de cálculo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a fórmula de cálculo",
        variant: "destructive",
      });
    }
  };

  const deleteFormula = async (id: string) => {
    try {
      const { error } = await supabase
        .from('concrem_formulas_calculo')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Fórmula de cálculo removida com sucesso",
      });

      fetchFormulas();
    } catch (error) {
      console.error('Erro ao remover fórmula de cálculo:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a fórmula de cálculo",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchFormulas();
  }, []);

  return {
    formulas,
    loading,
    createFormula,
    updateFormula,
    deleteFormula,
    refetch: fetchFormulas
  };
};