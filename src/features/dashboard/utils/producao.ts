// Atingimento de produção por setor — puro.
import type { ProducaoSetor } from '@/hooks/useProducaoSetor';
import { inCompetencia } from './dates';

export interface ProducaoResumo {
  atingimentoGlobal: number | null;   // %
  setoresAbaixo: number;
  totalSetoresComMeta: number;
}

/** Mapa setorId -> atingimento (%) na competência. */
export function producaoPorSetor(
  registros: ProducaoSetor[],
  comp: string,
  setorIds?: Set<string>,
): Map<string, number> {
  const bySetor = new Map<string, { meta: number; real: number }>();
  registros
    .filter(r => inCompetencia(r.data_producao, comp) && (!setorIds || (r.setor_id && setorIds.has(r.setor_id))))
    .forEach(r => {
      const k = r.setor_id || '—';
      const cur = bySetor.get(k) || { meta: 0, real: 0 };
      cur.meta += r.meta_diaria || 0;
      cur.real += r.producao_realizada || 0;
      bySetor.set(k, cur);
    });
  const out = new Map<string, number>();
  for (const [k, v] of bySetor) {
    if (v.meta > 0) out.set(k, Number(((v.real / v.meta) * 100).toFixed(1)));
  }
  return out;
}

export function producaoResumo(
  registros: ProducaoSetor[],
  comp: string,
  setorIds?: Set<string>,
): ProducaoResumo {
  const porSetor = producaoPorSetor(registros, comp, setorIds);
  let totMeta = 0;
  let totReal = 0;
  registros
    .filter(r => inCompetencia(r.data_producao, comp) && (!setorIds || (r.setor_id && setorIds.has(r.setor_id))))
    .forEach(r => {
      totMeta += r.meta_diaria || 0;
      totReal += r.producao_realizada || 0;
    });
  let abaixo = 0;
  for (const pct of porSetor.values()) if (pct < 100) abaixo++;
  return {
    atingimentoGlobal: totMeta > 0 ? Number(((totReal / totMeta) * 100).toFixed(1)) : null,
    setoresAbaixo: abaixo,
    totalSetoresComMeta: porSetor.size,
  };
}
