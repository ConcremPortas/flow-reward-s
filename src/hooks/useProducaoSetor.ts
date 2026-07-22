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
        .from('concremrh_producao_setor')
        .select(`
          *,
          setor:concremrh_setores(
            nome,
            empresa:concremrh_empresas(nome)
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
        .from('concremrh_producao_setor')
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
        .from('concremrh_producao_setor')
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

  /**
   * Salva a apuração mensal de vários setores de uma vez, preservando o formato
   * de dados esperado pela premiação (setor_id, data_producao 'YYYY-MM-01',
   * meta_diaria, producao_realizada, unidade_medida). Atualiza registros
   * existentes (por id) e insere os novos, em lote. Retorna a contagem por
   * operação; em falha, informa quais setores não foram salvos (falha parcial).
   */
  const saveApuracao = async (params: {
    updates: { id: string; meta_diaria: number; producao_realizada: number }[];
    inserts: { setor_id: string; data_producao: string; meta_diaria: number; producao_realizada: number; unidade_medida: string }[];
  }): Promise<{ ok: boolean; updated: number; inserted: number; failedSetorIds: string[] } | null> => {
    const { updates, inserts } = params;
    const failedSetorIds: string[] = [];
    let updated = 0;
    let inserted = 0;
    try {
      // Updates: um por registro existente (Supabase não faz update em lote com valores distintos).
      await Promise.all(updates.map(async (u) => {
        const { error } = await supabase
          .from('concremrh_producao_setor')
          .update({ meta_diaria: u.meta_diaria, producao_realizada: u.producao_realizada })
          .eq('id', u.id);
        if (error) failedSetorIds.push(u.id);
        else updated += 1;
      }));

      // Inserts: em uma única chamada em lote.
      if (inserts.length > 0) {
        const { error } = await supabase.from('concremrh_producao_setor').insert(inserts);
        if (error) inserts.forEach((r) => failedSetorIds.push(r.setor_id));
        else inserted = inserts.length;
      }

      const ok = failedSetorIds.length === 0;
      if (ok) {
        toast({ title: 'Apuração salva', description: `${updated} atualizado(s), ${inserted} inserido(s)` });
      } else {
        toast({
          title: 'Falha parcial ao salvar',
          description: `${failedSetorIds.length} setor(es) não foram salvos. As alterações foram mantidas.`,
          variant: 'destructive',
        });
      }
      await fetchRegistros();
      return { ok, updated, inserted, failedSetorIds };
    } catch (error) {
      console.error('Erro ao salvar apuração de produção:', error);
      toast({ title: 'Erro', description: 'Não foi possível salvar a apuração', variant: 'destructive' });
      return null;
    }
  };

  const deleteRegistro = async (id: string) => {
    try {
      const { error } = await supabase
        .from('concremrh_producao_setor')
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
    saveApuracao,
    refetch: fetchRegistros
  };
};