// Pendências cadastrais — regras centralizadas (não espalhar pelo JSX).
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { CompletionCheck } from '../types';

/**
 * Verifica os campos que o cadastro de RH considera essenciais para o
 * funcionário participar corretamente do fluxo de premiação/operação.
 * Mesmos campos hoje exibidos no formulário (nenhum campo novo).
 */
export function checkEmployeeCompletion(f: Funcionario): CompletionCheck {
  const missing: string[] = [];
  if (!f.cpf) missing.push('Código');
  if (!f.empresa_id) missing.push('Empresa');
  if (!f.setor_id && !(f.setor_ids && f.setor_ids.length > 0)) missing.push('Setor');
  if (!f.funcao_id) missing.push('Função');
  if (!f.categoria_id) missing.push('Categoria');
  if (!f.base_premiacao_id) missing.push('Base de Premiação');
  if (!f.faixa_id) missing.push('Faixa');
  if (!f.local_dss_id) missing.push('Local DSS');
  return { complete: missing.length === 0, missing };
}
