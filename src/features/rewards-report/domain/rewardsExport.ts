// Exportações do relatório — PORT VERBATIM das funções que viviam em
// RelatorioPremiacao.tsx (exportarExcel/exportarPDF/exportarRelatorioRH). Mesma
// estrutura de arquivo, mesmos cabeçalhos, mesmos formatos e nomes de arquivo —
// apenas parametrizadas por (rows, ctx) para operar sobre o dataset FILTRADO.
// Não remover nem alterar a estrutura consumida por RH.
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoHubUrl from '@/assets/logo-concrem-hub.png';
import type { ResultadoPremiacao } from '@/hooks/useResultadosPremiacao';
import { formatCurrencyBRL, formatPercentBR } from '@/lib/formatters';
import { getCurrentDateTimeInBrasilia } from '@/lib/dateTime';
import { valorFinal } from './rewardsReportMetrics';

export interface ExportContext {
  competencia: string;      // 'YYYY-MM' | ''
  baseNome: string | null;
}

const fmt = (v: number) => formatCurrencyBRL(v);
const pct = (v: number | null | undefined) => (v != null ? formatPercentBR(v * 100, 1) : '—');

const MESES: Record<string, string> = {
  '01': 'Janeiro', '02': 'Fevereiro', '03': 'Março', '04': 'Abril', '05': 'Maio', '06': 'Junho',
  '07': 'Julho', '08': 'Agosto', '09': 'Setembro', '10': 'Outubro', '11': 'Novembro', '12': 'Dezembro',
};

const loadLogoImage = (): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = logoHubUrl; });

const getLogoBase64 = (): Promise<string> =>
  fetch(logoHubUrl).then(r => r.blob()).then(blob => new Promise<string>(res => {
    const reader = new FileReader(); reader.onloadend = () => res((reader.result as string).split(',')[1]); reader.readAsDataURL(blob);
  }));

async function drawBrandedHeader(doc: jsPDF, W: number, title: string, sub1?: string, sub2?: string): Promise<number> {
  doc.setFillColor(0, 55, 0); doc.rect(0, 0, 62, 34, 'F');
  doc.setFillColor(0, 100, 0); doc.rect(62, 0, W - 62, 34, 'F');
  doc.setFillColor(0, 100, 0); doc.triangle(57, 0, 67, 0, 57, 34, 'F');
  try {
    const img = await loadLogoImage();
    const maxW = 52, maxH = 27; const ratio = img.naturalWidth / img.naturalHeight;
    const logoW = Math.min(maxW, maxH * ratio); const logoH = logoW / ratio;
    doc.addImage(img, 'PNG', 3 + (maxW - logoW) / 2, 3 + (maxH - logoH) / 2, logoW, logoH);
  } catch {
    doc.setTextColor(255, 255, 255); doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text('CONCREM', 8, 14);
    doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(180, 220, 180); doc.text('PORTAS PREMIUM', 8, 20);
  }
  const cx = 62 + (W - 62) / 2;
  doc.setTextColor(255, 255, 255); doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text(title, cx, 14, { align: 'center' });
  doc.setDrawColor(255, 255, 255); doc.setLineWidth(0.2); doc.line(70, 18, W - 8, 18);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(220, 240, 220);
  if (sub1 && sub2) { doc.text(sub1, cx - 40, 26); doc.text(sub2, cx + 40, 26, { align: 'right' }); }
  else if (sub1) { doc.text(sub1, cx, 26, { align: 'center' }); }
  doc.setFillColor(52, 168, 83); doc.rect(0, 34, W, 2.5, 'F');
  return 38;
}

