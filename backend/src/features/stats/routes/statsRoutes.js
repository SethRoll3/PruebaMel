import express from 'express';
import { getTopSellingProducts, getMonthlySalesStats, getProductsSalesStats, getEarningsStats, getFinancialMetrics } from '../controllers/statsController.js';
import { verifyToken, checkRole, checkUbicacion } from '../../../middleware/authMiddleware.js';

const router = express.Router();

router.get('/top-selling', verifyToken, checkUbicacion, getTopSellingProducts);
router.get('/monthly-sales', verifyToken, checkUbicacion, getMonthlySalesStats);
router.get('/products-sales', verifyToken, checkUbicacion, getProductsSalesStats);
router.get('/earnings', verifyToken, checkUbicacion, getEarningsStats);
router.get('/financial-metrics', verifyToken, checkRole(['admin', 'admin_ubicacion']), checkUbicacion, getFinancialMetrics);

export default router;