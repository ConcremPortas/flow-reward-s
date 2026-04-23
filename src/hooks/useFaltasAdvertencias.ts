import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FaltaAdvertencia {
  id: string;
  funcionario_id?: string;
  tipo: string;
  motivo: string;
  descricao?: string;
  gravidade?: string;
  quantidade?: number;
  data_ocorrencia: string;
  aplicado_por?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export const useFaltasAdvertencias = () => {
  const [registros, setRegistros] = useState<FaltaAdvertencia[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  type RegistroInput = Omit<FaltaAdvertencia, 'id' | 'created_at' | 'updated_at'>;

  const fetchRegistros = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('concremrh_faltas_advertencias')
        .select('*')
        .order('data_ocorrencia', { ascending: false });

      if (error) throw error;
      setRegistros(data || []);
    } catch (error) {
      console.error('Erro ao carregar faltas/advertências:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os registros de faltas/advertências",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createRegistro = async (registro: Omit<FaltaAdvertencia, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('concremrh_faltas_advertencias')
        .insert([registro])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Registro de falta/advertência criado com sucesso",
      });

      fetchRegistros();
      return data;
    } catch (error) {
      console.error('Erro ao criar registro:', error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o registro",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateRegistro = async (id: string, registro: Partial<Omit<FaltaAdvertencia, 'id' | 'created_at' | 'updated_at'>>) => {
    try {
      const { data, error } = await supabase
        .from('concremrh_faltas_advertencias')
        .update(registro)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Registro atualizado com sucesso",
      });

      fetchRegistros();
      return data;
    } catch (error) {
      console.error('Erro ao atualizar registro:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o registro",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteRegistro = async (id: string) => {
    try {
      const { error } = await supabase
        .from('concremrh_faltas_advertencias')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Registro excluído com sucesso",
      });

      fetchRegistros();
      return true;
    } catch (error) {
      console.error('Erro ao excluir registro:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o registro",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteRegistrosPorCompetencia = async (competencia: string) => {
    try {
      const [ano, mes] = competencia.split('-');
      const dataInicio = `${competencia}-01`;
      const ultimoDia = new Date(parseInt(ano), parseInt(mes), 0).getDate();
      const dataFim = `${ano}-${mes}-${String(ultimoDia).padStart(2, '0')}`;
      const { error } = await supabase
        .from('concremrh_faltas_advertencias')
        .delete()
        .gte('data_ocorrencia', dataInicio)
        .lte('data_ocorrencia', dataFim);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Registros removidos da competência ${competencia}`,
      });

      fetchRegistros();
      return true;
    } catch (error) {
      console.error('Erro ao excluir registros por competência:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir os registros da competência",
        variant: "destructive",
      });
      return false;
    }
  };

  const salvarApuracaoMensal = async (
    competencia: string,
    dadosApuracao: Record<string, { faltas: number; advertencias: number }>,
  ) => {
    try {
      const dataCompetencia = `${competencia}-01`;
      const [ano, mes] = competencia.split('-');
      const ultimoDia = new Date(parseInt(ano), parseInt(mes), 0).getDate();
      const dataFim = `${ano}-${mes}-${String(ultimoDia).padStart(2, '0')}`;

      const { error: deleteError } = await supabase
        .from('concremrh_faltas_advertencias')
        .delete()
        .gte('data_ocorrencia', dataCompetencia)
        .lte('data_ocorrencia', dataFim);

      if (deleteError) throw deleteError;

      const registrosParaInserir: RegistroInput[] = [];

      for (const [funcionarioId, dados] of Object.entries(dadosApuracao)) {
        if (dados.faltas > 0) {
          registrosParaInserir.push({
            funcionario_id: funcionarioId,
            tipo: 'falta',
            motivo: `Apuração mensal - ${competencia}`,
            gravidade: 'media',
            quantidade: dados.faltas,
            data_ocorrencia: dataCompetencia,
            descricao: `${dados.faltas} falta(s) registrada(s) na apuração mensal`,
          });
        }

        if (dados.advertencias > 0) {
          registrosParaInserir.push({
            funcionario_id: funcionarioId,
            tipo: 'advertencia',
            motivo: `Apuração mensal - ${competencia}`,
            gravidade: 'media',
            quantidade: dados.advertencias,
            data_ocorrencia: dataCompetencia,
            descricao: `${dados.advertencias} advertência(s) registrada(s) na apuração mensal`,
          });
        }
      }

      if (registrosParaInserir.length > 0) {
        const { error: insertError } = await supabase
          .from('concremrh_faltas_advertencias')
          .insert(registrosParaInserir);

        if (insertError) throw insertError;
      }

      toast({
        title: "Sucesso",
        description: `Apuração salva para ${competencia} (${registrosParaInserir.length} registro(s))`,
      });

      fetchRegistros();
      return { inserted: registrosParaInserir.length };
    } catch (error) {
      console.error('Erro ao salvar apuração mensal:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a apuração mensal",
        variant: "destructive",
      });
      return null;
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
    deleteRegistrosPorCompetencia,
    salvarApuracaoMensal,
    refetch: fetchRegistros
  };
};
