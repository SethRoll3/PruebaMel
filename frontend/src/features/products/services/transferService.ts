import { api } from '../../../lib/api';

export interface TransferProduct {
    productId: string;
    quantity: number;
    saleType: 'unit' | 'blister' | 'box';
}

export interface TransferRequest {
    ubicacionOrigenId: string;
    ubicacionDestinoId: string;
    productos: TransferProduct[];
}

export const transferProducts = async (transferData: TransferRequest) => {
    const response = await api.post('/ubicaciones/transferir', transferData);
    return response.data;
};