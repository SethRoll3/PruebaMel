import Report from '../../reports/models/Report.js';
import { startOfDay, startOfWeek, startOfMonth, endOfDay, startOfYear, endOfYear, eachMonthOfInterval } from 'date-fns';
import Product from '../../products/models/Product.js';
import { endOfMonth } from 'date-fns';
import { 
  getWeeklyEarnings, 
  getMonthlyEarnings, 
  getPreviousWeekEarnings,
  getPreviousMonthEarnings,
  getFifteenDaysEarnings 
} from '../services/statsService.js';

export const getTopSellingProducts = async (req, res) => {
  try {
    const { ubicacion, role } = req.user;
    const { period = 'day' } = req.query;
    let startDate;
    const endDate = endOfDay(new Date());

    switch (period) {
      case 'week':
        startDate = startOfWeek(new Date());
        break;
      case 'month':
        startDate = startOfMonth(new Date());
        break;
      default: // day
        startDate = startOfDay(new Date());
    }

    const query = {
      startDate: { $gte: startDate },
      endDate: { $lte: endDate }
    };

    // Solo aplicar filtro de ubicación si no es admin
    if (role !== 'admin') {
      query.ubicacion = ubicacion;
    }

    const reports = await Report.find(query);

    // Agrupar ventas por producto
    const productStats = {};

    reports.forEach(report => {
      report.sales.forEach(sale => {
        sale.items.forEach(item => {
          const productId = item.productId.toString();
          
          if (!productStats[productId]) {
            productStats[productId] = {
              productId,
              name: item.name,
              totalUnits: 0,
              totalAmount: 0,
              salesByType: {
                unit: 0,
                blister: 0,
                box: 0
              }
            };
          }

          // Actualizar estadísticas por tipo de venta
          productStats[productId].salesByType[item.saleType] += item.quantity;
          productStats[productId].totalAmount += item.subtotal;
          productStats[productId].totalUnits += (item.quantity * item.unitsPerSale);
        });
      });
    });

    // Convertir a array y ordenar por unidades totales
    const topProducts = Object.values(productStats)
      .sort((a, b) => b.totalUnits - a.totalUnits)
      .slice(0, 5);

    res.json(topProducts);
  } catch (error) {
    console.error('Error al obtener productos más vendidos:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
};

export const getMonthlySalesStats = async (req, res) => {
  try {
    const { ubicacion, role } = req.user;
    const startDate = startOfYear(new Date());
    const endDate = endOfYear(new Date());
    
    const query = {
      startDate: { $gte: startDate },
      endDate: { $lte: endDate }
    };

    // Solo aplicar filtro de ubicación si no es admin
    if (role !== 'admin') {
      query.ubicacion = ubicacion;
    }
    
    const reports = await Report.find(query);

    // Crear array con todos los meses del año
    const monthsData = eachMonthOfInterval({
      start: startDate,
      end: endDate
    }).map(date => ({
      month: date.getMonth(),
      totalSales: 0,
      numberOfSales: 0
    }));

    // Agrupar ventas por mes
    reports.forEach(report => {
      report.sales.forEach(sale => {
        const saleMonth = new Date(sale.createdAt).getMonth();
        monthsData[saleMonth].totalSales += sale.total;
        monthsData[saleMonth].numberOfSales += 1;
      });
    });

    res.json(monthsData);
  } catch (error) {
    console.error('Error al obtener estadísticas mensuales:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
};

export const getProductsSalesStats = async (req, res) => {
  try {
    const { ubicacion, role } = req.user;
    const currentDate = new Date();
    const startDate = startOfMonth(currentDate);
    const endDate = endOfMonth(currentDate);
    
    const productQuery = role === 'admin' ? {} : { location: ubicacion };
    const products = await Product.find(productQuery);

    const reportQuery = {
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    };

    // Solo aplicar filtro de ubicación si no es admin
    if (role !== 'admin') {
      reportQuery.ubicacion = ubicacion;
    }

    const reports = await Report.find(reportQuery);
    
    const productStats = {};

    // Inicializar estadísticas para cada producto
    products.forEach(product => {
      productStats[product._id] = {
        _id: product._id,
        name: product.name,
        pharmaceuticalCompany: product.pharmaceuticalCompany,
        salesByType: {
          unit: 0,
          blister: 0,
          box: 0
        },
        sellOptions: product.sellOptions,
        totalUnits: 0
      };
    });

    // Calcular ventas por tipo y total de unidades para cada producto
    reports.forEach(report => {
      report.sales.forEach(sale => {
        sale.items.forEach(async item => {
          if (productStats[item.productId]) {
            const product = products.find(p => p._id.toString() === item.productId.toString());
            if (product) {
              // Actualizar conteo por tipo de venta
              productStats[item.productId].salesByType[item.saleType] += item.quantity;
              
              // Calcular total de unidades según el tipo de venta
              let totalUnits = 0;
              if (item.saleType === 'unit') {
                totalUnits = item.quantity;
              } else if (item.saleType === 'blister') {
                totalUnits = item.quantity * product.packaging.unitsPerBlister;
              } else if (item.saleType === 'box') {
                totalUnits = item.quantity * product.packaging.unitsPerBlister * product.packaging.blistersPerBox;
              }
              
              productStats[item.productId].totalUnits += totalUnits;
            }
          }
        });
      });
    });

    // Convertir a array y ordenar por unidades totales
    const sortedProducts = Object.values(productStats)
      .sort((a, b) => b.totalUnits - a.totalUnits);

    res.json(sortedProducts);
  } catch (error) {
    console.error('Error al obtener estadísticas de productos:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas' });
  }
};

export const getEarningsStats = async (req, res) => {
  try {
    const { ubicacion } = req.user;
    const [
      weeklyEarnings,
      monthlyEarnings,
      previousWeekEarnings,
      previousMonthEarnings,
      fifteenDaysStats
    ] = await Promise.all([
      getWeeklyEarnings(ubicacion),
      getMonthlyEarnings(ubicacion),
      getPreviousWeekEarnings(ubicacion),
      getPreviousMonthEarnings(ubicacion),
      getFifteenDaysEarnings(ubicacion)
    ]);

    res.json({
      weeklyEarnings,
      monthlyEarnings,
      previousWeekEarnings,
      previousMonthEarnings,
      firstFifteenDaysEarnings: fifteenDaysStats.firstHalf,
      lastFifteenDaysEarnings: fifteenDaysStats.secondHalf
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener estadísticas de ganancias' });
  }
};


export const getFinancialMetrics = async (req, res) => {
  try {
    const { period = 'day' } = req.query;
    let startDate;
    const endDate = endOfDay(new Date());

    switch (period) {
      case 'week':
        startDate = startOfWeek(new Date());
        break;
      case 'month':
        startDate = startOfMonth(new Date());
        break;
      default: // day
        startDate = startOfDay(new Date());
    }

    const reports = await Report.find({
      startDate: { $gte: startDate },
      endDate: { $lte: endDate }
    }).populate('sales.items.productId');

    let metrics = {
      totalRevenue: 0,
      totalCost: 0,
      contributionMargin: 0,
      marginPercentage: 0,
      productMargins: {},
      dailyMargins: {}
    };

    // Procesar cada reporte
    reports.forEach(report => {
      report.sales.forEach(sale => {
        const saleDate = sale.createdAt.toISOString().split('T')[0];
        
        sale.items.forEach(item => {
          const product = item.productId;
          if (!product) return; // Skip if product reference is missing

          const revenue = item.price * item.quantity;
          const cost = product.purchasePrices[item.saleType] * item.quantity;
          const margin = revenue - cost;

          // Acumular totales
          metrics.totalRevenue += revenue;
          metrics.totalCost += cost;
          metrics.contributionMargin += margin;

          // Acumular por producto
          if (!metrics.productMargins[product._id]) {
            metrics.productMargins[product._id] = {
              name: product.name,
              revenue: 0,
              cost: 0,
              margin: 0
            };
          }
          metrics.productMargins[product._id].revenue += revenue;
          metrics.productMargins[product._id].cost += cost;
          metrics.productMargins[product._id].margin += margin;

          // Acumular por día
          if (!metrics.dailyMargins[saleDate]) {
            metrics.dailyMargins[saleDate] = {
              revenue: 0,
              cost: 0,
              margin: 0
            };
          }
          metrics.dailyMargins[saleDate].revenue += revenue;
          metrics.dailyMargins[saleDate].cost += cost;
          metrics.dailyMargins[saleDate].margin += margin;
        });
      });
    });

    // Calcular porcentaje de margen
    metrics.marginPercentage = metrics.totalRevenue > 0 
      ? (metrics.contributionMargin / metrics.totalRevenue) * 100 
      : 0;

    // Convertir productMargins a array y ordenar por margen
    metrics.topProducts = Object.values(metrics.productMargins)
      .sort((a, b) => b.margin - a.margin)
      .slice(0, 10);

    // Convertir dailyMargins a array y ordenar por fecha
    metrics.dailyMarginTrend = Object.entries(metrics.dailyMargins)
      .map(([date, data]) => ({
        date,
        ...data
      }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json(metrics);
  } catch (error) {
    console.error('Error al obtener métricas financieras:', error);
    res.status(500).json({ message: 'Error al obtener métricas financieras' });
  }
};