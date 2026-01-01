import express from 'express';
import {
  createPromotion,
  getPromotions,
  getActivePromotions,
  updatePromotion,
  deletePromotion,
  validatePromotion,
  getPromotionsByProduct
} from '../controllers/promotionController.js';
import { verifyToken, checkRole, checkUbicacion } from '../../../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', verifyToken, checkRole(['admin', 'admin_ubicacion']), checkUbicacion, createPromotion);
router.get('/', verifyToken, checkUbicacion, getPromotions);
router.get('/active', verifyToken, checkUbicacion, getActivePromotions);
router.put('/:id', verifyToken, checkRole(['admin', 'admin_ubicacion']), checkUbicacion, updatePromotion);
router.delete('/:id', verifyToken, checkRole(['admin']), deletePromotion);
router.post('/validate', verifyToken, checkUbicacion, validatePromotion);
router.get('/promotion/:productId', verifyToken, checkUbicacion, getPromotionsByProduct)

export default router;