async function addExcelBranding(wb: ExcelJS.Workbook, ws: ExcelJS.Worksheet, title: string, subtitle: string, ncols: number): Promise<void> {
  const DARK = 'FF006400', MED = 'FF1A7A1A', ACC = 'FF34A853';
  const fill = (argb: string): ExcelJS.Fill => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
  ws.getRow(1).height = 40;
  for (let c = 1; c <= ncols; c++) ws.getCell(1, c).fill = fill(DARK);
  ws.mergeCells(1, 1, 1, ncols);
  Object.assign(ws.getCell(1, 1), { value: title, style: { fill: fill(DARK), font: { bold: true, size: 16, color: { argb: 'FFFFFFFF' }, name: 'Calibri' }, alignment: { horizontal: 'center', vertical: 'middle' } } });
  ws.getRow(2).height = 20;
  for (let c = 1; c <= ncols; c++) ws.getCell(2, c).fill = fill(MED);
  ws.mergeCells(2, 1, 2, ncols);
  Object.assign(ws.getCell(2, 1), { value: subtitle, style: { fill: fill(MED), font: { size: 10, italic: true, color: { argb: 'FFFFFFFF' }, name: 'Calibri' }, alignment: { horizontal: 'center', vertical: 'middle' } } });
  ws.getRow(3).height = 5;
  for (let c = 1; c <= ncols; c++) ws.getCell(3, c).fill = fill(ACC);
  try {
    const b64 = await getLogoBase64();
    const imgId = wb.addImage({ base64: b64, extension: 'png' });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ws.addImage(imgId, { tl: { col: 0, row: 0 }, ext: { width: 165, height: 58 }, editAs: 'oneCell' } as any);
  } catch { /* sem logo */ }
}

const download = (blob: Blob, name: string) => {
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); URL.revokeObjectURL(a.href);
};

