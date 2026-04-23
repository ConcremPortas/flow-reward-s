import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Download, Search } from 'lucide-react';
import { useBasePremiacao } from '@/hooks/useBasePremiacao';
import { useResultadosPremiacao } from '@/hooks/useResultadosPremiacao';
import { useCategorias } from '@/hooks/useCategorias';

const fmt = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const pct = (value: number | null | undefined) =>
  value != null ? `${(value * 100).toFixed(1)}%` : '—';

const formatCompetencia = (competencia: string) => {
  if (!competencia) return '';
  const [ano, mes] = competencia.split('-');
  return `${mes}/${ano}`;
};

const MESES: Record<string, string> = {
  '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril',
  '05': 'Maio', '06': 'Junho', '07': 'Julho', '08': 'Agosto',
  '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro',
};

// Célula de nota colorida: vermelho se < 1, verde se = 1
const NotaCell = ({ value }: { value: number | null | undefined }) => {
  if (value == null) return <TableCell className="text-center text-muted-foreground">—</TableCell>;
  const cor = value < 1 ? 'text-red-600 font-semibold' : value >= 1 ? 'text-green-700' : '';
  return <TableCell className={`text-center ${cor}`}>{pct(value)}</TableCell>;
};

const RelatorioPremiacao = () => {
  const [searchParams] = useSearchParams();
  const { bases } = useBasePremiacao();
  const { resultados } = useResultadosPremiacao();
  const { categorias } = useCategorias();

  const [baseId, setBaseId] = useState(searchParams.get('baseId') || '');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [competencia, setCompetencia] = useState(searchParams.get('competencia') || '');
  const [searchTerm, setSearchTerm] = useState('');

  const baseSelecionada = bases.find(b => b.id === baseId);

  const resultadosFiltrados = useMemo(() => {
    return resultados.filter(r => {
      const mesComp = competencia ? competencia + '-01' : null;
      if (mesComp && r.mes_competencia !== mesComp) return false;
      if (baseId && r.base_premiacao_id !== baseId) return false;
      if (categoriaFiltro && !r.categoria?.toUpperCase().includes(categoriaFiltro.toUpperCase())) return false;
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        return r.nome?.toLowerCase().includes(s) || r.cod_funcionario?.toLowerCase().includes(s) || r.setor?.toLowerCase().includes(s);
      }
      return true;
    });
  }, [resultados, baseId, categoriaFiltro, competencia, searchTerm]);

  // Detectar quais colunas de indicadores mostrar com base nos dados presentes
  const showProducao = resultadosFiltrados.some(r => r.nota_producao != null);
  const showSupervisorCols = resultadosFiltrados.some(r => r.nota_faturamento != null);
  // Faltas e Advertências ficam visíveis para todos (incluindo supervisor, pois fazem parte do cálculo)
  const showFaltas = true;
  const showAdvertencias = true;

  const totalBonusPossivel = resultadosFiltrados.reduce((acc, r) => acc + (r.bonus_possivel || 0), 0);
  const totalBonusAlcancado = resultadosFiltrados.reduce((acc, r) => acc + (r.bonus_alcancado || 0), 0);
  const totalValorFinal = resultadosFiltrados.reduce((acc, r) => acc + (r.valor_ajustado ?? r.bonus_alcancado ?? 0), 0);

  // ─── Exportar Excel ──────────────────────────────────────────────────────────
  const exportarExcel = () => {
    if (resultadosFiltrados.length === 0) return;
    const [, mes] = (competencia || '').split('-');
    const nomeMes = MESES[mes] || mes || 'MÊS';
    const rows = resultadosFiltrados.map(r => {
      const valorFinal = r.valor_ajustado ?? r.bonus_alcancado ?? 0;
      return {
        'COD': r.cod_funcionario || '',
        'FUNCIONÁRIO': r.nome,
        'SETOR': r.setor || '',
        'FUNÇÃO': r.funcao || '',
        'CATEGORIA BÔNUS': r.faixa || '',
        ...(showProducao ? { '% PRODUÇÃO SETOR': r.nota_producao != null ? `${(r.nota_producao * 100).toFixed(1)}%` : '' } : {}),
        'EPI': `${(r.nota_epi * 100).toFixed(1)}%`,
        ...(showFaltas ? { 'FALTAS': `${(r.nota_faltas * 100).toFixed(1)}%` } : {}),
        ...(showAdvertencias ? { 'ADVERTÊNCIAS': `${(r.nota_advertencias * 100).toFixed(1)}%` } : {}),
        'DSS': `${(r.nota_dss * 100).toFixed(1)}%`,
        ...(showSupervisorCols ? {
          'FATURAMENTO': r.nota_faturamento != null ? `${(r.nota_faturamento * 100).toFixed(1)}%` : '',
          'ITENS NC': r.nota_itens_nc != null ? `${(r.nota_itens_nc * 100).toFixed(1)}%` : '',
          'TRATAMENTO NC': r.nota_tratamento_nc != null ? `${(r.nota_tratamento_nc * 100).toFixed(1)}%` : '',
          'HORA MÁQUINA': r.nota_hora_maquina != null ? `${(r.nota_hora_maquina * 100).toFixed(1)}%` : '',
          'OPERAÇÃO SEGURA': r.nota_operacao_segura != null ? `${(r.nota_operacao_segura * 100).toFixed(1)}%` : '',
          'LIMPEZA': r.nota_limpeza != null ? `${(r.nota_limpeza * 100).toFixed(1)}%` : '',
        } : {}),
        'NOTA GERAL': `${(r.nota_geral * 100).toFixed(2)}%`,
        'BÔNUS POSSÍVEL': r.bonus_possivel || 0,
        'BÔNUS ALCANÇADO': r.bonus_alcancado || 0,
        [`BÔNUS ${nomeMes.toUpperCase()}`]: valorFinal,
        'DIFERENÇA': valorFinal - (r.bonus_possivel || 0),
      };
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Premiações');
    XLSX.writeFile(wb, `relatorio_premiacoes_${competencia || 'todos'}_${baseSelecionada?.nome || 'todas'}.xlsx`);
  };

  // ─── Exportar PDF ────────────────────────────────────────────────────────────
  const exportarPDF = () => {
    if (resultadosFiltrados.length === 0) return;
    const [ano, mes] = (competencia || '').split('-');
    const nomeMesFinal = MESES[mes] || mes || 'MÊS';
    const tituloRelatorio = `RELATÓRIO DE PREMIAÇÃO ${mes ? `${mes}/${ano}` : ''}`;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

    doc.setFillColor(0, 100, 0);
    doc.rect(0, 0, 297, 20, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(tituloRelatorio, 148.5, 13, { align: 'center' });

    // Montar headers dinamicamente
    const headers: string[] = ['COD', 'FUNCIONÁRIO', 'SETOR', 'FUNÇÃO', 'CATEGORIA BÔNUS'];
    if (showProducao) headers.push('PROD. SETOR');
    headers.push('EPI');
    if (showFaltas) headers.push('FALTAS');
    if (showAdvertencias) headers.push('ADV.');
    headers.push('DSS');
    if (showSupervisorCols) {
      headers.push('FATURAMENTO', 'ITENS NC', 'TRAT. NC', 'HORA MÁQ.', 'OP. SEGURA', 'LIMPEZA');
    }
    headers.push('NOTA GERAL', 'BÔN. POSSÍVEL', 'BÔN. ALCANÇADO', `BÔN. ${nomeMesFinal.toUpperCase().slice(0, 3)}.`, 'DIFERENÇA');

    const rows = resultadosFiltrados.map(r => {
      const valorFinal = r.valor_ajustado ?? r.bonus_alcancado ?? 0;
      const diferenca = valorFinal - (r.bonus_possivel || 0);
      const row: string[] = [
        r.cod_funcionario || '',
        r.nome || '',
        r.setor || '',
        r.funcao || '',
        r.faixa || '',
      ];
      if (showProducao) row.push(r.nota_producao != null ? pct(r.nota_producao) : '—');
      row.push(pct(r.nota_epi));
      if (showFaltas) row.push(pct(r.nota_faltas));
      if (showAdvertencias) row.push(pct(r.nota_advertencias));
      row.push(pct(r.nota_dss));
      if (showSupervisorCols) {
        row.push(
          r.nota_faturamento != null ? pct(r.nota_faturamento) : '—',
          r.nota_itens_nc != null ? pct(r.nota_itens_nc) : '—',
          r.nota_tratamento_nc != null ? pct(r.nota_tratamento_nc) : '—',
          r.nota_hora_maquina != null ? pct(r.nota_hora_maquina) : '—',
          r.nota_operacao_segura != null ? pct(r.nota_operacao_segura) : '—',
          r.nota_limpeza != null ? pct(r.nota_limpeza) : '—',
        );
      }
      row.push(
        pct(r.nota_geral),
        fmt(r.bonus_possivel || 0),
        fmt(r.bonus_alcancado || 0),
        fmt(valorFinal),
        fmt(diferenca),
      );
      return row;
    });

    // Linha de totais
    const totalRow = new Array(headers.length).fill('');
    const idxNota = headers.indexOf('NOTA GERAL');
    totalRow[4] = 'TOTAL';
    totalRow[idxNota + 1] = fmt(totalBonusPossivel);
    totalRow[idxNota + 2] = fmt(totalBonusAlcancado);
    totalRow[idxNota + 3] = fmt(totalValorFinal);
    totalRow[idxNota + 4] = fmt(totalValorFinal - totalBonusPossivel);
    rows.push(totalRow);

    // Larguras: fixas para colunas de identificação, menores para indicadores
    const colStyles: Record<number, { cellWidth: number; halign?: 'center' | 'right' | 'left' }> = {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 38 },
      2: { cellWidth: 22 },
      3: { cellWidth: 22 },
      4: { cellWidth: 22 },
    };
    let idx = 5;
    const indicadorW = showSupervisorCols ? 12 : 13;
    if (showProducao) { colStyles[idx++] = { cellWidth: indicadorW, halign: 'center' }; }
    colStyles[idx++] = { cellWidth: indicadorW, halign: 'center' }; // EPI
    if (showFaltas) { colStyles[idx++] = { cellWidth: indicadorW, halign: 'center' }; }
    if (showAdvertencias) { colStyles[idx++] = { cellWidth: indicadorW, halign: 'center' }; }
    colStyles[idx++] = { cellWidth: indicadorW, halign: 'center' }; // DSS
    if (showSupervisorCols) {
      for (let i = 0; i < 6; i++) colStyles[idx++] = { cellWidth: indicadorW, halign: 'center' };
    }
    colStyles[idx++] = { cellWidth: 14, halign: 'center' }; // nota geral
    colStyles[idx++] = { cellWidth: 18, halign: 'right' }; // bôn possível
    colStyles[idx++] = { cellWidth: 18, halign: 'right' }; // bôn alcançado
    colStyles[idx++] = { cellWidth: 18, halign: 'right' }; // bôn mês
    colStyles[idx++] = { cellWidth: 18, halign: 'right' }; // diferença

    const difColIdx = headers.length - 1;
    const bonPosIdx = headers.length - 4;

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 22,
      styles: { fontSize: 6.5, cellPadding: 1.2, overflow: 'linebreak' },
      headStyles: { fillColor: [0, 100, 0], textColor: 255, fontStyle: 'bold', fontSize: 6.5, halign: 'center' },
      columnStyles: colStyles,
      alternateRowStyles: { fillColor: [245, 245, 245] },
      didParseCell: (data) => {
        if (data.row.index === rows.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [220, 240, 220];
        }
        // Colorir diferença
        if (data.column.index === difColIdx && data.row.index < rows.length - 1) {
          const r = resultadosFiltrados[data.row.index];
          if (r) {
            const vf = r.valor_ajustado ?? r.bonus_alcancado ?? 0;
            const dif = vf - (r.bonus_possivel || 0);
            data.cell.styles.textColor = dif < 0 ? [200, 0, 0] : dif > 0 ? [0, 140, 0] : [0, 0, 0];
          }
        }
        // Colorir indicadores < 100%
        if (data.row.index < rows.length - 1 && data.section === 'body') {
          const ci = data.column.index;
          if (ci >= 5 && ci < idxNota) {
            const cellText = String(data.cell.text);
            const val = parseFloat(cellText.replace('%', ''));
            if (!isNaN(val) && val < 100) {
              data.cell.styles.textColor = [200, 0, 0];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      },
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(120);
      doc.text(`Página ${i} de ${pageCount}`, 290, 207, { align: 'right' });
    }

    doc.save(`relatorio_premiacoes_${competencia || 'todos'}_${baseSelecionada?.nome || 'todas'}.pdf`);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Relatório de Premiações</h1>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Base de Premiação</Label>
              <Select value={baseId || 'TODAS'} onValueChange={v => setBaseId(v === 'TODAS' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Todas as bases" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todas</SelectItem>
                  {bases.map(b => <SelectItem key={b.id} value={b.id}>{b.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={categoriaFiltro || 'TODAS'} onValueChange={v => setCategoriaFiltro(v === 'TODAS' ? '' : v)}>
                <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todas</SelectItem>
                  {categorias
                    .filter(c => ['AUXILIAR', 'SUPERVISOR', 'ENCARREGADO'].includes(c.nome.toUpperCase()))
                    .map(c => <SelectItem key={c.id} value={c.nome}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mês Competência</Label>
              <Input type="month" value={competencia} onChange={e => setCompetencia(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Buscar Funcionário</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input placeholder="Nome, código ou setor..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {resultadosFiltrados.length > 0
                ? `${resultadosFiltrados.length} funcionário(s)${competencia ? ` — ${formatCompetencia(competencia)}` : ''}${baseSelecionada ? ` — ${baseSelecionada.nome}` : ''}`
                : 'Selecione os filtros para visualizar'}
            </CardTitle>
            {resultadosFiltrados.length > 0 && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={exportarExcel}>
                  <Download className="h-4 w-4 mr-1" /> Excel
                </Button>
                <Button variant="outline" size="sm" onClick={exportarPDF}>
                  <FileText className="h-4 w-4 mr-1" /> PDF
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {resultadosFiltrados.length === 0 ? (
            <div className="text-sm text-muted-foreground py-8 text-center">
              Nenhum resultado encontrado com os filtros selecionados.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-green-800 hover:bg-green-800">
                      <TableHead className="text-white font-bold text-xs">COD</TableHead>
                      <TableHead className="text-white font-bold text-xs">FUNCIONÁRIO</TableHead>
                      <TableHead className="text-white font-bold text-xs">SETOR</TableHead>
                      <TableHead className="text-white font-bold text-xs">FUNÇÃO</TableHead>
                      <TableHead className="text-white font-bold text-xs">CATEGORIA BÔNUS</TableHead>
                      {showProducao && <TableHead className="text-white font-bold text-xs text-center">PRODUÇÃO SETOR</TableHead>}
                      <TableHead className="text-white font-bold text-xs text-center">EPI</TableHead>
                      {showFaltas && <TableHead className="text-white font-bold text-xs text-center">FALTAS</TableHead>}
                      {showAdvertencias && <TableHead className="text-white font-bold text-xs text-center">ADVERTÊNCIAS</TableHead>}
                      <TableHead className="text-white font-bold text-xs text-center">DSS</TableHead>
                      {showSupervisorCols && <>
                        <TableHead className="text-white font-bold text-xs text-center">FATURAMENTO</TableHead>
                        <TableHead className="text-white font-bold text-xs text-center">ITENS NC</TableHead>
                        <TableHead className="text-white font-bold text-xs text-center">TRATAMENTO NC</TableHead>
                        <TableHead className="text-white font-bold text-xs text-center">HORA MÁQ.</TableHead>
                        <TableHead className="text-white font-bold text-xs text-center">OP. SEGURA</TableHead>
                        <TableHead className="text-white font-bold text-xs text-center">LIMPEZA</TableHead>
                      </>}
                      <TableHead className="text-white font-bold text-xs text-center">NOTA GERAL</TableHead>
                      <TableHead className="text-white font-bold text-xs text-right">BÔN. POSSÍVEL</TableHead>
                      <TableHead className="text-white font-bold text-xs text-right">BÔN. ALCANÇADO</TableHead>
                      <TableHead className="text-white font-bold text-xs text-right">VALOR FINAL</TableHead>
                      <TableHead className="text-white font-bold text-xs text-right">DIFERENÇA</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resultadosFiltrados.map((r, idx) => {
                      const valorFinal = r.valor_ajustado ?? r.bonus_alcancado ?? 0;
                      const diferenca = valorFinal - (r.bonus_possivel || 0);
                      return (
                        <TableRow key={r.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <TableCell className="font-mono text-xs py-1.5">{r.cod_funcionario}</TableCell>
                          <TableCell className="font-medium text-xs py-1.5">{r.nome}</TableCell>
                          <TableCell className="text-xs py-1.5">{r.setor}</TableCell>
                          <TableCell className="text-xs py-1.5">{r.funcao}</TableCell>
                          <TableCell className="text-xs py-1.5">{r.faixa}</TableCell>
                          {showProducao && <NotaCell value={r.nota_producao} />}
                          <NotaCell value={r.nota_epi} />
                          {showFaltas && <NotaCell value={r.nota_faltas} />}
                          {showAdvertencias && <NotaCell value={r.nota_advertencias} />}
                          <NotaCell value={r.nota_dss} />
                          {showSupervisorCols && <>
                            <NotaCell value={r.nota_faturamento} />
                            <NotaCell value={r.nota_itens_nc} />
                            <NotaCell value={r.nota_tratamento_nc} />
                            <NotaCell value={r.nota_hora_maquina} />
                            <NotaCell value={r.nota_operacao_segura} />
                            <NotaCell value={r.nota_limpeza} />
                          </>}
                          <TableCell className={`text-center text-xs font-bold py-1.5 ${r.nota_geral < 1 ? 'text-orange-600' : 'text-green-700'}`}>
                            {pct(r.nota_geral)}
                          </TableCell>
                          <TableCell className="text-right text-xs py-1.5">{fmt(r.bonus_possivel || 0)}</TableCell>
                          <TableCell className="text-right text-xs font-semibold text-green-700 py-1.5">{fmt(r.bonus_alcancado || 0)}</TableCell>
                          <TableCell className="text-right text-xs font-semibold py-1.5">
                            {fmt(valorFinal)}
                            {r.valor_ajustado != null && <span className="ml-1 text-xs text-muted-foreground">(aj.)</span>}
                          </TableCell>
                          <TableCell className={`text-right text-xs font-semibold py-1.5 ${diferenca < 0 ? 'text-red-600' : diferenca > 0 ? 'text-green-600' : ''}`}>
                            {fmt(diferenca)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Totais */}
              <div className="mt-4 pt-4 border-t flex justify-end gap-8 text-sm">
                <div className="text-right">
                  <div className="text-muted-foreground text-xs">Total Bônus Possível</div>
                  <div className="font-semibold">{fmt(totalBonusPossivel)}</div>
                </div>
                <div className="text-right">
                  <div className="text-muted-foreground text-xs">Total Bônus Alcançado</div>
                  <div className="font-semibold">{fmt(totalBonusAlcancado)}</div>
                </div>
                <div className="text-right">
                  <div className="text-muted-foreground text-xs">Total Valor Final</div>
                  <div className="font-semibold">{fmt(totalValorFinal)}</div>
                </div>
                <div className="text-right">
                  <div className="text-muted-foreground text-xs">Diferença Total</div>
                  <div className={`font-semibold ${totalValorFinal - totalBonusPossivel < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {fmt(totalValorFinal - totalBonusPossivel)}
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RelatorioPremiacao;
