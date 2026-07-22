// Geração de relatório de auditoria de EPI (PDF). Não existia nenhum gerador
// funcional antes (o botão "Relatório" da tela legada não tinha onClick) —
// este é um gerador novo e real, reaproveitando jsPDF/jspdf-autotable (já
// usadas em RelatorioPremiacao.tsx e no relatório de DSS), sem inventar
// dados: usa somente as auditorias já carregadas e agrupadas.
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { EpiAuditGroupEnriched } from './epiCalculations';
import { formatDateBR, getCurrentDateTimeInBrasilia, getCurrentDateInBrasilia } from '@/lib/dateTime';

const fmtDate = (d: string) => formatDateBR(d);

function drawHeader(doc: jsPDF, W: number, title: string, subtitle?: string): number {
  doc.setFillColor(0, 70, 40);
  doc.rect(0, 0, W, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('CONCREM — ' + title, W / 2, 12, { align: 'center' });
  if (subtitle) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, W / 2, 19, { align: 'center' });
  }
  doc.setFillColor(52, 168, 83);
  doc.rect(0, 24, W, 1.5, 'F');
  return 32;
}

function drawFooter(doc: jsPDF, W: number) {
  const [dataGeracao, horaGeracao] = getCurrentDateTimeInBrasilia().split(', ');
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text(`Gerado em ${dataGeracao} às ${horaGeracao} · Horário de Brasília`, 8, 205);
    doc.text(`Página ${i} de ${pages}`, W - 8, 205, { align: 'right' });
  }
}

/** Relatório de uma única auditoria: totais e lista de conformes/não conformes. */
export function generateSingleEpiReport(group: EpiAuditGroupEnriched) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  let y = drawHeader(doc, W, 'RELATÓRIO DE AUDITORIA DE EPI', `${group.titulo} · ${fmtDate(group.data)}`);

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const taxa = group.taxaConformidade != null ? `${group.taxaConformidade.toFixed(1)}%` : '—';
  doc.text(
    `Auditados: ${group.totalAuditados} · Conformes: ${group.conformes} · Não conformes: ${group.naoConformes} · Taxa: ${taxa}`,
    10, y + 4,
  );
  y += 12;

  const conformes = group.membros.filter((m) => m.conforme);
  const naoConformes = group.membros.filter((m) => !m.conforme);

  autoTable(doc, {
    startY: y,
    head: [['Conformes']],
    body: conformes.length ? conformes.map((m) => [m.nome]) : [['Nenhum funcionário conforme']],
    headStyles: { fillColor: [0, 100, 50], fontSize: 9 },
    styles: { fontSize: 8 },
    margin: { left: 10, right: 105 },
  });

  autoTable(doc, {
    startY: y,
    head: [['Não conformes']],
    body: naoConformes.length ? naoConformes.map((m) => [m.nome]) : [['Nenhum funcionário não conforme']],
    headStyles: { fillColor: [180, 40, 45], fontSize: 9 },
    styles: { fontSize: 8 },
    margin: { left: 105, right: 10 },
  });

  drawFooter(doc, W);
  doc.save(`epi_auditoria_${group.data}.pdf`);
}

/** Relatório de período: lista de auditorias filtradas com taxa de conformidade. */
export function generatePeriodEpiReport(groups: EpiAuditGroupEnriched[], subtitle: string) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297;
  const y = drawHeader(doc, W, 'RELATÓRIO DE EPI — PERÍODO', subtitle);

  autoTable(doc, {
    startY: y,
    head: [['Data', 'Título', 'Auditados', 'Conformes', 'Não conformes', 'Taxa']],
    body: groups.map((g) => [
      fmtDate(g.data), g.titulo, String(g.totalAuditados), String(g.conformes), String(g.naoConformes),
      g.taxaConformidade != null ? `${g.taxaConformidade.toFixed(1)}%` : '—',
    ]),
    headStyles: { fillColor: [0, 100, 50], fontSize: 8 },
    styles: { fontSize: 7.5 },
    margin: { left: 8, right: 8 },
  });

  drawFooter(doc, W);
  doc.save(`epi_periodo_${getCurrentDateInBrasilia()}.pdf`);
}
