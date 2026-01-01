import express from 'express';
import { createNotification, getNotifications, markAsRead } from '../controllers/notificationController.js';
import { verifyToken, checkRole, checkUbicacion } from '../../../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', verifyToken, checkRole(['admin', 'admin_ubicacion', 'employee']), checkUbicacion, createNotification);
router.get('/', verifyToken, checkRole(['admin', 'admin_ubicacion', 'employee' ]), checkUbicacion, getNotifications);
router.put('/:id/read', verifyToken, checkRole(['admin', 'admin_ubicacion', 'employee']), checkUbicacion, markAsRead);

export default router;