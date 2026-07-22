/**
 * Suporte puro à idempotência das RPCs (Fase 2C §11). A RPC usará `operacao_id`
 * + hash dos parâmetros normalizados. Aqui fornecemos a NORMALIZAÇÃO canônica
 * (JSON estável, chaves ordenadas) — o hash (sha256) é calculado no servidor.
 * Determinístico: mesma entrada → mesma string.
 */
export function canonicalizarParametros(valor: unknown): string {
  return JSON.stringify(ordenar(valor));
}

function ordenar(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(ordenar);
  if (v && typeof v === 'object') {
    const obj = v as Record<string, unknown>;
    return Object.keys(obj)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        if (obj[k] !== undefined) acc[k] = ordenar(obj[k]);
        return acc;
      }, {});
  }
  return v;
}
