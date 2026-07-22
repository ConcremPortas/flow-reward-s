import type { JobEmployeeRow, EmployeeJobSituacao, JobEmployeeFilters } from '../types/job-employee.types';
import { SITUACAO_LABEL } from './employeeJobStatus';

export type Severidade = 'alta' | 'media' | 'baixa';

const SEVERIDADE: Partial<Record<EmployeeJobSituacao, Severidade>> = {
  abaixo_faixa: 'alta',
  acima_faixa: 'alta',
  sem_cargo: 'media',
  somente_funcao: 'media',
  sem_faixa: 'media',
  sem_nivel: 'baixa',
  salario_nao_informado: 'baixa',
  revisar: 'media',
};

const SEV_ORDEM: Record<Severidade, number> = { alta: 0, media: 1, baixa: 2 };

export interface IssueTipo {
  situacao: EmployeeJobSituacao;
  titulo: string;
  severidade: Severidade;
  quantidade: number;
  setoresAfetados: number;
  /** Filtro que a visão Colaboradores deve aplicar ao clicar. */
  filtro: Partial<JobEmployeeFilters>;
}

const filtroDe = (s: EmployeeJobSituacao): Partial<JobEmployeeFilters> => {
  if (s === 'sem_cargo' || s === 'somente_funcao') return { enquadramento: 'sem_cargo' };
  if (s === 'abaixo_faixa') return { faixa: 'abaixo' };
  if (s === 'acima_faixa') return { faixa: 'acima' };
  if (s === 'salario_nao_informado') return { faixa: 'sem_salario' };
  return { enquadramento: 'pendentes' };
};

/**
 * Agrega as pendências de enquadramento por tipo (só colaboradores ativos).
 * Cada pendência aparece uma vez por colaborador que a possui.
 */
export function agregarPendencias(rows: JobEmployeeRow[]): IssueTipo[] {
  const ativos = rows.filter((r) => r.ativo);
  const contagem = new Map<EmployeeJobSituacao, { q: number; setores: Set<string> }>();

  for (const r of ativos) {
    for (const p of r.pendencias) {
      const item = contagem.get(p) ?? { q: 0, setores: new Set<string>() };
      item.q++;
      if (r.funcionario.setor_id) item.setores.add(r.funcionario.setor_id);
      contagem.set(p, item);
    }
  }

  return Array.from(contagem.entries())
    .map(([situacao, { q, setores }]) => ({
      situacao,
      titulo: SITUACAO_LABEL[situacao],
      severidade: SEVERIDADE[situacao] ?? 'baixa',
      quantidade: q,
      setoresAfetados: setores.size,
      filtro: filtroDe(situacao),
    }))
    .sort((a, b) => SEV_ORDEM[a.severidade] - SEV_ORDEM[b.severidade] || b.quantidade - a.quantidade);
}

export interface SetorPendencia {
  setorId: string | null;
  setorNome: string;
  total: number;
  pendentes: number;
  semCargo: number;
}

/** Pendências agrupadas por setor (para a visão por setor). */
export function pendenciasPorSetor(rows: JobEmployeeRow[]): SetorPendencia[] {
  const ativos = rows.filter((r) => r.ativo);
  const mapa = new Map<string, SetorPendencia>();
  for (const r of ativos) {
    const id = r.funcionario.setor_id ?? '__sem__';
    const nome = r.setorNome ?? 'Sem setor';
    const item = mapa.get(id) ?? { setorId: id === '__sem__' ? null : id, setorNome: nome, total: 0, pendentes: 0, semCargo: 0 };
    item.total++;
    if (r.situacao !== 'regular') item.pendentes++;
    if (r.cargo == null) item.semCargo++;
    mapa.set(id, item);
  }
  return Array.from(mapa.values()).sort((a, b) => b.pendentes - a.pendentes || b.total - a.total);
}
