import { api } from '../../../lib/api';
import { toast } from 'react-hot-toast';

export interface TopSellingProduct {
  productId: string;
  name: string;
  pharmaceuticalCompany: string;
  totalUnits: number;
  totalAmount: number;
  salesDetails: {
    units: number;
    blisters: number;
    boxes: number;
  };
}

export interface DailySalesData {
  date: string;
  totalSales: number;
  numberOfSales: number;
}

export const getTopSellingProducts = async (period: 'day' | 'week' | 'month'): Promise<TopSellingProduct[]> => {
  try {
    const response = await api.get(`stats/top-selling?period=${period}`);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al obtener estadísticas';
    toast.error(message);
    throw error;
  }
};

export interface MonthlySalesData {
  month: number;
  totalSales: number;
  numberOfSales: number;
}

export const getMonthlySalesStats = async (): Promise<MonthlySalesData[]> => {
  try {
    const response = await api.get('stats/monthly-sales');
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al obtener estadísticas mensuales';
    toast.error(message);
    throw error;
  }
};

export const getProductsSalesStats = async () => {
  try {
    const response = await api.get('/stats/products-sales');
    return response.data;
  } catch (error) {
    console.error('Error fetching products sales stats:', error);
    throw error;
  }
};

export const getEarningsStats = async () => {
  try {
    const response = await api.get('/stats/earnings');
    return response.data;

  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al obtener estadísticas mensuales';
    toast.error(message);
    throw error;

  }
};

export const getFinancialMetrics = async (period = 'month') => {
  try {
    const response = await api.get(`/stats/financial-metrics?period=${period}`);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al obtener métricas financieras';
    toast.error(message);
    throw error;
  }
};

export const getDailySalesStats = async (): Promise<DailySalesData[]> => {
  try {
    const response = await api.get('reports/daily-sales');
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al obtener estadísticas diarias';
    toast.error(message);
    throw error;
  }
};

