import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface IndicadorSetor {
  id: string;
  setor_id?: string;
  competencia: string;
  hora_maquina_meta?: number;
  hora_maquina_realizado?: number;
  hora_maquina_percentual?: number;
  identificacao_nc_meta?: number;
  identificacao_nc_realizado?: number;
  identificacao_nc_percentual?: number;
  limpeza_meta?: number;
  limpeza_realizado?: number;
  limpeza_percentual?: number;
  tratamento_nc_meta?: number;
  tratamento_nc_realizado?: number;
  tratamento_nc_percentual?: number;
  operacao_segura_meta?: number;
  operacao_segura_realizado?: number;
  operacao_segura_percentual?: number;
  created_at: string;
  updated_at: string;
  // Dados relacionados
  setor?: { nome: string };
}

export const useIndicadoresSetor = () => {
  const [indicadores, setIndicadores] = useState<IndicadorSetor[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  type IndicadorSetorInput = Omit<IndicadorSetor, 'id' | 'created_at' | 'updated_at' | 'setor'>;

  const fetchIndicadores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('concremrh_indicadores_setor')
        .select(`
          *,
          setor:concremrh_setores(nome)
        `)
        .order('competencia', { ascending: false });

      if (error) throw error;
      setIndicadores(data || []);
    } catch (error) {
      console.error('Erro ao carregar indicadores de setor:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os indicadores de setor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calcularPercentuais = (meta?: number, realizado?: number) => {
    if (!meta || meta === 0) return null;
    return realizado ? (realizado / meta) : 0;
  };

  const createIndicador = async (indicador: IndicadorSetorInput) => {
    try {
      // Calcular percentuais
      const hora_maquina_percentual = calcularPercentuais(indicador.hora_maquina_meta, indicador.hora_maquina_realizado);
      const identificacao_nc_percentual = calcularPercentuais(indicador.identificacao_nc_meta, indicador.identificacao_nc_realizado);
      const limpeza_percentual = calcularPercentuais(indicador.limpeza_meta, indicador.limpeza_realizado);
      const tratamento_nc_percentual = calcularPercentuais(indicador.tratamento_nc_meta, indicador.tratamento_nc_realizado);
      const operacao_segura_percentual = calcularPercentuais(indicador.operacao_segura_meta, indicador.operacao_segura_realizado);

      const { error } = await supabase
        .from('concremrh_indicadores_setor')
        .insert({
          ...indicador,
          hora_maquina_percentual,
          identificacao_nc_percentual,
          limpeza_percentual,
          tratamento_nc_percentual,
          operacao_segura_percentual
        });

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Indicador criado com sucesso",
      });
      
      fetchIndicadores();
    } catch (error) {
      console.error('Erro ao criar indicador:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o indicador",
        variant: "destructive",
      });
    }
  };

  const createIndicadoresBulk = async (indicadoresBulk: IndicadorSetorInput[]) => {
    try {
      const rows = indicadoresBulk.map((indicador) => {
        const hora_maquina_percentual = calcularPercentuais(indicador.hora_maquina_meta, indicador.hora_maquina_realizado);
        const identificacao_nc_percentual = calcularPercentuais(indicador.identificacao_nc_meta, indicador.identificacao_nc_realizado);
        const limpeza_percentual = calcularPercentuais(indicador.limpeza_meta, indicador.limpeza_realizado);
        const tratamento_nc_percentual = calcularPercentuais(indicador.tratamento_nc_meta, indicador.tratamento_nc_realizado);
        const operacao_segura_percentual = calcularPercentuais(indicador.operacao_segura_meta, indicador.operacao_segura_realizado);

        return {
          ...indicador,
          hora_maquina_percentual,
          identificacao_nc_percentual,
          limpeza_percentual,
          tratamento_nc_percentual,
          operacao_segura_percentual,
        };
      });

      const { error } = await supabase
        .from('concremrh_indicadores_setor')
        .insert(rows);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `${indicadoresBulk.length} registro(s) criado(s) com sucesso`,
      });

      fetchIndicadores();
    } catch (error) {
      console.error('Erro ao criar indicadores em lote:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar os indicadores em lote",
        variant: "destructive",
      });
    }
  };

  const updateIndicador = async (id: string, indicador: Partial<IndicadorSetorInput>) => {
    try {
      // Recalcular percentuais se meta ou realizado mudaram
      const updates: any = { ...indicador };
      
      if (indicador.hora_maquina_meta !== undefined || indicador.hora_maquina_realizado !== undefined) {
        const { data: current } = await supabase.from('concremrh_indicadores_setor').select('*').eq('id', id).single();
        updates.hora_maquina_percentual = calcularPercentuais(
          indicador.hora_maquina_meta ?? current?.hora_maquina_meta,
          indicador.hora_maquina_realizado ?? current?.hora_maquina_realizado
        );
      }
      
      if (indicador.identificacao_nc_meta !== undefined || indicador.identificacao_nc_realizado !== undefined) {
        const { data: current } = await supabase.from('concremrh_indicadores_setor').select('*').eq('id', id).single();
        updates.identificacao_nc_percentual = calcularPercentuais(
          indicador.identificacao_nc_meta ?? current?.identificacao_nc_meta,
          indicador.identificacao_nc_realizado ?? current?.identificacao_nc_realizado
        );
      }
      
      if (indicador.limpeza_meta !== undefined || indicador.limpeza_realizado !== undefined) {
        const { data: current } = await supabase.from('concremrh_indicadores_setor').select('*').eq('id', id).single();
        updates.limpeza_percentual = calcularPercentuais(
          indicador.limpeza_meta ?? current?.limpeza_meta,
          indicador.limpeza_realizado ?? current?.limpeza_realizado
        );
      }
      
      if (indicador.tratamento_nc_meta !== undefined || indicador.tratamento_nc_realizado !== undefined) {
        const { data: current } = await supabase.from('concremrh_indicadores_setor').select('*').eq('id', id).single();
        updates.tratamento_nc_percentual = calcularPercentuais(
          indicador.tratamento_nc_meta ?? current?.tratamento_nc_meta,
          indicador.tratamento_nc_realizado ?? current?.tratamento_nc_realizado
        );
      }
      
      if (indicador.operacao_segura_meta !== undefined || indicador.operacao_segura_realizado !== undefined) {
        const { data: current } = await supabase.from('concremrh_indicadores_setor').select('*').eq('id', id).single();
        updates.operacao_segura_percentual = calcularPercentuais(
          indicador.operacao_segura_meta ?? current?.operacao_segura_meta,
          indicador.operacao_segura_realizado ?? current?.operacao_segura_realizado
        );
      }

      const { error } = await supabase
        .from('concremrh_indicadores_setor')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Indicador atualizado com sucesso",
      });
      
      fetchIndicadores();
    } catch (error) {
      console.error('Erro ao atualizar indicador:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o indicador",
        variant: "destructive",
      });
    }
  };

  /**
   * Salva a apuração mensal de indicadores de vários setores de uma vez,
   * preservando o formato esperado pela premiação (uma linha por
   * setor+competência com os 15 campos: meta/realizado/percentual dos 5
   * indicadores; competência como 'YYYY-MM-01'; percentual como FRAÇÃO). Atualiza
   * registros existentes (por id) e insere os novos. Em falha, informa quais
   * setores não foram salvos (falha parcial) — as alterações são mantidas.
   */
  const saveApuracaoIndicadores = async (params: {
    updates: { id: string; setorId: string; values: Record<string, number | null> }[];
    inserts: { setor_id: string; competencia: string; values: Record<string, number | null> }[];
  }): Promise<{ ok: boolean; updated: number; inserted: number; failedSetorIds: string[] } | null> => {
    const { updates, inserts } = params;
    const failedSetorIds: string[] = [];
    let updated = 0;
    let inserted = 0;
    try {
      await Promise.all(updates.map(async (u) => {
        const { error } = await supabase
          .from('concremrh_indicadores_setor')
          .update(u.values)
          .eq('id', u.id);
        if (error) failedSetorIds.push(u.setorId);
        else updated += 1;
      }));

      if (inserts.length > 0) {
        const rows = inserts.map((i) => ({ setor_id: i.setor_id, competencia: i.competencia, ...i.values }));
        const { error } = await supabase.from('concremrh_indicadores_setor').insert(rows);
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
      await fetchIndicadores();
      return { ok, updated, inserted, failedSetorIds };
    } catch (error) {
      console.error('Erro ao salvar apuração de indicadores:', error);
      toast({ title: 'Erro', description: 'Não foi possível salvar a apuração', variant: 'destructive' });
      return null;
    }
  };

  const deleteIndicador = async (id: string) => {
    try {
      const { error } = await supabase
        .from('concremrh_indicadores_setor')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Indicador excluído com sucesso",
      });
      
      fetchIndicadores();
    } catch (error) {
      console.error('Erro ao excluir indicador:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o indicador",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchIndicadores();
  }, []);

  return {
    indicadores,
    loading,
    createIndicador,
    createIndicadoresBulk,
    updateIndicador,
    saveApuracaoIndicadores,
    deleteIndicador,
    refetch: fetchIndicadores
  };
};
