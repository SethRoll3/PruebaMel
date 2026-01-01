import { api } from '../../../lib/api';
import { toast } from 'react-hot-toast';
import { Product } from '../types/Product';

export const getProducts = async (ubicacion?: string): Promise<Product[]> => {
  const params = ubicacion ? { ubicacion } : {};
  const response = await api.get('/products', { params });
  return response.data;
};

export const createProduct = async (productData: Partial<Product>): Promise<Product> => {
  try {
    const response = await api.post('/products', productData);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al crear el producto';
    toast.error(message);
    throw error;
  }
};

export const updateProduct = async (id: string, productData: Partial<Product>): Promise<Product> => {
  try {
    const response = await api.put(`/products/${id}`, productData);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al actualizar el producto';
    toast.error(message);
    throw error;
  }
};

export const deleteProduct = async (id: string): Promise<void> => {
  try {
    await api.delete(`/products/${id}`);
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al eliminar el producto';
    toast.error(message);
    throw error;
  }
};

export const findProductByBarcode = async (barcode: string): Promise<Product> => {
  const response = await api.get(`/products/barcode/${barcode}`);
  return response.data;
};

export const updateStock = async (
  productId: string, 
  quantity: number, 
  saleType: 'unit' | 'blister' | 'box'
): Promise<void> => {
  await api.post('/products/update-stock', {
    productId,
    quantity,
    saleType
  });
};

export const findProductByType = async (types: string[]): Promise<Product[]> => {
  try {
    const response = await api.get(`/products/type/${types.join(',')}`);
    console.log(response.data)
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al buscar productos';
    toast.error(message);
    throw error;
  }
};

export const getProductTypes = async (): Promise<string[]> => {
  try {
    const response = await api.get('/products/types');
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al obtener tipos de productos';
    toast.error(message);
    throw error;
  }
};

