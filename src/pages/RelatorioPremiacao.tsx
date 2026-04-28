import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoHubUrl from '@/assets/logo-concrem-hub.png';
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

// ─── Helpers de logo / header (module-level) ────────────────────────────────
const loadLogoImage = (): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = logoHubUrl;
  });

const getLogoBase64 = (): Promise<string> =>
  fetch(logoHubUrl)
    .then(r => r.blob())
    .then(blob => new Promise<string>(res => {
      const reader = new FileReader();
      reader.onloadend = () => res((reader.result as string).split(',')[1]);
      reader.readAsDataURL(blob);
    }));

const drawBrandedHeader = async (
  doc: jsPDF, W: number, title: string, sub1?: string, sub2?: string
): Promise<number> => {
  // Painel esquerdo — verde escuro
  doc.setFillColor(0, 55, 0);
  doc.rect(0, 0, 62, 34, 'F');
  // Painel direito — verde padrão
  doc.setFillColor(0, 100, 0);
  doc.rect(62, 0, W - 62, 34, 'F');
  // Diagonal de transição
  doc.setFillColor(0, 100, 0);
  doc.triangle(57, 0, 67, 0, 57, 34, 'F');

  // Logo no painel esquerdo (preserva proporção)
  try {
    const img = await loadLogoImage();
    const maxW = 52;
    const maxH = 27;
    const ratio = img.naturalWidth / img.naturalHeight;
    const logoW = Math.min(maxW, maxH * ratio);
    const logoH = logoW / ratio;
    const logoX = 3 + (maxW - logoW) / 2;
    const logoY = 3 + (maxH - logoH) / 2;
    doc.addImage(img, 'PNG', logoX, logoY, logoW, logoH);
  } catch {
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CONCREM', 8, 14);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(180, 220, 180);
    doc.text('PORTAS PREMIUM', 8, 20);
  }

  // Título no painel direito
  const cx = 62 + (W - 62) / 2;
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(title, cx, 14, { align: 'center' });

  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.2);
  doc.line(70, 18, W - 8, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(220, 240, 220);
  if (sub1 && sub2) {
    doc.text(sub1, cx - 40, 26);
    doc.text(sub2, cx + 40, 26, { align: 'right' });
  } else if (sub1) {
    doc.text(sub1, cx, 26, { align: 'center' });
  }

  // Barra de acento
  doc.setFillColor(52, 168, 83);
  doc.rect(0, 34, W, 2.5, 'F');
  return 38;
};

