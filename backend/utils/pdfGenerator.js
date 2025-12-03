import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

export async function generateRevenueReportPdf(reportData) {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const stream = doc.pipe(new PassThrough());

  const formatCurrency = (amount) => `$${amount.toFixed(2)}`;

  // --- Header ---
  doc
    .fontSize(25)
    .text('Vortex LMS Revenue Report', { align: 'center' })
    .moveDown();

  doc
    .fontSize(10)
    .text(`Report Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, { align: 'center' })
    .moveDown(1);

  // --- Overall Summary ---
  doc
    .fontSize(18)
    .text('Overall Summary', { underline: true })
    .moveDown(0.5);

  doc
    .fontSize(14)
    .fillColor('#10B981')
    .text(`Total Revenue: ${formatCurrency(reportData.totalRevenue)}`)
    .moveDown(0.5);

  doc
    .fontSize(12)
    .fillColor('#333333')
    .text(`Total Paid Courses: ${reportData.courseReports.length}`)
    .text(`Total Purchases: ${reportData.courseReports.reduce((sum, r) => sum + r.purchases, 0)}`)
    .moveDown(1.5);

  // --- Detailed Course Revenue Table ---
  doc
    .fontSize(18)
    .fillColor('#000000')
    .text('Detailed Course Revenue', { underline: true })
    .moveDown(0.5);

  const table = {
    headers: ['Course Title', 'Purchases', 'Total Revenue'],
    rows: reportData.courseReports.map(r => [
      r.title,
      r.purchases.toString(),
      formatCurrency(r.revenue)
    ])
  };

  const tableTop = doc.y;
  const itemX = 50;
  const purchasesX = 350;
  const revenueX = 450;
  const rowHeight = 20;

  // Draw Headers
  doc.fontSize(12).font('Helvetica-Bold');
  doc.text(table.headers[0], itemX, tableTop, { width: 280 });
  doc.text(table.headers[1], purchasesX, tableTop, { width: 100, align: 'right' });
  doc.text(table.headers[2], revenueX, tableTop, { width: 100, align: 'right' });
  doc.moveDown(0.2);

  // Draw Header Separator
  doc.lineWidth(1).strokeColor('#cccccc').moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown(0.5);

  // Draw Rows
  doc.fontSize(10).font('Helvetica');
  let currentY = doc.y;

  table.rows.forEach((row, index) => {
    // Check if we need a new page
    if (currentY + rowHeight > doc.page.height - doc.page.margins.bottom) {
      doc.addPage();
      currentY = doc.page.margins.top;
      
      // Redraw headers on new page
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text(table.headers[0], itemX, currentY, { width: 280 });
      doc.text(table.headers[1], purchasesX, currentY, { width: 100, align: 'right' });
      doc.text(table.headers[2], revenueX, currentY, { width: 100, align: 'right' });
      doc.moveDown(0.2);
      doc.lineWidth(1).strokeColor('#cccccc').moveTo(50, doc.y).lineTo(550, doc.y).stroke().moveDown(0.5);
      doc.fontSize(10).font('Helvetica');
      currentY = doc.y;
    }

    doc.text(row[0], itemX, currentY, { width: 280 });
    doc.text(row[1], purchasesX, currentY, { width: 100, align: 'right' });
    doc.text(row[2], revenueX, currentY, { width: 100, align: 'right' });
    currentY += rowHeight;
    doc.y = currentY;
  });

  doc.end();
  return stream;
}