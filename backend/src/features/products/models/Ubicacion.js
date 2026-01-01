import mongoose from 'mongoose';

const ubicacionSchema = new mongoose.Schema({
    nombre: {
        type: String,
        required: true,
        index: true
    },
    direccion: { 
        type: String,
        required: true,
        index: true
    },
    telefono: {
        type: String,
        required: true,
        index: true
    },
    productosAsociados: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Producto'
    }]
})
export default mongoose.model('Ubicacion', ubicacionSchema);