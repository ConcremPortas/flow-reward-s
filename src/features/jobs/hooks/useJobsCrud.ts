import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Cargo } from '@/hooks/useCargos';

export type CargoInput = Omit<Cargo, 'id' | 'created_at' | 'updated_at' | 'concremrh_setores'>;

/**
 * Camada de dados da tela de Cargos (admin). Diferente do `useCargos` global,
 * que só retorna cargos ATIVOS, este hook carrega TODOS (ativos e inativos) —
 * necessário para o filtro de status, inativação e reativação. Reusa o cliente
 * Supabase e o toast; segue o mesmo padrão de consulta em lote (sem N+1). Não
 * altera banco/RLS.
 */
export function useJobsCrud() {
  const [cargos, setCargos] = useState<Cargo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const mounted = useRef(true);
  const { toast } = useToast();

  const fetchCargos = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const { data, error: err } = await supabase
        .from('concremrh_cargos')
        .select('*, concremrh_setores ( id, nome )')
        .order('nome');
      if (err) throw err;
      if (mounted.current) setCargos((data as Cargo[]) || []);
    } catch (e) {
      console.error('Erro ao carregar cargos:', e);
      if (mounted.current) {
        setError(true);
        toast({ title: 'Erro', description: 'Não foi possível carregar os cargos', variant: 'destructive' });
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    mounted.current = true;
    fetchCargos();
    return () => { mounted.current = false; };
  }, [fetchCargos]);

  const createCargo = useCallback(async (input: CargoInput): Promise<Cargo | null> => {
    setSaving(true);
    try {
      const { data, error: err } = await supabase.from('concremrh_cargos').insert([input]).select('*, concremrh_setores ( id, nome )').single();
      if (err) throw err;
      toast({ title: 'Cargo cadastrado', description: 'O cargo foi criado com sucesso.' });
      await fetchCargos();
      return data as Cargo;
    } catch (e) {
      console.error('Erro ao criar cargo:', e);
      toast({ title: 'Erro', description: 'Não foi possível cadastrar o cargo.', variant: 'destructive' });
      return null;
    } finally {
      setSaving(false);
    }
  }, [fetchCargos, toast]);

  const updateCargo = useCallback(async (id: string, patch: Partial<CargoInput>): Promise<boolean> => {
    setSaving(true);
    try {
      const { error: err } = await supabase.from('concremrh_cargos').update(patch).eq('id', id);
      if (err) throw err;
      toast({ title: 'Cargo atualizado', description: 'As alterações foram salvas.' });
      await fetchCargos();
      return true;
    } catch (e) {
      console.error('Erro ao atualizar cargo:', e);
      toast({ title: 'Erro', description: 'Não foi possível atualizar o cargo.', variant: 'destructive' });
      return false;
    } finally {
      setSaving(false);
    }
  }, [fetchCargos, toast]);

  const setAtivo = useCallback(async (id: string, ativo: boolean): Promise<boolean> => {
    setSaving(true);
    try {
      const { error: err } = await supabase.from('concremrh_cargos').update({ ativo }).eq('id', id);
      if (err) throw err;
      toast({ title: ativo ? 'Cargo reativado' : 'Cargo inativado', description: ativo ? 'O cargo voltou a ficar ativo.' : 'O cargo foi inativado, preservando o histórico.' });
      await fetchCargos();
      return true;
    } catch (e) {
      console.error('Erro ao alterar status do cargo:', e);
      toast({ title: 'Erro', description: 'Não foi possível alterar o status do cargo.', variant: 'destructive' });
      return false;
    } finally {
      setSaving(false);
    }
  }, [fetchCargos, toast]);

  /** Exclusão definitiva — o chamador DEVE garantir (via dependências) que é seguro. */
  const deleteCargo = useCallback(async (id: string): Promise<boolean> => {
    setSaving(true);
    try {
      const { error: err } = await supabase.from('concremrh_cargos').delete().eq('id', id);
      if (err) throw err;
      toast({ title: 'Cargo excluído', description: 'O cargo foi removido definitivamente.' });
      await fetchCargos();
      return true;
    } catch (e) {
      console.error('Erro ao excluir cargo:', e);
      toast({ title: 'Não foi possível excluir', description: 'O cargo possui vínculos que impedem a exclusão. Prefira inativá-lo.', variant: 'destructive' });
      return false;
    } finally {
      setSaving(false);
    }
  }, [fetchCargos, toast]);

  return { cargos, loading, error, saving, createCargo, updateCargo, setAtivo, deleteCargo, refetch: fetchCargos };
}
