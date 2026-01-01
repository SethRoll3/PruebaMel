import Product from '../features/products/models/Product.js';
import User from '../features/auth/models/User.js';
import Ubicacion from '../features/products/models/Ubicacion.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const createInitialUser = async () => {
  try {
    console.log('Verificando usuario inicial...');
    
    const existingUser = await User.findOne({ 
      $or: [
        { username: 'admin' },
        { email: 'admin@farmacia.com' }
      ]
    });
    
    if (existingUser) {
      console.log('Usuario admin ya existe');
      return;
    }
    
    const hashedPassword = await bcrypt.hash('admin123', 10); 
    
    await User.create({
      username: 'admin',
      email: 'admin@farmacia.com',
      password: hashedPassword,
      role: 'admin',
      ubicacion: '680b8acc93df9890caa65f4f'  
    });
    
    console.log('Usuario admin creado exitosamente');
  } catch (error) {
    console.warn('Error en createInitialUser:', error);
  }
};

const linkProductsToLocations = async () => {
  try {
    console.log('Vinculando productos con ubicaciones...');
    
    // Obtener todos los productos
    const products = await Product.find();
    
    // Iterar sobre cada producto y actualizar su ubicación 
    for (const product of products) {
      if (product.location) {
        await Ubicacion.findByIdAndUpdate(
          product.location,
          { $addToSet: { productosAsociados: product._id } },
          { new: true }
        );
      }
    }
    
    console.log('Productos vinculados exitosamente con sus ubicaciones');
  } catch (error) {
    console.error('Error vinculando productos con ubicaciones:', error);
  }
};

