import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
  return new Promise((resolve, reject) => {
    // Timer para el timeout manual
    const timeoutId = setTimeout(() => {
      reject(new Error('Timeout al conectar a MongoDB después de 30 segundos'));
    }, 30000);

    try {
      // Verificar que tenemos la URI
      if (!process.env.MONGODB_URI) {
        clearTimeout(timeoutId);
        throw new Error('MONGODB_URI no está definida en las variables de entorno');
      }
      console.log('URI de MongoDB:', process.env.MONGODB_URI);

      console.log('Iniciando conexión a MongoDB...');
      
      // Intentar conectar con opciones más permisivas
      mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 30000, // 30 segundos
        heartbeatFrequencyMS: 2000,      // Latido cada 2 segundos
        retryWrites: true,
        w: 'majority'
      })
      .then((conn) => {
        clearTimeout(timeoutId); // Limpiar el timeout si la conexión es exitosa
        console.log('Conexión exitosa a MongoDB');
        console.log(`Host de MongoDB: ${conn.connection.host}`);
        console.log(`Base de datos: ${conn.connection.name}`);
        resolve(conn);
      })
      .catch((error) => {
        clearTimeout(timeoutId); // Limpiar el timeout si hay error
        console.error('Error al conectar a MongoDB:', {
          name: error.name,
          message: error.message,
          code: error.code
        });
        reject(error);
      });

    } catch (error) {
      clearTimeout(timeoutId); // Limpiar el timeout si hay error
      console.error('Error al conectar a MongoDB:', {
        name: error.name,
        message: error.message,
        code: error.code
      });
      reject(error);
    }
  });
};