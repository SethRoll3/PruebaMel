import Report from '../models/Report.js';

// Crear un nuevo reporte diario
export const createDailyReport = async (req, res) => {
  try {
    const { ubicacion, role } = req.user;
    const now = new Date();
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999); // Final del día actual

    const query = {
      startDate: {
        $gte: new Date(now.setHours(0, 0, 0, 0)), // Inicio del día actual
        $lt: endOfDay
      }
    };

    // Solo aplicar filtro de ubicación si no es admin
    if (role !== 'admin') {
      query.ubicacion = ubicacion;
    }

    // Verificar si ya existe un reporte para hoy y esta ubicación
    const existingReport = await Report.findOne(query);

    if (existingReport) {
      return res.json({ success: true, report: existingReport });
    }

    const report = new Report({
      ubicacion,
      startDate: now, // Hora actual de creación
      endDate: endOfDay, // Fin del día actual (23:59:59.999)
      sales: [],
      totalSales: 0,
      totalProducts: 0,
      status: 'active'
    });

    await report.save();
    console.log('Nuevo reporte creado:', report);
    return res.json({ success: true, report });
  } catch (error) {
    console.error('Error al crear reporte diario:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error al crear el reporte diario' 
    });
  }
};

// Obtener reporte actual
export const getCurrentReport = async (req, res) => {
  try {
    const { ubicacion, role } = req.user;
    console.log(ubicacion)
    const { ubicacion: queryUbicacion } = req.query;
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const query = {
      status: 'active',
      startDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    };

    // Si es admin y proporciona una ubicación en la consulta, usar esa
    if (role === 'admin' && queryUbicacion) {
      query.ubicacion = queryUbicacion;
    } else if (role !== 'admin') {
      // Si no es admin, usar su ubicación asignada
      query.ubicacion = ubicacion;
    }

    const report = await Report.findOne(query);
    
    console.log('Fecha actual:', now);
    console.log('Reporte encontrado:', report);

    if (!report) {
      return res.status(404).json({ message: 'No hay reporte activo para hoy' });
    }

    res.json(report);
  } catch (error) {
    console.error('Error al obtener reporte actual:', error);
    res.status(500).json({ message: 'Error al obtener reporte actual' });
  }
};

// Agregar una venta al reporte activo
export const addSaleToReport = async (req, res) => {
  try {
    const { items, total, paymentType, createdAt, appliedPromotions } = req.body;
    const { ubicacion, role } = req.user;
    console.log(paymentType); 
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const query = { 
      status: 'active',
      startDate: {
        $gte: today,
        $lt: tomorrow
      }
    };

    // Solo aplicar filtro de ubicación si no es admin
    if (role !== 'admin') {
      query.ubicacion = ubicacion;
    }
    
    const activeReport = await Report.findOne(query);

    if (!activeReport) {
      return res.status(404).json({ message: 'No hay reporte activo' });
    }

    const localDate = new Date(createdAt);
    
    // Crear los objetos de pago según el esquema
    const payments = [];
    
    if (paymentType.isDivided) {
      // Si el pago está dividido, crear un pago por cada tipo con monto mayor a 0
      Object.entries(paymentType.paymentDetails).forEach(([type, amount]) => {
        if (amount > 0) {
          payments.push({
            type,
            amount,
            isDivided: true,
            paymentDetails: paymentType.paymentDetails
          });
        }
      });
    } else {
      // Si no está dividido, crear un solo pago
      payments.push({
        type: paymentType.type,
        amount: total,
        isDivided: false,
        paymentDetails: {
          efectivo: paymentType.type === 'efectivo' ? total : 0,
          TC: paymentType.type === 'TC' ? total : 0,
          transferencia: paymentType.type === 'transferencia' ? total : 0
        }
      });
    }

    // Crear el objeto de venta con los pagos y promociones incluidos
    const saleObject = {
      items: items.map(item => ({
        productId: item.productId,
        barcode: item.barcode,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        saleType: item.saleType,
        unitsPerSale: item.unitsPerSale,
        subtotal: item.subtotal,
        appliedPromotion: item.appliedPromotion // Información de promoción por item
      })),
      total,
      totalDiscount: appliedPromotions?.reduce((acc, promo) => acc + (promo.discountAmount || 0), 0) || 0,
      appliedPromotions, // Array de promociones aplicadas a la venta
      payments,
      createdAt: localDate
    };

    // Inicializar totalsByPaymentType si no existe
    if (!activeReport.totalsByPaymentType) {
      activeReport.totalsByPaymentType = {
        efectivo: 0,
        TC: 0,
        transferencia: 0
      };
    }

    // Actualizar los totales por tipo de pago
    if (paymentType.isDivided) {
      Object.entries(paymentType.paymentDetails).forEach(([type, amount]) => {
        if (amount > 0) {
          activeReport.totalsByPaymentType[type] = (activeReport.totalsByPaymentType[type] || 0) + amount;
        }
      });
    } else {
      activeReport.totalsByPaymentType[paymentType.type] = (activeReport.totalsByPaymentType[paymentType.type] || 0) + total;
    }

    // Agregar la venta al reporte
    activeReport.sales.push(saleObject);

    // Actualizar totales generales
    activeReport.totalSales += total;
    activeReport.totalProducts += items.reduce((acc, item) => acc + (item.quantity * item.unitsPerSale), 0);

    await activeReport.save();
    
    res.json(activeReport);
  } catch (error) {
    console.error('Error en addSaleToReport:', error);
    res.status(500).json({ message: 'Error al agregar venta al reporte' });
  }
};