// Modificar la función createInitialProducts para llamar a linkProductsToLocations
const createInitialProducts = async () => {
  try {
    console.log('Verificando productos iniciales...');
    
    const existingProducts = await Product.find();
    if (existingProducts.length > 0) {
      console.log('Ya existen productos en la base de datos');
      return;
    }

    const products = [
      {
        barcode: '7501234567890',
        name: 'Paracetamol 500mg',
        expirationDate: new Date('2024-12-31'), // Vence en 6 meses aprox.
        pharmaceuticalCompany: 'Bayer',
        paymentType: 'gravado',
        prices: { 
          unit: 1.25,
          blister: 10.0,
          box: 85.0,
        },
        stock: {
          units: 100,
          blisters: 10,
          boxes: 1,
        },
        packaging: {
          unitsPerBlister: 10,
          blistersPerBox: 10,
        },
        sellOptions: {
          unit: true,
          blister: true,
          box: true,
        },
        types: ['Analgesico', 'Generico'],
        purchasePrices: {
          unit: 1.00,
          blister: 8.00,
          box: 75.00,
        },
        location: '680b8acc93df9890caa65f4f'
      },
      {
        barcode: '7501234567891',
        name: 'Paracetamol 500mg',
        expirationDate: new Date('2024-06-15'), // Ya próximo a vencer
        pharmaceuticalCompany: 'Bayer',
        paymentType: 'gravado',
        prices: {
          unit: 1.25,
          blister: 10.0,
          box: 85.0,
        },
        purchasePrices: {
          unit: 1.00,
          blister: 8.00,
          box: 75.00,
        },
        stock: {
          units: 150,
          blisters: 15,
          boxes: 2,
        },
        packaging: {
          unitsPerBlister: 10,
          blistersPerBox: 10,
        },
        sellOptions: {
          unit: true,
          blister: true,
          box: true,
        },
        types: ['Analgesico'],
        location: '680b8e1f93df9890caa66424'
      },
      {
        barcode: '7502345678901',
        name: 'Ibuprofeno 400mg',
        expirationDate: new Date('2024-05-01'), // Muy próximo a vencer
        pharmaceuticalCompany: 'Pfizer',
        paymentType: 'exento',
        prices: {
          unit: 1.50,
          blister: 12.00,
          box: 100.00,
        },
        purchasePrices: {
          unit: 1.00,
          blister: 8.00,
          box: 75.00,
        },
        stock: {
          units: 85,
          blisters: 8,
          boxes: 2,
        },
        packaging: {
          unitsPerBlister: 10,
          blistersPerBox: 12,
        },
        sellOptions: {
          unit: true,
          blister: true,
          box: true,
        },
        types: ['Analgesico', 'Generico'],
        location: '680b8acc93df9890caa65f4f'
      },
      {
        barcode: '7503456789012',
        name: 'Omeprazol 20mg',
        expirationDate: new Date('2024-03-15'), // Ya vencido
        pharmaceuticalCompany: 'Roche',
        paymentType: 'exento',
        prices: {
          blister: 25.00,
          box: 225.00,
        },
        purchasePrices: {
          blister: 15.00,
          box: 180.00,
        },
        stock: {
          units: 140,
          blisters: 14,
          boxes: 1,
        },
        packaging: {
          unitsPerBlister: 10,
          blistersPerBox: 14,
        },
        sellOptions: {
          unit: false,
          blister: true,
          box: true,
        },
        types: ['Generico'],
        location: '680b8e1f93df9890caa66424'
      },
      {
        barcode: '7504567890123',
        name: 'Amoxicilina 500mg',
        expirationDate: new Date('2025-12-31'),
        pharmaceuticalCompany: 'GSK',
        paymentType: 'gravado',
        prices: {
          blister: 35.00,
          box: 350.00,
        },
        purchasePrices: {
          blister: 15.00,
          box: 250.00,
        },
        stock: {
          units: 144,
          blisters: 12,
          boxes: 1,
        },
        packaging: {
          unitsPerBlister: 12,
          blistersPerBox: 12,
        },
        sellOptions: {
          unit: false,
          blister: true,
          box: true,
        },
        types: ['Generico'],
        location: '680b8e1f93df9890caa66424'
      },
      {
        barcode: '7505678901234',
        name: 'Jeringa 5ml',
        expirationDate: new Date('2025-06-30'),
        pharmaceuticalCompany: 'BD Medical',
        paymentType: 'gravado',
        prices: {
          unit: 3.50,
        },
        purchasePrices: {
          unit: 1.00,
        },
        stock: {
          units: 75,
          blisters: 0,
          boxes: 0,
        },
        packaging: {
          unitsPerBlister: 0,
          blistersPerBox: 0,
        },
        sellOptions: {
          unit: true,
          blister: false,
          box: false,
        },
        types: ['Vacuna', 'Otro'],
        location: '680b8acc93df9890caa65f4f'
      },
      {
        barcode: '7506789012345',
        name: 'Loratadina 10mg',
        expirationDate: new Date('2025-03-15'),
        pharmaceuticalCompany: 'Pfizer',
        paymentType: 'gravado',
        prices: {
          unit: 2.00,
          blister: 18.00,
        },
        purchasePrices: {
          unit: 1.00,
          blister: 10.00,
        },
        stock: {
          units: 120,
          blisters: 12,
          boxes: 0,
        },
        packaging: {
          unitsPerBlister: 10,
          blistersPerBox: 0,
        },
        sellOptions: {
          unit: true,
          blister: true,
          box: false,
        },
        types: ['Generico'],
        location: '680b8acc93df9890caa65f4f'
      },
      {
        barcode: '7507890123456',
        name: 'Vitamina C 500mg',
        expirationDate: new Date('2025-09-30'),
        pharmaceuticalCompany: 'Nature Made',
        paymentType: 'gravado',
        prices: {
          unit: 5.00,
          box: 45.00,
        },
        purchasePrices: {
          unit: 1.00,
          box: 25.00,
        },
        stock: {
          units: 100,
          blisters: 0,
          boxes: 10,
        },
        packaging: {
          unitsPerBlister: 0,
          blistersPerBox: 10,
        },
        sellOptions: {
          unit: true,
          blister: false,
          box: true,
        },
        types: ['Otro'],
        location: '680b8e1f93df9890caa66424'
      },
      {
        barcode: '7508901234567',
        name: 'Alcohol en Gel 60ml',
        expirationDate: new Date('2025-12-31'),
        pharmaceuticalCompany: 'Medical Care',
        paymentType: 'gravado',
        prices: {
          unit: 15.00,
        },
        purchasePrices: {
          unit: 7.00,
        },
        stock: {
          units: 50,
          blisters: 0,
          boxes: 0,
        },
        packaging: {
          unitsPerBlister: 0,
          blistersPerBox: 0,
        },
        sellOptions: {
          unit: true,
          blister: false,
          box: false,
        },
        types: ['Otro'],
        location: '680b8acc93df9890caa65f4f'
      },
      {
        barcode: '7509012345678',
        name: 'Vendas Elásticas 4"',
        expirationDate: new Date('2025-10-15'),
        pharmaceuticalCompany: '3M',
        paymentType: 'gravado',
        prices: {
          unit: 12.00,
          box: 110.00,
        },
        purchasePrices: {
          unit: 6.00,
          box: 75.00,
        },
        stock: {
          units: 30,
          blisters: 0,
          boxes: 2,
        },
        packaging: {
          unitsPerBlister: 0,
          blistersPerBox: 10,
        },
        sellOptions: {
          unit: true,
          blister: false,
          box: true,
        },
        types: ['Otro'],
        location: '680b8e1f93df9890caa66424'
      },
      {
        barcode: '7510123456789',
        name: 'Metformina 850mg',
        expirationDate: new Date('2024-08-30'),
        pharmaceuticalCompany: 'Merck',
        paymentType: 'exento',
        prices: {
          blister: 22.00,
          box: 200.00,
        },
        purchasePrices: {
          blister: 12.00,
          box: 130.00,
        },
        stock: {
          units: 300,
          blisters: 30,
          boxes: 3,
        },
        packaging: {
          unitsPerBlister: 10,
          blistersPerBox: 10,
        },
        sellOptions: {
          unit: false,
          blister: true,
          box: true,
        },
        types: ['Otro'],
        location: '680b8acc93df9890caa65f4f'
      },
      {
        barcode: '7511234567890',
        name: 'Gasas Estériles',
        expirationDate: new Date('2025-11-30'),
        pharmaceuticalCompany: '3M',
        paymentType: 'gravado',
        prices: {
          unit: 5.00,
          box: 45.00,
        },
        purchasePrices: {
          unit: 1.00,
          box: 15.00,
        },
        stock: {
          units: 100,
          blisters: 0,
          boxes: 10,
        },
        packaging: {
          unitsPerBlister: 0,
          blistersPerBox: 10,
        },
        sellOptions: {
          unit: true,
          blister: false,
          box: true,
        },
        types: ['Otro'],
        location: '680b8e1f93df9890caa66424'
      },
      {
        barcode: '7512345678901',
        name: 'Ranitidina 150mg',
        expirationDate: new Date('2024-08-15'),
        pharmaceuticalCompany: 'GSK',
        paymentType: 'exento',
        prices: {
          unit: 1.80,
          blister: 16.00,
          box: 140.00,
        },
        purchasePrices: {
          unit: 1.00,
          blister: 8.00,
          box: 75.00,
        },
        stock: {
          units: 150,
          blisters: 15,
          boxes: 1,
        },
        packaging: {
          unitsPerBlister: 10,
          blistersPerBox: 10,
        },
        sellOptions: {
          unit: true,
          blister: true,
          box: true,
        },
        types: ['Otro'],
        location: '680b8acc93df9890caa65f4f'
      },
      {
        barcode: '7513456789012',
        name: 'Termómetro Digital',
        expirationDate: new Date('2026-12-31'),
        pharmaceuticalCompany: 'Omron',
        paymentType: 'gravado',
        prices: {
          unit: 45.00,
        },
        purchasePrices: {
          unit: 23.00,
        },
        stock: {
          units: 20,
          blisters: 0,
          boxes: 0,
        },
        packaging: {
          unitsPerBlister: 0,
          blistersPerBox: 0,
        },
        sellOptions: {
          unit: true,
          blister: false,
          box: false,
        },
        types: ['Otro'],
        location: '680b8e1f93df9890caa66424'
      },
      {
        barcode: '7514567890123',
        name: 'Diclofenaco 50mg',
        expirationDate: new Date('2024-07-30'),
        pharmaceuticalCompany: 'Novartis',
        paymentType: 'exento',
        prices: {
          blister: 20.00,
          box: 180.00,
        },
        purchasePrices: {
          blister: 8.00,
          box: 125.00,
        },
        stock: {
          units: 200,
          blisters: 20,
          boxes: 2,
        },
        packaging: {
          unitsPerBlister: 10,
          blistersPerBox: 10,
        },
        sellOptions: {
          unit: false,
          blister: true,
          box: true,
        },
        types: ['Analgesico'],
        location: '680b8acc93df9890caa65f4f'
      },
      {
        barcode: '7515678901234',
        name: 'Suero Oral 500ml',
        expirationDate: new Date('2025-12-26'),
        pharmaceuticalCompany: 'Pisa',
        paymentType: 'gravado',
        prices: {
          unit: 25.00,
          box: 280.00,
        },
        purchasePrices: {
          unit: 12.00,
          box: 144.00,
        },
        stock: {
          units: 48,
          blisters: 0,
          boxes: 4,
        },
        packaging: {
          unitsPerBlister: 0,
          blistersPerBox: 12,
        },
        sellOptions: {
          unit: true,
          blister: false,
          box: true,
        },
        types: ['Generico'],
        location: '680b8e1f93df9890caa66424'
      },
      {
        barcode: '7516789012345',
        name: 'Amoxicilina 500mg',
        expirationDate: new Date('2024-09-15'), // Próximo a vencer (6 meses)
        pharmaceuticalCompany: 'Pfizer',
        paymentType: 'exento',
        prices: { 
          unit: 2.50,
          blister: 22.00,
          box: 200.00,
        },
        purchasePrices: {
          unit: 1.00,
          blister: 12.00,
          box: 144.00,
        },
        stock: {
          units: 180,
          blisters: 18,
          boxes: 2,
        },
        packaging: {
          unitsPerBlister: 10,
          blistersPerBox: 10,
        },
        sellOptions: {
          unit: true,
          blister: true,
          box: true,
        },
        types: ['Generico'],
        location: '680b8acc93df9890caa65f4f'
      },
      {
        barcode: '7517890123456',
        name: 'Amoxicilina 500mg', // Mismo producto, diferente fecha y fabricante
        expirationDate: new Date('2025-11-20'),
        pharmaceuticalCompany: 'Bayer',
        paymentType: 'gravado',
        prices: {
          unit: 2.75,
          blister: 25.00,
          box: 220.00,
        },
        purchasePrices: {
          unit: 1.00,
          blister: 13.00,
          box: 175.00,
        },
        stock: {
          units: 200,
          blisters: 20,
          boxes: 2,
        },
        packaging: {
          unitsPerBlister: 10,
          blistersPerBox: 10,
        },
        sellOptions: {
          unit: true,
          blister: true,
          box: true,
        },
        types: ['Analgesico', 'Generico'],
        location: '680b8e1f93df9890caa66424'
      },

      {
        barcode: '7518901234567',
        name: 'Metformina 850mg',
        expirationDate: new Date('2024-06-30'), // Ya próximo a vencer
        pharmaceuticalCompany: 'Merck',
        paymentType: 'exento',
        prices: {
          unit: 1.80,
          blister: 16.00,
          box: 140.00,
        },
        purchasePrices: {
          unit: 1.00,
          blister: 8.00,
          box: 75.00,
        },
        stock: {
          units: 150,
          blisters: 15,
          boxes: 1,
        },
        packaging: {
          unitsPerBlister: 10,
          blistersPerBox: 10,
        },
        sellOptions: {
          unit: true,
          blister: true,
          box: true,
        },
        types: ['Analgesico', 'Generico'],
        location: '680b8acc93df9890caa65f4f'
      },
      {
        barcode: '7519012345678',
        name: 'Losartán 50mg',
        expirationDate: new Date('2024-03-01'), // Ya vencido
        pharmaceuticalCompany: 'Novartis',
        paymentType: 'gravado',
        prices: {
          unit: 1.90,
          blister: 17.00,
          box: 150.00,
        },
        purchasePrices: {
          unit: 1.00,
          blister: 8.00,
          box: 115.00,
        },
        stock: {
          units: 90,
          blisters: 9,
          boxes: 1,
        },
        packaging: {
          unitsPerBlister: 10,
          blistersPerBox: 10,
        },
        sellOptions: {
          unit: true,
          blister: true,
          box: true,
        },
        types: ['Otro'],
        location: '680b8e1f93df9890caa66424'
      },
      {
        barcode: '7520123456789',
        name: 'Aspirina 100mg',
        expirationDate: new Date('2025-12-31'),
        pharmaceuticalCompany: 'Bayer',
        paymentType: 'gravado',
        prices: {
          unit: 0.80,
          blister: 7.00,
          box: 60.00,
        },
        purchasePrices: {
          unit: 1.00,
          blister: 3.00,
          box: 45.00,
        },
        stock: {
          units: 300,
          blisters: 30,
          boxes: 3,
        },
        packaging: {
          unitsPerBlister: 10,
          blistersPerBox: 10,
        },
        sellOptions: {
          unit: true,
          blister: true,
          box: true,
        },
        types: ['Analgesico'],
        location: '680b8acc93df9890caa65f4f'
      },
      {
        barcode: '7521234567890',
        name: 'Omeprazol 20mg', // Mismo producto, diferente fecha y fabricante
        expirationDate: new Date('2024-08-15'), // Próximo a vencer
        pharmaceuticalCompany: 'Pfizer',
        paymentType: 'exento',
        prices: {
          unit: 2.20,
          blister: 20.00,
          box: 180.00,
        },
        purchasePrices: {
          unit: 1.00,
          blister: 10.00,
          box: 115.00,
        },
        stock: {
          units: 120,
          blisters: 12,
          boxes: 1,
        },
        packaging: {
          unitsPerBlister: 10,
          blistersPerBox: 10,
        },
        sellOptions: {
          unit: true,
          blister: true,
          box: true,
        },
        types: ['Analgesico'],
        location: '680b8e1f93df9890caa66424'
      },
      {
        barcode: '7522345678901',
        name: 'Cetirizina 10mg',
        expirationDate: new Date('2025-06-30'),
        pharmaceuticalCompany: 'GSK',
        paymentType: 'gravado',
        prices: {
          unit: 1.50,
          blister: 13.00,
          box: 115.00,
        },
        purchasePrices: {
          unit: 1.00,
          blister: 8.00,
          box: 75.00,
        },
        stock: {
          units: 160,
          blisters: 16,
          boxes: 2,
        },
        packaging: {
          unitsPerBlister: 10,
          blistersPerBox: 10,
        },
        sellOptions: {
          unit: true,
          blister: true,
          box: true,
        },
        types: ['Otro'],
        location: '680b8acc93df9890caa65f4f'
      },
      {
        barcode: '7523456789012',
        name: 'Naproxeno 550mg',
        expirationDate: new Date('2024-12-30'), // Próximo a vencer (6 meses)
        pharmaceuticalCompany: 'Roche',
        paymentType: 'exento',
        prices: {
          unit: 2.00,
          blister: 18.00,
          box: 160.00,
        },
        purchasePrices: {
          unit: 1.00,
          blister: 8.00,
          box: 95.00,
        },
        stock: {
          units: 140,
          blisters: 14,
          boxes: 1,
        },
        packaging: {
          unitsPerBlister: 10,
          blistersPerBox: 10,
        },
        sellOptions: {
          unit: true,
          blister: true,
          box: true,
        },
        types: ['Otro'],
        location: '680b8e1f93df9890caa66424'
      },
      {
        barcode: '7524567890123',
        name: 'Atorvastatina 20mg',
        expirationDate: new Date('2025-04-15'),
        pharmaceuticalCompany: 'Pfizer',
        paymentType: 'gravado',
        prices: {
          unit: 3.00,
          blister: 28.00,
          box: 250.00,
        },
        purchasePrices: {
          unit: 1.00,
          blister: 16.00,
          box: 169.00,
        },
        stock: {
          units: 200,
          blisters: 20,
          boxes: 2,
        },
        packaging: {
          unitsPerBlister: 10,
          blistersPerBox: 10,
        },
        sellOptions: {
          unit: true,
          blister: true,
          box: true,
        },
        types: ['Analgesico'],
        location: '680b8acc93df9890caa65f4f'
      },
      {
        barcode: '7525678901234',
        name: 'Metronidazol 500mg',
        expirationDate: new Date('2027-12-15'), // Próximo a vencer
        pharmaceuticalCompany: 'Sanofi',
        paymentType: 'exento',
        prices: {
          unit: 1.75,
          blister: 15.00,
          box: 130.00,
        },
        purchasePrices: {
          unit: 1.00,
          blister: 8.00,
          box: 75.00,
        },
        stock: {
          units: 180,
          blisters: 18,
          boxes: 2,
        },
        packaging: {
          unitsPerBlister: 10,
          blistersPerBox: 10,
        },
        sellOptions: {
          unit: true,
          blister: true,
          box: true,
        },
        types: ['Analgesico', 'Generico'],
        location: '680b8e1f93df9890caa66424'
      }
    ];

    await Product.insertMany(products);
    await linkProductsToLocations();
    console.log('Productos iniciales creados exitosamente');
  } catch (error) {
    console.warn('Error en createInitialProducts:', error); 
    throw error;
  } 
};

export const seedDatabase = async () => {
  try {
    await createInitialUser();
    await wait(1000); // Esperar un segundo
    await createInitialProducts();
  } catch (error) {
    console.warn('Error en seedDatabase:', error);
    throw error;
  }
};

