import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface EPI {
  id: string;
  funcionario_id?: string;
  tipo_epi: string;
  numero_ca?: string;
  data_entrega: string;
  data_vencimento?: string;
  status?: string;
  descricao?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export const useEPI = () => {
  const [epiRecords, setEpiRecords] = useState<EPI[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEPI = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('concremrh_epi')
        .select('*')
        .order('data_entrega', { ascending: false });

      if (error) throw error;
      setEpiRecords(data || []);
    } catch (error) {
      console.error('Erro ao carregar EPI:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os registros de EPI",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createEPI = async (epi: Omit<EPI, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('concremrh_epi')
        .insert([epi])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Registro de EPI criado com sucesso",
      });

      fetchEPI();
      return data;
    } catch (error) {
      console.error('Erro ao criar registro de EPI:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o registro de EPI",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateEPI = async (id: string, epi: Partial<Omit<EPI, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      console.log('Hook updateEPI - dados recebidos:', { id, epi });
      
      const { data, error } = await supabase
        .from('concremrh_epi')
        .update(epi)
        .eq('id', id)
        .select()
        .single();

      console.log('Hook updateEPI - resposta do banco:', { data, error });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Registro de EPI atualizado com sucesso",
      });

      fetchEPI();
      return data;
    } catch (error) {
      console.error('Erro ao atualizar EPI:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o registro de EPI",
        variant: "destructive",
      });
      return null;
    }
  };

  /**
   * Salva uma auditoria completa em uma única operação: opcionalmente apaga
   * linhas antigas (edição) e insere as novas linhas (1 por funcionário
   * auditado + 1 resumo) em um único INSERT em lote — evita N chamadas
   * separadas (e N toasts) para auditorias com centenas de funcionários.
   * `funcionario_id: null` identifica a linha-resumo da auditoria.
   */
  const saveAuditoria = async (
    rows: (Omit<EPI, 'id' | 'created_at' | 'updated_at' | 'funcionario_id'> & { funcionario_id: string | null })[],
    deleteIds: string[] = [],
  ) => {
    try {
      if (deleteIds.length > 0) {
        const { error: deleteError } = await supabase.from('concremrh_epi').delete().in('id', deleteIds);
        if (deleteError) throw deleteError;
      }

      const { error } = await supabase.from('concremrh_epi').insert(rows);
      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Auditoria de EPI salva com sucesso",
      });

      await fetchEPI();
      return true;
    } catch (error) {
      console.error('Erro ao salvar auditoria de EPI:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a auditoria de EPI",
        variant: "destructive",
      });
      return false;
    }
  };

  /** Exclui todas as linhas de uma auditoria (resumo + detalhe por funcionário) em uma única operação. */
  const deleteManyEPI = async (ids: string[]) => {
    if (ids.length === 0) return true;
    try {
      const { error } = await supabase.from('concremrh_epi').delete().in('id', ids);
      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Auditoria de EPI excluída com sucesso",
      });

      await fetchEPI();
      return true;
    } catch (error) {
      console.error('Erro ao excluir auditoria de EPI:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a auditoria de EPI",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteEPI = async (id: string) => {
    try {
      const { error } = await supabase
        .from('concremrh_epi')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Registro de EPI excluído com sucesso",
      });

      fetchEPI();
      return true;
    } catch (error) {
      console.error('Erro ao excluir EPI:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o registro de EPI",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchEPI();
  }, []);

  return {
    epiRecords,
    loading,
    createEPI,
    updateEPI,
    deleteEPI,
    saveAuditoria,
    deleteManyEPI,
    refetch: fetchEPI
  };
};