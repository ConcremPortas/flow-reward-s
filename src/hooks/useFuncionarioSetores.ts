import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useFuncionarioSetores = () => {
  const { toast } = useToast();

  const fetchSetoresByFuncionario = async (funcionarioId: string): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('concremrh_funcionario_setores')
        .select('setor_id')
        .eq('funcionario_id', funcionarioId);
      if (error) throw error;
      return (data || []).map(r => r.setor_id);
    } catch (error) {
      console.error('Erro ao buscar setores do funcionário:', error);
      return [];
    }
  };

  const saveSetoresFuncionario = async (funcionarioId: string, setorIds: string[]): Promise<boolean> => {
    try {
      // Delete all existing
      const { error: deleteError } = await supabase
        .from('concremrh_funcionario_setores')
        .delete()
        .eq('funcionario_id', funcionarioId);
      if (deleteError) throw deleteError;

      // Insert new ones
      if (setorIds.length > 0) {
        const rows = setorIds.map(setor_id => ({ funcionario_id: funcionarioId, setor_id }));
        const { error: insertError } = await supabase
          .from('concremrh_funcionario_setores')
          .insert(rows);
        if (insertError) throw insertError;
      }
      return true;
    } catch (error) {
      console.error('Erro ao salvar setores do funcionário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar os setores vinculados",
        variant: "destructive",
      });
      return false;
    }
  };

  return { fetchSetoresByFuncionario, saveSetoresFuncionario };
};
