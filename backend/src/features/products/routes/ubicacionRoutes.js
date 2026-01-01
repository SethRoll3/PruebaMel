import express from 'express';
import ubicacionController from '../controllers/ubicacionController.js';
import { verifyToken, checkRole, checkUbicacion } from '../../../middleware/authMiddleware.js';

const router = express.Router();

// Rutas básicas CRUD
router.get('/', verifyToken, checkUbicacion, ubicacionController.getAll);
router.get('/:id', verifyToken, checkUbicacion, ubicacionController.getById);
router.post('/', verifyToken, checkRole(['admin']), ubicacionController.create);
router.put('/:id', verifyToken, checkRole(['admin']), ubicacionController.update);
router.delete('/:id', verifyToken, checkRole(['admin']), ubicacionController.delete); 

// Ruta para transferir productos entre ubicaciones
router.post('/transferir', verifyToken, checkRole(['admin', 'admin_ubicacion']), checkUbicacion, ubicacionController.transferirProductos);

export default router;