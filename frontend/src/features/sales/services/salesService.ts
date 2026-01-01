import { api } from '../../../lib/api';
import { Product } from '../../../features/products/types/Product';
import { SaleItem } from '../types/Sale';
import toast from 'react-hot-toast';
import { Promotion } from '../../promotions/types/Promotion';

export const findProductByBarcodeService = async (barcode: string): Promise<Product> => {
  try {
    const response = await api.get(`/products/barcode/${barcode}`);
    return response.data;
  } catch (error) {
    console.error('Error buscando producto por código de barras:', error);
    throw error;
  }
};

export const updateStockService = async (
  productId: string, 
  quantity: number,
  saleType: 'unit' | 'blister' | 'box'
): Promise<void> => {
  try {
    console.log(quantity)
    await api.post('/products/update-stock', {
      productId,
      quantity,
      saleType
    });
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al actualizar el stock';
    toast.error(message);
    throw error;
  }
};

export const registerSaleService = async (items: SaleItem[], total: number): Promise<void> => {
  try {
    await api.post('/reports/add-sale', {
      items: items.map(item => ({
        productId: item.productId,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        saleType: item.saleType,
        unitsPerSale: item.unitsPerSale,
        subtotal: item.subtotal
      })),
      total
    });
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al registrar la venta';
    toast.error(message);
    throw error;
  }
};

export const getProductPromotions = async (productId: string): Promise<Promotion[]> => {
  try {
    const response = await api.get(`/promotions/promotion/${productId}`);
    return response.data;
  } catch (error: any) {
    const message = error.response?.data?.message || 'Error al obtener promociones del producto';
    toast.error(message);
    throw error;
  }
};
