import { jsPDF } from 'jspdf';

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  gymName: string;
  gymAddress: string | null;
  gymPhone: string | null;
  gymEmail: string | null;
  memberName: string;
  memberEmail: string | null;
  memberPhone: string | null;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  notes: string | null;
  status: string;
}

interface ReportData {
  title: string;
  dateRange: { start: string; end: string };
  gymName: string;
  metrics: {
    label: string;
    value: string | number;
  }[];
  transactions: {
    date: string;
    description: string;
    amount: number;
    status: string;
  }[];
  currency: string;
}

/**
 * Format currency based on locale
 */
function formatCurrency(amount: number, currency: string): string {
  if (currency === 'AOA' || currency === 'Kz') {
    return new Intl.NumberFormat('pt-AO', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + ' Kz';
  }
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount);
}

/**
 * Generate a professional PDF invoice
 */
export function generateInvoicePDF(data: InvoiceData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(data.gymName, 20, y);
  
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (data.gymAddress) {
    doc.text(data.gymAddress, 20, y);
    y += 5;
  }
  if (data.gymPhone) {
    doc.text(`Tel: ${data.gymPhone}`, 20, y);
    y += 5;
  }
  if (data.gymEmail) {
    doc.text(`Email: ${data.gymEmail}`, 20, y);
    y += 5;
  }

  // Invoice title and number
  y += 10;
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('FATURA', pageWidth - 20, 30, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nº: ${data.invoiceNumber}`, pageWidth - 20, 38, { align: 'right' });
  doc.text(`Data: ${data.invoiceDate}`, pageWidth - 20, 44, { align: 'right' });
  if (data.dueDate) {
    doc.text(`Vencimento: ${data.dueDate}`, pageWidth - 20, 50, { align: 'right' });
  }

  // Status badge
  y += 5;
  const statusColors: Record<string, [number, number, number]> = {
    paid: [34, 197, 94],
    issued: [59, 130, 246],
    draft: [156, 163, 175],
    overdue: [239, 68, 68],
    void: [107, 114, 128],
  };
  const statusColor = statusColors[data.status] || [156, 163, 175];
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.roundedRect(pageWidth - 45, 54, 25, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.text(data.status.toUpperCase(), pageWidth - 32.5, 59.5, { align: 'center' });
  doc.setTextColor(0, 0, 0);

  // Bill To section
  y = 80;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('FATURAR A:', 20, y);
  
  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.text(data.memberName, 20, y);
  if (data.memberEmail) {
    y += 5;
    doc.text(data.memberEmail, 20, y);
  }
  if (data.memberPhone) {
    y += 5;
    doc.text(data.memberPhone, 20, y);
  }

  // Line items table
  y = 115;
  
  // Table header
  doc.setFillColor(243, 244, 246);
  doc.rect(20, y - 5, pageWidth - 40, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Descrição', 22, y);
  doc.text('Qtd', 110, y);
  doc.text('Preço Unit.', 130, y);
  doc.text('Total', pageWidth - 22, y, { align: 'right' });

  // Table rows
  y += 10;
  doc.setFont('helvetica', 'normal');
  
  data.items.forEach(item => {
    doc.text(item.description.substring(0, 40), 22, y);
    doc.text(item.quantity.toString(), 112, y);
    doc.text(formatCurrency(item.unitPrice, data.currency), 130, y);
    doc.text(formatCurrency(item.total, data.currency), pageWidth - 22, y, { align: 'right' });
    y += 8;
  });

  // Totals section
  y += 10;
  doc.setDrawColor(229, 231, 235);
  doc.line(120, y - 5, pageWidth - 20, y - 5);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', 130, y);
  doc.text(formatCurrency(data.subtotal, data.currency), pageWidth - 22, y, { align: 'right' });
  
  y += 7;
  doc.text('IVA:', 130, y);
  doc.text(formatCurrency(data.tax, data.currency), pageWidth - 22, y, { align: 'right' });
  
  y += 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('TOTAL:', 130, y);
  doc.text(formatCurrency(data.total, data.currency), pageWidth - 22, y, { align: 'right' });

  // Notes
  if (data.notes) {
    y += 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Notas:', 20, y);
    
    y += 5;
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(data.notes, pageWidth - 40);
    doc.text(splitNotes, 20, y);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text('Documento gerado automaticamente', pageWidth / 2, footerY, { align: 'center' });

  return doc;
}

/**
 * Generate a financial report PDF
 */
export function generateReportPDF(data: ReportData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(data.title, 20, y);
  
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(data.gymName, 20, y);
  
  y += 6;
  doc.setTextColor(107, 114, 128);
  doc.text(`Período: ${data.dateRange.start} - ${data.dateRange.end}`, 20, y);
  doc.setTextColor(0, 0, 0);

  // Metrics summary
  y += 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo', 20, y);
  
  y += 8;
  const metricsPerRow = 3;
  const metricWidth = (pageWidth - 40) / metricsPerRow;
  
  data.metrics.forEach((metric, index) => {
    const col = index % metricsPerRow;
    const row = Math.floor(index / metricsPerRow);
    const x = 20 + col * metricWidth;
    const metricY = y + row * 20;
    
    doc.setFillColor(243, 244, 246);
    doc.roundedRect(x, metricY - 5, metricWidth - 5, 18, 2, 2, 'F');
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(107, 114, 128);
    doc.text(metric.label, x + 3, metricY);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(String(metric.value), x + 3, metricY + 8);
  });

  // Transactions table
  y += Math.ceil(data.metrics.length / metricsPerRow) * 20 + 15;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Transações', 20, y);
  
  y += 8;
  
  // Table header
  doc.setFillColor(243, 244, 246);
  doc.rect(20, y - 4, pageWidth - 40, 8, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Data', 22, y);
  doc.text('Descrição', 50, y);
  doc.text('Status', 130, y);
  doc.text('Valor', pageWidth - 22, y, { align: 'right' });

  // Table rows
  y += 8;
  doc.setFont('helvetica', 'normal');
  
  data.transactions.slice(0, 30).forEach(tx => {
    doc.text(tx.date, 22, y);
    doc.text(tx.description.substring(0, 35), 50, y);
    doc.text(tx.status, 130, y);
    doc.text(formatCurrency(tx.amount, data.currency), pageWidth - 22, y, { align: 'right' });
    y += 6;
    
    if (y > doc.internal.pageSize.getHeight() - 30) {
      doc.addPage();
      y = 20;
    }
  });

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15;
  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  doc.text(`Gerado em ${new Date().toLocaleDateString('pt-AO')}`, pageWidth / 2, footerY, { align: 'center' });

  return doc;
}

/**
 * Download a PDF document
 */
export function downloadPDF(doc: jsPDF, filename: string): void {
  doc.save(filename);
}
