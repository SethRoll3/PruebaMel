import mongoose from 'mongoose';

const saleItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  saleType: {
    type: String,
    enum: ['unit', 'blister', 'box'],
    required: true
  },
  unitsPerSale: {
    type: Number,
    required: true
  },
  subtotal: {
    type: Number,
    required: true
  },
  appliedPromotion: {
    promotionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Promotion'
    },
    name: String,
    type: {
      type: String,
      enum: ['NxM', 'percentage', 'fixed']
    },
    discountValue: Number,
    discountAmount: Number
  }
});

const paymentSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['transferencia', 'TC', 'efectivo'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  isDivided: {
    type: Boolean,
    default: false
  },
  paymentDetails: {
    efectivo: {
      type: Number,
      default: 0
    },
    TC: {
      type: Number,
      default: 0
    },
    transferencia: {
      type: Number,
      default: 0
    }
  }
});

const saleSchema = new mongoose.Schema({
  items: [saleItemSchema],
  total: {
    type: Number,
    required: true
  },
  totalDiscount: {
    type: Number,
    default: 0
  },
  appliedPromotions: [{
    promotionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Promotion'
    },
    name: String,
    type: {
      type: String,
      enum: ['NxM', 'percentage', 'fixed']
    },
    discountValue: Number,
    discountAmount: Number
  }],
  payments: {
    type: [paymentSchema],
    required: true,
    validate: {
      validator: function(payments) {
        return payments && payments.length > 0;
      },
      message: 'Debe haber al menos un método de pago'
    }
  },
  totalsByPaymentType: {
    efectivo: {
      type: Number,
      default: 0
    },
    TC: {
      type: Number,
      default: 0
    },
    transferencia: {
      type: Number,
      default: 0
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const reportSchema = new mongoose.Schema({
  ubicacion: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ubicacion',
    required: true,
    index: true
  },
  startDate: {  
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  sales: [{
    items: [{
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
      },
      barcode: String,
      name: String,
      price: Number,
      quantity: Number,
      saleType: {
        type: String,
        enum: ['unit', 'blister', 'box']
      },
      unitsPerSale: Number,
      subtotal: Number
    }],
    total: Number,
    payments: [paymentSchema],
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  totalSales: {
    type: Number,
    default: 0
  },
  totalProducts: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['active', 'closed', 'inactive'],
    default: 'active'
  }
}, { timestamps: true });

export default mongoose.model('Report', reportSchema);