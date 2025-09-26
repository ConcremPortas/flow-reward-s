import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ResultadoPremiacao {
  id: string;
  mes_competencia: string;
  base_premiacao_id?: string;
  funcionario_id?: string;
  cod_funcionario?: string;
  nome: string;
  setor?: string;
  funcao?: string;
  categoria?: string;
  faixa?: string;
  valor_faixa?: number;
  nota_producao?: number;
  nota_epi: number;
  nota_faltas: number;
  nota_advertencias: number;
  nota_dss: number;
  valor_kits?: number;
  nota_geral: number;
  bonus_possivel: number;
  bonus_alcancado: number;
  created_at: string;
  updated_at: string;
}

export const useResultadosPremiacao = () => {
  const [resultados, setResultados] = useState<ResultadoPremiacao[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchResultados = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('concrem_resultados_premiacao')
        .select('*')
        .order('mes_competencia', { ascending: false })
        .order('nome');

      if (error) throw error;
      setResultados(data || []);
    } catch (error) {
      console.error('Erro ao carregar resultados de premiação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os resultados de premiação",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const salvarResultados = async (
    competencia: string, 
    baseId: string, 
    premiacoes: any[]
  ) => {
    try {
      const mesCompetencia = competencia + '-01'; // Formato YYYY-MM-DD
      
      // Primeiro, deletar resultados existentes para este mês e base
      const { error: deleteError } = await supabase
        .from('concrem_resultados_premiacao')
        .delete()
        .eq('mes_competencia', mesCompetencia)
        .eq('base_premiacao_id', baseId);

      if (deleteError) throw deleteError;

      // Preparar dados para inserção
      const resultadosParaSalvar = premiacoes.map(premiacao => ({
        mes_competencia: mesCompetencia,
        base_premiacao_id: baseId,
        funcionario_id: premiacao.id,
        cod_funcionario: premiacao.cod_funcionario,
        nome: premiacao.nome,
        setor: premiacao.setor,
        funcao: premiacao.funcao,
        categoria: premiacao.categoria,
        faixa: premiacao.faixa,
        valor_faixa: premiacao.valor_faixa || null,
        nota_producao: premiacao.nota_producao || null,
        nota_epi: premiacao.nota_epi,
        nota_faltas: premiacao.nota_faltas,
        nota_advertencias: premiacao.nota_advertencias,
        nota_dss: premiacao.nota_dss,
        valor_kits: premiacao.valor_kits || null,
        nota_geral: premiacao.nota_geral,
        bonus_possivel: premiacao.bonus_possivel,
        bonus_alcancado: premiacao.bonus_alcancado
      }));

      // Inserir novos resultados
      const { error: insertError } = await supabase
        .from('concrem_resultados_premiacao')
        .insert(resultadosParaSalvar);

      if (insertError) throw insertError;

      toast({
        title: "Sucesso",
        description: `Resultados salvos para ${competencia}`,
      });

      // Atualizar lista
      fetchResultados();
      
      return true;
    } catch (error) {
      console.error('Erro ao salvar resultados de premiação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar os resultados de premiação",
        variant: "destructive",
      });
      return false;
    }
  };

  const verificarResultadosExistentes = async (competencia: string, baseId: string) => {
    try {
      const mesCompetencia = competencia + '-01';
      const { data, error } = await supabase
        .from('concrem_resultados_premiacao')
        .select('id')
        .eq('mes_competencia', mesCompetencia)
        .eq('base_premiacao_id', baseId)
        .limit(1);

      if (error) throw error;
      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('Erro ao verificar resultados existentes:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchResultados();
  }, []);

  return {
    resultados,
    loading,
    salvarResultados,
    verificarResultadosExistentes,
    refetch: fetchResultados
  };
};