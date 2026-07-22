import type { Cargo } from '@/hooks/useCargos';
import type { FuncionarioSensivel } from '@/hooks/useFuncionariosSensivel';
import type { StructureCounts, FuncaoCargoDiagnostico } from './structureAnalysis';

export type Severidade = 'alta' | 'media' | 'baixa';

export interface GovernanceIssue {
  chave: string;
  titulo: string;
  descricao: string;
  severidade: Severidade;
  quantidade: number;
  acaoSugerida: string;
}

const SEVERIDADE_ORDEM: Record<Severidade, number> = { alta: 0, media: 1, baixa: 2 };

/**
 * Constrói a lista de pendências de governança a partir de fatos cadastrais.
 * Cada item só aparece quando `quantidade > 0`. Não inventa dados nem
 * transforma ausência em problema fictício.
 */
export function construirPendencias(
  cargos: Cargo[],
  colaboradores: FuncionarioSensivel[],
  counts: StructureCounts,
  diag: FuncaoCargoDiagnostico,
  autorizadoRemuneracao: boolean,
): GovernanceIssue[] {
  const issues: GovernanceIssue[] = [];
  const ativos = colaboradores.filter((c) => c.ativo !== false);

  const cargosSemFaixa = cargos.filter(
    (c) => !(typeof c.salario_minimo === 'number' && typeof c.salario_maximo === 'number'),
  ).length;
  const cargosSemNivel = cargos.filter(
    (c) => c.nivel_hierarquico == null || String(c.nivel_hierarquico).trim() === '',
  ).length;
  const cargosSemSetor = cargos.filter((c) => !c.setor_id).length;
  const cargosSemDescricao = cargos.filter((c) => {
    const missao = typeof c.missao === 'string' && c.missao.trim() !== '';
    const resp = Array.isArray(c.responsabilidades) && c.responsabilidades.length > 0;
    return !missao && !resp;
  }).length;

  if (diag.colaboradoresSemVinculoCargo > 0) {
    issues.push({
      chave: 'colab_sem_cargo',
      titulo: 'Colaboradores sem cargo formal',
      descricao: 'Colaboradores ativos sem enquadramento em um cargo (o vínculo cadastral atual é com função, não com cargo).',
      severidade: 'alta',
      quantidade: diag.colaboradoresSemVinculoCargo,
      acaoSugerida: 'Enquadrar os colaboradores nos cargos correspondentes registrando a movimentação em histórico de cargos.',
    });
  }
  if (cargosSemFaixa > 0) {
    issues.push({
      chave: 'cargo_sem_faixa',
      titulo: 'Cargos sem faixa salarial',
      descricao: 'Cargos sem salário mínimo/máximo definidos — impedem análise de posicionamento e compressão.',
      severidade: 'alta',
      quantidade: cargosSemFaixa,
      acaoSugerida: 'Definir a faixa salarial (mínimo e máximo) de cada cargo.',
    });
  }
  if (cargosSemNivel > 0) {
    issues.push({
      chave: 'cargo_sem_nivel',
      titulo: 'Cargos sem nível hierárquico',
      descricao: 'Cargos sem nível definido — comprometem a leitura da hierarquia e a análise de compressão entre níveis.',
      severidade: 'media',
      quantidade: cargosSemNivel,
      acaoSugerida: 'Atribuir nível hierárquico aos cargos.',
    });
  }
  if (diag.cargosSemOcupante > 0) {
    issues.push({
      chave: 'cargo_sem_ocupante',
      titulo: 'Cargos sem ocupante',
      descricao: 'Cargos cadastrados sem nenhum colaborador enquadrado.',
      severidade: 'baixa',
      quantidade: diag.cargosSemOcupante,
      acaoSugerida: 'Revisar se o cargo está ativo e enquadrar colaboradores ou inativar o cargo.',
    });
  }
  if (cargosSemSetor > 0) {
    issues.push({
      chave: 'cargo_sem_setor',
      titulo: 'Cargos sem setor',
      descricao: 'Cargos sem vínculo com setor — dificultam a leitura de cobertura organizacional.',
      severidade: 'baixa',
      quantidade: cargosSemSetor,
      acaoSugerida: 'Vincular cada cargo ao setor correspondente.',
    });
  }
  if (cargosSemDescricao > 0) {
    issues.push({
      chave: 'cargo_sem_descricao',
      titulo: 'Cargos sem descrição',
      descricao: 'Cargos sem missão ou responsabilidades descritas.',
      severidade: 'baixa',
      quantidade: cargosSemDescricao,
      acaoSugerida: 'Descrever missão e responsabilidades dos cargos.',
    });
  }
  if (autorizadoRemuneracao) {
    const semSalario = ativos.filter((c) => c.salario == null).length;
    if (semSalario > 0) {
      issues.push({
        chave: 'colab_sem_salario',
        titulo: 'Colaboradores sem salário registrado',
        descricao: 'Colaboradores ativos sem salário informado — reduzem a cobertura das análises de remuneração.',
        severidade: 'media',
        quantidade: semSalario,
        acaoSugerida: 'Registrar o salário dos colaboradores no cadastro.',
      });
    }
  }

  return issues.sort((a, b) => SEVERIDADE_ORDEM[a.severidade] - SEVERIDADE_ORDEM[b.severidade] || b.quantidade - a.quantidade);
}

/** Resumo do "centro de atenção" (as pendências mais graves em destaque). */
export interface AttentionSummary {
  totalPendencias: number;
  altas: number;
  medias: number;
  baixas: number;
  destaques: GovernanceIssue[];
}

export function resumirAtencao(issues: GovernanceIssue[]): AttentionSummary {
  return {
    totalPendencias: issues.length,
    altas: issues.filter((i) => i.severidade === 'alta').length,
    medias: issues.filter((i) => i.severidade === 'media').length,
    baixas: issues.filter((i) => i.severidade === 'baixa').length,
    destaques: issues.slice(0, 3),
  };
}
