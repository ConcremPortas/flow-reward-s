import { useMemo } from 'react';
import { useSetores } from '@/hooks/useSetores';
import { useEmpresas } from '@/hooks/useEmpresas';
import { useFuncionarios } from '@/hooks/useFuncionarios';
import { useProducaoSetor } from '@/hooks/useProducaoSetor';
import { useIndicadoresSetor } from '@/hooks/useIndicadoresSetor';
import { buildDependencyMaps, linksFor } from '../domain/sectorDependencies';
import { getSectorRegistrationStatus } from '../domain/sectorRegistrationStatus';
import { descricaoDisplay, normalizeStr } from '../domain/sectorPresentation';
import type { SectorRow } from '../types/sector.types';

/**
 * Composição das fontes da Central de Estrutura Organizacional. Constrói as
 * linhas enriquecidas (status/vínculos/apresentação) UMA vez, com contagem de
 * vínculos agregada em lote (sem N+1). Reexpõe as ações de persistência.
 */
export function useSectors() {
  const { setores, loading: setoresLoading, createSetor, updateSetor, deleteSetor, refetch } = useSetores();
  const { empresas } = useEmpresas();
  const { funcionarios } = useFuncionarios();
  const { registros: producao } = useProducaoSetor();
  const { indicadores } = useIndicadoresSetor();

  const depMaps = useMemo(() => buildDependencyMaps(funcionarios, producao, indicadores), [funcionarios, producao, indicadores]);

  const rows = useMemo<SectorRow[]>(() => setores.map((s) => {
    const links = linksFor(s.id, depMaps);
    return {
      id: s.id,
      nome: s.nome,
      descricao: s.descricao ?? null,
      empresaId: s.empresa_id ?? null,
      empresaNome: s.empresa?.nome ?? null,
      supervisorId: s.supervisor_id ?? null,
      supervisorNome: s.supervisor?.nome ?? null,
      encarregadoId: s.encarregado_id ?? null,
      encarregadoNome: s.encarregado?.nome ?? null,
      links,
      status: getSectorRegistrationStatus({ empresaId: s.empresa_id ?? null, supervisorId: s.supervisor_id ?? null, encarregadoId: s.encarregado_id ?? null, funcionarios: links.funcionarios }),
      descricaoDisplay: descricaoDisplay(s.nome, s.descricao),
    } satisfies SectorRow;
  }), [setores, depMaps]);

  const supervisores = useMemo(() => funcionarios.filter(f => f.categoria?.nome?.toLowerCase().includes('supervisor')), [funcionarios]);
  const encarregados = useMemo(() => funcionarios.filter(f => f.categoria?.nome?.toLowerCase().includes('encarregado')), [funcionarios]);

  /** Duplicidade app-level (não há constraint no banco): mesmo nome normalizado na mesma empresa. */
  const findDuplicate = (nome: string, empresaId: string | null, exceptId?: string): SectorRow | undefined =>
    rows.find(r => r.id !== exceptId && normalizeStr(r.nome) === normalizeStr(nome) && (r.empresaId ?? '') === (empresaId ?? ''));

  return {
    rows, empresas, supervisores, encarregados,
    loading: setoresLoading,
    createSetor, updateSetor, deleteSetor, refetch,
    findDuplicate,
  };
}

export type UseSectorsReturn = ReturnType<typeof useSectors>;