// Cerrar el reporte actual
export const closeCurrentReport = async () => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    
    // Buscar todos los reportes activos anteriores a hoy
    const activeReports = await Report.find({
      status: 'active',
      startDate: { $lt: startOfDay }
    }).populate('ubicacion');

    // Cerrar cada reporte encontrado
    for (const report of activeReports) {
      if (!report.ubicacion) {
        console.warn('Reporte sin ubicación encontrado:', report._id);
        continue;
      }
      report.status = 'closed';
      await report.save();
    }

    console.log(`${activeReports.length} reportes cerrados exitosamente`);
  } catch (error) {
    console.warn('Error al cerrar reportes:', error);
    throw error;
  }
}


// Obtener historial de reportes
export const getReportHistory = async (req, res) => {
  try {
    const { ubicacion, role } = req.user;
    const query = { status: 'completed' };

    // Solo aplicar filtro de ubicación si no es admin
    if (role !== 'admin') {
      query.ubicacion = ubicacion;
    }

    const reports = await Report.find(query)
      .sort({ endDate: -1 })
      .limit(30); // Últimos 30 reportes

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener historial de reportes' });
  }
};

export const getReportByDate = async (req, res) => {
  try {
    const { date } = req.params;
    const { ubicacion, role } = req.user;
    console.log(ubicacion, date)
    const selectedDate = new Date(date);
    const startOfDay = new Date(selectedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(selectedDate.setHours(23, 59, 59, 999));

    const query = {
      startDate: {
        $gte: startOfDay,
        $lte: endOfDay
      }
    };

    // Solo aplicar filtro de ubicación si no es admin
    if (role !== 'admin') {
      query.ubicacion = ubicacion;
    }

    const report = await Report.findOne(query);

    if (!report) {
      return res.status(404).json({ message: 'No hay reporte para esta fecha' });
    }

    res.json(report);
  } catch (error) {
    console.error('Error al obtener reporte por fecha:', error);
    res.status(500).json({ message: 'Error al obtener reporte' });
  }
};

// Obtener ventas por día
export const getDailySalesStats = async (req, res) => {
  try {
    const { ubicacion, role } = req.user;
    // Obtener los últimos 30 días por defecto
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const query = {
      startDate: { $gte: startDate, $lte: endDate },
      status: 'completed'
    };

    // Solo aplicar filtro de ubicación si no es admin
    if (role !== 'admin') {
      query.ubicacion = ubicacion;
    }

    const reports = await Report.find(query);

    // Agrupar ventas por día
    const dailySales = reports.reduce((acc, report) => {
      const date = report.startDate.toISOString().split('T')[0];
      
      if (!acc[date]) {
        acc[date] = {
          totalSales: 0,
          numberOfSales: 0
        };
      }
      
      acc[date].totalSales += report.totalSales;
      acc[date].numberOfSales += report.sales.length;
      
      return acc;
    }, {});

    // Convertir a array y ordenar por fecha
    const dailySalesArray = Object.entries(dailySales).map(([date, stats]) => ({
      date,
      ...stats
    })).sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({ success: true, data: dailySalesArray });
  } catch (error) {
    console.error('Error al obtener estadísticas de ventas diarias:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener estadísticas de ventas diarias'
    });
  }
};

export const getReportsByRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const { ubicacion, role } = req.user;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Debes proporcionar startDate y endDate' });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const query = {
      startDate: { $gte: start, $lte: end }
    };

    // Solo aplicar filtro de ubicación si no es admin
    if (role !== 'admin') {
      query.ubicacion = ubicacion;
    }

    const reports = await Report.find(query).sort({ startDate: 1 });

    res.json(reports);
  } catch (error) {
    console.error('Error al obtener reportes por rango:', error);
    res.status(500).json({ message: 'Error al obtener reportes por rango de fechas' });
  }
};