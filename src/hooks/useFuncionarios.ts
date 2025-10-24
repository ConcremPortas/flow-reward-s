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
  status?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  // Dados relacionados
  empresa?: { nome: string };
  setor?: { nome: string };
  funcao?: { nome: string };
  categoria?: { nome: string };
  base_premiacao?: { nome: string };
  faixa?: { nome: string };
}

export const useFuncionarios = () => {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFuncionarios = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('concrem_funcionarios')
        .select(`
          *,
          empresa:concrem_empresas(nome),
          setor:concrem_setores(nome),
          funcao:concrem_funcoes(nome),
          categoria:concrem_categorias(nome),
          base_premiacao:concrem_base_premiacao(nome),
          faixa:concrem_faixas(nome)
        `)
        .order('nome');

      if (error) throw error;
      setFuncionarios((data as any) || []);
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
      const { data, error } = await supabase
        .from('concrem_funcionarios')
        .insert([funcionario])
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
      const { data, error } = await supabase
        .from('concrem_funcionarios')
        .update(funcionario)
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
        .from('concrem_funcionarios')
        .update({ ativo: false })
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