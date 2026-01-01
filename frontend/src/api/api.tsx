// src/lib/api.ts
import axios, { AxiosError } from 'axios';

const BASE_URL = 'http://localhost:3000/api';
//const BASE_URL = 'https://melbobackend.onrender.com/api/'
export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const errorMessage = (error?.response?.data as { message?: string })?.message || error?.message || 'Error en el servidor';
    console.error('API Error:', { message: errorMessage });
    throw error;
  }
);

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
};

// Products API
export const productsAPI = {
  getProducts: async () => {
    const response = await api.get('/products');
    return response.data;
  },

  createProduct: async (productData: any) => {
    const response = await api.post('/products', productData);
    return response.data;
  },

  findByBarcode: async (barcode: string) => {
    const response = await api.get(`/products/barcode/${barcode}`);
    return response.data;
  },

  updateStock: async (productId: string, quantity: number, saleType: 'unit' | 'blister' | 'box') => {
    const response = await api.post('/products/update-stock', {
      productId,
      quantity,
      saleType
    });
    return response.data;
  }
};

// Reports API
export const reportsAPI = {
  getCurrentReport: async () => {
    const response = await api.get('/reports/current');
    return response.data;
  },

  getReportHistory: async () => {
    const response = await api.get('/reports/history');
    return response.data;
  },

  addSaleToReport: async (sale: any) => {
    const response = await api.post('/reports/add-sale', sale);
    return response.data;
  },

  closeCurrentReport: async () => {
    const response = await api.post('/reports/close');
    return response.data;
  },

  generatePDF: async (report: any) => {
    const response = await api.post('/reports/generate-pdf', { report }, {
      responseType: 'blob'
    });
    return response.data;
  },

  generateDetailedPDF: async (report: any) => {
    const response = await api.post('/reports/generate-detailed-pdf', { report }, {
      responseType: 'blob'
    });
    return response.data;
  }
};
