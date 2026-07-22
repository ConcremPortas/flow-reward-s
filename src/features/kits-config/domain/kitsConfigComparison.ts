// Comparação de parâmetros entre duas configurações — PURO. Sem mesclar.
export interface ParamCompareInput {
  minimoKits: number; incrementoFaixa: number; bonusBase: number; bonusPorFaixa: number; maxFaixas: number | null;
}

export type ParamKind = 'kits' | 'currency' | 'faixas';

export interface ParamDiffRow {
  key: keyof ParamCompareInput;
  label: string;
  kind: ParamKind;
  a: number | null;
  b: number | null;
  deltaAbs: number | null;    // b - a (null quando algum lado é null)
  deltaPct: number | null;    // (b-a)/a * 100
  changed: boolean;
}

const FIELDS: { key: keyof ParamCompareInput; label: string; kind: ParamKind }[] = [
  { key: 'minimoKits', label: 'Mínimo de kits', kind: 'kits' },
  { key: 'incrementoFaixa', label: 'Incremento por faixa', kind: 'kits' },
  { key: 'bonusBase', label: 'Bônus base', kind: 'currency' },
  { key: 'bonusPorFaixa', label: 'Bônus por faixa', kind: 'currency' },
  { key: 'maxFaixas', label: 'Máximo de faixas', kind: 'faixas' },
];

export function diffConfigParams(a: ParamCompareInput, b: ParamCompareInput): ParamDiffRow[] {
  return FIELDS.map(f => {
    const va = a[f.key]; const vb = b[f.key];
    const bothNum = typeof va === 'number' && typeof vb === 'number';
    const deltaAbs = bothNum ? (vb as number) - (va as number) : null;
    const deltaPct = bothNum && (va as number) !== 0 ? Math.round((((vb as number) - (va as number)) / (va as number)) * 1000) / 10 : null;
    return { key: f.key, label: f.label, kind: f.kind, a: va ?? null, b: vb ?? null, deltaAbs, changed: va !== vb, deltaPct };
  });
}
