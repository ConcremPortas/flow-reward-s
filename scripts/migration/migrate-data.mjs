#!/usr/bin/env node
// Migracao de dados V2 — copia dados do banco ANTIGO para o NOVO projeto Supabase.
//
// SEGURANCA:
//   - NAO contem credenciais. Le SRC_DATABASE_URL e DST_DATABASE_URL do ambiente.
//   - NAO grava dados em disco (streaming src -> dst em memoria).
//   - Idempotente: usa INSERT ... ON CONFLICT (id) DO NOTHING.
//
// USO:
//   SRC_DATABASE_URL="postgresql://.../postgres" DST_DATABASE_URL="postgresql://.../postgres" \
//     node scripts/migration/migrate-data.mjs [flags]
//
// FLAGS:
//   --dry-run            Nao escreve; so conta linhas na origem.
//   --include-seed       Tambem migra tabelas de config ja cobertas pelo seed 0010 (default: pula).
//   --skip-sensitive     NAO migra funcionarios e usuarios (dados pessoais).
//   --only=a,b,c         Migra apenas estas tabelas (nome sem prefixo concremrh_).
//   --on-conflict=update Faz upsert (DO UPDATE) em vez de DO NOTHING.
//
// Requer o pacote `pg`. Se nao estiver instalado:  npm i pg   (ou rode via npx).

import pg from 'pg';
const { Client } = pg;

const P = 'concremrh_';
const args = process.argv.slice(2);
const has = f => args.includes(f);
const val = k => { const a = args.find(x => x.startsWith(k + '=')); return a ? a.split('=')[1] : null; };

const DRY = has('--dry-run');
const INCLUDE_SEED = has('--include-seed');
const SKIP_SENSITIVE = has('--skip-sensitive');
const ONLY = (val('--only') || '').split(',').map(s => s.trim()).filter(Boolean);
const ON_CONFLICT = (val('--on-conflict') === 'update') ? 'update' : 'nothing';

// Config ja coberta pelo seed 0010 (pulada por padrao para nao duplicar/sobrescrever).
const SEED_TABLES = new Set([
  'base_premiacao', 'categorias', 'configuracoes_kits', 'formulas_calculo',
  'hr_applications', 'tipos_indicadores', 'tipos_indicadores_gerais',
]);
// Dados pessoais/sensiveis (LGPD). Migrados por padrao (login precisa), gate com --skip-sensitive.
const SENSITIVE_TABLES = new Set(['funcionarios', 'usuarios']);

// Ordem por dependencia de FK. O ciclo setores<->funcionarios e tratado em duas passadas:
// setores entra com supervisor_id/encarregado_id NULOS; depois de funcionarios, faz-se o UPDATE.
const ORDER = [
  'empresas', 'base_premiacao', 'categorias', 'configuracoes_kits', 'faixas', 'funcoes',
  'locais_dss', 'hr_applications', 'tipos_indicadores', 'tipos_indicadores_gerais', 'formulas_calculo',
  'setores',            // 1a passada: sem supervisor/encarregado
  'funcionarios',
  '@fix_setores',       // 2a passada: UPDATE supervisor_id/encarregado_id
  'funcionarios_setores',
  'cargos', 'plano_carreira', 'historico_cargos', 'estrutura_hierarquica', 'avaliacoes_desempenho',
  'epi', 'dss', 'faltas_advertencias', 'indicadores_setor', 'indicadores_gerais',
  'producao_setor', 'resultados_premiacao',
  'usuarios', 'user_roles', 'user_application_permissions',
];

function requireEnv(name) {
  const v = process.env[name];
  if (!v) { console.error(`\nERRO: variavel de ambiente ${name} nao definida.\nDefina SRC_DATABASE_URL e DST_DATABASE_URL (ver scripts/migration/README.md).\n`); process.exit(1); }
  return v;
}

async function columnKinds(client, table) {
  const { rows } = await client.query(
    `select column_name, udt_name from information_schema.columns
     where table_schema='public' and table_name=$1 order by ordinal_position`, [P + table]);
  const kinds = {};
  for (const r of rows) {
    if (r.udt_name === 'jsonb' || r.udt_name === 'json') kinds[r.column_name] = 'jsonb';
    else if (r.udt_name.startsWith('_')) kinds[r.column_name] = 'array';
    else kinds[r.column_name] = 'plain';
  }
  return kinds;
}

