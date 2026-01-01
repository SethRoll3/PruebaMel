import mongoose from 'mongoose';

const historicoProductoSchema = new mongoose.Schema({
  barcode: String,
  name: String,
  expirationDate: Date,
  pharmaceuticalCompany: String,
  paymentType: {
    type: String,
    enum: ['exento', 'gravado']
  },
  prices: {
    unit: Number,
    blister: Number,
    box: Number,
  },
  packaging: {
    unitsPerBlister: Number,
    blistersPerBox: Number
  },
  types: [{
    type: String,
    enum: ['Jarabe', 'Analgesico', 'Vacuna', 'Bebe', 'Generico', 'Otro']
  }],
  deletedAt: {
    type: Date,
    default: Date.now
  },
  deletionReason: {
    type: String,
    enum: ['manual', 'expired', 'other'],
    required: true
  }
}, { 
  timestamps: true 
});

export default mongoose.model('HistoricoProducto', historicoProductoSchema);