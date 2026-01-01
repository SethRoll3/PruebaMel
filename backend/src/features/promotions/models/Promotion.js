import mongoose from 'mongoose';

const promotionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  promotionType: {
    type: String,
    enum: ['NxM', 'percentage', 'fixed'],
    required: true
  },
  // Para promociones NxM
  nxmConfig: {
    buyQuantity: Number, // N - cantidad a comprar
    getQuantity: Number, // M - cantidad a recibir
  },
  // Para descuentos porcentuales o fijos
  discountValue: {
    type: Number
  },
  products: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    minimumQuantity: {
      type: Number,
      default: 1
    }
  }],
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  conditions: {
    minimumPurchase: {
      type: Number,
      default: 0
    },
    maxUses: {
      type: Number,
      default: null
    },
    usedCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

const Promotion = mongoose.model('Promotion', promotionSchema);
export default Promotion;