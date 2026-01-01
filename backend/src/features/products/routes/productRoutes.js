import express from 'express';
import { 
  getProducts, 
  createProduct, 
  findByBarcode, 
  updateStock, 
  deleteProduct, 
  updateProduct, 
  findByType, 
  getProductTypes,
  getHistoricoProductos,
  generateHistoricoExcel 
} from '../controllers/productController.js';
import { verifyToken, checkRole, checkUbicacion } from '../../../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', verifyToken, checkUbicacion, getProducts);
router.post('/', verifyToken, checkRole(['admin', 'admin_ubicacion']), checkUbicacion, createProduct);
router.get('/barcode/:barcode', verifyToken, checkUbicacion, findByBarcode);
router.post('/update-stock', verifyToken, checkUbicacion, updateStock);
router.put('/:id', verifyToken, checkRole(['admin', 'admin_ubicacion']), checkUbicacion, updateProduct);
router.delete('/:id', verifyToken, checkRole(['admin']), deleteProduct);
router.get('/type/:type', verifyToken, checkUbicacion, findByType);
router.get('/types', verifyToken, getProductTypes);
router.get('/historico', verifyToken, checkUbicacion, getHistoricoProductos);
router.get('/historico/excel', verifyToken, checkUbicacion, generateHistoricoExcel);

export default router;