function buildInsert(table, cols, kinds, row) {
  const ph = cols.map((c, i) => kinds[c] === 'jsonb' ? `$${i + 1}::jsonb` : `$${i + 1}`);
  const vals = cols.map(c => {
    const v = row[c];
    if (v === null || v === undefined) return null;
    if (kinds[c] === 'jsonb') return JSON.stringify(v);
    return v; // arrays (JS array) e escalares passam direto (node-pg formata)
  });
  let sql = `insert into public.${P}${table} (${cols.join(', ')}) values (${ph.join(', ')})`;
  if (ON_CONFLICT === 'update') {
    const set = cols.filter(c => c !== 'id').map(c => `${c}=excluded.${c}`).join(', ');
    sql += ` on conflict (id) do update set ${set}`;
  } else {
    sql += ` on conflict (id) do nothing`;
  }
  return { sql, vals };
}

async function copyTable(src, dst, table) {
  const srcRows = (await src.query(`select * from public.${P}${table} order by 1`)).rows;
  if (srcRows.length === 0) { console.log(`  ${table}: 0 linhas (pulado)`); return 0; }
  if (DRY) { console.log(`  ${table}: ${srcRows.length} linhas (dry-run, nada escrito)`); return 0; }

  const kinds = await columnKinds(dst, table);
  const cols = Object.keys(srcRows[0]).filter(c => kinds[c]); // so colunas que existem no destino
  const nullify = table === 'setores' ? ['supervisor_id', 'encarregado_id'] : [];

  let n = 0;
  await dst.query('begin');
  try {
    for (const row of srcRows) {
      for (const c of nullify) row[c] = null;
      const { sql, vals } = buildInsert(table, cols, kinds, row);
      const res = await dst.query(sql, vals);
      n += res.rowCount || 0;
    }
    await dst.query('commit');
  } catch (e) { await dst.query('rollback'); throw e; }
  console.log(`  ${table}: ${srcRows.length} lidas, ${n} inseridas/atualizadas`);
  return n;
}

async function fixSetores(src, dst) {
  if (DRY) { console.log('  @fix_setores: (dry-run)'); return; }
  const srcRows = (await src.query(
    `select id, supervisor_id, encarregado_id from public.${P}setores
     where supervisor_id is not null or encarregado_id is not null`)).rows;
  let n = 0;
  await dst.query('begin');
  try {
    for (const r of srcRows) {
      const res = await dst.query(
        `update public.${P}setores set supervisor_id=$1, encarregado_id=$2 where id=$3`,
        [r.supervisor_id, r.encarregado_id, r.id]);
      n += res.rowCount || 0;
    }
    await dst.query('commit');
  } catch (e) { await dst.query('rollback'); throw e; }
  console.log(`  @fix_setores: ${n} setores atualizados (supervisor/encarregado)`);
}

function shouldMigrate(table) {
  if (ONLY.length) return ONLY.includes(table);
  if (SEED_TABLES.has(table) && !INCLUDE_SEED) return false;
  if (SENSITIVE_TABLES.has(table) && SKIP_SENSITIVE) return false;
  return true;
}

(async () => {
  const SRC = requireEnv('SRC_DATABASE_URL');
  const DST = requireEnv('DST_DATABASE_URL');
  const src = new Client({ connectionString: SRC, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 20000 });
  const dst = new Client({ connectionString: DST, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 20000 });
  await src.connect(); await dst.connect();
  console.log(`\nMigracao de dados V2  ${DRY ? '(DRY-RUN)' : ''}`);
  console.log(`on-conflict: ${ON_CONFLICT}${INCLUDE_SEED ? ' | incluindo seed' : ''}${SKIP_SENSITIVE ? ' | SEM sensiveis' : ''}${ONLY.length ? ' | only=' + ONLY.join(',') : ''}\n`);

  let total = 0;
  for (const step of ORDER) {
    if (step === '@fix_setores') {
      if (!ONLY.length || ONLY.includes('setores') || ONLY.includes('funcionarios')) await fixSetores(src, dst);
      continue;
    }
    if (!shouldMigrate(step)) { console.log(`  ${step}: pulado (${SEED_TABLES.has(step) ? 'seed' : SENSITIVE_TABLES.has(step) ? 'sensivel' : 'filtro'})`); continue; }
    try { total += await copyTable(src, dst, step); }
    catch (e) { console.error(`  ${step}: ERRO -> ${e.message}`); await src.end(); await dst.end(); process.exit(1); }
  }

  console.log(`\nConcluido. ${DRY ? '(dry-run)' : total + ' linhas inseridas/atualizadas.'}`);
  await src.end(); await dst.end();
})().catch(e => { console.error('FALHA:', e.message); process.exit(1); });
