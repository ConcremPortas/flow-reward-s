import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, PackagePlus, ClipboardCheck, MoreVertical, SlidersHorizontal, Download, RefreshCw, Settings, AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/app/PageHeader';
import { Button } from '@/components/ui/button';
import { SectionCard } from '@/components/app/SectionCard';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDateTimeBR } from '@/lib/dateTime';
import { useInventoryDashboard } from '../hooks/useInventoryDashboard';
import { InventoryGlobalFilters } from '../components/dashboard/InventoryGlobalFilters';
import { InventoryExecutiveStats } from '../components/dashboard/InventoryExecutiveStats';
import { InventoryHealthSummary } from '../components/dashboard/InventoryHealthSummary';
import { InventoryMovementTrend } from '../components/dashboard/InventoryMovementTrend';
import { InventoryByUnit, InventoryByCategory, InventoryItemRanking } from '../components/dashboard/InventoryRankings';
import { InventoryPriorityAlerts } from '../components/dashboard/InventoryPriorityAlerts';
import { InventoryRecentMovements } from '../components/dashboard/InventoryRecentMovements';
import { InventoryQuickActions, InventoryFinancialSummary, InventoryDataIssues } from '../components/dashboard/InventoryOpsBlocks';
import { FardamentoDetailsDrawer } from '../components/fardamentos/FardamentoDetailsDrawer';
import { PERIODO_LABEL } from '../components/dashboard/derive';
import { situacaoDaLinha, SITUACAO_LABEL } from '../components/fardamentos/situacao';
import type { FardamentoRow } from '../types/db.types';

export function VisaoGeralView() {
  const navigate = useNavigate();
  const { screen, filtros, setFiltro, limpar, data, atualizadoEm } = useInventoryDashboard();
  const [drawer, setDrawer] = useState<{ f: FardamentoRow; aba: string } | null>(null);
  const financeiroRef = useRef<HTMLDivElement>(null);

  const unidadeNome = useMemo(() => new Map(screen.unidades.map((u) => [u.id, u.nome])), [screen.unidades]);
  const varNome = useMemo(() => new Map(screen.fardamentos.map((f) => [f.variante.id, f.variante.nome])), [screen.fardamentos]);
  const fardPorVar = useMemo(() => new Map(screen.fardamentos.map((f) => [f.variante.id, f])), [screen.fardamentos]);

  const abrirItem = (varianteId: string, aba = 'resumo') => { const f = fardPorVar.get(varianteId); if (f) setDrawer({ f, aba }); };
  const verValor = () => financeiroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const exportarCsv = () => {
    const cab = ['Item', 'Código', 'Categoria', 'Tamanho', 'Saldo', 'Situação', 'Valor'];
    const linhas = data.linhas.map((l) => [
      l.f.variante.nome, l.f.variante.codigo_interno, l.f.categoriaNome ?? '', l.f.tamanhoRotulo ?? '',
      String(l.saldoTotal), SITUACAO_LABEL[situacaoDaLinha(l.f)], l.valor.toFixed(2).replace('.', ','),
    ]);
    const csv = [cab, ...linhas].map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'estoque-dashboard.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const acoes = (
    <div className="flex items-center gap-2">
      <Button variant="outline" className="gap-2" onClick={() => navigate('/controle-estoque/entradas')}><PackagePlus className="h-4 w-4" /><span className="hidden sm:inline">Registrar entrada</span></Button>
      <Button className="gap-2" onClick={() => navigate('/controle-estoque/entregas')}><ClipboardCheck className="h-4 w-4" /><span className="hidden sm:inline">Nova entrega</span></Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Mais ações"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => navigate('/controle-estoque/ajuste')}><SlidersHorizontal className="mr-2 h-4 w-4" /> Ajustar saldo</DropdownMenuItem>
          <DropdownMenuItem onClick={exportarCsv} disabled={data.linhas.length === 0}><Download className="mr-2 h-4 w-4" /> Exportar relatório</DropdownMenuItem>
          <DropdownMenuItem onClick={screen.refetch}><RefreshCw className="mr-2 h-4 w-4" /> Atualizar dados</DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/controle-estoque/cadastros')}><Settings className="mr-2 h-4 w-4" /> Acessar cadastros</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[1800px] space-y-5">
      <PageHeader icon={LayoutDashboard} title="Controle de Farda" description="Visão consolidada de saldos, movimentações e pontos de atenção." actions={acoes} />

      {/* Linha contextual */}
      <div className="-mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span>Período: <span className="font-medium text-foreground">{PERIODO_LABEL[filtros.periodo]}</span></span>
        <span>Local: <span className="font-medium text-foreground">{filtros.unidadeId ? (unidadeNome.get(filtros.unidadeId) ?? '—') : 'Todos'}</span></span>
        <span>{data.exec.itens} {data.exec.itens === 1 ? 'item analisado' : 'itens analisados'}</span>
        <span>Atualizado {formatDateTimeBR(atualizadoEm.toISOString())}</span>
      </div>

      {screen.error ? (
        <SectionCard title="Dashboard">
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="text-sm font-medium text-foreground">Não foi possível carregar os dados do estoque</p>
            <Button variant="outline" size="sm" onClick={screen.refetch}>Tentar novamente</Button>
          </div>
        </SectionCard>
      ) : (
        <>
          <InventoryGlobalFilters
            filtros={filtros} opcoes={{ categorias: screen.opcoes.categorias, unidades: screen.opcoes.unidades }}
            atualizadoEm={atualizadoEm} itens={data.exec.itens}
            onSetFiltro={setFiltro} onLimpar={limpar} onAtualizar={screen.refetch}
          />

          <InventoryExecutiveStats
            exec={data.exec} cobertura={data.financeiro.cobertura} loading={screen.loading} loadingMov={screen.loadingMov}
            onFiltrarAlerta={() => setFiltro('situacao', 'ATENCAO')} onFiltrarSemEstoque={() => setFiltro('situacao', 'SEM_ESTOQUE')} onVerValor={verValor}
          />

          <InventoryHealthSummary saude={data.saude} loading={screen.loading} onFiltrar={(s) => setFiltro('situacao', s)} />

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
            {/* Coluna principal */}
            <div className="space-y-5">
              <InventoryMovementTrend eventos={data.eventos} loading={screen.loadingMov} />
              <div className="grid gap-5 lg:grid-cols-2">
                <InventoryByUnit dados={data.porUnidade} loading={screen.loading} onFiltrar={(id) => setFiltro('unidadeId', id)} />
                <InventoryByCategory dados={data.porCategoria} loading={screen.loading} onFiltrar={(c) => setFiltro('categoria', c)} />
              </div>
              <InventoryItemRanking dados={data.ranking} loading={screen.loadingMov} onOpenItem={abrirItem} />
            </div>

            {/* Coluna lateral */}
            <div className="space-y-5">
              <InventoryPriorityAlerts alertas={data.alertas} loading={screen.loading} onOpenItem={abrirItem} />
              <InventoryRecentMovements recentes={data.recentes} unidadeNome={unidadeNome} varNome={varNome} loading={screen.loadingMov} />
              <InventoryQuickActions onExportar={exportarCsv} />
              <div ref={financeiroRef} className="scroll-mt-4"><InventoryFinancialSummary fin={data.financeiro} loading={screen.loading} /></div>
              <InventoryDataIssues pend={data.pendencias} />
            </div>
          </div>
        </>
      )}

      <FardamentoDetailsDrawer fardamento={drawer?.f ?? null} abaInicial={drawer?.aba} onOpenChange={(o) => { if (!o) setDrawer(null); }} />
    </div>
  );
}
