import ExcelJS from 'exceljs';
import Report from '../models/Report.js';

const formatDate = (date) => {
  const d = new Date(date);
  const localDate = new Date(d.getTime() + d.getTimezoneOffset() * 60000);
  return localDate.toISOString().split('T')[0];
};

export const generateReportExcel = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { startDate, endDate } = req.query;

    let reports = [];
    let fileName = '';

    if (reportId && reportId !== 'undefined' && reportId !== 'null') {
      const report = await Report.findById(reportId).populate('sales.items.productId');
      if (!report) {
        return res.status(404).json({ message: 'Reporte no encontrado' });
      }
      reports = [report];
      console.log(reports.sales)
      fileName = `reporte-${formatDate(report.startDate)}.xlsx`;
    } else if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      reports = await Report.find({
        startDate: { $gte: start, $lte: end }
      }).populate('sales.items.productId');
      
      if (!reports.length) {
        return res.status(404).json({ message: 'No hay reportes en el rango' });
      }
      fileName = `reporte-rango-${formatDate(startDate)}_a_${formatDate(endDate)}.xlsx`;
    } else {
      return res.status(400).json({ message: 'Parámetros insuficientes' });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Reporte de Ventas');

    // Configurar columnas
    worksheet.columns = [
      { header: 'Fecha', key: 'date', width: 15 },
      { header: 'Hora', key: 'time', width: 10 },
      { header: 'Producto', key: 'product', width: 40 },
      { header: 'Código de Barras', key: 'barcode', width: 15 },
      { header: 'Cantidad', key: 'quantity', width: 12 },
      { header: 'Tipo de Venta', key: 'saleType', width: 15 },
      { header: 'Tipo de Pago', key: 'paymentType', width: 15 },
      { header: 'Precio Unitario', key: 'price', width: 15 },
      { header: 'FAC', key: 'fac', width: 15 },
      { header: 'Subtotal', key: 'subtotal', width: 15 }
    ];

    // Estilo básico para el encabezado
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '2F75B5' }
    };

    // Agregar datos
    let currentRow = 2;
    let total = 0;

    reports.forEach(report => {
      report.sales.forEach(sale => {
        sale.items.forEach(item => {
          const saleDate = new Date(sale.createdAt);
          const localDate = new Date(saleDate.getTime() + saleDate.getTimezoneOffset() * 60000);

          const fecha = localDate.toLocaleDateString('es-GT', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
          
          const hora = localDate.toLocaleTimeString('es-GT', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });

          // Manejar los tipos de pago y sus montos
          let tipoPago = '';
          
          // Verificar los payments y obtener los detalles de cada uno
          if (sale.payments.some(payment => payment.isDivided)) {
            const detallesPago = sale.payments.map(payment => {
              if (payment.paymentDetails) {
                if (payment.type === 'efectivo' && payment.amount > 0) {
                  return `Efectivo Q${payment.amount.toFixed(2)}`;
                }
                if (payment.type === 'TC' && payment.amount > 0) {
                  return `TC Q${payment.amount.toFixed(2)}`;
                }
                if (payment.type === 'transferencia' && payment.amount > 0) {
                  return `Transferencia Q${payment.amount.toFixed(2)}`;
                }
              }
              return null;
            }).filter(Boolean);
            
            tipoPago = detallesPago.join(' + ');
          } else {
            // Si no está dividido, usar el tipo de pago único con su monto
            const payment = sale.payments[0];
            tipoPago = `${formatPaymentType(payment.type)} Q${payment.amount.toFixed(2)}`;
          }

          worksheet.addRow({
            date: fecha,
            time: hora,
            product: item.productId?.name || item.name,
            barcode: item.productId?.barcode || item.barcode || '-',
            quantity: item.quantity,
            saleType: formatSaleType(item.saleType),
            paymentType: tipoPago,
            price: `Q${item.price.toFixed(2)}`,
            fac: item.productId?.paymentType === 'gravado' ? 'Gravado' : 'Exento',
            subtotal: `Q${item.subtotal.toFixed(2)}`
          });

          // Aplicar formato de moneda a las columnas numéricas
          worksheet.getCell(`H${currentRow}`).numFmt = '"Q"#,##0.00';
          worksheet.getCell(`J${currentRow}`).numFmt = '"Q"#,##0.00';

          total += item.subtotal;
          currentRow++;
        });
      });
    });

    // Agregar total en la última columna
    worksheet.addRow(['Total', '', '', '', '', '', '', '', '', `Q${total.toFixed(2)}`]);
    const totalRow = worksheet.getRow(currentRow);
    totalRow.font = { bold: true };
    totalRow.getCell(10).numFmt = '"Q"#,##0.00';
    totalRow.getCell(10).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'E2EFD9' }
    };

    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    res.send(buffer);

  } catch (error) {
    console.error('Error al generar Excel:', error);
    res.status(500).json({ message: 'Error al generar el archivo Excel' });
  }
};

// Funciones auxiliares
const formatSaleType = (type) => {
  switch (type) {
    case 'unit': return 'Unidad';
    case 'blister': return 'Blister';
    case 'box': return 'Caja';
    default: return type;
  }
};

const formatPaymentType = (type) => {
  switch (type) {
    case 'efectivo': return 'Efectivo';
    case 'TC': return 'Tarjeta';
    case 'transferencia': return 'Transferencia';
    case 'multiple': return 'Pago Múltiple';
    default: return type;
  }
};
