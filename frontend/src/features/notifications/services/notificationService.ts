import { api } from '../../../lib/api';

export interface Notification {
  _id: string;
  productId: string;
  type: 'stock-low' | 'expired' | 'expiring-soon' | 'out-of-stock';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  ubicacion?: string;
}

export const createNotification = async (notification: Omit<Notification, '_id' | 'read' | 'createdAt'>) => {
  try {
    const ubicacion = localStorage.getItem('ubicacion');
    if (!ubicacion) {
      throw new Error('No hay ubicación seleccionada');
    }

    const response = await api.post('/notifications', notification,
      {
        params: { ubicacion }
      }
    );
    return response.data;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || error?.message || 'Error al crear notificación';
    console.error('Error al crear notificación:', errorMessage);
    throw new Error(errorMessage);
  }
};

export const getNotifications = async (): Promise<Notification[]> => {
  try {
    const ubicacion = localStorage.getItem('ubicacion');
    if (!ubicacion) {
      throw new Error('No hay ubicación seleccionada');
    }

    const response = await api.get('/notifications', {
      params: { ubicacion }
    });
    return response.data;
  } catch (error: any) {
    const errorMessage = error?.response?.data?.message || error?.message || 'Error al obtener notificaciones';
    console.error('Error al obtener notificaciones:', errorMessage);
    throw new Error(errorMessage);
  }
};

export const markNotificationAsRead = async (notificationId: string): Promise<Notification> => {
  try {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    throw error;
  }
};