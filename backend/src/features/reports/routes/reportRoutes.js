import express from 'express';
import {
  createDailyReport,
  addSaleToReport,
  closeCurrentReport,
  getCurrentReport,
  getReportHistory,
  getReportByDate,
  getDailySalesStats,
  getReportsByRange
} from '../controllers/reportController.js';
import { generateReportPDF } from '../controllers/pdfController.js';
import { generateReportExcel } from '../controllers/excelController.js';
import { verifyToken, checkRole, checkUbicacion } from '../../../middleware/authMiddleware.js';

const router = express.Router();

// Rutas protegidas con autenticación y ubicación
router.post('/create', verifyToken, checkUbicacion, createDailyReport);
router.post('/add-sale', verifyToken, checkUbicacion, addSaleToReport);
router.post('/close', verifyToken, checkRole(['admin', 'admin_ubicacion']), checkUbicacion, closeCurrentReport);
router.get('/current', verifyToken, checkUbicacion, getCurrentReport);
router.get('/history', verifyToken, checkUbicacion, getReportHistory);
router.post('/generate-pdf', verifyToken, checkUbicacion, generateReportPDF);
router.get('/by-date/:date', verifyToken, checkUbicacion, getReportByDate);
router.get('/generate-excel/:reportId', verifyToken, checkUbicacion, generateReportExcel);
router.get('/generate-excel', verifyToken, checkUbicacion, generateReportExcel);
router.get('/daily-stats', verifyToken, checkUbicacion, getDailySalesStats);
router.get('/by-range', verifyToken, checkUbicacion, getReportsByRange);

export default router;