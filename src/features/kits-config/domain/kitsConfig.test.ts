import { describe, it, expect } from 'vitest';
import { calcularComissao, FALLBACK_CONFIG } from '@/domain/premiacao/calculoPremiacao';
import { selectConfigForCompetencia, isSentinela } from './kitsConfigSelection';
import { computePeriodsAndStates } from './kitsConfigPeriods';
import { validateKitsConfig } from './kitsConfigValidation';
import { buildConfigUsage, competenciasAfetadasPorRetroatividade } from './kitsConfigDependencies';
import { canEditConfig, canDeleteConfig, protectionReason } from './kitsConfigStatus';
import { diffConfigParams } from './kitsConfigComparison';
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';

const cfg = (id: string, vigenciaInicio: string) => ({ id, vigenciaInicio });
const res = (mes: string, valorKits: number | null): ResultadoPremiacao => ({
  id: Math.random().toString(36), mes_competencia: `${mes}-01`, nome: 'x', valor_kits: valorKits ?? undefined,
  nota_epi: 1, nota_faltas: 1, nota_advertencias: 1, nota_dss: 1, nota_geral: 1, bonus_possivel: 0, bonus_alcancado: 0, created_at: '', updated_at: '',
} as ResultadoPremiacao);

// ---------- motor (reuso, não duplica) ----------
describe('calcularComissao (motor real)', () => {
  const c = { minimo_kits: 10000, incremento_faixa: 250, bonus_base: 100, bonus_por_faixa: 25 };
  it('abaixo do mínimo → 0', () => expect(calcularComissao(9999, c)).toBe(0));
  it('exatamente no mínimo → bônus base', () => expect(calcularComissao(10000, c)).toBe(100));
  it('mínimo + incremento - 1 → ainda base', () => expect(calcularComissao(10249, c)).toBe(100));
  it('mínimo + incremento → base + 1 faixa', () => expect(calcularComissao(10250, c)).toBe(125));
  it('muitas faixas (floor)', () => expect(calcularComissao(10000 + 250 * 10, c)).toBe(100 + 25 * 10));
  it('sem teto de faixas (max_faixas não aplicado)', () => expect(calcularComissao(10000 + 250 * 1000, c)).toBe(100 + 25 * 1000));
  it('FALLBACK_CONFIG documentado', () => expect(FALLBACK_CONFIG).toMatchObject({ minimo_kits: 10000, incremento_faixa: 250, bonus_base: 100, bonus_por_faixa: 25 }));
});

// ---------- seleção por competência ----------
describe('selectConfigForCompetencia', () => {
  const configs = [cfg('c2000', '2000-01'), cfg('cMai', '2026-05'), cfg('cAgo', '2026-08')];
  it('competência anterior à primeira → null', () => expect(selectConfigForCompetencia([cfg('cMai', '2026-05')], '2026-04')).toBeNull());
  it('igual à vigência → a própria', () => expect(selectConfigForCompetencia(configs, '2026-05')?.id).toBe('cMai'));
  it('entre duas vigências → a anterior', () => expect(selectConfigForCompetencia(configs, '2026-07')?.id).toBe('cMai'));
  it('competência futura → a última vigente', () => expect(selectConfigForCompetencia(configs, '2027-01')?.id).toBe('cAgo'));
  it('antes de tudo (só há 2000) → sentinela', () => expect(selectConfigForCompetencia(configs, '2010-01')?.id).toBe('c2000'));
  it('isSentinela detecta 2000-01', () => { expect(isSentinela('2000-01')).toBe(true); expect(isSentinela('2026-05')).toBe(false); });
});

// ---------- períodos e estados ----------
describe('computePeriodsAndStates', () => {
  const configs = [cfg('c2000', '2000-01'), cfg('cMai', '2026-05'), cfg('cAgo', '2026-08')];
  const ps = computePeriodsAndStates(configs, '2026-06'); // atual = maio
  it('período efetivo derivado (fim = mês anterior à próxima)', () => {
    expect(ps.get('c2000')!.period).toMatchObject({ inicio: '2000-01', fim: '2026-04', emDiante: false });
    expect(ps.get('cMai')!.period).toMatchObject({ inicio: '2026-05', fim: '2026-07', emDiante: false });
    expect(ps.get('cAgo')!.period).toMatchObject({ inicio: '2026-08', fim: null, emDiante: true });
  });
  it('estados: histórica / atual / programada', () => {
    expect(ps.get('c2000')!.state.state).toBe('historica');
    expect(ps.get('cMai')!.state.state).toBe('atual');
    expect(ps.get('cAgo')!.state.state).toBe('programada');
  });
});

