import {
  FolderTree, Shirt, Ruler, Package, Warehouse, Truck,
  Layers, CheckCircle2, AlertCircle, XCircle, Building2, Boxes, Coins, PhoneOff, Tag,
} from 'lucide-react';
import { formatCurrencyBRL, formatNumberBR } from '@/lib/formatters';
import { formatDateBR } from '@/lib/dateTime';
import {
  GENERO_OPTS, TIPO_TAM_OPTS, tipoTamLabel, generoLabel, norm,
  type MasterKey, type TabConfig, type MasterCtx, type FormOpcoes, type Row,
} from './masterShared';
import type { CategoriaRow, TamanhoRow, UnidadeRow, VarianteRow } from '../../types/db.types';
import type { ModeloRow, FornecedorRow } from '../../services/cadastrosApi';
import { Cell2 } from './MasterDataCell';

const s = (v: unknown) => String(v ?? '');
const dash = (v: unknown) => { const t = s(v).trim(); return t === '' ? '—' : t; };
const temContato = (f: FornecedorRow) => Boolean((f.email || f.telefone || f.contato || '').trim());

const chips = (arr: string[], max = 8) => (
  arr.length === 0 ? <span className="text-sm text-muted-foreground">—</span> : (
    <div className="flex flex-wrap gap-1.5">
      {arr.slice(0, max).map((t, i) => <span key={i} className="rounded-md bg-muted/70 px-2 py-0.5 text-xs text-foreground">{t}</span>)}
      {arr.length > max && <span className="text-xs text-muted-foreground">+{arr.length - max}</span>}
    </div>
  )
);

