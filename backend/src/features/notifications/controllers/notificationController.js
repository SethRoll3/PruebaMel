import { Notification } from '../models/Notification.js';
import Product from '../../products/models/Product.js';
import { handleError } from '../../../utils/errorHandler.js';

export const createNotification = async (req, res) => {
  try {
    const { productId, type, title, message } = req.body;
 
    // Buscar el producto para obtener nombre, código de barras y ubicación
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado para la notificación' });
    }

    // Verificar que el producto tenga una ubicación asignada
    if (!product.location) { 
      return res.status(400).json({ message: 'El producto no tiene una ubicación asignada' });
    }
 
    // Construir el mensaje correcto según el tipo
    let fullMessage = "";
    if (type === 'stock-low') {
      fullMessage = `El producto ${product.name} tiene stock bajo (${product.stock} unidades). | Nombre: ${product.name} | Código de barras: ${product.barcode}`;
    } else if (type === 'out-of-stock') {
      fullMessage = `El producto ${product.name} está agotado. | Nombre: ${product.name} | Código de barras: ${product.barcode}`;
    } else {
      // Para expired y expiring-soon, el mensaje viene del frontend y se enriquece
      fullMessage = `${message} | Nombre: ${product.name} | Código de barras: ${product.barcode}`;
    }

    // Buscar notificación existente por productId y type
    const existingNotification = await Notification.findOne({ productId, type });

    if (existingNotification) {
      // Si el mensaje es exactamente igual, no hacer nada
      if (existingNotification.message === fullMessage) {
        return res.json(existingNotification);
      }
      // Solo para expired y expiring-soon: actualizar si el mensaje cambió
      if (type === 'expired' || type === 'expiring-soon') {
        existingNotification.title = title;
        existingNotification.message = fullMessage;
        existingNotification.createdAt = new Date();
        existingNotification.read = false;
        await existingNotification.save();
        return res.json(existingNotification);
      }
      // Para stock-low y out-of-stock, si ya existe pero el mensaje cambió, no actualizar (opcional: puedes actualizar si quieres)
      return res.json(existingNotification);
    }

    // Si no existe, crear la notificación
    const notification = new Notification({
      productId,
      type,
      title,
      message: fullMessage,
      ubicacion: product.location
    });

    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    console.error('Error en createNotification:', error);
    handleError(res, error, 'Error al crear o actualizar notificación');
  }
};

export const getNotifications = async (req, res) => {
  try {
    const { ubicacion } = req.query;
    const { role } = req.user;

    // Si es admin, puede ver todas las notificaciones
    // Si es admin_ubicacion o employee, solo ve las notificaciones de su ubicación
    const query = role === 'admin' ? {} : { ubicacion };
    
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    handleError(res, error, 'Error al obtener notificaciones');
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    const notification = await Notification.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notificación no encontrada' });
    }

    res.json(notification);
  } catch (error) {
    console.error('Error al marcar notificación como leída:', error);
    res.status(500).json({ message: 'Error al marcar notificación como leída' });
  }
};