// Aplica cabeçalho visual (logo + 3 linhas de branding) a uma worksheet exceljs
const addExcelBranding = async (
  wb: ExcelJS.Workbook, ws: ExcelJS.Worksheet,
  title: string, subtitle: string, ncols: number
): Promise<void> => {
  const DARK = 'FF006400';
  const MED  = 'FF1A7A1A';
  const ACC  = 'FF34A853';
  const fill = (argb: string): ExcelJS.Fill => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });

  // Linha 1: título
  ws.getRow(1).height = 40;
  for (let c = 1; c <= ncols; c++) ws.getCell(1, c).fill = fill(DARK);
  ws.mergeCells(1, 1, 1, ncols);
  Object.assign(ws.getCell(1, 1), {
    value: title,
    style: {
      fill: fill(DARK),
      font: { bold: true, size: 16, color: { argb: 'FFFFFFFF' }, name: 'Calibri' },
      alignment: { horizontal: 'center', vertical: 'middle' },
    },
  });

  // Linha 2: sub-título
  ws.getRow(2).height = 20;
  for (let c = 1; c <= ncols; c++) ws.getCell(2, c).fill = fill(MED);
  ws.mergeCells(2, 1, 2, ncols);
  Object.assign(ws.getCell(2, 1), {
    value: subtitle,
    style: {
      fill: fill(MED),
      font: { size: 10, italic: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri' },
      alignment: { horizontal: 'center', vertical: 'middle' },
    },
  });

  // Linha 3: faixa de acento
  ws.getRow(3).height = 5;
  for (let c = 1; c <= ncols; c++) ws.getCell(3, c).fill = fill(ACC);

  // Logo (não bloqueia — se falhar, continua sem imagem)
  try {
    const b64 = await getLogoBase64();
    const imgId = wb.addImage({ base64: b64, extension: 'png' });
    ws.addImage(imgId, { tl: { col: 0, row: 0 }, ext: { width: 165, height: 58 }, editAs: 'oneCell' } as any);
  } catch { /* sem logo */ }
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

  // ─── Relatório RH ────────────────────────────────────────────────────────────
  const exportarRelatorioRH = async (formato: 'excel' | 'pdf') => {
    if (resultadosFiltrados.length === 0) return;

    const dados = [...resultadosFiltrados].sort((a, b) =>
      (a.nome || '').localeCompare(b.nome || '', 'pt-BR')
    );

    const [ano, mes] = (competencia || '').split('-');
    const nomeMes = MESES[mes] || mes || 'MÊS';
    const colMes = `BÔNUS ${nomeMes.toUpperCase()}`;

    const tPoss  = dados.reduce((acc, r) => acc + (r.bonus_possivel || 0), 0);
    const tAlc   = dados.reduce((acc, r) => acc + (r.bonus_alcancado || 0), 0);
    const tFinal = dados.reduce((acc, r) => acc + (r.valor_ajustado ?? r.bonus_alcancado ?? 0), 0);

    // ── Paleta ────────────────────────────────────────────────────────────────
    const G_DARK   = 'FF006400';
    const G_MED    = 'FF1A7A1A';
    const G_ACCENT = 'FF34A853';
    const G_LIGHT  = 'FFD4EDDA';
    const WHITE    = 'FFFFFFFF';
    const GRAY_ALT = 'FFF7F7F7';
    const GRAY_BDR = 'FFDDDDDD';
    const TXT      = 'FF1A1A1A';
    const RED      = 'FFCC0000';
    const GREEN_P  = 'FF006600';

    if (formato === 'excel') {
      const NCOLS = 9;
      const subInfo = [
        competencia ? `Competência: ${mes}/${ano}` : '',
        baseSelecionada ? `Base: ${baseSelecionada.nome}` : '',
      ].filter(Boolean).join('     |     ');

      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Relatório RH');

      ws.columns = [
        { key: 'cod',   width: 10 }, { key: 'nome',  width: 38 },
        { key: 'setor', width: 24 }, { key: 'funcao', width: 24 },
        { key: 'cat',   width: 26 }, { key: 'poss',  width: 20 },
        { key: 'alc',   width: 20 }, { key: 'fin',   width: 20 },
        { key: 'dif',   width: 16 },
      ];

      await addExcelBranding(wb, ws, 'CONCREM  —  RELATÓRIO DE PREMIAÇÃO RH', subInfo, NCOLS);

      // ── Linha de cabeçalho das colunas ──────────────────────────────────
      const hRow = ws.addRow(['COD', 'FUNCIONÁRIO', 'SETOR', 'FUNÇÃO', 'CATEGORIA BÔNUS',
        'BÔNUS POSSÍVEL', 'BÔNUS ALCANÇADO', colMes, 'DIFERENÇA']);
      hRow.height = 24;
      hRow.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF006400' } };
        cell.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = { bottom: { style: 'medium', color: { argb: 'FF004D00' } } };
      });

      const fmtBRL = '"R$ "#,##0.00';
      const isRight = [false, false, false, false, false, true, true, true, true];

      // ── Linhas de dados ──────────────────────────────────────────────────
      dados.forEach((r, i) => {
        const vf  = r.valor_ajustado ?? r.bonus_alcancado ?? 0;
        const dif = vf - (r.bonus_possivel || 0);
        const row = ws.addRow([
          r.cod_funcionario || '', r.nome || '', r.setor || '',
          r.funcao || '', r.faixa || '',
          r.bonus_possivel || 0, r.bonus_alcancado || 0, vf, dif,
        ]);
        row.height = 18;
        row.eachCell({ includeEmpty: true }, (cell, ci) => {
          const c = ci - 1;
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 === 0 ? 'FFFFFFFF' : 'FFF7F7F7' } };
          cell.font = {
            size: 9, name: 'Calibri',
            color: { argb: c === 8 ? (dif < 0 ? 'FFCC0000' : dif > 0 ? 'FF006600' : 'FF1A1A1A') : 'FF1A1A1A' },
            bold: c === 8 && dif !== 0,
          };
          cell.alignment = { horizontal: isRight[c] ? 'right' : (c === 0 ? 'center' : 'left'), vertical: 'middle' };
          cell.border = { bottom: { style: 'hair', color: { argb: 'FFDDDDDD' } } };
          if (c >= 5) cell.numFmt = fmtBRL;
        });
      });

      // ── Linha de totais ──────────────────────────────────────────────────
      const totRow = ws.addRow(['', 'TOTAL', '', '', '', tPoss, tAlc, tFinal, tFinal - tPoss]);
      totRow.height = 22;
      totRow.eachCell({ includeEmpty: true }, (cell, ci) => {
        const c = ci - 1;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EDDA' } };
        cell.font = { bold: true, size: 10, name: 'Calibri' };
        cell.alignment = { horizontal: isRight[c] ? 'right' : (c === 1 ? 'center' : 'left'), vertical: 'middle' };
        cell.border = { top: { style: 'medium', color: { argb: 'FF006400' } }, bottom: { style: 'medium', color: { argb: 'FF006400' } } };
        if (c >= 5) cell.numFmt = fmtBRL;
      });

      const buf = await wb.xlsx.writeBuffer();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      a.download = `relatorio_rh_${competencia || 'todos'}_${baseSelecionada?.nome || 'todas'}.xlsx`;
      a.click();
      URL.revokeObjectURL(a.href);

    } else {
      // ── PDF ───────────────────────────────────────────────────────────────
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const W = 297;
      const sub1 = competencia ? `Competência: ${mes}/${ano}` : undefined;
      const sub2 = baseSelecionada ? `Base: ${baseSelecionada.nome}` : undefined;
      const startY = await drawBrandedHeader(doc, W, 'RELATÓRIO DE PREMIAÇÃO — RH', sub1, sub2);

      // ── Tabela ───────────────────────────────────────────────────────────
      const headers = [
        'COD', 'FUNCIONÁRIO', 'SETOR', 'FUNÇÃO', 'CATEGORIA BÔNUS',
        'BÔN. POSSÍVEL', 'BÔN. ALCANÇADO', `BÔN. ${nomeMes.toUpperCase().slice(0, 3)}.`, 'DIFERENÇA',
      ];

      const rows: string[][] = dados.map(r => {
        const vf = r.valor_ajustado ?? r.bonus_alcancado ?? 0;
        return [
          r.cod_funcionario || '',
          r.nome || '',
          r.setor || '',
          r.funcao || '',
          r.faixa || '',
          fmt(r.bonus_possivel || 0),
          fmt(r.bonus_alcancado || 0),
          fmt(vf),
          fmt(vf - (r.bonus_possivel || 0)),
        ];
      });
      rows.push(['', 'TOTAL', '', '', '', fmt(tPoss), fmt(tAlc), fmt(tFinal), fmt(tFinal - tPoss)]);

      autoTable(doc, {
        head: [headers],
        body: rows,
        startY,
        margin: { left: 8, right: 8 },
        styles: {
          fontSize: 7.5,
          cellPadding: { top: 2, bottom: 2, left: 2.5, right: 2.5 },
          overflow: 'linebreak',
          lineColor: [230, 230, 230],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: [0, 80, 0],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 7.5,
          halign: 'center',
          cellPadding: { top: 3, bottom: 3, left: 2.5, right: 2.5 },
        },
        tableWidth: 281,
        columnStyles: {
          0: { cellWidth: 12,  halign: 'center', fontStyle: 'bold' },
          1: { cellWidth: 65 },
          2: { cellWidth: 33 },
          3: { cellWidth: 33 },
          4: { cellWidth: 33 },
          5: { cellWidth: 29, halign: 'right' },
          6: { cellWidth: 29, halign: 'right' },
          7: { cellWidth: 29, halign: 'right' },
          8: { cellWidth: 18, halign: 'right' },
        },
        alternateRowStyles: { fillColor: [246, 250, 246] },
        didParseCell: (data) => {
          const lastRow = rows.length - 1;
          if (data.row.index === lastRow) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.fontSize  = 8;
            data.cell.styles.fillColor = [212, 237, 218];
            data.cell.styles.lineWidth = 0.5;
          }
          // Colorir coluna DIFERENÇA
          if (data.column.index === 8 && data.row.index < lastRow && data.section === 'body') {
            const r = dados[data.row.index];
            if (r) {
              const vf  = r.valor_ajustado ?? r.bonus_alcancado ?? 0;
              const dif = vf - (r.bonus_possivel || 0);
              if (dif < 0) {
                data.cell.styles.textColor = [180, 0, 0];
                data.cell.styles.fontStyle = 'bold';
              } else if (dif > 0) {
                data.cell.styles.textColor = [0, 110, 0];
                data.cell.styles.fontStyle = 'bold';
              }
            }
          }
          // Colorir colunas monetárias do header
          if (data.section === 'head' && data.column.index >= 5) {
            data.cell.styles.halign = 'right';
          }
        },
      });

      // ── Rodapé ───────────────────────────────────────────────────────────
      const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFillColor(0, 80, 0);
        doc.rect(0, 203, W, 1.5, 'F');

        doc.setFontSize(6.5);
        doc.setTextColor(90, 90, 90);
        doc.setFont('helvetica', 'normal');
        doc.text(`Gerado em: ${today}`, 8, 208);
        doc.text('CONCREM — Documento Confidencial', W / 2, 208, { align: 'center' });
        doc.text(`Página ${i} de ${pageCount}`, W - 8, 208, { align: 'right' });
      }

      doc.save(`relatorio_rh_${competencia || 'todos'}_${baseSelecionada?.nome || 'todas'}.pdf`);
    }
  };

  // ─── Exportar Excel (relatório completo) ─────────────────────────────────────
  const exportarExcel = async () => {
    if (resultadosFiltrados.length === 0) return;
    const [ano, mes] = (competencia || '').split('-');
    const nomeMes = MESES[mes] || mes || 'MÊS';
    const colMesFull = `BÔNUS ${nomeMes.toUpperCase()}`;
    const subInfo = [
      competencia ? `Competência: ${mes}/${ano}` : '',
      baseSelecionada ? `Base: ${baseSelecionada.nome}` : '',
    ].filter(Boolean).join('     |     ');

    // Montar headers dinamicamente
    const hLabels: string[] = ['COD', 'FUNCIONÁRIO', 'SETOR', 'FUNÇÃO', 'CATEGORIA BÔNUS'];
    if (showProducao) hLabels.push('% PRODUÇÃO SETOR');
    hLabels.push('EPI');
    if (showFaltas) hLabels.push('FALTAS');
    if (showAdvertencias) hLabels.push('ADVERTÊNCIAS');
    hLabels.push('DSS');
    if (showSupervisorCols) hLabels.push('FATURAMENTO', 'ITENS NC', 'TRATAMENTO NC', 'HORA MÁQUINA', 'OPERAÇÃO SEGURA', 'LIMPEZA');
    hLabels.push('NOTA GERAL', 'BÔNUS POSSÍVEL', 'BÔNUS ALCANÇADO', colMesFull, 'DIFERENÇA');
    const NCOLS = hLabels.length;

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Premiações');

    // Larguras
    const colWidths = [10, 36, 22, 22, 22];
    if (showProducao) colWidths.push(16);
    colWidths.push(10);
    if (showFaltas) colWidths.push(10);
    if (showAdvertencias) colWidths.push(14);
    colWidths.push(10);
    if (showSupervisorCols) colWidths.push(14, 12, 14, 14, 16, 12);
    colWidths.push(13, 18, 18, 18, 15);
    ws.columns = colWidths.map(w => ({ width: w }));

    await addExcelBranding(wb, ws, 'CONCREM  —  RELATÓRIO DE PREMIAÇÃO', subInfo, NCOLS);

    // Cabeçalho das colunas
    const hRow = ws.addRow(hLabels);
    hRow.height = 26;
    hRow.eachCell(cell => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF006400' } };
      cell.font = { bold: true, size: 8, color: { argb: 'FFFFFFFF' }, name: 'Calibri' };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: false };
      cell.border = { bottom: { style: 'medium', color: { argb: 'FF004D00' } } };
    });

    // Colunas monetárias (últimas 4 antes de DIFERENÇA e DIFERENÇA)
    const moneyStart = NCOLS - 4; // índice 1-based da primeira coluna monetária

    // Dados
    resultadosFiltrados.forEach((r, i) => {
      const valorFinal = r.valor_ajustado ?? r.bonus_alcancado ?? 0;
      const diferenca = valorFinal - (r.bonus_possivel || 0);
      const vals: any[] = [r.cod_funcionario || '', r.nome || '', r.setor || '', r.funcao || '', r.faixa || ''];
      if (showProducao) vals.push(r.nota_producao != null ? `${(r.nota_producao * 100).toFixed(1)}%` : '');
      vals.push(`${(r.nota_epi * 100).toFixed(1)}%`);
      if (showFaltas) vals.push(`${(r.nota_faltas * 100).toFixed(1)}%`);
      if (showAdvertencias) vals.push(`${(r.nota_advertencias * 100).toFixed(1)}%`);
      vals.push(`${(r.nota_dss * 100).toFixed(1)}%`);
      if (showSupervisorCols) {
        vals.push(
          r.nota_faturamento != null ? `${(r.nota_faturamento * 100).toFixed(1)}%` : '',
          r.nota_itens_nc != null ? `${(r.nota_itens_nc * 100).toFixed(1)}%` : '',
          r.nota_tratamento_nc != null ? `${(r.nota_tratamento_nc * 100).toFixed(1)}%` : '',
          r.nota_hora_maquina != null ? `${(r.nota_hora_maquina * 100).toFixed(1)}%` : '',
          r.nota_operacao_segura != null ? `${(r.nota_operacao_segura * 100).toFixed(1)}%` : '',
          r.nota_limpeza != null ? `${(r.nota_limpeza * 100).toFixed(1)}%` : '',
        );
      }
      vals.push(`${(r.nota_geral * 100).toFixed(2)}%`, r.bonus_possivel || 0, r.bonus_alcancado || 0, valorFinal, diferenca);

      const row = ws.addRow(vals);
      row.height = 16;
      const bg = i % 2 === 0 ? 'FFFFFFFF' : 'FFF5F5F5';
      row.eachCell({ includeEmpty: true }, (cell, ci) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        cell.font = { size: 8, name: 'Calibri', color: { argb: ci === NCOLS ? (diferenca < 0 ? 'FFCC0000' : diferenca > 0 ? 'FF006600' : 'FF1A1A1A') : 'FF1A1A1A' } };
        cell.alignment = { horizontal: ci <= 5 ? (ci === 1 ? 'center' : 'left') : 'center', vertical: 'middle' };
        cell.border = { bottom: { style: 'hair', color: { argb: 'FFDDDDDD' } } };
        if (ci >= moneyStart) {
          cell.numFmt = '"R$ "#,##0.00';
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
        }
      });
    });

    // Totais
    const totVals = new Array(NCOLS).fill('');
    totVals[1] = 'TOTAL';
    totVals[NCOLS - 4] = totalBonusPossivel;
    totVals[NCOLS - 3] = totalBonusAlcancado;
    totVals[NCOLS - 2] = totalValorFinal;
    totVals[NCOLS - 1] = totalValorFinal - totalBonusPossivel;
    const totRow = ws.addRow(totVals);
    totRow.height = 22;
    totRow.eachCell({ includeEmpty: true }, (cell, ci) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EDDA' } };
      cell.font = { bold: true, size: 9, name: 'Calibri' };
      cell.alignment = { horizontal: ci === 2 ? 'center' : ci >= moneyStart ? 'right' : 'left', vertical: 'middle' };
      cell.border = { top: { style: 'medium', color: { argb: 'FF006400' } }, bottom: { style: 'medium', color: { argb: 'FF006400' } } };
      if (ci >= moneyStart) cell.numFmt = '"R$ "#,##0.00';
    });

    const buf = await wb.xlsx.writeBuffer();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    a.download = `relatorio_premiacoes_${competencia || 'todos'}_${baseSelecionada?.nome || 'todas'}.xlsx`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // ─── Exportar PDF (relatório completo) ───────────────────────────────────────
  const exportarPDF = async () => {
    if (resultadosFiltrados.length === 0) return;
    const [ano, mes] = (competencia || '').split('-');
    const nomeMesFinal = MESES[mes] || mes || 'MÊS';
    const tituloRelatorio = `RELATÓRIO DE PREMIAÇÃO${mes ? ` — ${mes}/${ano}` : ''}`;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const W = 297;
    const sub1 = competencia ? `Competência: ${mes}/${ano}` : undefined;
    const sub2 = baseSelecionada ? `Base: ${baseSelecionada.nome}` : undefined;
    const tableStartY = await drawBrandedHeader(doc, W, tituloRelatorio, sub1, sub2);

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
      startY: tableStartY,
      styles: { fontSize: 6.5, cellPadding: 1.2, overflow: 'linebreak' },
      headStyles: { fillColor: [0, 80, 0], textColor: 255, fontStyle: 'bold', fontSize: 6.5, halign: 'center' },
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

    const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFillColor(0, 80, 0);
      doc.rect(0, 203, W, 1.5, 'F');
      doc.setFontSize(6.5);
      doc.setTextColor(90, 90, 90);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gerado em: ${today}`, 8, 208);
      doc.text('CONCREM — Documento Confidencial', W / 2, 208, { align: 'center' });
      doc.text(`Página ${i} de ${pageCount}`, W - 8, 208, { align: 'right' });
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
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={exportarExcel}>
                  <Download className="h-4 w-4 mr-1" /> Excel
                </Button>
                <Button variant="outline" size="sm" onClick={exportarPDF}>
                  <FileText className="h-4 w-4 mr-1" /> PDF
                </Button>
                <div className="w-px bg-border mx-1" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportarRelatorioRH('excel')}
                  className="border-green-700 text-green-700 hover:bg-green-50"
                >
                  <Download className="h-4 w-4 mr-1" /> RH Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportarRelatorioRH('pdf')}
                  className="border-green-700 text-green-700 hover:bg-green-50"
                >
                  <FileText className="h-4 w-4 mr-1" /> RH PDF
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
