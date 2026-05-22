import type { StageMetricsReport } from '@/services';
import { formatDuration, formatDateTime } from '@/lib/utils';

/** Dispara la descarga de un Blob con el nombre dado. */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function slug(text: string) {
  return (text || 'general')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 50);
}

/** Exporta el reporte de métricas por etapa como CSV. */
export function exportStageMetricsCsv(report: StageMetricsReport) {
  const header = [
    'Etapa',
    'Tiempo promedio',
    'Tiempo promedio (ms)',
    'Tramos completados',
    'Actualmente en etapa',
    'Antiguedad promedio actual',
    'Antiguedad promedio (ms)',
  ];
  const rows = report.stages.map((s) => [
    s.stageName,
    formatDuration(s.avgDurationMs),
    String(s.avgDurationMs),
    String(s.completedSegments),
    String(s.currentlyInStage),
    formatDuration(s.avgCurrentAgeMs),
    String(s.avgCurrentAgeMs),
  ]);
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csv = [header, ...rows]
    .map((r) => r.map(escape).join(','))
    .join('\r\n');
  // BOM para que Excel respete los acentos
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `metricas-etapas-${slug(report.projectName ?? '')}.csv`);
}

/** Exporta el reporte de métricas por etapa como PDF institucional. */
export async function exportStageMetricsPdf(report: StageMetricsReport) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 40;

  doc.setFillColor(0, 146, 63);
  doc.rect(0, 0, pageWidth, 56, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('TrazApp · Alcaldía de Florencia', marginX, 26);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Métricas de tiempo por etapa', marginX, 44);

  doc.setTextColor(23, 23, 23);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  let y = 88;
  doc.text(
    report.projectName ?? 'Todos los proyectos',
    marginX,
    y,
  );
  y += 18;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(82, 82, 82);
  [
    `Actividades consideradas: ${report.totalActivities}`,
    `Generado: ${formatDateTime(report.generatedAt)}`,
  ].forEach((line) => {
    doc.text(line, marginX, y);
    y += 14;
  });
  y += 8;

  const rows = report.stages.map((s) => [
    s.stageName,
    formatDuration(s.avgDurationMs),
    String(s.completedSegments),
    String(s.currentlyInStage),
    formatDuration(s.avgCurrentAgeMs),
  ]);

  autoTable(doc, {
    startY: y,
    margin: { left: marginX, right: marginX },
    head: [
      [
        'Etapa',
        'Tiempo promedio',
        'Completadas',
        'En etapa ahora',
        'Antigüedad prom.',
      ],
    ],
    body:
      rows.length > 0
        ? rows
        : [['—', '—', '—', '—', 'Sin datos de historial']],
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: 6,
      overflow: 'linebreak',
      textColor: [38, 38, 38],
    },
    headStyles: {
      fillColor: [0, 116, 47],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [250, 250, 250] },
  });

  doc.save(`metricas-etapas-${slug(report.projectName ?? '')}.pdf`);
}
