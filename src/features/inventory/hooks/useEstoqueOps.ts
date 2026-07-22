import { useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import * as api from '../services/inventoryApi';

/**
 * Mutação das operações de estoque via RPCs transacionais. Cada função retorna
 * `true`/`false` (sucesso), controla `saving` e emite toast (sucesso/erro),
 * traduzindo as mensagens de negócio vindas das RPCs. Não contém regra —
 * apenas orquestra a chamada e o feedback.
 */
export function useEstoqueOps() {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  // Retorna o resultado da RPC (truthy) em sucesso, ou null em erro. Os chamadores
  // que só checam `if (ok)` continuam funcionando (objeto = truthy, null = falsy).
  const run = useCallback(async (fn: () => Promise<unknown>, sucesso: string): Promise<unknown> => {
    setSaving(true);
    try {
      const resultado = await fn();
      toast({ title: sucesso });
      return resultado ?? true;
    } catch (e) {
      toast({ title: 'Não foi possível concluir a operação', description: traduzErro(e), variant: 'destructive' });
      return null;
    } finally {
      setSaving(false);
    }
  }, [toast]);

  return {
    saving,
    registrarEntrada: (input: Parameters<typeof api.registrarEntrada>[0]) => run(() => api.registrarEntrada(input), 'Entrada de estoque registrada.'),
    registrarEntrega: (input: Parameters<typeof api.registrarEntrega>[0]) => run(() => api.registrarEntrega(input), 'Entrega registrada.'),
    registrarDevolucao: (input: Parameters<typeof api.registrarDevolucao>[0]) => run(() => api.registrarDevolucao(input), 'Devolução registrada.'),
    registrarTroca: (input: Parameters<typeof api.registrarTroca>[0]) => run(() => api.registrarTroca(input), 'Troca registrada.'),
    ajustarSaldo: (input: Parameters<typeof api.ajustarSaldo>[0]) => run(() => api.ajustarSaldo(input), 'Saldo ajustado.'),
    cancelarEntrega: (input: Parameters<typeof api.cancelarEntrega>[0]) => run(() => api.cancelarEntrega(input), 'Entrega cancelada.'),
    estornarDevolucao: (input: Parameters<typeof api.estornarDevolucao>[0]) => run(() => api.estornarDevolucao(input), 'Devolução estornada.'),
  };
}

/** Traduz códigos de erro de negócio das RPCs para mensagens em pt-BR. */
function traduzErro(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  const mapa: Record<string, string> = {
    SALDO_INSUFICIENTE: 'Estoque insuficiente para a operação.',
    SEM_ITENS: 'Adicione ao menos um item.',
    DATA_FUTURA: 'A data não pode ser futura.',
    UNIDADE_INVALIDA: 'Local de estoque inválido ou inativo.',
    VARIANTE_INVALIDA: 'Item inexistente ou inativo.',
    QTD_INVALIDA: 'Quantidade inválida.',
    FUNCIONARIO_INEXISTENTE: 'Colaborador não encontrado.',
    FUNCIONARIO_INATIVO: 'Colaborador inativo.',
    FUNCIONARIO_DESLIGADO: 'Colaborador desligado — entrega não permitida.',
    EMPRESA_INCOMPATIVEL: 'Colaborador pertence a outra empresa do local de estoque.',
    VALOR_COMPRA_OBRIGATORIO: 'Informe o valor da compra.',
    QTD_MAIOR_QUE_DISPONIVEL: 'Quantidade maior que a disponível para devolução.',
    AJUSTE_SEM_ALTERACAO: 'A nova quantidade é igual ao saldo atual.',
    AJUSTE_NEGATIVO: 'A quantidade não pode ser negativa.',
    MOTIVO_OBRIGATORIO: 'Informe o motivo.',
    POSSUI_DEVOLUCOES_VINCULADAS: 'Há devoluções vinculadas — não é possível cancelar.',
    JA_CANCELADA: 'Esta entrega já foi cancelada.',
    JA_ESTORNADA: 'Esta devolução já foi estornada.',
    SEM_PERMISSAO: 'Você não tem permissão para esta operação.',
    NAO_AUTENTICADO: 'Sessão expirada. Entre novamente.',
    OPERACAO_EM_ANDAMENTO: 'Operação em andamento — aguarde.',
    OPERACAO_CONFLITO: 'Conflito de operação. Recarregue e tente novamente.',
  };
  for (const [code, texto] of Object.entries(mapa)) if (msg.includes(code)) return texto;
  return msg;
}
