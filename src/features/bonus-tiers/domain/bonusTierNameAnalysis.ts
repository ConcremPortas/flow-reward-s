// Análise OBSERVACIONAL do nome da faixa — detecta valor monetário embutido e
// compara com o campo `valor`. Pura. NÃO altera o dado. Regex centralizada aqui
// (nunca espalhada no JSX).
//
// AUDITORIA: o NOME da faixa não participa de nenhuma regra do motor de
// premiação (o cálculo usa o campo numérico `valor`). Portanto valores no nome
// são cosméticos/legados — sinalizados para revisão, jamais corrigidos sozinhos.
import { parseCurrencyBR } from './bonusTierValidation';
import type { NameAnalysis } from '../types/bonus-tier.types';

// Captura "R$ 150,00", "R$150", "R$ 1.250,50" (última ocorrência é a mais relevante).
const MONEY_RE = /R\$\s*([\d.]*\d(?:,\d{1,2})?)/gi;
const HAS_MONEY_HINT = /R\$/i;

/** Extrai o valor monetário do nome (última ocorrência), ou null. */
export function parseMoneyFromName(nome: string): number | null {
  const matches = [...(nome ?? '').matchAll(MONEY_RE)];
  if (matches.length === 0) return null;
  const last = matches[matches.length - 1][1];
  return parseCurrencyBR(last);
}

/** Há indício de valor monetário no nome, mesmo que não interpretável? */
export function nameHasMoneyHint(nome: string): boolean {
  return HAS_MONEY_HINT.test(nome ?? '');
}

/**
 * Remove o valor monetário do texto do nome (uso LOCAL no formulário, antes de
 * salvar). Não altera nenhum registro. Limpa separadores órfãos (" - ", "()").
 */
export function stripMoneyFromName(nome: string): string {
  return (nome ?? '')
    .replace(MONEY_RE, '')
    .replace(/\(\s*\)/g, '')          // parênteses vazios
    .replace(/[-–—:|]\s*$/g, '')      // separador solto no fim
    .replace(/\s{2,}/g, ' ')
    .trim();
}

const EPS = 0.005;

/** Analisa o nome vs. o valor cadastrado. Observacional. */
export function analyzeName(nome: string, valor: number): NameAnalysis {
  const hint = nameHasMoneyHint(nome);
  const valorNoNome = parseMoneyFromName(nome);

  if (!hint && valorNoNome == null) {
    return { state: 'sem_valor', valorNoNome: null, temValorNoNome: false };
  }
  if (valorNoNome == null) {
    // Há "R$" no nome mas não foi possível interpretar um número.
    return { state: 'nao_interpretavel', valorNoNome: null, temValorNoNome: true };
  }
  const consistente = Math.abs(valorNoNome - (valor ?? 0)) <= EPS;
  return { state: consistente ? 'consistente' : 'divergente', valorNoNome, temValorNoNome: true };
}
