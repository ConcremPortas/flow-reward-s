import { useEffect, useRef, useState } from 'react';
import type { Funcionario } from '@/hooks/useFuncionarios';
import { linkedActiveFuncionarios } from '../domain/dssValidation';
import { computePresenceDiff, type PresenceMap } from '../domain/dssComparison';

interface Args {
  localDssId: string;
  funcionarios: Funcionario[];
  /** IDs presentes originalmente (edição de um DSS existente). Undefined = novo DSS. */
  initialParticipantIds?: string[];
}

/**
 * Rascunho da lista de presença. Preserva o comportamento original: ao
 * selecionar/entrar num local, todos os vinculados começam marcados como
 * presentes (cadastro novo) — ou apenas os IDs salvos em `participantes_ids`
 * (edição). Trocar de local reseta para "todos presentes" da nova população,
 * já que a marcação antiga não tem correspondência com ela.
 */
export function useDssAttendance({ localDssId, funcionarios, initialParticipantIds }: Args) {
  const [baseline, setBaseline] = useState<PresenceMap>({});
  const [draft, setDraft] = useState<PresenceMap>({});
  const lastLocalId = useRef<string | null>(null);
  const usedInitialSeed = useRef(false);

  const vinculados = linkedActiveFuncionarios(funcionarios, localDssId);

  useEffect(() => {
    if (!localDssId) { setBaseline({}); setDraft({}); lastLocalId.current = null; return; }
    if (lastLocalId.current === localDssId) return;
    lastLocalId.current = localDssId;

    const seedFromInitial = !usedInitialSeed.current && initialParticipantIds != null;
    usedInitialSeed.current = true;

    const map: PresenceMap = {};
    vinculados.forEach((f) => {
      map[f.id] = seedFromInitial ? initialParticipantIds!.includes(f.id) : true;
    });
    setBaseline(map);
    setDraft(map);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localDssId, vinculados.length]);

  const setPresence = (funcionarioId: string, presente: boolean) =>
    setDraft((prev) => ({ ...prev, [funcionarioId]: presente }));

  const markAll = (presente: boolean) =>
    setDraft(() => {
      const map: PresenceMap = {};
      vinculados.forEach((f) => { map[f.id] = presente; });
      return map;
    });

  const restoreInitial = () => setDraft(baseline);

  const diff = computePresenceDiff(baseline, draft);
  const isDirty = diff.totalAlterados > 0;

  const presentes = vinculados.filter((f) => draft[f.id]);
  const ausentes = vinculados.filter((f) => !draft[f.id]);
  const participacaoPct = vinculados.length > 0 ? Number(((presentes.length / vinculados.length) * 100).toFixed(1)) : 0;

  return {
    vinculados, baseline, draft, setPresence,
    markAllPresent: () => markAll(true), markAllAbsent: () => markAll(false), restoreInitial,
    diff, isDirty, presentes, ausentes, participacaoPct,
  };
}

export type UseDssAttendanceReturn = ReturnType<typeof useDssAttendance>;
