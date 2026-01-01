import PDFDocument from 'pdfkit';
import Report from '../models/Report.js';

const formatCurrency = (amount) => {
  return `Q${amount.toFixed(2)}`;
};
 
const formatDate = (dateString) => {
  const date = new Date(dateString);
  // Ajustar la fecha para la zona horaria local
  const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  return localDate.toLocaleDateString('es-GT', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  // Ajustar la hora para la zona horaria local
  const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
  return localDate.toLocaleTimeString('es-GT', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

const formatSaleType = (type) => {
  switch (type) {
    case 'unit': return 'Unidad';
    case 'blister': return 'Blister';
    case 'box': return 'Caja';
    default: return type;
  }
};



export const generateReportPDF = async (req, res) => {
  try {
    const { reportId, startDate, endDate } = req.body;

    let reports = [];
    if (startDate && endDate) {
      // Si vienen fechas, busca todos los reportes en el rango
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      reports = await Report.find({
        startDate: { $gte: start, $lte: end }
      }).populate('sales.items.productId').sort({ startDate: 1 });
    } else if (reportId) {
      // Si viene un ID, busca solo ese reporte
      const report = await Report.findById(reportId).populate('sales.items.productId');
      if (!report) {
        return res.status(404).json({ message: 'Reporte no encontrado' });
      }
      reports = [report];
    } else {
      return res.status(400).json({ message: 'Debes proporcionar reportId o startDate y endDate' });
    }

    if (!reports.length) {
      return res.status(404).json({ message: 'No se encontraron reportes para generar el PDF' });
    }

    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      info: {
        Title: 'Reporte de Ventas - Melbo',
        Author: 'Melbo System',
      }
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=reporte-${new Date().toISOString().split('T')[0]}.pdf`);

    doc.pipe(res);

    // Encabezado
    doc.fontSize(24)
      .font('Helvetica-Bold')
      .text('Melbo', { align: 'center' });
    
    doc.moveDown(0.5);
    
    doc.lineWidth(1)
      .moveTo(50, 100)
      .lineTo(545, 100)
      .stroke('#2563eb');

    // Título del reporte
    doc.moveDown(1);
    doc.fontSize(16)
      .font('Helvetica')
      .fillColor('#1e40af')
      .text(startDate && endDate ? 'Reporte de Ventas - Rango de Fechas' : 'Reporte de Ventas - Resumen', { align: 'center' });

    // Información general
    doc.moveDown(1);
    doc.fontSize(12)
      .fillColor('#374151');

    const infoY = doc.y;
    doc.roundedRect(50, infoY, 495, 70, 5)
      .fillAndStroke('#f8fafc', '#e2e8f0');
    
    doc.fillColor('#1f2937')
      .text('Información del Reporte', 70, infoY + 15, { fontSize: 14, font: 'Helvetica-Bold' });
    
    // Mostrar información según el tipo de reporte
    if (startDate && endDate) {
      const dateText = `Rango de Fechas: ${formatDate(startDate)} - ${formatDate(endDate)}`;
      const reportsText = `Total de Reportes: ${reports.length}`;
      
      // Calcular el ancho del texto para evitar sobreposición
      const dateWidth = doc.widthOfString(dateText);
      const reportsWidth = doc.widthOfString(reportsText);
      
      doc.fontSize(11)
        .text(dateText, 70, infoY + 35)
        .text(reportsText, 545 - reportsWidth, infoY + 35); // Alinear a la derecha
    } else {
      const dateText = `Fecha: ${formatDate(reports[0].startDate)}`;
      const statusText = `Estado: ${reports[0].status === 'active' ? 'Activo' : 'Completado'}`;
      
      // Calcular el ancho del texto para evitar sobreposición
      const dateWidth = doc.widthOfString(dateText);
      const statusWidth = doc.widthOfString(statusText);
      
      doc.fontSize(11)
        .text(dateText, 70, infoY + 35)
        .text(statusText, 545 - statusWidth, infoY + 35); // Alinear a la derecha
    }

    // Calcular totales generales
    const totales = reports.reduce((acc, report) => {
      acc.ventas += report.totalSales || 0;
      acc.productos += report.totalProducts || 0;
      acc.transacciones += report.sales ? report.sales.length : 0;
      return acc;
    }, { ventas: 0, productos: 0, transacciones: 0 });

    // Resumen de ventas
    doc.moveDown(3);
    const summaryY = doc.y;
    const cardWidth = 150;
    const cardSpacing = 20;

    // Tarjeta de Total de Ventas
    doc.roundedRect(50, summaryY, cardWidth, 80, 5)
      .fillAndStroke('#eef2ff', '#c7d2fe');
    doc.fillColor('#312e81')
      .fontSize(12)
      .text('Total de Ventas', 60, summaryY + 15, { width: cardWidth - 20, align: 'center' })
      .fontSize(16)
      .font('Helvetica-Bold')
      .text(formatCurrency(totales.ventas), 60, summaryY + 40, { width: cardWidth - 20, align: 'center' });

    // Tarjeta de Productos Vendidos
    doc.roundedRect(50 + cardWidth + cardSpacing, summaryY, cardWidth, 80, 5)
      .fillAndStroke('#f0fdf4', '#bbf7d0');
    doc.fillColor('#166534')
      .fontSize(12)
      .text('Productos Vendidos', 60 + cardWidth + cardSpacing, summaryY + 15, { width: cardWidth - 20, align: 'center' })
      .fontSize(16)
      .font('Helvetica-Bold')
      .text(totales.productos.toString(), 60 + cardWidth + cardSpacing, summaryY + 40, { width: cardWidth - 20, align: 'center' });

    // Tarjeta de Transacciones
    doc.roundedRect(50 + (cardWidth + cardSpacing) * 2, summaryY, cardWidth, 80, 5)
      .fillAndStroke('#fff1f2', '#fecdd3');
    doc.fillColor('#9f1239')
      .fontSize(12)
      .text('Transacciones', 60 + (cardWidth + cardSpacing) * 2, summaryY + 15, { width: cardWidth - 20, align: 'center' })
      .fontSize(16)
      .font('Helvetica-Bold')
      .text(totales.transacciones.toString(), 60 + (cardWidth + cardSpacing) * 2, summaryY + 40, { width: cardWidth - 20, align: 'center' });

    // Detalle de ventas por reporte
    reports.forEach((report, reportIndex) => {
      if (reportIndex > 0 || doc.y > 600) {
        doc.addPage();
      }

      doc.moveDown(2);
      const reportDateText = formatDate(report.startDate);
      doc.font('Helvetica-Bold')
        .fontSize(14)
        .fillColor('#1f2937')
        .text(`Reporte ${reportDateText}`, { 
          underline: true,
          align: 'left' // Asegurar alineación a la izquierda
        });

      if (!report.sales || report.sales.length === 0) {
        doc.moveDown(1);
        doc.font('Helvetica')
          .fontSize(12)
          .fillColor('#6b7280')
          .text('No hay ventas registradas en este período');
      } else {
        report.sales.forEach((sale, index) => {
          if (doc.y > 700) {
            doc.addPage();
          }

          doc.moveDown(1.5);
          
          const saleHeaderY = doc.y;
          doc.roundedRect(50, saleHeaderY, 495, 30, 5)
            .fillAndStroke('#f1f5f9', '#e2e8f0');
          
          doc.fillColor('#1f2937')
            .fontSize(12)
            .font('Helvetica-Bold')
            .text(`Venta #${index + 1}`, 60, saleHeaderY + 8)
            .font('Helvetica')
            .fontSize(11)
            .text(`Fecha: ${formatDate(sale.createdAt)}`, 200, saleHeaderY + 8)
            .text(`Total: ${formatCurrency(sale.total)}`, 400, saleHeaderY + 8);

          // Tabla de productos
          if (sale.items && sale.items.length > 0) {
            doc.moveDown(1);
            const tableTop = doc.y;
            doc.font('Helvetica-Bold')
              .fontSize(10);

            const colX = {
              producto: 60,
              cantidad: 260,
              tipo: 320,
              precio: 400,
              subtotal: 480
            };

            doc.text('Producto', colX.producto, tableTop)
              .text('Cantidad', colX.cantidad, tableTop)
              .text('Tipo', colX.tipo, tableTop)
              .text('Precio', colX.precio, tableTop)
              .text('Subtotal', colX.subtotal, tableTop);

            doc.moveDown(0.5);
            doc.lineWidth(0.5)
              .moveTo(50, doc.y)
              .lineTo(545, doc.y)
              .stroke('#e5e7eb');

            sale.items.forEach(item => {
              if (doc.y > 700) {
                doc.addPage();
              }

              doc.moveDown(0.5);
              const rowY = doc.y;
              
              doc.font('Helvetica')
                .fontSize(10)
                .text(item.productId?.name || item.name || 'Producto no disponible', colX.producto, rowY, { width: 190 })
                .text(item.quantity.toString(), colX.cantidad, rowY)
                .text(formatSaleType(item.saleType), colX.tipo, rowY)
                .text(formatCurrency(item.price), colX.precio, rowY)
                .text(formatCurrency(item.subtotal), colX.subtotal, rowY);
            });
          }
        });
      }
    });

    // Pie de página
    const pageBottom = doc.page.height - 50;
    doc.lineWidth(1)
      .moveTo(50, pageBottom - 20)
      .lineTo(545, pageBottom - 20)
      .stroke('#e5e7eb');

    doc.fontSize(8)
      .fillColor('#6b7280')
      .text(
        'Melbo - Sistema de Gestión',
        50,
        pageBottom - 10,
        { align: 'center' }
      );

    doc.end();
  } catch (error) {
    console.error('Error generando PDF:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error generando PDF' });
    }
  }
};