/** Constrói a configuração completa de todas as abas a partir do contexto derivado. */
export function buildConfigs(ctx: MasterCtx, opcoes: FormOpcoes): Record<MasterKey, TabConfig> {
  const semCategoriaAtiva = opcoes.categorias.length === 0;
  const semModeloOuTamanho = opcoes.modelos.length === 0 || opcoes.tamanhos.length === 0;
  const semEmpresa = opcoes.empresas.length === 0;

  return {
    // ── CATEGORIAS ───────────────────────────────────────────────────────
    categorias: {
      key: 'categorias', singular: 'categoria', novoLabel: 'Nova categoria', icon: FolderTree, formLayout: 'compact',
      rows: ctx.categorias as unknown as Row[],
      columns: [
        { header: 'Nome', cell: (r) => <Cell2 main={s((r as unknown as CategoriaRow).nome)} /> },
        { header: 'Modelos', cell: (r) => formatNumberBR(ctx.modelosDaCategoria(s((r as unknown as CategoriaRow).id)).length) },
        { header: 'Variantes ativas', cell: (r) => formatNumberBR(ctx.variantesAtivasDaCategoria(s((r as unknown as CategoriaRow).id))) },
        { header: 'Atualizado', cell: (r) => <span className="text-muted-foreground">{formatDateBR((r as unknown as CategoriaRow).updated_at)}</span> },
      ],
      fields: [{ name: 'nome', label: 'Nome', type: 'text', required: true, placeholder: 'Ex.: Uniforme 2026' }],
      indicators: [
        { key: 'total', label: 'Categorias', value: ctx.categorias.length, icon: FolderTree, tone: 'default', hint: 'Total cadastrado (ativas + inativas).' },
        { key: 'ativas', label: 'Ativas', value: ctx.categorias.filter((c) => c.ativo).length, icon: CheckCircle2, tone: 'success', hint: 'Disponíveis para novos vínculos.' },
        { key: 'semmod', label: 'Sem modelos', value: ctx.categorias.filter((c) => ctx.modelosDaCategoria(c.id).length === 0).length, icon: AlertCircle, tone: 'warning', hint: 'Categorias sem nenhum modelo cadastrado.' },
        { key: 'comvar', label: 'Com variantes ativas', value: ctx.categorias.filter((c) => ctx.variantesAtivasDaCategoria(c.id) > 0).length, icon: Package, tone: 'info', hint: 'Categorias com ao menos uma variante ativa.' },
      ],
      searchText: (r) => norm(s((r as unknown as CategoriaRow).nome)),
      pendencias: (r) => {
        const c = r as unknown as CategoriaRow; const out = [];
        if (ctx.modelosDaCategoria(c.id).length === 0) out.push({ label: 'Sem modelos', tone: 'warning' as const, hint: 'Cadastre um modelo para esta categoria.' });
        if (!c.ativo && ctx.variantesAtivasDaCategoria(c.id) > 0) out.push({ label: 'Inativa com variantes ativas', tone: 'danger' as const, hint: 'Há variantes ativas sob uma categoria inativa.' });
        return out;
      },
      detail: (r) => {
        const c = r as unknown as CategoriaRow; const mods = ctx.modelosDaCategoria(c.id);
        return {
          sections: [
            { title: 'Dados', fields: [{ label: 'Nome', value: c.nome }] },
            { title: 'Modelos vinculados', node: chips(mods.map((m) => m.nome)) },
          ],
          dependencies: [
            { label: 'Modelos', count: mods.length },
            { label: 'Variantes ativas', count: ctx.variantesAtivasDaCategoria(c.id) },
          ],
        };
      },
      emptyTitle: 'Nenhuma categoria cadastrada',
      emptyDescription: 'As categorias organizam os modelos e variantes do estoque. Cadastre a primeira para começar.',
    },

    // ── MODELOS ──────────────────────────────────────────────────────────
    modelos: {
      key: 'modelos', singular: 'modelo', novoLabel: 'Novo modelo', icon: Shirt, formLayout: 'wide',
      rows: ctx.modelos as unknown as Row[],
      columns: [
        { header: 'Nome', cell: (r) => <Cell2 main={s((r as unknown as ModeloRow).nome)} sub={s((r as unknown as ModeloRow).descricao) || undefined} /> },
        { header: 'Categoria', cell: (r) => ctx.categoriaNome((r as unknown as ModeloRow).categoria_id) },
        { header: 'Variantes', cell: (r) => formatNumberBR(ctx.variantesDoModelo(s((r as unknown as ModeloRow).id)).length) },
        { header: 'Tamanhos', cell: (r) => chips(ctx.tamanhosDoModelo(s((r as unknown as ModeloRow).id)), 6) },
        { header: 'Atualizado', cell: (r) => <span className="text-muted-foreground">{formatDateBR((r as unknown as ModeloRow).updated_at)}</span> },
      ],
      fields: [
        { name: 'nome', label: 'Nome', type: 'text', required: true, section: 'Identificação', placeholder: 'Ex.: Polo Verde' },
        { name: 'categoria_id', label: 'Categoria', type: 'select', required: true, options: opcoes.categorias, section: 'Identificação', hint: 'Apenas categorias ativas.' },
        { name: 'descricao', label: 'Descrição', type: 'textarea', optional: true, section: 'Detalhes', full: true },
      ],
      indicators: [
        { key: 'total', label: 'Modelos', value: ctx.modelos.length, icon: Shirt, tone: 'default', hint: 'Total cadastrado.' },
        { key: 'ativos', label: 'Ativos', value: ctx.modelos.filter((m) => m.ativo).length, icon: CheckCircle2, tone: 'success', hint: 'Disponíveis para novas variantes.' },
        { key: 'semvar', label: 'Sem variantes', value: ctx.modelos.filter((m) => ctx.variantesDoModelo(m.id).length === 0).length, icon: AlertCircle, tone: 'warning', hint: 'Modelos sem nenhuma variante (SKU).' },
        { key: 'cats', label: 'Categorias usadas', value: new Set(ctx.modelos.map((m) => m.categoria_id)).size, icon: FolderTree, tone: 'info', hint: 'Categorias distintas referenciadas por modelos.' },
      ],
      searchText: (r) => norm([s((r as unknown as ModeloRow).nome), ctx.categoriaNome((r as unknown as ModeloRow).categoria_id), s((r as unknown as ModeloRow).descricao)].join(' ')),
      pendencias: (r) => {
        const m = r as unknown as ModeloRow; const out = [];
        const cat = ctx.categorias.find((c) => c.id === m.categoria_id);
        if (cat && !cat.ativo) out.push({ label: 'Categoria inativa', tone: 'danger' as const, hint: 'A categoria deste modelo está inativa.' });
        if (ctx.variantesDoModelo(m.id).length === 0) out.push({ label: 'Sem variantes', tone: 'warning' as const, hint: 'Cadastre uma variante para este modelo.' });
        return out;
      },
      detail: (r) => {
        const m = r as unknown as ModeloRow; const vars = ctx.variantesDoModelo(m.id);
        return {
          sections: [
            { title: 'Dados', fields: [{ label: 'Nome', value: m.nome }, { label: 'Categoria', value: ctx.categoriaNome(m.categoria_id) }, { label: 'Descrição', value: dash(m.descricao), full: true }] },
            { title: 'Tamanhos disponíveis', node: chips(ctx.tamanhosDoModelo(m.id)) },
            { title: 'Variantes', node: chips(vars.map((v) => `${v.nome} · ${v.codigo_interno}`)) },
          ],
          dependencies: [
            { label: 'Variantes', count: vars.length },
            { label: 'Tamanhos', count: ctx.tamanhosDoModelo(m.id).length },
          ],
        };
      },
      emptyTitle: 'Nenhum modelo cadastrado',
      emptyDescription: semCategoriaAtiva ? 'Antes de criar um modelo, é necessário possuir uma categoria ativa.' : 'Modelos agrupam variantes de um mesmo produto (ex.: Polo Verde). Cadastre o primeiro.',
      criarBloqueado: semCategoriaAtiva ? 'Cadastre uma categoria ativa antes de criar modelos.' : undefined,
    },

    // ── TAMANHOS ─────────────────────────────────────────────────────────
    tamanhos: {
      key: 'tamanhos', singular: 'tamanho', novoLabel: 'Novo tamanho', icon: Ruler, formLayout: 'compact',
      rows: ctx.tamanhos as unknown as Row[],
      columns: [
        { header: 'Rótulo', cell: (r) => <Cell2 main={s((r as unknown as TamanhoRow).rotulo)} /> },
        { header: 'Tipo', cell: (r) => tipoTamLabel((r as unknown as TamanhoRow).tipo) },
        { header: 'Ordem', cell: (r) => formatNumberBR((r as unknown as TamanhoRow).ordem ?? 0) },
        { header: 'Variantes', cell: (r) => formatNumberBR(ctx.variantesDoTamanho(s((r as unknown as TamanhoRow).id))) },
      ],
      fields: [
        { name: 'rotulo', label: 'Rótulo', type: 'text', required: true, placeholder: 'P, M, G, 40...' },
        { name: 'tipo', label: 'Tipo', type: 'select', required: true, options: TIPO_TAM_OPTS, hint: 'Roupa e Calçado podem repetir o mesmo rótulo (ex.: 40).' },
      ],
      indicators: [
        { key: 'total', label: 'Tamanhos', value: ctx.tamanhos.length, icon: Ruler, tone: 'default', hint: 'Total cadastrado.' },
        { key: 'roupa', label: 'Roupas', value: ctx.tamanhos.filter((t) => t.tipo === 'ROUPA').length, icon: Shirt, tone: 'info', hint: 'Tamanhos do tipo Roupa.' },
        { key: 'calcado', label: 'Calçados', value: ctx.tamanhos.filter((t) => t.tipo === 'CALCADO').length, icon: Layers, tone: 'info', hint: 'Tamanhos do tipo Calçado.' },
        { key: 'inativos', label: 'Inativos', value: ctx.tamanhos.filter((t) => !t.ativo).length, icon: XCircle, tone: 'neutral', hint: 'Tamanhos inativos.' },
      ],
      searchText: (r) => norm([s((r as unknown as TamanhoRow).rotulo), tipoTamLabel((r as unknown as TamanhoRow).tipo)].join(' ')),
      pendencias: (r) => {
        const t = r as unknown as TamanhoRow; const out = [];
        if (ctx.variantesDoTamanho(t.id) === 0) out.push({ label: 'Sem variantes', tone: 'warning' as const, hint: 'Nenhuma variante usa este tamanho.' });
        return out;
      },
      detail: (r) => {
        const t = r as unknown as TamanhoRow;
        return {
          sections: [{ title: 'Dados', fields: [{ label: 'Rótulo', value: t.rotulo }, { label: 'Tipo', value: tipoTamLabel(t.tipo) }, { label: 'Ordem', value: formatNumberBR(t.ordem ?? 0) }] }],
          dependencies: [{ label: 'Variantes', count: ctx.variantesDoTamanho(t.id) }],
        };
      },
      emptyTitle: 'Nenhum tamanho cadastrado',
      emptyDescription: 'Os tamanhos (Roupa/Calçado) são usados nas variantes. Cadastre o primeiro.',
    },

    // ── VARIANTES ────────────────────────────────────────────────────────
    variantes: {
      key: 'variantes', singular: 'variante', novoLabel: 'Nova variante', icon: Package, formLayout: 'wide', prefix: 'VAR',
      rows: ctx.variantes as unknown as Row[],
      columns: [
        { header: 'Item', cell: (r) => { const v = r as unknown as VarianteRow; return <Cell2 main={v.nome} sub={[v.modelo?.categoria?.nome, v.modelo?.nome, v.tamanho?.rotulo].filter(Boolean).join(' · ') || undefined} />; } },
        { header: 'Código', cell: (r) => <Cell2 main={s((r as unknown as VarianteRow).codigo_interno)} sub={s((r as unknown as VarianteRow).codigo_barras) || undefined} mono /> },
        { header: 'Custo', align: 'right', cell: (r) => formatCurrencyBRL((r as unknown as VarianteRow).custo_unitario) },
        { header: 'Mínimo', align: 'right', cell: (r) => formatNumberBR((r as unknown as VarianteRow).estoque_minimo_padrao ?? 0) },
        {
          header: 'Saldo', align: 'right', cell: (r) => {
            const v = r as unknown as VarianteRow; const tot = ctx.saldoVariante(v.id); const al = ctx.alertaVariante(v.id) && v.ativo;
            return <span className={al ? 'font-semibold text-status-warning' : 'font-medium text-foreground'}>{formatNumberBR(tot)}</span>;
          },
        },
      ],
      fields: [
        { name: 'codigo_interno', label: 'Código interno', type: 'text', required: true, section: 'Identificação', hint: 'Sugerido automaticamente — você pode editar.' },
        { name: 'codigo_barras', label: 'Código de barras', type: 'text', optional: true, section: 'Identificação' },
        { name: 'nome', label: 'Nome do item', type: 'text', required: true, section: 'Identificação', full: true, placeholder: 'Ex.: Farda ADM' },
        { name: 'modelo_id', label: 'Modelo', type: 'select', required: true, options: opcoes.modelos, section: 'Classificação' },
        { name: 'tamanho_id', label: 'Tamanho', type: 'select', required: true, options: opcoes.tamanhos, section: 'Classificação' },
        { name: 'genero', label: 'Gênero', type: 'select', options: GENERO_OPTS, section: 'Classificação' },
        { name: 'fornecedor_id', label: 'Fornecedor', type: 'select', optional: true, options: opcoes.fornecedores, section: 'Classificação' },
        { name: 'custo_unitario', label: 'Custo unitário (R$)', type: 'number', section: 'Estoque e custo' },
        { name: 'estoque_minimo_padrao', label: 'Estoque mínimo padrão', type: 'number', section: 'Estoque e custo' },
        { name: 'cor', label: 'Cor', type: 'text', optional: true, section: 'Atributos' },
        { name: 'material', label: 'Material', type: 'text', optional: true, section: 'Atributos' },
        { name: 'marca', label: 'Marca', type: 'text', optional: true, section: 'Atributos' },
        { name: 'localizacao', label: 'Localização física', type: 'text', optional: true, section: 'Atributos' },
        { name: 'descricao', label: 'Descrição', type: 'textarea', optional: true, section: 'Atributos', full: true },
      ],
      indicators: [
        { key: 'total', label: 'Variantes', value: ctx.variantes.length, icon: Package, tone: 'default', hint: 'Total cadastrado (ativas + inativas).' },
        { key: 'ativas', label: 'Ativas', value: ctx.variantes.filter((v) => v.ativo).length, icon: CheckCircle2, tone: 'success', hint: 'Disponíveis para operações.' },
        { key: 'semsaldo', label: 'Sem saldo', value: ctx.variantes.filter((v) => v.ativo && ctx.saldoVariante(v.id) <= 0).length, icon: Boxes, tone: 'warning', hint: 'Variantes ativas sem estoque em nenhum local.' },
        { key: 'semcusto', label: 'Sem custo', value: ctx.variantes.filter((v) => v.ativo && (v.custo_unitario ?? 0) <= 0).length, icon: Coins, tone: 'warning', hint: 'Variantes ativas com custo unitário zerado.' },
        { key: 'semmin', label: 'Sem mínimo', value: ctx.variantes.filter((v) => v.ativo && (v.estoque_minimo_padrao ?? 0) <= 0).length, icon: AlertCircle, tone: 'warning', hint: 'Variantes ativas sem estoque mínimo padrão.' },
      ],
      searchText: (r) => { const v = r as unknown as VarianteRow; return norm([v.nome, v.codigo_interno, v.codigo_barras, v.modelo?.nome, v.modelo?.categoria?.nome, v.tamanho?.rotulo].filter(Boolean).join(' ')); },
      pendencias: (r) => {
        const v = r as unknown as VarianteRow; const out = [];
        if (v.ativo && ctx.saldoVariante(v.id) <= 0) out.push({ label: 'Sem saldo', tone: 'warning' as const, hint: 'Sem estoque em nenhum local.' });
        if ((v.custo_unitario ?? 0) <= 0) out.push({ label: 'Sem custo', tone: 'warning' as const, hint: 'Custo unitário zerado.' });
        if ((v.estoque_minimo_padrao ?? 0) <= 0) out.push({ label: 'Sem mínimo', tone: 'warning' as const, hint: 'Estoque mínimo padrão não definido.' });
        if (!v.ativo && ctx.saldoVariante(v.id) > 0) out.push({ label: 'Inativa com saldo', tone: 'danger' as const, hint: 'Item inativo ainda possui saldo em estoque.' });
        return out;
      },
      detail: (r) => {
        const v = r as unknown as VarianteRow; const det = ctx.saldoDetalheVariante(v.id);
        return {
          sections: [
            { title: 'Identificação', fields: [{ label: 'Código interno', value: v.codigo_interno }, { label: 'Código de barras', value: dash(v.codigo_barras) }, { label: 'Nome', value: v.nome, full: true }] },
            { title: 'Classificação', fields: [{ label: 'Categoria', value: v.modelo?.categoria?.nome ?? '—' }, { label: 'Modelo', value: ctx.modeloNome(v.modelo_id) }, { label: 'Tamanho', value: ctx.tamanhoLabel(v.tamanho_id) }, { label: 'Gênero', value: generoLabel(v.genero) }, { label: 'Fornecedor', value: ctx.fornecedorNome(v.fornecedor_id) }] },
            { title: 'Estoque e custo', fields: [{ label: 'Custo unitário', value: formatCurrencyBRL(v.custo_unitario) }, { label: 'Mínimo padrão', value: formatNumberBR(v.estoque_minimo_padrao ?? 0) }, { label: 'Saldo total', value: formatNumberBR(ctx.saldoVariante(v.id)) }] },
            {
              title: 'Saldo por local', node: det.length === 0 ? <span className="text-sm text-muted-foreground">Sem saldo registrado.</span> : (
                <ul className="space-y-1.5">{det.map((d) => (
                  <li key={d.unidadeId} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate text-foreground">{d.unidadeNome}</span>
                    <span className={`shrink-0 tabular-nums ${d.alerta ? 'font-semibold text-status-warning' : 'text-foreground'}`}>{formatNumberBR(d.quantidade)}{d.minimo > 0 ? ` / min ${formatNumberBR(d.minimo)}` : ''}</span>
                  </li>))}
                </ul>
              ),
            },
          ],
          dependencies: [
            { label: 'Locais com saldo', count: det.filter((d) => d.quantidade > 0).length, to: '/controle-estoque/fardamentos' },
            { label: 'Saldo total', count: ctx.saldoVariante(v.id) },
          ],
        };
      },
      emptyTitle: 'Nenhuma variante cadastrada',
      emptyDescription: semModeloOuTamanho ? 'Antes de criar uma variante, é necessário possuir um modelo e um tamanho ativos.' : 'A variante é o item real de estoque (modelo + tamanho). Cadastre a primeira.',
      criarBloqueado: semModeloOuTamanho ? 'Cadastre um modelo e um tamanho ativos antes de criar variantes.' : undefined,
    },

    // ── LOCAIS DE ESTOQUE (unidades) ──────────────────────────────────────
    unidades: {
      key: 'unidades', singular: 'local de estoque', novoLabel: 'Novo local de estoque', icon: Warehouse, formLayout: 'wide', prefix: 'UN',
      rows: ctx.unidades as unknown as Row[],
      columns: [
        { header: 'Código', cell: (r) => <Cell2 main={s((r as unknown as UnidadeRow).codigo)} mono /> },
        { header: 'Nome', cell: (r) => <Cell2 main={s((r as unknown as UnidadeRow).nome)} sub={s((r as unknown as UnidadeRow).descricao) || undefined} /> },
        { header: 'Empresa', cell: (r) => ctx.empresaNome((r as unknown as UnidadeRow).empresa_id) },
        { header: 'Setor', cell: (r) => ctx.setorNome((r as unknown as UnidadeRow).setor_id) },
        {
          header: 'Estoque', cell: (r) => { const a = ctx.unidadeAgg(s((r as unknown as UnidadeRow).id)); return <span className="text-sm text-muted-foreground">{formatNumberBR(a.pecas)} pç · {formatNumberBR(a.itens)} itens{a.alertas > 0 ? ` · ${a.alertas} alerta(s)` : ''}</span>; },
        },
      ],
      fields: [
        { name: 'codigo', label: 'Código', type: 'text', required: true, readOnly: true, section: 'Identificação', hint: 'Gerado automaticamente.' },
        { name: 'nome', label: 'Nome', type: 'text', required: true, section: 'Identificação', full: true, placeholder: 'Ex.: Almoxarifado Central' },
        { name: 'empresa_id', label: 'Empresa', type: 'select', required: true, options: opcoes.empresas, section: 'Vínculo' },
        { name: 'setor_id', label: 'Setor', type: 'select', optional: true, options: opcoes.setores, section: 'Vínculo' },
        { name: 'descricao', label: 'Descrição', type: 'textarea', optional: true, section: 'Detalhes', full: true },
      ],
      indicators: [
        { key: 'total', label: 'Locais', value: ctx.unidades.length, icon: Warehouse, tone: 'default', hint: 'Total cadastrado.' },
        { key: 'ativos', label: 'Ativos', value: ctx.unidades.filter((u) => u.ativo).length, icon: CheckCircle2, tone: 'success', hint: 'Locais disponíveis para operações.' },
        { key: 'empresas', label: 'Empresas atendidas', value: new Set(ctx.unidades.map((u) => u.empresa_id)).size, icon: Building2, tone: 'info', hint: 'Empresas distintas com ao menos um local.' },
        { key: 'comsaldo', label: 'Locais com saldo', value: ctx.unidades.filter((u) => ctx.unidadeAgg(u.id).pecas > 0).length, icon: Boxes, tone: 'info', hint: 'Locais com peças em estoque.' },
      ],
      searchText: (r) => { const u = r as unknown as UnidadeRow; return norm([u.codigo, u.nome, ctx.empresaNome(u.empresa_id), ctx.setorNome(u.setor_id)].join(' ')); },
      pendencias: (r) => {
        const u = r as unknown as UnidadeRow; const out = [];
        if (!u.setor_id) out.push({ label: 'Sem setor', tone: 'warning' as const, hint: 'Local sem setor vinculado.' });
        if (!u.ativo && ctx.unidadeAgg(u.id).pecas > 0) out.push({ label: 'Inativo com saldo', tone: 'danger' as const, hint: 'Local inativo ainda possui saldo.' });
        return out;
      },
      detail: (r) => {
        const u = r as unknown as UnidadeRow; const a = ctx.unidadeAgg(u.id); const itens = ctx.variantesDaUnidade(u.id);
        return {
          sections: [
            { title: 'Dados', fields: [{ label: 'Código', value: u.codigo }, { label: 'Nome', value: u.nome }, { label: 'Empresa', value: ctx.empresaNome(u.empresa_id) }, { label: 'Setor', value: ctx.setorNome(u.setor_id) }, { label: 'Descrição', value: dash(u.descricao), full: true }] },
            { title: 'Estoque', fields: [{ label: 'Itens', value: formatNumberBR(a.itens) }, { label: 'Peças', value: formatNumberBR(a.pecas) }, { label: 'Valor estimado', value: formatCurrencyBRL(a.valor) }, { label: 'Alertas', value: formatNumberBR(a.alertas) }] },
            {
              title: 'Itens armazenados', node: itens.length === 0 ? <span className="text-sm text-muted-foreground">Nenhum item com saldo.</span> : (
                <ul className="space-y-1.5">{itens.slice(0, 40).map((it) => (
                  <li key={it.varianteId} className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate text-foreground">{it.nome} <span className="font-mono text-xs text-muted-foreground">{it.codigo}</span></span>
                    <span className={`shrink-0 tabular-nums ${it.alerta ? 'font-semibold text-status-warning' : 'text-foreground'}`}>{formatNumberBR(it.quantidade)}</span>
                  </li>))}
                </ul>
              ),
            },
          ],
          dependencies: [
            { label: 'Itens armazenados', count: a.itens, to: '/controle-estoque/movimentacoes' },
            { label: 'Peças', count: a.pecas },
          ],
        };
      },
      emptyTitle: 'Nenhum local de estoque cadastrado',
      emptyDescription: semEmpresa ? 'Antes de criar um local, é necessário possuir uma empresa ativa.' : 'Os locais de estoque (depósitos/almoxarifados) guardam o saldo por empresa. Cadastre o primeiro.',
      criarBloqueado: semEmpresa ? 'Cadastre uma empresa ativa antes de criar locais de estoque.' : undefined,
    },

    // ── FORNECEDORES ─────────────────────────────────────────────────────
    fornecedores: {
      key: 'fornecedores', singular: 'fornecedor', novoLabel: 'Novo fornecedor', icon: Truck, formLayout: 'wide',
      rows: ctx.fornecedores as unknown as Row[],
      columns: [
        { header: 'Fornecedor', cell: (r) => { const f = r as unknown as FornecedorRow; return <Cell2 main={f.nome_fantasia || f.razao_social} sub={f.nome_fantasia ? f.razao_social : undefined} />; } },
        { header: 'CNPJ', cell: (r) => dash((r as unknown as FornecedorRow).cnpj) },
        { header: 'Contato', cell: (r) => { const f = r as unknown as FornecedorRow; return <Cell2 main={dash(f.contato || f.email)} sub={f.telefone || undefined} />; } },
        { header: 'Itens', align: 'right', cell: (r) => formatNumberBR(ctx.variantesDoFornecedor(s((r as unknown as FornecedorRow).id)).total) },
      ],
      fields: [
        { name: 'razao_social', label: 'Razão social', type: 'text', required: true, section: 'Identificação', full: true },
        { name: 'nome_fantasia', label: 'Nome fantasia', type: 'text', optional: true, section: 'Identificação' },
        { name: 'cnpj', label: 'CNPJ', type: 'text', optional: true, section: 'Identificação', placeholder: '00.000.000/0000-00' },
        { name: 'contato', label: 'Pessoa de contato', type: 'text', optional: true, section: 'Contato' },
        { name: 'email', label: 'E-mail', type: 'text', optional: true, section: 'Contato' },
        { name: 'telefone', label: 'Telefone', type: 'text', optional: true, section: 'Contato' },
        { name: 'categorias', label: 'Categorias fornecidas', type: 'text', optional: true, section: 'Fornecimento', hint: 'Texto livre (ex.: uniformes, EPI).' },
        { name: 'prazo_entrega_dias', label: 'Prazo de entrega (dias)', type: 'number', section: 'Fornecimento' },
        { name: 'endereco', label: 'Endereço', type: 'textarea', optional: true, section: 'Outros', full: true },
        { name: 'observacoes', label: 'Observações', type: 'textarea', optional: true, section: 'Outros', full: true },
      ],
      indicators: [
        { key: 'total', label: 'Fornecedores', value: ctx.fornecedores.length, icon: Truck, tone: 'default', hint: 'Total cadastrado.' },
        { key: 'ativos', label: 'Ativos', value: ctx.fornecedores.filter((f) => f.ativo).length, icon: CheckCircle2, tone: 'success', hint: 'Disponíveis para vincular a variantes/entradas.' },
        { key: 'comitens', label: 'Com itens vinculados', value: ctx.fornecedores.filter((f) => ctx.variantesDoFornecedor(f.id).total > 0).length, icon: Tag, tone: 'info', hint: 'Fornecedores referenciados por variantes.' },
        { key: 'semcontato', label: 'Sem contato', value: ctx.fornecedores.filter((f) => !temContato(f)).length, icon: PhoneOff, tone: 'warning', hint: 'Sem e-mail, telefone ou pessoa de contato.' },
      ],
      searchText: (r) => { const f = r as unknown as FornecedorRow; return norm([f.razao_social, f.nome_fantasia, f.cnpj, f.contato, f.email].filter(Boolean).join(' ')); },
      pendencias: (r) => {
        const f = r as unknown as FornecedorRow; const out = [];
        if (!temContato(f)) out.push({ label: 'Sem contato', tone: 'warning' as const, hint: 'Cadastre e-mail, telefone ou pessoa de contato.' });
        if (!f.ativo && ctx.variantesDoFornecedor(f.id).ativas > 0) out.push({ label: 'Inativo com itens ativos', tone: 'warning' as const, hint: 'Há variantes ativas vinculadas a este fornecedor inativo.' });
        return out;
      },
      detail: (r) => {
        const f = r as unknown as FornecedorRow; const vinc = ctx.variantesDoFornecedor(f.id);
        return {
          sections: [
            { title: 'Identificação', fields: [{ label: 'Razão social', value: f.razao_social, full: true }, { label: 'Nome fantasia', value: dash(f.nome_fantasia) }, { label: 'CNPJ', value: dash(f.cnpj) }] },
            { title: 'Contato', fields: [{ label: 'Pessoa de contato', value: dash(f.contato) }, { label: 'E-mail', value: dash(f.email) }, { label: 'Telefone', value: dash(f.telefone) }, { label: 'Endereço', value: dash(f.endereco), full: true }] },
            { title: 'Fornecimento', fields: [{ label: 'Categorias fornecidas', value: dash(f.categorias) }, { label: 'Prazo de entrega', value: f.prazo_entrega_dias != null ? `${formatNumberBR(f.prazo_entrega_dias)} dia(s)` : '—' }, { label: 'Observações', value: dash(f.observacoes), full: true }] },
            { title: 'Itens fornecidos', fields: [{ label: 'Variantes vinculadas', value: formatNumberBR(vinc.total) }, { label: 'Variantes ativas', value: formatNumberBR(vinc.ativas) }] },
          ],
          dependencies: [{ label: 'Itens vinculados', count: vinc.total }],
        };
      },
      emptyTitle: 'Nenhum fornecedor cadastrado',
      emptyDescription: 'Cadastre fornecedores para associá-los às variantes e às entradas de estoque.',
    },
  };
}
