// Painel de Qualidade e Cobertura de Dados — governança das fontes.
import type { DataQuality, DataSource } from './types';

const SOURCES: DataSource[] = [
  { key: 'funcionarios', label: 'Funcionários (ativos, admissão, desligamento)', status: 'disponivel', detail: 'concremrh_funcionarios' },
  { key: 'setores', label: 'Setores e gestores', status: 'disponivel', detail: 'concremrh_setores' },
  { key: 'unidades', label: 'Unidades', status: 'disponivel', detail: 'concremrh_empresas' },
  { key: 'faltas', label: 'Faltas e advertências', status: 'calculavel', detail: 'concremrh_faltas_advertencias' },
  { key: 'producao', label: 'Produção por setor', status: 'disponivel', detail: 'concremrh_producao_setor' },
  { key: 'dss', label: 'DSS (participação)', status: 'calculavel', detail: 'concremrh_dss · participação por local' },
  { key: 'epi', label: 'EPI (não conformidades)', status: 'calculavel', detail: 'concremrh_epi' },
  { key: 'premiacao', label: 'Premiações', status: 'disponivel', detail: 'concremrh_resultados_premiacao + motor de domínio' },
  { key: 'absenteismo_horas', label: 'Absenteísmo por horas previstas', status: 'parcial', detail: 'Sem base de horas previstas — usada aproximação por 100 colaboradores' },
  { key: 'premiacao_aprovada', label: 'Premiação aprovada', status: 'parcial', detail: 'Sem fluxo de aprovação; apenas ajuste manual (valor_ajustado)' },
  { key: 'afastamentos', label: 'Afastamentos (INSS/atestados)', status: 'indisponivel', detail: 'Não há tabela — requer módulo SESMT/RH' },
  { key: 'horas_extras', label: 'Horas extras', status: 'indisponivel', detail: 'Não há campo/tabela — requer ponto/folha' },
  { key: 'turno', label: 'Turno de trabalho', status: 'indisponivel', detail: 'Não há campo de turno no cadastro' },
];

export function buildDataQuality(): DataQuality {
  const total = SOURCES.length;
  const cobertos = SOURCES.filter(s => s.status === 'disponivel' || s.status === 'calculavel').length;
  return { sources: SOURCES, coberturaPct: Math.round((cobertos / total) * 100) };
}
