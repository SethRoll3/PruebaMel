import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  ubicacion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ubicacion',
    required: true,
    index: true // Índice para búsquedas por ubicación
  },
  type: {
    type: String,
    enum: ['stock-low', 'expired', 'expiring-soon', 'out-of-stock'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24 * 7 // 7 días en segundos
  }
});

// Asegurarnos de que los índices estén creados
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });
notificationSchema.index({ ubicacion: 1, type: 1 }); // Índice compuesto para búsquedas frecuentes

export const Notification = mongoose.model('Notification', notificationSchema);