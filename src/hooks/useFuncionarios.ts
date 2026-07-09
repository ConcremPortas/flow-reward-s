import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Funcionario {
  id: string;
  nome: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  data_nascimento?: string;
  data_admissao?: string;
  data_demissao?: string;
  salario?: number;
  empresa_id?: string;
  setor_id?: string;
  funcao_id?: string;
  categoria_id?: string;
  base_premiacao_id?: string;
  faixa_id?: string;
  local_dss_id?: string;
  status?: string;
  valor_fixo?: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  // Dados relacionados
  empresa?: { nome: string };
  setor?: { nome: string };
  funcao?: { nome: string };
  categoria?: { nome: string };
  base_premiacao?: { nome: string };
  faixa?: { nome: string; valor: number };
  local_dss?: { nome: string };
  setor_ids?: string[];
}

export const useFuncionarios = () => {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFuncionarios = async () => {
    try {
      setLoading(true);
      // Projecao explicita (Fase 5B): NAO buscar colunas sensiveis
      // (salario/email/telefone/data_nascimento). Estas ficam na view guardada
      // concremrh_funcionarios_sensivel (hook useFuncionariosSensivel). `cpf` e
      // mantido pois funciona como Codigo Funcionario (import/export/premiacao).
      const { data, error } = await supabase
        .from('concremrh_funcionarios')
        .select(`
          id, user_id, nome, cpf, data_admissao, data_demissao,
          empresa_id, setor_id, funcao_id, categoria_id,
          base_premiacao_id, faixa_id, local_dss_id,
          status, valor_fixo, ativo, created_at, updated_at,
          empresa:concremrh_empresas(nome),
          setor:concremrh_setores!concremrh_funcionarios_setor_id_fkey(nome),
          funcao:concremrh_funcoes(nome),
          categoria:concremrh_categorias(nome),
          base_premiacao:concremrh_base_premiacao(nome),
          faixa:concremrh_faixas(nome, valor),
          local_dss:concremrh_locais_dss(nome)
        `)
        .order('nome');

      if (error) throw error;

      // Buscar setor_ids via RPC (contorna schema cache do PostgREST)
      let setorIdsMap: Record<string, string[]> = {};
      try {
        const { data: setorIdsData } = await supabase.rpc('get_all_funcionario_setor_ids');
        if (setorIdsData) {
          for (const row of setorIdsData as { funcionario_id: string; setor_ids: string }[]) {
            if (row.setor_ids) {
              setorIdsMap[row.funcionario_id] = row.setor_ids.split(',').filter(Boolean);
            }
          }
        }
      } catch {
        // Ignora silenciosamente se a função ainda não existir
      }

      const funcionariosComSetorIds = (data || []).map((f: any) => ({
        ...f,
        setor_ids: setorIdsMap[f.id] || null,
      }));

      setFuncionarios(funcionariosComSetorIds as any);
    } catch (error) {
      console.error('Erro ao carregar funcionários:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os funcionários",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createFuncionario = async (funcionario: Omit<Funcionario, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { setor_ids: _setor_ids, ...funcionarioSemSetorIds } = funcionario as any;
      const { data, error } = await supabase
        .from('concremrh_funcionarios')
        .insert([funcionarioSemSetorIds])
        .select()
        .single();

      if (error) {
        // Tratamento específico para CPF duplicado
        if (error.code === '23505' && error.message.includes('cpf_key')) {
          toast({
            title: "CPF Duplicado",
            description: "Já existe um funcionário cadastrado com este CPF/Código",
            variant: "destructive",
          });
          return null;
        }
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Funcionário criado com sucesso",
      });

      fetchFuncionarios();
      return data;
    } catch (error: any) {
      console.error('Erro ao criar funcionário:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o funcionário",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateFuncionario = async (id: string, funcionario: Partial<Funcionario>) => {
    try {
      const { setor_ids: _setor_ids, ...funcionarioSemSetorIds } = funcionario as any;
      const { data, error } = await supabase
        .from('concremrh_funcionarios')
        .update(funcionarioSemSetorIds)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        // Tratamento específico para CPF duplicado
        if (error.code === '23505' && error.message.includes('cpf_key')) {
          toast({
            title: "CPF Duplicado",
            description: "Já existe outro funcionário cadastrado com este CPF/Código",
            variant: "destructive",
          });
          return null;
        }
        throw error;
      }

      toast({
        title: "Sucesso",
        description: "Funcionário atualizado com sucesso",
      });

      fetchFuncionarios();
      return data;
    } catch (error: any) {
      console.error('Erro ao atualizar funcionário:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar o funcionário",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteFuncionario = async (id: string) => {
    try {
      const { error } = await supabase
        .from('concremrh_funcionarios')
        .update({ ativo: false, status: 'Rescisão' })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Funcionário removido com sucesso",
      });

      fetchFuncionarios();
    } catch (error) {
      console.error('Erro ao remover funcionário:', error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o funcionário",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchFuncionarios();
  }, []);

  return {
    funcionarios,
    loading,
    createFuncionario,
    updateFuncionario,
    deleteFuncionario,
    refetch: fetchFuncionarios
  };
};