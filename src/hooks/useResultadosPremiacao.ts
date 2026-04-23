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
  percentual_producao?: number; // Percentual real (pode ser > 100%)
  nota_producao?: number; // Nota limitada a 100%
  nota_epi: number;
  nota_faltas: number;
  nota_advertencias: number;
  nota_dss: number;
  nota_faturamento?: number;
  nota_itens_nc?: number;
  nota_tratamento_nc?: number;
  nota_hora_maquina?: number;
  nota_operacao_segura?: number;
  nota_limpeza?: number;
  valor_kits?: number;
  nota_geral: number;
  bonus_possivel: number;
  bonus_alcancado: number;
  valor_fixo?: number;
  valor_ajustado?: number;
  observacao_ajuste?: string;
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
        .from('concremrh_resultados_premiacao')
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
        .from('concremrh_resultados_premiacao')
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
        valor_faixa: premiacao.valor_faixa ?? null,
        percentual_producao: premiacao.percentual_producao ?? null,
        nota_producao: premiacao.nota_producao ?? null,
        nota_epi: premiacao.nota_epi,
        nota_faltas: premiacao.nota_faltas,
        nota_advertencias: premiacao.nota_advertencias,
        nota_dss: premiacao.nota_dss,
        nota_faturamento: premiacao.nota_faturamento ?? null,
        nota_itens_nc: premiacao.nota_itens_nc ?? null,
        nota_tratamento_nc: premiacao.nota_tratamento_nc ?? null,
        nota_hora_maquina: premiacao.nota_hora_maquina ?? null,
        nota_operacao_segura: premiacao.nota_operacao_segura ?? null,
        nota_limpeza: premiacao.nota_limpeza ?? null,
        valor_kits: premiacao.valor_kits ?? null,
        nota_geral: premiacao.nota_geral,
        bonus_possivel: premiacao.bonus_possivel,
        bonus_alcancado: premiacao.bonus_alcancado,
        valor_fixo: premiacao.valor_fixo ?? null
      }));

      // Inserir novos resultados
      const { error: insertError } = await supabase
        .from('concremrh_resultados_premiacao')
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

  const updateResultado = async (id: string, dados: { valor_ajustado?: number | null; observacao_ajuste?: string | null }) => {
    try {
      const { error } = await supabase
        .from('concremrh_resultados_premiacao')
        .update(dados)
        .eq('id', id);
      if (error) throw error;
      toast({ title: "Sucesso", description: "Ajuste salvo com sucesso" });
      fetchResultados();
      return true;
    } catch (error) {
      console.error('Erro ao atualizar resultado:', error);
      toast({ title: "Erro", description: "Não foi possível salvar o ajuste", variant: "destructive" });
      return false;
    }
  };

  const verificarResultadosExistentes = async (competencia: string, baseId: string) => {
    try {
      const mesCompetencia = competencia + '-01';
      const { data, error } = await supabase
        .from('concremrh_resultados_premiacao')
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

  const excluirResultados = async (competencia: string, baseId: string) => {
    try {
      const mesCompetencia = competencia + '-01';
      const { error } = await supabase
        .from('concremrh_resultados_premiacao')
        .delete()
        .eq('mes_competencia', mesCompetencia)
        .eq('base_premiacao_id', baseId);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: `Premiações removidas de ${competencia}`,
      });

      fetchResultados();
      return true;
    } catch (error) {
      console.error('Erro ao excluir resultados de premiação:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir as premiações salvas",
        variant: "destructive",
      });
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
    excluirResultados,
    updateResultado,
    refetch: fetchResultados
  };
};
