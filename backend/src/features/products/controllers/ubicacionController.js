import Ubicacion from '../models/Ubicacion.js';
import Product from '../models/Product.js';

const ubicacionController = {};

ubicacionController.getAll = async (req, res) => {
  try {
    const ubicaciones = await Ubicacion.find().populate({
      path: 'productosAsociados',
      model: Product
    });
    res.status(200).json(ubicaciones);
  } catch (error) {
    console.error('Error al obtener ubicaciones:', error);
    res.status(500).json({ error: 'Error al obtener ubicaciones' });
  }
};

ubicacionController.getById = async (req, res) => {
  try {
    const ubicacion = await Ubicacion.findById(req.params.id).populate({
      path: 'productosAsociados',
      model: Product
    });
    res.status(200).json(ubicacion);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ubicacion' });
  }
};

ubicacionController.create = async (req, res) => {
  try {
    const ubicacion = await Ubicacion.create(req.body);
    res.status(201).json(ubicacion);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear ubicacion' });
  }
};

ubicacionController.update = async (req, res) => {
  try {
    const ubicacion = await Ubicacion.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json(ubicacion);
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar ubicacion' });
  }
};

ubicacionController.delete = async (req, res) => {
  try {
    const ubicacion = await Ubicacion.findByIdAndDelete(req.params.id);
    res.status(200).json(ubicacion);
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar ubicacion' });
  }
};

//Transferir productos de una ubicacion a otra
ubicacionController.transferirProductos = async (req, res) => {
  try {
    const { ubicacionOrigenId, ubicacionDestinoId, productos } = req.body;
    // Validar los datos de entrada
    if (!ubicacionOrigenId || !ubicacionDestinoId || !productos || !Array.isArray(productos)) {
      return res.status(400).json({ error: 'Datos de entrada inválidos' });
    }

    // Verificar que existan ambas ubicaciones
    const [ubicacionOrigen, ubicacionDestino] = await Promise.all([
      Ubicacion.findById(ubicacionOrigenId),
      Ubicacion.findById(ubicacionDestinoId)
    ]);

    if (!ubicacionOrigen || !ubicacionDestino) {
      return res.status(404).json({ error: 'Una o ambas ubicaciones no existen' });
    }

    // Procesar cada producto a transferir
    const actualizaciones = await Promise.all(productos.map(async ({ productId, quantity, saleType }) => {
      // Buscar el producto en la ubicación origen
      const productoOrigen = await Product.findOne({
        _id: productId,
        location: ubicacionOrigenId
      });

      if (!productoOrigen) {
        throw new Error(`Producto ${productId} no encontrado en la ubicación origen`);
      }

      // Calcular unidades totales según el tipo de venta
      let unidadesTotales = 0;
      if (saleType === 'blister') {
        unidadesTotales = quantity * productoOrigen.packaging.unitsPerBlister;
      } else if (saleType === 'box') {
        unidadesTotales = quantity * productoOrigen.packaging.unitsPerBlister * productoOrigen.packaging.blistersPerBox;
      }

      // Verificar stock suficiente
      if (productoOrigen.stock.units < unidadesTotales) {
        throw new Error(`Stock insuficiente para el producto ${productoOrigen.name}`);
      }
      console.log(productId, ubicacionDestinoId) 

      // Buscar si el producto ya existe en la ubicación destino
      let productoDestino = await Product.findOne({
        barcode: productoOrigen.barcode,
        name: productoOrigen.name,
        pharmaceuticalCompany: productoOrigen.pharmaceuticalCompany,
        expirationDate: productoOrigen.expirationDate,
        location: ubicacionDestinoId
      });

      // Si no existe, crear uno nuevo
      if (!productoDestino) {
        productoDestino = new Product({
          ...productoOrigen.toObject(),
          _id: undefined,
          location: ubicacionDestinoId,
          stock: {
            units: 0,
            blisters: 0,
            boxes: 0
          }
        });
      }

      console.log(productoOrigen)

      // Calcular las cantidades a transferir en cada nivel
      const { unitsPerBlister, blistersPerBox } = productoOrigen.packaging;
      
      let cajasTransferir = 0;
      let blistersTransferir = 0;
      let unidadesTransferir = 0;

      if (saleType === 'box' && productoOrigen.sellOptions.box) {
        cajasTransferir = quantity;
        blistersTransferir = quantity * blistersPerBox;
        unidadesTotales = quantity * blistersPerBox * unitsPerBlister;
      } else if (saleType === 'blister' && productoOrigen.sellOptions.blister) {
        blistersTransferir = quantity;
        unidadesTotales = quantity * unitsPerBlister;
      } else if (saleType === 'unit' && productoOrigen.sellOptions.unit) {
        unidadesTotales = quantity;
        unidadesTransferir = quantity;
      } else {
        throw new Error(`Tipo de venta ${saleType} no permitido para este producto`);
      }

      // Verificar stock suficiente
      if (productoOrigen.stock.units < unidadesTotales) {
        throw new Error(`Stock insuficiente para el producto ${productoOrigen.name}`);
      }

      // Actualizar stock en origen
      productoOrigen.stock.units -= unidadesTotales;
      productoOrigen.stock.boxes -= cajasTransferir;
      productoOrigen.stock.blisters -= blistersTransferir;

      // Si el producto destino ya existe, actualizamos su stock
      if (productoDestino._id) {
        productoDestino.stock.units += unidadesTotales;
        productoDestino.stock.boxes += cajasTransferir;
        productoDestino.stock.blisters += blistersTransferir;
      } else {
        // Si es nuevo, establecemos el stock con las cantidades transferidas
        productoDestino.stock = {
          units: unidadesTotales,
          blisters: blistersTransferir,
          boxes: cajasTransferir
        };
      }

      // Guardar cambios
      await Promise.all([
        productoOrigen.save(),
        productoDestino.save(),
        Ubicacion.findByIdAndUpdate(ubicacionOrigenId, {
          $pull: { productosAsociados: productId }
        }),
        Ubicacion.findByIdAndUpdate(ubicacionDestinoId, {
          $addToSet: { productosAsociados: productoDestino._id }
        })
      ]);

      return {
        origen: productoOrigen,
        destino: productoDestino,
        cantidadTransferida: {
          unidades: unidadesTransferir,
          blisters: blistersTransferir,
          cajas: cajasTransferir,
          totalUnidades: unidadesTotales
        }
      };
    }));

    res.status(200).json({
      mensaje: 'Productos transferidos exitosamente',
      transferencias: actualizaciones
    });

  } catch (error) {
    console.error('Error en transferencia:', error);
    res.status(500).json({ 
      error: 'Error al transferir productos',
      detalles: error.message 
    });
  }
};


export default ubicacionController;