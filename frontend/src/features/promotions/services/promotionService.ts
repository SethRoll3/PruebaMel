import { api } from '../../../lib/api';
import { toast } from 'react-hot-toast';
import { Promotion } from '../types/Promotion';

export const getPromotions = async (): Promise<Promotion[]> => {
  try {
    const response = await api.get('/promotions');
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al obtener promociones';
    toast.error(message);
    throw error;
  }
};

export const getActivePromotions = async (): Promise<Promotion[]> => {
  try {
    const response = await api.get('/promotions/active');
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al obtener promociones activas';
    toast.error(message);
    throw error;
  }
};

export const createPromotion = async (promotionData: Partial<Promotion>): Promise<Promotion> => {
  try {
    const response = await api.post('/promotions', promotionData);
    toast.success('Promoción creada exitosamente');
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al crear la promoción';
    toast.error(message);
    throw error;
  }
};

export const updatePromotion = async (id: string, promotionData: Partial<Promotion>): Promise<Promotion> => {
  try {
    const response = await api.put(`/promotions/${id}`, promotionData);
    toast.success('Promoción actualizada exitosamente');
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al actualizar la promoción';
    toast.error(message);
    throw error;
  }
};

export const deletePromotion = async (id: string): Promise<void> => {
  try {
    await api.delete(`/promotions/${id}`);
    toast.success('Promoción eliminada exitosamente');
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al eliminar la promoción';
    toast.error(message);
    throw error;
  }
};

export const validatePromotion = async (products: any[], total: number): Promise<Promotion[]> => {
  try {
    const response = await api.post('/promotions/validate', { products, total });
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al validar promociones';
    toast.error(message);
    throw error;
  }
};

export const getPromotionsByProduct = async (productId: string): Promise<Promotion[]> => {
  try {
    const response = await api.get(`/promotions/promotion/${productId}`);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al obtener promociones del producto';
    toast.error(message);
    throw error;
  }
};