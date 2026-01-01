import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from 'date-fns';
import Report from '../../reports/models/Report.js';

export const getWeeklyEarnings = async (ubicacion) => {
  const start = startOfWeek(new Date());
  const end = endOfWeek(new Date());
  
  const reports = await Report.find({
    ubicacion,
    startDate: { $gte: start },
    endDate: { $lte: end }
  });
  
  return reports.reduce((total, report) => total + report.totalSales, 0);
};

export const getPreviousWeekEarnings = async (ubicacion) => {
  const start = startOfWeek(subWeeks(new Date(), 1));
  const end = endOfWeek(subWeeks(new Date(), 1));
  
  const reports = await Report.find({
    ubicacion,
    startDate: { $gte: start },
    endDate: { $lte: end }
  });
  console.log(reports)
  
  return reports.reduce((total, report) => total + report.totalSales, 0);
};

export const getMonthlyEarnings = async (ubicacion) => {
  const start = startOfMonth(new Date());
  const end = endOfMonth(new Date());
  
  const reports = await Report.find({
    ubicacion,
    startDate: { $gte: start },
    endDate: { $lte: end }
  });
  
  return reports.reduce((total, report) => total + report.totalSales, 0);
};

export const getPreviousMonthEarnings = async (ubicacion) => {
  const start = startOfMonth(subMonths(new Date(), 1));
  const end = endOfMonth(subMonths(new Date(), 1));
  
  const reports = await Report.find({
    ubicacion,
    startDate: { $gte: start },
    endDate: { $lte: end }
  });
  
  return reports.reduce((total, report) => total + report.totalSales, 0);
};

export const getFifteenDaysEarnings = async (ubicacion) => {
  const now = new Date();
  const start = startOfMonth(now);
  const middle = new Date(now.getFullYear(), now.getMonth(), 15);
  const end = endOfMonth(now);

  const firstHalfReports = await Report.find({
    ubicacion,
    startDate: { $gte: start },
    endDate: { $lte: middle }
  });

  const secondHalfReports = await Report.find({
    ubicacion,
    startDate: { $gt: middle },
    endDate: { $lte: end }
  });

  const firstHalfTotal = firstHalfReports.reduce((total, report) => total + report.totalSales, 0);
  const secondHalfTotal = secondHalfReports.reduce((total, report) => total + report.totalSales, 0);
  const monthTotal = firstHalfTotal + secondHalfTotal;

  return {
    firstHalf: (firstHalfTotal / monthTotal) * 100 || 0,
    secondHalf: (secondHalfTotal / monthTotal) * 100 || 0
  };
};