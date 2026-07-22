// Validação do formulário de função — pura. Preserva a regra atual (nome
// obrigatório) e NÃO altera caixa/acentuação automaticamente.
import { toPersistedName } from './functionNameAnalysis';

/** Nome válido para persistir (não vazio após aparar). */
export function isValidFunctionName(nome: string): boolean {
  return toPersistedName(nome).length > 0;
}
