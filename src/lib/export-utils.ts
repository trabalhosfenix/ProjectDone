import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";

export const exportToExcel = (data: any[], fileName: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");
  XLSX.writeFile(workbook, `${fileName}_${format(new Date(), "yyyyMMdd_HHmm")}.xlsx`);
};

export const exportToPDF = (data: any[], title: string, stats?: any) => {
  const doc = new jsPDF() as any;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(9, 65, 96); // #094160
  doc.text("ProjectDone - Management Report", 14, 22);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy HH:mm")}`, 14, 30);

  // Stats Summary
  if (stats) {
    doc.setDrawColor(200);
    doc.line(14, 35, 196, 35);
    
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Resumo Executivo:", 14, 45);
    
    doc.setFontSize(10);
    doc.text(`Total de Itens: ${stats.total}`, 14, 55);
    doc.text(`Concluídos: ${stats.completed}`, 60, 55);
    doc.text(`Pendentes: ${stats.pending}`, 110, 55);
    doc.text(`Bloqueados: ${stats.blocked}`, 160, 55);
    
    doc.line(14, 62, 196, 62);
  }

  const startY = stats ? 70 : 40;

  // Table
  const tableColumn = ["ID", "Tarefa", "Responsável", "Status", "Dt. Conclusão"];
  const tableRows = data.map(item => [
    item.externalId || item.id.substring(0,8),
    item.task || "N/A",
    item.responsible || "N/A",
    item.status || "N/A",
    item.dateActual ? format(new Date(item.dateActual), "dd/MM/yyyy") : "-"
  ]);

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: startY,
    theme: 'grid',
    headStyles: { fillColor: [9, 65, 96], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    margin: { top: 10 },
  });

  doc.save(`${title.replace(/\s+/g, '_')}_Report.pdf`);
};
