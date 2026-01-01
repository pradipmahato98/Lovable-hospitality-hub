import jsPDF from "jspdf";
import * as XLSX from "xlsx";

interface ReportData {
  title: string;
  headers: string[];
  rows: (string | number)[][];
  generatedAt?: string;
}

export function exportToPDF(data: ReportData): void {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(data.title, 14, 22);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${data.generatedAt || new Date().toLocaleString()}`, 14, 30);

  // Table
  let y = 40;
  const cellPadding = 4;
  const colWidths = data.headers.map(() => 180 / data.headers.length);

  // Header row
  doc.setFillColor(38, 38, 38);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");

  let x = 14;
  data.headers.forEach((header, i) => {
    doc.rect(x, y, colWidths[i], 10, "F");
    doc.text(header, x + cellPadding, y + 7);
    x += colWidths[i];
  });

  y += 10;

  // Data rows
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  data.rows.forEach((row, rowIndex) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    x = 14;
    const bgColor = rowIndex % 2 === 0 ? 250 : 240;
    doc.setFillColor(bgColor, bgColor, bgColor);

    row.forEach((cell, i) => {
      doc.rect(x, y, colWidths[i], 8, "F");
      doc.text(String(cell).slice(0, 25), x + cellPadding, y + 5);
      x += colWidths[i];
    });
    y += 8;
  });

  doc.save(`${data.title.replace(/\s+/g, "_")}.pdf`);
}

export function exportToExcel(data: ReportData): void {
  const worksheetData = [data.headers, ...data.rows];
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths
  const colWidths = data.headers.map((h) => ({ wch: Math.max(h.length + 2, 12) }));
  worksheet["!cols"] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Report");

  XLSX.writeFile(workbook, `${data.title.replace(/\s+/g, "_")}.xlsx`);
}
