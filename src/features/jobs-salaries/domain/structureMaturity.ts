import type { Cargo } from '@/hooks/useCargos';
import type { StructureCounts } from './structureAnalysis';

/**
 * Índice de maturidade da estrutura de cargos e remuneração. É um indicador
 * de IMPLANTAÇÃO (quão configurado está o módulo), não de desempenho. Todos os
 * componentes são derivados de fatos cadastrais; um módulo vazio pontua 0 e a
 * classificação explica que ele "não foi implantado".
 */
export type MaturidadeClasse = 'nao_implantado' | 'inicial' | 'em_estruturacao' | 'estruturado' | 'maduro';

export interface MaturidadeComponente {
  chave: string;
  rotulo: string;
  peso: number;
  /** 0..1 — proporção atingida do componente. */
  proporcao: number;
  pontos: number;
  detalhe: string;
}

export interface MaturidadeResultado {
  score: number; // 0..100
  classe: MaturidadeClasse;
  classeRotulo: string;
  componentes: MaturidadeComponente[];
  proximosPassos: string[];
}

const CLASSE_ROTULO: Record<MaturidadeClasse, string> = {
  nao_implantado: 'Não implantado',
  inicial: 'Inicial',
  em_estruturacao: 'Em estruturação',
  estruturado: 'Estruturado',
  maduro: 'Maduro',
};

function classificar(score: number, temCargos: boolean): MaturidadeClasse {
  if (!temCargos) return 'nao_implantado';
  if (score < 25) return 'inicial';
  if (score < 55) return 'em_estruturacao';
  if (score < 85) return 'estruturado';
  return 'maduro';
}

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

/**
 * Componentes e pesos (somam 100):
 *  - Cargos cadastrados (existência)              — 20
 *  - Cargos com nível hierárquico definido        — 15
 *  - Cargos com faixa salarial (mín/máx)          — 20
 *  - Colaboradores ativos enquadrados em cargo    — 30
 *  - Cargos descritos (missão/responsabilidades)  — 15
 */
export function calcularMaturidade(cargos: Cargo[], counts: StructureCounts): MaturidadeResultado {
  const temCargos = counts.totalCargos > 0;

  const comNivel = cargos.filter((c) => c.nivel_hierarquico != null && String(c.nivel_hierarquico).trim() !== '').length;
  const comFaixa = cargos.filter((c) => typeof c.salario_minimo === 'number' && typeof c.salario_maximo === 'number').length;
  const comDescricao = cargos.filter((c) => {
    const missao = typeof c.missao === 'string' && c.missao.trim() !== '';
    const resp = Array.isArray(c.responsabilidades) && c.responsabilidades.length > 0;
    return missao || resp;
  }).length;

  const nCargos = Math.max(1, counts.totalCargos);
  const nColab = Math.max(1, counts.colaboradoresAtivos);

  const defs: Array<Omit<MaturidadeComponente, 'pontos'>> = [
    {
      chave: 'existencia',
      rotulo: 'Cargos cadastrados',
      peso: 20,
      proporcao: temCargos ? 1 : 0,
      detalhe: temCargos ? `${counts.totalCargos} cargo(s) cadastrado(s)` : 'Nenhum cargo cadastrado',
    },
    {
      chave: 'niveis',
      rotulo: 'Cargos com nível hierárquico',
      peso: 15,
      proporcao: clamp01(comNivel / nCargos),
      detalhe: `${comNivel} de ${counts.totalCargos} cargo(s) com nível`,
    },
    {
      chave: 'faixas',
      rotulo: 'Cargos com faixa salarial',
      peso: 20,
      proporcao: clamp01(comFaixa / nCargos),
      detalhe: `${comFaixa} de ${counts.totalCargos} cargo(s) com faixa (mín/máx)`,
    },
    {
      chave: 'enquadramento',
      rotulo: 'Colaboradores enquadrados',
      peso: 30,
      proporcao: clamp01(counts.totalEnquadrados / nColab),
      detalhe: `${counts.totalEnquadrados} de ${counts.colaboradoresAtivos} colaborador(es) ativo(s) enquadrado(s)`,
    },
    {
      chave: 'descricao',
      rotulo: 'Cargos descritos',
      peso: 15,
      proporcao: clamp01(comDescricao / nCargos),
      detalhe: `${comDescricao} de ${counts.totalCargos} cargo(s) com missão/responsabilidades`,
    },
  ];

  const componentes: MaturidadeComponente[] = defs.map((d) => ({
    ...d,
    pontos: Math.round(d.peso * d.proporcao),
  }));

  const score = Math.max(0, Math.min(100, componentes.reduce((acc, c) => acc + c.peso * c.proporcao, 0)));
  const classe = classificar(score, temCargos);

  const proximosPassos: string[] = [];
  if (!temCargos) {
    proximosPassos.push('Cadastrar os primeiros cargos do plano de cargos e salários.');
  } else {
    if (comFaixa < counts.totalCargos) proximosPassos.push('Definir faixas salariais (mínimo e máximo) dos cargos.');
    if (comNivel < counts.totalCargos) proximosPassos.push('Atribuir nível hierárquico aos cargos.');
    if (counts.totalEnquadrados < counts.colaboradoresAtivos) proximosPassos.push('Enquadrar os colaboradores ativos nos cargos correspondentes.');
    if (comDescricao < counts.totalCargos) proximosPassos.push('Descrever missão e responsabilidades dos cargos.');
  }

  return {
    score: Math.round(score),
    classe,
    classeRotulo: CLASSE_ROTULO[classe],
    componentes,
    proximosPassos,
  };
}
