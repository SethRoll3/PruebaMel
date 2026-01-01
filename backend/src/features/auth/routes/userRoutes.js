import express from 'express';
import { getUsers, createUser, updateUser, deleteUser, getUser } from '../controllers/userController.js';
import { verifyToken, checkRole, checkUbicacion } from '../../../middleware/authMiddleware.js';

const router = express.Router();

// Rutas de usuarios
router.get('/', verifyToken, checkUbicacion, getUsers);
router.post('/', verifyToken, checkRole(['admin', 'admin_ubicacion']), checkUbicacion, createUser);
router.get('/:id', verifyToken, checkUbicacion, getUser);
router.put('/:id', verifyToken, checkRole(['admin', 'admin_ubicacion']), checkUbicacion, updateUser);
router.delete('/:id', verifyToken, checkRole(['admin']), deleteUser);

export default router;