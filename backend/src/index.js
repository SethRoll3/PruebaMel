import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/database.js';
import { seedDatabase } from './config/seedData.js';
import authRoutes from './features/auth/routes/authRoutes.js';
import productRoutes from './features/products/routes/productRoutes.js';
import reportRoutes from './features/reports/routes/reportRoutes.js';
import { createDailyReport, closeCurrentReport } from './features/reports/controllers/reportController.js';
import Report from './features/reports/models/Report.js';
import notificationRoutes from './features/notifications/routes/notificationRoutes.js';
import statsRoutes from './features/stats/routes/statsRoutes.js';
import ubicacionRoutes from './features/products/routes/ubicacionRoutes.js';
import promotionRoutes from './features/promotions/routes/promotionRoutes.js';
import userRoutes from './features/auth/routes/userRoutes.js';
// Cargar variables de entorno
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/ubicaciones', ubicacionRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/users', userRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'API funcionando correctamente' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Error en el servidor' });
});

// Función para manejar los reportes según el día
const handleReports = async () => {
  try {
    // Cerrar reportes anteriores
    await closeCurrentReport();

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // Obtener todas las ubicaciones disponibles
    const ubicaciones = await mongoose.connection.db.collection('ubicacions').find().toArray();
    console.log('Ubicaciones disponibles:', ubicaciones); 

    // Crear un reporte para cada ubicación si no existe
    for (const ubicacion of ubicaciones) {
      const activeReport = await Report.findOne({
        status: 'active',
        startDate: {
          $gte: startOfDay,
          $lte: endOfDay
        },
        ubicacion: ubicacion._id
      });

      if (!activeReport) {
        console.log(`Creando nuevo reporte para ubicación: ${ubicacion.nombre}`);
        const report = new Report({
          ubicacion: ubicacion._id,
          startDate: now,
          endDate: endOfDay,
          sales: [],
          totalSales: 0,
          totalProducts: 0, 
          status: 'active'
        });
        await report.save();
      }
    }
  } catch (error) {
    console.error('Error manejando reportes:', error);
  }
};

const startServer = async () => {
  try {
    await connectDB();
    console.log('Conexión a MongoDB establecida');

    // Ejecutar seed de la base de datos
    await seedDatabase();
    
    // Iniciar el sistema de reportes
    await handleReports();
    // Verificar reportes cada hora
    setInterval(handleReports, 60 * 60 * 1000);

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

startServer();
