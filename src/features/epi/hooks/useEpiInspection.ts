import { useEffect, useRef, useState } from 'react';
import type { Funcionario } from '@/hooks/useFuncionarios';
import { computeComplianceDiff } from '../domain/epiComparison';
import type { ComplianceMap } from '../types/epi.types';

interface Args {
  /** Funcionários elegíveis para a auditoria (já filtrados por auditableFuncionarios). */
  funcionarios: Funcionario[];
  /** Estado inicial ao editar uma auditoria existente. Undefined = nova auditoria. */
  initialComplianceMap?: ComplianceMap;
  /** Muda a cada "iniciar nova"/"editar"/"duplicar" — força reseed mesmo com a mesma lista de funcionários. */
  seedKey: string;
}

/**
 * Rascunho da inspeção de EPI (Etapa 2). Preserva a regra atual: todo
 * funcionário começa CONFORME por padrão (ausência no map = conforme); a tela
 * só rastreia quem foi marcado como não conforme.
 */
export function useEpiInspection({ funcionarios, initialComplianceMap, seedKey }: Args) {
  const [baseline, setBaseline] = useState<ComplianceMap>({});
  const [draft, setDraft] = useState<ComplianceMap>({});
  const lastSeedKey = useRef<string | null>(null);

  useEffect(() => {
    if (lastSeedKey.current === seedKey) return;
    lastSeedKey.current = seedKey;

    const map: ComplianceMap = {};
    funcionarios.forEach((f) => {
      map[f.id] = initialComplianceMap ? (initialComplianceMap[f.id] ?? true) : true;
    });
    setBaseline(map);
    setDraft(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seedKey, funcionarios.length]);

  const setCompliance = (funcionarioId: string, conforme: boolean) =>
    setDraft((prev) => ({ ...prev, [funcionarioId]: conforme }));

  const markAllConforme = () =>
    setDraft(() => {
      const map: ComplianceMap = {};
      funcionarios.forEach((f) => { map[f.id] = true; });
      return map;
    });

  const restoreInitial = () => setDraft(baseline);

  const diff = computeComplianceDiff(baseline, draft);
  const isDirty = diff.totalAlterados > 0;

  const conformes = funcionarios.filter((f) => draft[f.id] ?? true);
  const naoConformes = funcionarios.filter((f) => !(draft[f.id] ?? true));
  const taxaConformidade = funcionarios.length > 0 ? Number(((conformes.length / funcionarios.length) * 100).toFixed(1)) : 0;

  return {
    funcionarios, baseline, draft, setCompliance,
    markAllConforme, restoreInitial,
    diff, isDirty, conformes, naoConformes, taxaConformidade,
  };
}

export type UseEpiInspectionReturn = ReturnType<typeof useEpiInspection>;
