import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  barcode: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true,
    index: true
  },
  expirationDate: {
    type: Date,
    required: true,
    index: true
  },
  pharmaceuticalCompany: {
    type: String,
    required: true,
    index: true
  },
  paymentType: {
    type: String,
    enum: ['exento', 'gravado'],
    required: true
  },
  prices: {
    unit: Number,
    blister: Number,
    box: Number,
  },
  purchasePrices: {  // Precio de compra/adquisición
    unit: Number,
    blister: Number,
    box: Number,
  },
  stock: {
    units: {
      type: Number,
      default: 0,
      index: true
    },
    blisters: {
      type: Number,
      default: 0
    },
    boxes: {
      type: Number,
      default: 0
    }
  },
  packaging: {
    unitsPerBlister: {
      type: Number,
      required: true,
      default: 10
    },
    blistersPerBox: {
      type: Number,
      required: true,
      default: 10
    }
  },
  sellOptions: {
    unit: {
      type: Boolean,
      default: true
    },
    blister: {
      type: Boolean,
      default: true
    },
    box: {
      type: Boolean,
      default: true
    },
  },
  types: {
    type: [String],
    enum: ['Jarabe', 'Analgesico', 'Vacuna', 'Bebe', 'Generico', 'Otro'],
    required: true,
    default: [] 
  },
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ubicacion',
    required: true,
    index: true
  }
}, { 
  timestamps: true,
  // Índice compuesto para validar productos únicos
  indexes: [
    { 
      name: 1, 
      expirationDate: 1, 
      pharmaceuticalCompany: 1,
      location: 1
    }
  ]
});



export default mongoose.model('Product', productSchema);