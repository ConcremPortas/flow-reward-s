// Situação cadastral da função — função PURA, fonte única. Sem espalhar ifs no
// JSX. NÃO afirma duplicidade: usa a linguagem "possível correspondência".
//
// "Sem vínculo" é um estado de UTILIZAÇÃO, não de situação cadastral — por isso
// não entra aqui (uma função recém-criada e correta é "Regular" mesmo sem uso).
import type {
  FunctionRegistrationStatus, NameQuality, SimilarityMatch,
} from '../types/function.types';

interface Input {
  quality: NameQuality;
  similar: SimilarityMatch[];
  duplicadoLiteral: boolean;
}

export function getFunctionRegistrationStatus({ quality, similar, duplicadoLiteral }: Input): FunctionRegistrationStatus {
  const motivos: string[] = [];

  if (duplicadoLiteral) motivos.push('Existe outra função com exatamente o mesmo nome.');
  for (const m of similar) {
    if (m.type === 'similar_name') continue; // agrupado abaixo como genérico
    motivos.push(`Nome semelhante a "${m.targetNome}" (${m.diffs.join(', ').toLowerCase()}).`);
  }
  const temSimilarFraco = similar.some(m => m.type === 'similar_name');
  if (temSimilarFraco && motivos.length === 0) {
    motivos.push('Há outra função com nome muito parecido.');
  }
  for (const issue of quality.issues) motivos.push(issue.label);

  const temCorrespondencia = duplicadoLiteral || similar.length > 0;

  let status: FunctionRegistrationStatus['status'];
  let descricao: string;
  if (temCorrespondencia) {
    status = 'possivel_correspondencia';
    descricao = 'Há outra função com nomenclatura semelhante. Revise antes de considerar duplicidade.';
  } else if (quality.hasIssues) {
    status = 'revisar';
    descricao = 'Há pontos de formatação a revisar no nome desta função.';
  } else {
    status = 'regular';
    descricao = 'Função com nomenclatura regular.';
  }

  return { status, motivos, descricao };
}

export const FUNCTION_STATUS_META: Record<FunctionRegistrationStatus['status'], { label: string; variant: 'success' | 'warning' | 'info' }> = {
  regular: { label: 'Regular', variant: 'success' },
  revisar: { label: 'Revisar', variant: 'warning' },
  possivel_correspondencia: { label: 'Possível correspondência', variant: 'warning' },
};
