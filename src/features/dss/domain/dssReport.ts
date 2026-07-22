// Geração de relatório de DSS (PDF). Não existia nenhum gerador funcional
// antes (o botão "Relatório" da tela legada não tinha onClick) — este é um
// gerador novo e real, reaproveitando jsPDF/jspdf-autotable (dependências já
// usadas em RelatorioPremiacao.tsx), sem inventar dados: usa somente os
// registros de DSS e funcionários já carregados.
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Funcionario } from '@/hooks/useFuncionarios';
import type { DssHistoryRow } from '../types';
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

/** Relatório de um único DSS: tema, local, data, presentes e ausentes. */
export function generateSingleDssReport(params: {
  titulo: string; localNome: string; dataRealizacao: string;
  presentes: Funcionario[]; ausentes: Funcionario[];
}) {
  const { titulo, localNome, dataRealizacao, presentes, ausentes } = params;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210;
  let y = drawHeader(doc, W, 'RELATÓRIO DE DSS', `${localNome} · ${fmtDate(dataRealizacao)}`);

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Tema: ${titulo}`, 10, y + 4);
  doc.setFont('helvetica', 'normal');
  doc.text(`Presentes: ${presentes.length} · Ausentes: ${ausentes.length} · Total vinculado: ${presentes.length + ausentes.length}`, 10, y + 10);
  y += 16;

  autoTable(doc, {
    startY: y,
    head: [['Presentes']],
    body: presentes.length ? presentes.map((f) => [f.nome]) : [['Nenhum funcionário presente']],
    headStyles: { fillColor: [0, 100, 50], fontSize: 9 },
    styles: { fontSize: 8 },
    margin: { left: 10, right: 105 },
  });

  autoTable(doc, {
    startY: y,
    head: [['Ausentes']],
    body: ausentes.length ? ausentes.map((f) => [f.nome]) : [['Nenhum funcionário ausente']],
    headStyles: { fillColor: [180, 40, 45], fontSize: 9 },
    styles: { fontSize: 8 },
    margin: { left: 105, right: 10 },
  });

  drawFooter(doc, W);
  doc.save(`dss_${titulo.replace(/\s+/g, '_').toLowerCase()}_${dataRealizacao}.pdf`);
}

/** Relatório de período: lista de DSS filtrados com participação. */
export function generatePeriodDssReport(rows: DssHistoryRow[], subtitle: string) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297;
  const y = drawHeader(doc, W, 'RELATÓRIO DE DSS — PERÍODO', subtitle);

  autoTable(doc, {
    startY: y,
    head: [['Data', 'Tema', 'Local', 'Presentes', 'Vinculados', 'Participação']],
    body: rows.map((r) => [
      fmtDate(r.data_realizacao), r.titulo, r.localNome || '—',
      String(r.presentes), r.totalVinculado != null ? String(r.totalVinculado) : '—',
      r.participacao != null ? `${r.participacao.toFixed(1)}%` : '—',
    ]),
    headStyles: { fillColor: [0, 100, 50], fontSize: 8 },
    styles: { fontSize: 7.5 },
    margin: { left: 8, right: 8 },
  });

  drawFooter(doc, W);
  doc.save(`dss_periodo_${getCurrentDateInBrasilia()}.pdf`);
}
