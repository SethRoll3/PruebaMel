import Product from '../models/Product.js';
import HistoricoProducto from '../models/HistoricoProducto.js';

import ExcelJS from 'exceljs';

export const getProducts = async (req, res) => {
  try {
    const { role, ubicacion } = req.user;
    const { location } = req.query; // Permitir filtrar por ubicación desde el frontend
    
    let query = {};
    
    // Si no es admin, solo puede ver productos de su ubicación
    if (role !== 'admin') {
      query.location = ubicacion;
    } 
    // Si es admin y especifica ubicación(es), filtrar por ellas
    else if (location) {
      query.location = location.includes(',') 
        ? { $in: location.split(',') }
        : location;
    }
    
    const products = await Product.find(query).populate('location', 'nombre');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos' });
  }
};

export const createProduct = async (req, res) => {
  try {
    const productData = req.body;
    const product = new Product(productData);
    await product.save();

    // Actualizar la ubicación para incluir este producto
    if (product.location) {
      await mongoose.connection.db.collection('ubicaciones').updateOne(
        { _id: new mongoose.Types.ObjectId(product.location) },
        { $addToSet: { productosAsociados: product._id } }
      );
    }

    res.status(201).json(product);
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ message: 'Error al crear producto' });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    // Simplemente actualizamos con los valores que vienen del frontend
    // ya que el cálculo dinámico ya se hizo allí
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json(updatedProduct);
  } catch (error) {
    console.error('Error al actualizar producto:', error);
    res.status(500).json({ message: 'Error al actualizar producto' });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason = 'manual' } = req.body; // Razón de eliminación
    
    const deletedProduct = await Product.findById(id);

    if (!deletedProduct) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    // Crear entrada en el histórico
    const historicoProducto = new HistoricoProducto({
      barcode: deletedProduct.barcode,
      name: deletedProduct.name,
      expirationDate: deletedProduct.expirationDate,
      pharmaceuticalCompany: deletedProduct.pharmaceuticalCompany,
      paymentType: deletedProduct.paymentType,
      prices: deletedProduct.prices,
      packaging: deletedProduct.packaging,
      types: deletedProduct.types,
      deletionReason: reason
    });

    // Guardar en histórico y eliminar el producto original
    await historicoProducto.save();
    await Product.findByIdAndDelete(id);

    res.json({ 
      message: 'Producto eliminado exitosamente y guardado en histórico',
      historicoId: historicoProducto._id 
    });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ message: 'Error al eliminar producto' });
  }
};

// Nuevo endpoint para consultar el histórico
export const getHistoricoProductos = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      name, 
      type 
    } = req.query;

    // Construir el filtro base
    let filter = {};

    // Filtro por rango de fechas
    if (startDate || endDate) {
      filter.deletedAt = {};
      if (startDate) filter.deletedAt.$gte = new Date(startDate);
      if (endDate) filter.deletedAt.$lte = new Date(endDate);
    }

    // Filtro por nombre (búsqueda parcial, no sensible a mayúsculas/minúsculas)
    if (name) {
      filter.name = { $regex: name, $options: 'i' };
    }

    // Filtro por tipo
    if (type) {
      filter.types = { $in: type.split(',') };
    }

    const historicos = await HistoricoProducto.find(filter)
      .sort({ deletedAt: -1 });
    
    res.json(historicos);
  } catch (error) {
    console.error('Error al obtener histórico de productos:', error);
    res.status(500).json({ message: 'Error al obtener histórico de productos' });
  }
};

export const findByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;
    const product = await Product.findOne({ barcode });

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar producto' });
  }
};

//Obtener los tipos de productos del model
export const getProductTypes = async (req, res)=>{
  try{
    const types = Product.schema.path('types').caster.enumValues;
    res.json(types);
  }catch(error){
    console.error('Error al obtener tipos de productos:', error);
    res.status(500).json({ message: 'Error al obtener tipos de productos' });
  }
}

