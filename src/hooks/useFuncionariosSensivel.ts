import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Dados sensiveis de funcionarios (salario/email), servidos pela VIEW guardada
// `concremrh_funcionarios_sensivel` (Fase 5A). O gate por perfil e feito NA VIEW
// (has_secao/is_admin, sobre auth.uid()):
//   - salario: admin OU cargos_salarios          -> senao NULL
//   - email:   admin OU rh OU cargos_salarios     -> senao NULL
// Use este hook APENAS em telas que precisam de salario/email (Cargos & Salarios).
export interface FuncionarioSensivel {
  id: string;
  nome: string | null;
  salario: number | null;
  email: string | null;
  funcao_id: string | null;
  categoria_id: string | null;
  setor_id: string | null;
  ativo: boolean | null;
}

export const useFuncionariosSensivel = () => {
  const [dados, setDados] = useState<FuncionarioSensivel[]>([]);
  const [porId, setPorId] = useState<Record<string, FuncionarioSensivel>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        // A view nao esta no types.ts gerado; cast para nao quebrar o typecheck.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from('concremrh_funcionarios_sensivel')
          .select('id, nome, salario, email, funcao_id, categoria_id, setor_id, ativo');
        if (error) throw error;
        if (!mounted) return;
        const rows = (data || []) as FuncionarioSensivel[];
        setDados(rows);
        setPorId(Object.fromEntries(rows.map((r) => [r.id, r])));
      } catch (error) {
        console.error('Erro ao carregar dados sensiveis de funcionarios:', error);
        if (mounted) {
          setDados([]);
          setPorId({});
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { dados, porId, loading };
};