// ── RELATÓRIO RH (operacional) ───────────────────────────────────────────────
export async function exportRH(rows: ResultadoPremiacao[], ctx: ExportContext, formato: 'excel' | 'pdf'): Promise<void> {
  if (rows.length === 0) return;
  const dados = [...rows].sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR'));
  const [ano, mes] = (ctx.competencia || '').split('-');
  const nomeMes = MESES[mes] || mes || 'MÊS';
  const colMes = `BÔNUS ${nomeMes.toUpperCase()}`;
  const tPoss = dados.reduce((a, r) => a + (r.bonus_possivel || 0), 0);
  const tAlc = dados.reduce((a, r) => a + (r.bonus_alcancado || 0), 0);
  const tFinal = dados.reduce((a, r) => a + valorFinal(r), 0);

  if (formato === 'excel') {
    const NCOLS = 9;
    const subInfo = [ctx.competencia ? `Competência: ${mes}/${ano}` : '', ctx.baseNome ? `Base: ${ctx.baseNome}` : ''].filter(Boolean).join('     |     ');
    const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet('Relatório RH');
    ws.columns = [{ key: 'cod', width: 10 }, { key: 'nome', width: 38 }, { key: 'setor', width: 24 }, { key: 'funcao', width: 24 }, { key: 'cat', width: 26 }, { key: 'poss', width: 20 }, { key: 'alc', width: 20 }, { key: 'fin', width: 20 }, { key: 'dif', width: 16 }];
    await addExcelBranding(wb, ws, 'CONCREM  —  RELATÓRIO DE PREMIAÇÃO RH', subInfo, NCOLS);
    const hRow = ws.addRow(['COD', 'FUNCIONÁRIO', 'SETOR', 'FUNÇÃO', 'CATEGORIA BÔNUS', 'BÔNUS POSSÍVEL', 'BÔNUS ALCANÇADO', colMes, 'DIFERENÇA']);
    hRow.height = 24;
    hRow.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF006400' } }; cell.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' }, name: 'Calibri' }; cell.alignment = { horizontal: 'center', vertical: 'middle' }; cell.border = { bottom: { style: 'medium', color: { argb: 'FF004D00' } } }; });
    const fmtBRL = '"R$ "#,##0.00';
    const isRight = [false, false, false, false, false, true, true, true, true];
    dados.forEach((r, i) => {
      const vf = valorFinal(r); const dif = vf - (r.bonus_possivel || 0);
      const row = ws.addRow([r.cod_funcionario || '', r.nome || '', r.setor || '', r.funcao || '', r.faixa || '', r.bonus_possivel || 0, r.bonus_alcancado || 0, vf, dif]);
      row.height = 18;
      row.eachCell({ includeEmpty: true }, (cell, ci) => {
        const c = ci - 1;
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: i % 2 === 0 ? 'FFFFFFFF' : 'FFF7F7F7' } };
        cell.font = { size: 9, name: 'Calibri', color: { argb: c === 8 ? (dif < 0 ? 'FFCC0000' : dif > 0 ? 'FF006600' : 'FF1A1A1A') : 'FF1A1A1A' }, bold: c === 8 && dif !== 0 };
        cell.alignment = { horizontal: isRight[c] ? 'right' : (c === 0 ? 'center' : 'left'), vertical: 'middle' };
        cell.border = { bottom: { style: 'hair', color: { argb: 'FFDDDDDD' } } };
        if (c >= 5) cell.numFmt = fmtBRL;
      });
    });
    const totRow = ws.addRow(['', 'TOTAL', '', '', '', tPoss, tAlc, tFinal, tFinal - tPoss]);
    totRow.height = 22;
    totRow.eachCell({ includeEmpty: true }, (cell, ci) => { const c = ci - 1; cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EDDA' } }; cell.font = { bold: true, size: 10, name: 'Calibri' }; cell.alignment = { horizontal: isRight[c] ? 'right' : (c === 1 ? 'center' : 'left'), vertical: 'middle' }; cell.border = { top: { style: 'medium', color: { argb: 'FF006400' } }, bottom: { style: 'medium', color: { argb: 'FF006400' } } }; if (c >= 5) cell.numFmt = fmtBRL; });
    const buf = await wb.xlsx.writeBuffer();
    download(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `relatorio_rh_${ctx.competencia || 'todos'}_${ctx.baseNome || 'todas'}.xlsx`);
    return;
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' }); const W = 297;
  const startY = await drawBrandedHeader(doc, W, 'RELATÓRIO DE PREMIAÇÃO — RH', ctx.competencia ? `Competência: ${mes}/${ano}` : undefined, ctx.baseNome ? `Base: ${ctx.baseNome}` : undefined);
  const headers = ['COD', 'FUNCIONÁRIO', 'SETOR', 'FUNÇÃO', 'CATEGORIA BÔNUS', 'BÔN. POSSÍVEL', 'BÔN. ALCANÇADO', `BÔN. ${nomeMes.toUpperCase().slice(0, 3)}.`, 'DIFERENÇA'];
  const body: string[][] = dados.map(r => { const vf = valorFinal(r); return [r.cod_funcionario || '', r.nome || '', r.setor || '', r.funcao || '', r.faixa || '', fmt(r.bonus_possivel || 0), fmt(r.bonus_alcancado || 0), fmt(vf), fmt(vf - (r.bonus_possivel || 0))]; });
  body.push(['', 'TOTAL', '', '', '', fmt(tPoss), fmt(tAlc), fmt(tFinal), fmt(tFinal - tPoss)]);
  autoTable(doc, {
    head: [headers], body, startY, margin: { left: 8, right: 8 },
    styles: { fontSize: 7.5, cellPadding: { top: 2, bottom: 2, left: 2.5, right: 2.5 }, overflow: 'linebreak', lineColor: [230, 230, 230], lineWidth: 0.1 },
    headStyles: { fillColor: [0, 80, 0], textColor: 255, fontStyle: 'bold', fontSize: 7.5, halign: 'center', cellPadding: { top: 3, bottom: 3, left: 2.5, right: 2.5 } },
    tableWidth: 281,
    columnStyles: { 0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' }, 1: { cellWidth: 65 }, 2: { cellWidth: 33 }, 3: { cellWidth: 33 }, 4: { cellWidth: 33 }, 5: { cellWidth: 29, halign: 'right' }, 6: { cellWidth: 29, halign: 'right' }, 7: { cellWidth: 29, halign: 'right' }, 8: { cellWidth: 18, halign: 'right' } },
    alternateRowStyles: { fillColor: [246, 250, 246] },
    didParseCell: (data) => {
      const lastRow = body.length - 1;
      if (data.row.index === lastRow) { data.cell.styles.fontStyle = 'bold'; data.cell.styles.fontSize = 8; data.cell.styles.fillColor = [212, 237, 218]; data.cell.styles.lineWidth = 0.5; }
      if (data.column.index === 8 && data.row.index < lastRow && data.section === 'body') {
        const r = dados[data.row.index];
        if (r) { const dif = valorFinal(r) - (r.bonus_possivel || 0); if (dif < 0) { data.cell.styles.textColor = [180, 0, 0]; data.cell.styles.fontStyle = 'bold'; } else if (dif > 0) { data.cell.styles.textColor = [0, 110, 0]; data.cell.styles.fontStyle = 'bold'; } }
      }
      if (data.section === 'head' && data.column.index >= 5) data.cell.styles.halign = 'right';
    },
  });
  brandedFooter(doc, W);
  doc.save(`relatorio_rh_${ctx.competencia || 'todos'}_${ctx.baseNome || 'todas'}.pdf`);
}

// ── RELATÓRIO DETALHADO (completo por funcionário) ───────────────────────────
export async function exportDetalhado(rows: ResultadoPremiacao[], ctx: ExportContext, formato: 'excel' | 'pdf'): Promise<void> {
  if (rows.length === 0) return;
  const [ano, mes] = (ctx.competencia || '').split('-');
  const nomeMes = MESES[mes] || mes || 'MÊS';
  const showProducao = rows.some(r => r.nota_producao != null);
  const showSupervisorCols = rows.some(r => r.nota_faturamento != null);
  const totalPoss = rows.reduce((a, r) => a + (r.bonus_possivel || 0), 0);
  const totalAlc = rows.reduce((a, r) => a + (r.bonus_alcancado || 0), 0);
  const totalFinal = rows.reduce((a, r) => a + valorFinal(r), 0);
  const subInfo = [ctx.competencia ? `Competência: ${mes}/${ano}` : '', ctx.baseNome ? `Base: ${ctx.baseNome}` : ''].filter(Boolean).join('     |     ');

  if (formato === 'excel') {
    const hLabels: string[] = ['COD', 'FUNCIONÁRIO', 'SETOR', 'FUNÇÃO', 'CATEGORIA BÔNUS'];
    if (showProducao) hLabels.push('% PRODUÇÃO SETOR');
    hLabels.push('EPI', 'FALTAS', 'ADVERTÊNCIAS', 'DSS');
    if (showSupervisorCols) hLabels.push('FATURAMENTO', 'ITENS NC', 'TRATAMENTO NC', 'HORA MÁQUINA', 'OPERAÇÃO SEGURA', 'LIMPEZA');
    hLabels.push('NOTA GERAL', 'BÔNUS POSSÍVEL', 'BÔNUS ALCANÇADO', `BÔNUS ${nomeMes.toUpperCase()}`, 'DIFERENÇA');
    const NCOLS = hLabels.length;
    const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet('Premiações');
    const colWidths = [10, 36, 22, 22, 22];
    if (showProducao) colWidths.push(16);
    colWidths.push(10, 10, 14, 10);
    if (showSupervisorCols) colWidths.push(14, 12, 14, 14, 16, 12);
    colWidths.push(13, 18, 18, 18, 15);
    ws.columns = colWidths.map(w => ({ width: w }));
    await addExcelBranding(wb, ws, 'CONCREM  —  RELATÓRIO DE PREMIAÇÃO', subInfo, NCOLS);
    const hRow = ws.addRow(hLabels); hRow.height = 26;
    hRow.eachCell(cell => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF006400' } }; cell.font = { bold: true, size: 8, color: { argb: 'FFFFFFFF' }, name: 'Calibri' }; cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: false }; cell.border = { bottom: { style: 'medium', color: { argb: 'FF004D00' } } }; });
    const moneyStart = NCOLS - 4;
    rows.forEach((r, i) => {
      const vf = valorFinal(r); const dif = vf - (r.bonus_possivel || 0);
      const vals: (string | number)[] = [r.cod_funcionario || '', r.nome || '', r.setor || '', r.funcao || '', r.faixa || ''];
      if (showProducao) vals.push(r.nota_producao != null ? `${(r.nota_producao * 100).toFixed(1)}%` : '');
      vals.push(`${(r.nota_epi * 100).toFixed(1)}%`, `${(r.nota_faltas * 100).toFixed(1)}%`, `${(r.nota_advertencias * 100).toFixed(1)}%`, `${(r.nota_dss * 100).toFixed(1)}%`);
      if (showSupervisorCols) vals.push(r.nota_faturamento != null ? `${(r.nota_faturamento * 100).toFixed(1)}%` : '', r.nota_itens_nc != null ? `${(r.nota_itens_nc * 100).toFixed(1)}%` : '', r.nota_tratamento_nc != null ? `${(r.nota_tratamento_nc * 100).toFixed(1)}%` : '', r.nota_hora_maquina != null ? `${(r.nota_hora_maquina * 100).toFixed(1)}%` : '', r.nota_operacao_segura != null ? `${(r.nota_operacao_segura * 100).toFixed(1)}%` : '', r.nota_limpeza != null ? `${(r.nota_limpeza * 100).toFixed(1)}%` : '');
      vals.push(`${(r.nota_geral * 100).toFixed(2)}%`, r.bonus_possivel || 0, r.bonus_alcancado || 0, vf, dif);
      const row = ws.addRow(vals); row.height = 16;
      const bg = i % 2 === 0 ? 'FFFFFFFF' : 'FFF5F5F5';
      row.eachCell({ includeEmpty: true }, (cell, ci) => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }; cell.font = { size: 8, name: 'Calibri', color: { argb: ci === NCOLS ? (dif < 0 ? 'FFCC0000' : dif > 0 ? 'FF006600' : 'FF1A1A1A') : 'FF1A1A1A' } }; cell.alignment = { horizontal: ci <= 5 ? (ci === 1 ? 'center' : 'left') : 'center', vertical: 'middle' }; cell.border = { bottom: { style: 'hair', color: { argb: 'FFDDDDDD' } } }; if (ci >= moneyStart) { cell.numFmt = '"R$ "#,##0.00'; cell.alignment = { horizontal: 'right', vertical: 'middle' }; } });
    });
    const totVals: (string | number)[] = new Array(NCOLS).fill('');
    totVals[1] = 'TOTAL'; totVals[NCOLS - 4] = totalPoss; totVals[NCOLS - 3] = totalAlc; totVals[NCOLS - 2] = totalFinal; totVals[NCOLS - 1] = totalFinal - totalPoss;
    const totRow = ws.addRow(totVals); totRow.height = 22;
    totRow.eachCell({ includeEmpty: true }, (cell, ci) => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EDDA' } }; cell.font = { bold: true, size: 9, name: 'Calibri' }; cell.alignment = { horizontal: ci === 2 ? 'center' : ci >= moneyStart ? 'right' : 'left', vertical: 'middle' }; cell.border = { top: { style: 'medium', color: { argb: 'FF006400' } }, bottom: { style: 'medium', color: { argb: 'FF006400' } } }; if (ci >= moneyStart) cell.numFmt = '"R$ "#,##0.00'; });
    const buf = await wb.xlsx.writeBuffer();
    download(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `relatorio_premiacoes_${ctx.competencia || 'todos'}_${ctx.baseNome || 'todas'}.xlsx`);
    return;
  }

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' }); const W = 297;
  const tituloRelatorio = `RELATÓRIO DE PREMIAÇÃO${mes ? ` — ${mes}/${ano}` : ''}`;
  const startY = await drawBrandedHeader(doc, W, tituloRelatorio, ctx.competencia ? `Competência: ${mes}/${ano}` : undefined, ctx.baseNome ? `Base: ${ctx.baseNome}` : undefined);
  const headers: string[] = ['COD', 'FUNCIONÁRIO', 'SETOR', 'FUNÇÃO', 'CATEGORIA BÔNUS'];
  if (showProducao) headers.push('PROD. SETOR');
  headers.push('EPI', 'FALTAS', 'ADV.', 'DSS');
  if (showSupervisorCols) headers.push('FATURAMENTO', 'ITENS NC', 'TRAT. NC', 'HORA MÁQ.', 'OP. SEGURA', 'LIMPEZA');
  headers.push('NOTA GERAL', 'BÔN. POSSÍVEL', 'BÔN. ALCANÇADO', `BÔN. ${nomeMes.toUpperCase().slice(0, 3)}.`, 'DIFERENÇA');
  const body: string[][] = rows.map(r => {
    const vf = valorFinal(r);
    const row: string[] = [r.cod_funcionario || '', r.nome || '', r.setor || '', r.funcao || '', r.faixa || ''];
    if (showProducao) row.push(r.nota_producao != null ? pct(r.nota_producao) : '—');
    row.push(pct(r.nota_epi), pct(r.nota_faltas), pct(r.nota_advertencias), pct(r.nota_dss));
    if (showSupervisorCols) row.push(r.nota_faturamento != null ? pct(r.nota_faturamento) : '—', r.nota_itens_nc != null ? pct(r.nota_itens_nc) : '—', r.nota_tratamento_nc != null ? pct(r.nota_tratamento_nc) : '—', r.nota_hora_maquina != null ? pct(r.nota_hora_maquina) : '—', r.nota_operacao_segura != null ? pct(r.nota_operacao_segura) : '—', r.nota_limpeza != null ? pct(r.nota_limpeza) : '—');
    row.push(pct(r.nota_geral), fmt(r.bonus_possivel || 0), fmt(r.bonus_alcancado || 0), fmt(vf), fmt(vf - (r.bonus_possivel || 0)));
    return row;
  });
  const totalRow: string[] = new Array(headers.length).fill('');
  const idxNota = headers.indexOf('NOTA GERAL');
  totalRow[4] = 'TOTAL'; totalRow[idxNota + 1] = fmt(totalPoss); totalRow[idxNota + 2] = fmt(totalAlc); totalRow[idxNota + 3] = fmt(totalFinal); totalRow[idxNota + 4] = fmt(totalFinal - totalPoss);
  body.push(totalRow);
  const colStyles: Record<number, { cellWidth: number; halign?: 'center' | 'right' | 'left' }> = { 0: { cellWidth: 10, halign: 'center' }, 1: { cellWidth: 38 }, 2: { cellWidth: 22 }, 3: { cellWidth: 22 }, 4: { cellWidth: 22 } };
  let idx = 5; const indicadorW = showSupervisorCols ? 12 : 13;
  if (showProducao) colStyles[idx++] = { cellWidth: indicadorW, halign: 'center' };
  colStyles[idx++] = { cellWidth: indicadorW, halign: 'center' };
  colStyles[idx++] = { cellWidth: indicadorW, halign: 'center' };
  colStyles[idx++] = { cellWidth: indicadorW, halign: 'center' };
  colStyles[idx++] = { cellWidth: indicadorW, halign: 'center' };
  if (showSupervisorCols) for (let i = 0; i < 6; i++) colStyles[idx++] = { cellWidth: indicadorW, halign: 'center' };
  colStyles[idx++] = { cellWidth: 14, halign: 'center' };
  colStyles[idx++] = { cellWidth: 18, halign: 'right' };
  colStyles[idx++] = { cellWidth: 18, halign: 'right' };
  colStyles[idx++] = { cellWidth: 18, halign: 'right' };
  colStyles[idx++] = { cellWidth: 18, halign: 'right' };
  const difColIdx = headers.length - 1;
  autoTable(doc, {
    head: [headers], body, startY, styles: { fontSize: 6.5, cellPadding: 1.2, overflow: 'linebreak' },
    headStyles: { fillColor: [0, 80, 0], textColor: 255, fontStyle: 'bold', fontSize: 6.5, halign: 'center' },
    columnStyles: colStyles, alternateRowStyles: { fillColor: [245, 245, 245] },
    didParseCell: (data) => {
      if (data.row.index === body.length - 1) { data.cell.styles.fontStyle = 'bold'; data.cell.styles.fillColor = [220, 240, 220]; }
      if (data.column.index === difColIdx && data.row.index < body.length - 1) {
        const r = rows[data.row.index]; if (r) { const dif = valorFinal(r) - (r.bonus_possivel || 0); data.cell.styles.textColor = dif < 0 ? [200, 0, 0] : dif > 0 ? [0, 140, 0] : [0, 0, 0]; }
      }
      if (data.row.index < body.length - 1 && data.section === 'body') {
        const ci = data.column.index;
        if (ci >= 5 && ci < idxNota) { const val = parseFloat(String(data.cell.text).replace('%', '')); if (!isNaN(val) && val < 100) { data.cell.styles.textColor = [200, 0, 0]; data.cell.styles.fontStyle = 'bold'; } }
      }
    },
  });
  brandedFooter(doc, W);
  doc.save(`relatorio_premiacoes_${ctx.competencia || 'todos'}_${ctx.baseNome || 'todas'}.pdf`);
}

function brandedFooter(doc: jsPDF, W: number) {
  const [dataGeracao, horaGeracao] = getCurrentDateTimeInBrasilia().split(', ');
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFillColor(0, 80, 0); doc.rect(0, 203, W, 1.5, 'F');
    doc.setFontSize(6.5); doc.setTextColor(90, 90, 90); doc.setFont('helvetica', 'normal');
    doc.text(`Gerado em ${dataGeracao} às ${horaGeracao} · Horário de Brasília`, 8, 208);
    doc.text('CONCREM — Documento Confidencial', W / 2, 208, { align: 'center' });
    doc.text(`Página ${i} de ${pageCount}`, W - 8, 208, { align: 'right' });
  }
}
