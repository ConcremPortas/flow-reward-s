import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ConfiguracaoKits {
  id: string;
  vigencia_inicio: string;
  minimo_kits: number;
  incremento_faixa: number;
  bonus_base: number;
  bonus_por_faixa: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export const useConfiguracoesKits = () => {
  const [configuracoes, setConfiguracoes] = useState<ConfiguracaoKits[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchConfiguracoes = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('concremrh_configuracoes_kits')
        .select('*')
        .eq('ativo', true)
        .order('vigencia_inicio', { ascending: false });

      if (error) throw error;
      setConfiguracoes(data || []);
    } catch (error) {
      console.error('Erro ao carregar configurações de kits:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as configurações de kits",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getConfigParaCompetencia = (competencia: string): ConfiguracaoKits | null => {
    const competenciaMes = competencia.slice(0, 7);
    const vigentes = configuracoes
      .filter(c => c.vigencia_inicio <= competenciaMes)
      .sort((a, b) => b.vigencia_inicio.localeCompare(a.vigencia_inicio));
    return vigentes[0] || null;
  };

  const createConfiguracao = async (config: Omit<ConfiguracaoKits, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await (supabase as any)
        .from('concremrh_configuracoes_kits')
        .insert([config])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configuração criada com sucesso",
      });

      fetchConfiguracoes();
      return data;
    } catch (error: any) {
      console.error('Erro ao criar configuração:', error);
      const isDuplicate = error?.code === '23505';
      toast({
        title: "Erro",
        description: isDuplicate
          ? "Já existe uma configuração para esse mês de vigência"
          : "Não foi possível criar a configuração",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateConfiguracao = async (id: string, config: Partial<Omit<ConfiguracaoKits, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      const { error } = await (supabase as any)
        .from('concremrh_configuracoes_kits')
        .update(config)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configuração atualizada com sucesso",
      });

      fetchConfiguracoes();
    } catch (error: any) {
      console.error('Erro ao atualizar configuração:', error);
      const isDuplicate = error?.code === '23505';
      toast({
        title: "Erro",
        description: isDuplicate
          ? "Já existe uma configuração para esse mês de vigência"
          : "Não foi possível atualizar a configuração",
        variant: "destructive",
      });
    }
  };

  const deleteConfiguracao = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('concremrh_configuracoes_kits')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Configuração removida com sucesso",
      });

      fetchConfiguracoes();
    } catch (error) {
      console.error('Erro ao remover configuração:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover a configuração",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchConfiguracoes();
  }, []);

  return {
    configuracoes,
    loading,
    getConfigParaCompetencia,
    createConfiguracao,
    updateConfiguracao,
    deleteConfiguracao,
    refetch: fetchConfiguracoes,
  };
};