// ---------- validação ----------
describe('validateKitsConfig', () => {
  const base = { vigenciaInicio: '2026-05', minimoKits: 10000, incrementoFaixa: 250, bonusBase: 100, bonusPorFaixa: 25, maxFaixas: null };
  it('válida', () => expect(validateKitsConfig(base).valid).toBe(true));
  it('vigência inválida', () => expect(validateKitsConfig({ ...base, vigenciaInicio: '2026-13' }).valid).toBe(false));
  it('mínimo/incremento devem ser > 0', () => {
    expect(validateKitsConfig({ ...base, minimoKits: 0 }).valid).toBe(false);
    expect(validateKitsConfig({ ...base, incrementoFaixa: 0 }).valid).toBe(false);
  });
  it('bônus não pode ser negativo', () => expect(validateKitsConfig({ ...base, bonusBase: -1 }).valid).toBe(false));
  it('max_faixas: null ok; inteiro ≥1 ok (com aviso); 0 inválido', () => {
    expect(validateKitsConfig(base).warnings).toHaveLength(0);
    expect(validateKitsConfig({ ...base, maxFaixas: 5 }).valid).toBe(true);
    expect(validateKitsConfig({ ...base, maxFaixas: 5 }).warnings.length).toBeGreaterThan(0);
    expect(validateKitsConfig({ ...base, maxFaixas: 0 }).valid).toBe(false);
  });
});

// ---------- utilização / retroatividade ----------
describe('utilização e retroatividade', () => {
  const configs = [cfg('c2000', '2000-01'), cfg('cMai', '2026-05')];
  const resultados = [res('2026-04', 12000), res('2026-04', 5000), res('2026-05', 20000), res('2026-06', null)];
  it('usa só resultados de kits e mapeia competência → config', () => {
    const usage = buildConfigUsage(configs, resultados);
    // 2026-04 → c2000 (antes de maio): 2 resultados; 2026-05 → cMai: 1; 2026-06 tem valor_kits null → ignorado
    expect(usage.get('c2000')).toMatchObject({ competencias: 1, resultados: 2, utilizada: true });
    expect(usage.get('cMai')).toMatchObject({ competencias: 1, resultados: 1, utilizada: true });
  });
  it('retroatividade: competências processadas ≥ nova vigência', () => {
    const r = competenciasAfetadasPorRetroatividade(resultados, '2026-05');
    expect(r.competencias).toEqual(['2026-05']);
    expect(r.resultados).toBe(1);
  });
});

// ---------- permissões ----------
describe('permissões por estado/utilização', () => {
  const usado = { competencias: 2, resultados: 5, utilizada: true };
  const naoUsado = { competencias: 0, resultados: 0, utilizada: false };
  it('programada e não utilizada → editável/excluível', () => {
    expect(canEditConfig('programada', naoUsado)).toBe(true);
    expect(canDeleteConfig('programada', naoUsado)).toBe(true);
    expect(protectionReason('programada', naoUsado)).toBeNull();
  });
  it('utilizada → protegida', () => {
    expect(canEditConfig('programada', usado)).toBe(false);
    expect(protectionReason('programada', usado)).toContain('nova vigência');
  });
  it('atual → protegida', () => {
    expect(canEditConfig('atual', naoUsado)).toBe(false);
    expect(protectionReason('atual', naoUsado)).toContain('vigente');
  });
});

// ---------- comparação ----------
describe('diffConfigParams', () => {
  const a = { minimoKits: 10000, incrementoFaixa: 250, bonusBase: 100, bonusPorFaixa: 25, maxFaixas: null };
  const b = { minimoKits: 11000, incrementoFaixa: 250, bonusBase: 100, bonusPorFaixa: 30, maxFaixas: null };
  it('delta absoluto e percentual dos parâmetros', () => {
    const diff = diffConfigParams(a, b);
    const min = diff.find(d => d.key === 'minimoKits')!;
    expect(min).toMatchObject({ a: 10000, b: 11000, deltaAbs: 1000, deltaPct: 10, changed: true });
    expect(diff.find(d => d.key === 'incrementoFaixa')!.changed).toBe(false);
    expect(diff.find(d => d.key === 'bonusPorFaixa')!.deltaAbs).toBe(5);
  });
});
