// Validação local da importação de produção — pura, sem I/O.
// Reproduz e centraliza as regras do fluxo legado (ProducaoSetor.tsx):
// resolução de setor por id/nome, parsing de competência e numérico, e
// checagem de duplicidade (setor+competência já existente).
import type { Setor } from '@/hooks/useSetores';
import { parseNumberBR } from './productionValidation';
import type { ImportParsedRow, ImportRowStatus, ImportSummary } from '../types/production-entry.types';

export function normalizeKey(value: string): string {
  return value.trim().toLowerCase().normalize('NFD')
    .replace(/\p{Diacritic}/gu, '').replace(/[^\w]+/g, '_').replace(/^_+|_+$/g, '');
}

export function normalizeName(value: string): string {
  return value.trim().toLowerCase().normalize('NFD')
    .replace(/\p{Diacritic}/gu, '').replace(/\s+/g, ' ');
}

/** Resolve o id do setor a partir de setor_id ou setor_nome (match exato, depois prefixo). */
export function resolveSetorId(row: Record<string, unknown>, setores: Setor[]): string {
  const setorId = String(row.setor_id ?? '').trim();
  if (setorId && setores.some((s) => s.id === setorId)) return setorId;

  const nameCandidate = String(row.setor_nome ?? row.setor ?? row.setor_name ?? '').trim();
  if (!nameCandidate) return '';
  const target = normalizeName(nameCandidate);
  const found = setores.find((s) => normalizeName(s.nome) === target);
  if (found) return found.id;
  const foundPrefix = setores.find((s) => target.startsWith(normalizeName(s.nome)));
  return foundPrefix?.id || '';
}

/** Converte diferentes formatos de competência para 'YYYY-MM' (ou '' se inválida). Sem timezone. */
export function parseCompetencia(value: unknown): string {
  if (value == null || value === '') return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }
  const str = String(value).trim();
  if (!str) return '';
  let m: RegExpMatchArray | null;
  if ((m = str.match(/^(\d{4})-(\d{2})/))) return `${m[1]}-${m[2]}`;
  if ((m = str.match(/^(\d{2})\/(\d{4})$/))) return `${m[2]}-${m[1]}`;
  if ((m = str.match(/^(\d{2})-(\d{4})$/))) return `${m[2]}-${m[1]}`;
  if ((m = str.match(/^(\d{4})\/(\d{2})$/))) return `${m[1]}-${m[2]}`;
  return '';
}

interface ValidateArgs {
  /** Linhas cruas do Excel (chaves originais). */
  rawRows: Record<string, unknown>[];
  setores: Setor[];
  /** Chaves 'setorId|YYYY-MM' já existentes no banco (duplicidade). */
  existingKeys: Set<string>;
  /** Competência-alvo da importação (opcional): se a linha divergir, vira alerta. */
  competenciaAlvo?: string;
}

/** Valida todas as linhas e classifica cada uma (válido/alerta/inválido). */
export function validateImportRows({ rawRows, setores, existingKeys, competenciaAlvo }: ValidateArgs): ImportParsedRow[] {
  const seen = new Set<string>(); // duplicidade dentro do próprio arquivo
  return rawRows.map((raw, i) => {
    const normalized: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(raw)) normalized[normalizeKey(k)] = v;

    const setorId = resolveSetorId(normalized, setores) || null;
    const setorNome = String(normalized.setor_nome ?? normalized.setor ?? '').trim()
      || setores.find((s) => s.id === setorId)?.nome || '';
    const competencia = parseCompetencia(normalized.competencia ?? normalized.data_producao ?? normalized.mes_ano);
    const meta = parseNumberBR(normalized.meta_mensal ?? normalized.meta ?? normalized.meta_diaria);
    const realizado = parseNumberBR(normalized.producao_realizada ?? normalized.realizado ?? normalized.producao);
    const unidade = String(normalized.unidade_medida ?? normalized.unidade ?? 'unidades').trim() || 'unidades';

    const problemas: string[] = [];
    if (!setorId) problemas.push('Setor não identificado (use setor_id ou setor_nome)');
    if (!competencia) problemas.push('Competência inválida (use AAAA-MM)');
    if (meta == null || meta <= 0) problemas.push('Meta mensal inválida');
    if (realizado == null || realizado < 0) problemas.push('Produção realizada inválida');

    const key = setorId && competencia ? `${setorId}|${competencia}` : '';
    const jaExiste = !!key && existingKeys.has(key);
    const dupNoArquivo = !!key && seen.has(key);
    if (key) seen.add(key);

    const alertas: string[] = [];
    if (dupNoArquivo) alertas.push('Setor+competência duplicado no arquivo');
    if (jaExiste) alertas.push('Já existe registro para este setor/competência');
    if (competenciaAlvo && competencia && competencia !== competenciaAlvo) {
      alertas.push(`Competência diferente da selecionada (${competenciaAlvo})`);
    }

    let status: ImportRowStatus;
    let problema: string | null;
    if (problemas.length) {
      status = 'invalido';
      problema = problemas.join('; ');
    } else if (alertas.length) {
      status = 'alerta';
      problema = alertas.join('; ');
    } else {
      status = 'valido';
      problema = null;
    }

    return {
      linha: i + 2, // +1 header, +1 base 1
      setorId,
      setorNome,
      competencia,
      meta,
      realizado,
      unidade,
      status,
      problema,
      jaExiste,
    };
  });
}

export function summarizeImport(rows: ImportParsedRow[]): ImportSummary {
  return {
    total: rows.length,
    validos: rows.filter((r) => r.status === 'valido').length,
    alertas: rows.filter((r) => r.status === 'alerta').length,
    invalidos: rows.filter((r) => r.status === 'invalido').length,
  };
}