//Encontrar productos por uno o varios tipos que vengan, pude venir mas de un tipo en los parametros
export const findByType = async (req, res) => {
  try {
    const { type } = req.params;    
    // Dividir la cadena de tipos en un array
    const typeArray = type.split(',');
    console.log('Array de tipos:', typeArray);

    // Usar $in para buscar productos que coincidan con cualquiera de los tipos
    const products = await Product.find({
      types: { $in: typeArray }
    });

    if (!products || products.length === 0) {
      return res.status(404).json({ message: 'No se encontraron productos con los tipos especificados' });
    }

    res.json(products);
  } catch (error) {
    console.error('Error en findByType:', error);
    res.status(500).json({ message: 'Error al buscar productos por tipo' });
  }
}

export const updateStock = async (req, res) => {
  try {
    const { productId, quantity, saleType } = req.body;
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    console.log(product.packaging.unitsPerBlister);

    // Calcular unidades totales a deducir
    let unitsToDeduct = quantity;
    if (saleType === 'blister') {
      unitsToDeduct = quantity * product.packaging.unitsPerBlister; // Total de unidades a deducir por blisters
    } else if (saleType === 'box') {
      unitsToDeduct = quantity * product.packaging.unitsPerBlister * product.packaging.blistersPerBox; // Total de unidades a deducir por cajas
    }
    console.log(unitsToDeduct);
    // Verificar si hay suficiente stock
    if (product.stock.units < unitsToDeduct) {
      return res.status(400).json({ message: 'Stock insuficiente' });
    }

    // Actualizar unidades
    product.stock.units -= unitsToDeduct;

    // Actualizar blisters y cajas
    if (saleType === 'blister') {
      product.stock.blisters -= quantity; // Reducir la cantidad de blisters
    } else if (saleType === 'box') {
      product.stock.boxes -= quantity; // Reducir la cantidad de cajas
      product.stock.blisters -= quantity * product.packaging.blistersPerBox; // Reducir blisters según la cantidad de cajas vendidas
    }

    await product.save();
    res.json(product);
  } catch (error) {
    console.error('Error al actualizar stock:', error);
    res.status(500).json({ message: 'Error al actualizar stock' });
  }
};

export const generateHistoricoExcel = async (req, res) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Histórico de Productos');

    // Definir las columnas
    worksheet.columns = [
      { header: 'Código de Barras', key: 'barcode', width: 15 },
      { header: 'Nombre', key: 'name', width: 30 },
      { header: 'Fecha de Vencimiento', key: 'expirationDate', width: 20 },
      { header: 'Casa Farmaceutica', key: 'pharmaceuticalCompany', width: 25 },
      { header: 'Tipo de Pago', key: 'paymentType', width: 15 },
      { header: 'Precio Unidad', key: 'unitPrice', width: 15 },
      { header: 'Precio Blister', key: 'blisterPrice', width: 15 },
      { header: 'Precio Caja', key: 'boxPrice', width: 15 },
      { header: 'Tipos', key: 'types', width: 25 },
      { header: 'Fecha de Eliminación', key: 'deletedAt', width: 20 },
      { header: 'Razón de Eliminación', key: 'deletionReason', width: 20 }
    ];

    // Estilo para el encabezado
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '2563EB' } // Color azul
    };

    // Obtener los datos
    const historicos = await HistoricoProducto.find().sort({ deletedAt: -1 });

    // Agregar los datos
    historicos.forEach(producto => {
      worksheet.addRow({
        barcode: producto.barcode,
        name: producto.name,
        expirationDate: producto.expirationDate.toLocaleDateString('es-GT'),
        pharmaceuticalCompany: producto.pharmaceuticalCompany,
        paymentType: producto.paymentType,
        unitPrice: producto.prices.unit,
        blisterPrice: producto.prices.blister,
        boxPrice: producto.prices.box,
        types: producto.types.join(', '),
        deletedAt: producto.deletedAt.toLocaleDateString('es-GT'),
        deletionReason: producto.deletionReason
      });
    });

    // Formato para las columnas de precios
    ['G', 'H', 'I'].forEach(col => {
      worksheet.getColumn(col).numFmt = '"Q"#,##0.00';
    });

    // Agregar bordes a todas las celdas con datos
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Configurar el tipo de respuesta
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=historico-productos.xlsx'
    );

    // Enviar el archivo
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error al generar Excel:', error);
    res.status(500).json({ message: 'Error al generar el archivo Excel' });
  }
};
