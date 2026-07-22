// Inconsistências de qualidade — regras PURAS e centralizadas (não no JSX).
// Só sinaliza inconsistências reais e detectáveis a partir dos cadastros,
// configuração e registros de processamento. Não infere nada além dos dados.
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { BasePremiacao } from '@/hooks/useBasePremiacao';
import type { FormulaCalculo } from '@/hooks/useFormulasCalculo';
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
import type { Issue } from '../types/rewards-processing.types';
import { buildProcessingRows, mesToCompetencia } from './rewardsProcessingScope';

export interface IssuesInputs {
  funcionarios: Funcionario[];
  bases: BasePremiacao[];
  formulas: FormulaCalculo[];
  resultados: ResultadoPremiacao[];
}

const FUNC_ROUTE = '/premiacoes/funcionarios';

/** Constrói a lista de inconsistências detectáveis. */
export function buildIssues({ funcionarios, bases, formulas, resultados }: IssuesInputs): Issue[] {
  const issues: Issue[] = [];
  const ativos = funcionarios.filter(f => f.ativo);
  const baseIds = new Set(bases.map(b => b.id));

  const semSetor = ativos.filter(f => !f.setor_id && !(f.setor_ids && f.setor_ids.length));
  const semCategoria = ativos.filter(f => !f.categoria_id);
  const semFaixa = ativos.filter(f => !f.faixa_id);
  const semBase = ativos.filter(f => !f.base_premiacao_id);
  const baseInvalida = ativos.filter(f => f.base_premiacao_id && !baseIds.has(f.base_premiacao_id));

  const mk = (code: string, severity: Issue['severity'], title: string, description: string, entidade: string, origin: string, count: number, to = FUNC_ROUTE): Issue =>
    ({ code, severity, title, description: `${count} ${description}`, entidade, origin, action: { label: 'Abrir', to } });

  if (semCategoria.length) issues.push(mk('func_sem_categoria', 'atencao', 'Funcionários sem categoria', 'funcionário(s) ativo(s) sem categoria — a fórmula pode não ser localizada.', 'Funcionários', 'Funcionários', semCategoria.length));
  if (semFaixa.length) issues.push(mk('func_sem_faixa', 'atencao', 'Funcionários sem faixa', 'funcionário(s) ativo(s) sem faixa — valor-base zero.', 'Funcionários', 'Funcionários', semFaixa.length));
  if (semSetor.length) issues.push(mk('func_sem_setor', 'atencao', 'Funcionários sem setor', 'funcionário(s) ativo(s) sem setor — sem nota de produção em bases de produção.', 'Funcionários', 'Funcionários', semSetor.length));
  if (semBase.length) issues.push(mk('func_sem_base', 'bloqueio', 'Funcionários sem base', 'funcionário(s) ativo(s) sem base de premiação — não entram em nenhum processamento.', 'Funcionários', 'Funcionários', semBase.length));
  if (baseInvalida.length) issues.push(mk('func_base_invalida', 'bloqueio', 'Base inválida ou inativa', 'funcionário(s) apontando para uma base inexistente/inativa.', 'Funcionários', 'Bases', baseInvalida.length, '/premiacoes/cadastros/base-premiacao'));

  // Fórmulas incompletas (ativas com todos os pesos nulos/zerados).
  const pesoKeys: (keyof FormulaCalculo)[] = ['peso_producao_setor', 'peso_epi', 'peso_faltas', 'peso_advertencias', 'peso_dss', 'peso_faturamento', 'peso_itens_nc', 'peso_tratamento_nc', 'peso_hora_maquina', 'peso_operacao_segura', 'peso_limpeza'];
  const formulasIncompletas = formulas.filter(f => f.ativo && pesoKeys.every(k => !(f[k] as number | null)));
  if (formulasIncompletas.length) issues.push({ code: 'formula_incompleta', severity: 'atencao', title: 'Fórmulas sem pesos', description: `${formulasIncompletas.length} fórmula(s) ativa(s) sem nenhum peso configurado.`, entidade: 'Fórmulas', origin: 'Fórmulas de cálculo', action: { label: 'Ver fórmulas', to: '/premiacoes/cadastros/formulas-calculo' } });

  // Registros de processamento incompletos.
  const rows = buildProcessingRows(resultados, bases);
  const incompletos = rows.filter(r => r.integridade === 'incompleto');
  for (const r of incompletos) {
    issues.push({ code: 'proc_incompleto', severity: 'atencao', title: 'Processamento com registros incompletos', description: `${r.baseNome} · ${r.resultados} resultado(s): ${r.problemas.join('; ')}.`, entidade: 'Resultados', origin: 'Processamentos', competencia: r.competencia });
  }

  // Duplicidade: mesmo funcionário mais de uma vez no mesmo (mês+base).
  const seen = new Map<string, number>();
  for (const r of resultados) {
    if (!r.funcionario_id || !r.base_premiacao_id) continue;
    const key = `${r.mes_competencia}|${r.base_premiacao_id}|${r.funcionario_id}`;
    seen.set(key, (seen.get(key) || 0) + 1);
  }
  const duplicados = [...seen.entries()].filter(([, n]) => n > 1);
  if (duplicados.length) {
    const comp = mesToCompetencia(duplicados[0][0].split('|')[0]);
    issues.push({ code: 'duplicidade', severity: 'bloqueio', title: 'Resultados duplicados', description: `${duplicados.length} vínculo(s) com mais de um resultado no mesmo mês e base.`, entidade: 'Resultados', origin: 'Processamentos', competencia: comp });
  }

  const order: Record<Issue['severity'], number> = { bloqueio: 0, atencao: 1 };
  return issues.sort((a, b) => order[a.severity] - order[b.severity]);
}

export interface IssuesSummary { bloqueios: number; atencoes: number; funcionariosAfetados: number; total: number }

export function summarizeIssues(issues: Issue[]): IssuesSummary {
  const funcAfetados = issues
    .filter(i => i.entidade === 'Funcionários')
    .reduce((s, i) => s + (parseInt(i.description) || 0), 0);
  return {
    bloqueios: issues.filter(i => i.severity === 'bloqueio').length,
    atencoes: issues.filter(i => i.severity === 'atencao').length,
    funcionariosAfetados: funcAfetados,
    total: issues.length,
  };
}
