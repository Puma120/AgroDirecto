/**
 * seed.js — Carga datos iniciales en MongoDB Atlas
 * Uso: npm run seed  (desde la carpeta server/)
 *
 * Siembra:
 *  - 4 usuarios demo (contraseñas hasheadas)
 *  - 24 productos con imágenes locales
 */
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB } from './db.js';
import User    from './models/User.js';
import Product from './models/Product.js';

// ─── Usuarios demo ────────────────────────────────────────────────────────────
const DEMO_USERS = [
  {
    _id: 'u1',
    name:  'María García López',
    email: 'maria@ejemplo.com',
    password: '123456',
    role: 'consumer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maria',
  },
  {
    _id: 'u2',
    name:  'Carlos Mendoza Ríos',
    email: 'carlos@ejemplo.com',
    password: '123456',
    role: 'consumer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=carlos',
  },
  {
    _id: 'u3',
    name:  'Roberto Hernández',
    email: 'roberto@productor.com',
    password: 'productor123',
    role: 'producer',
    farmName: 'Rancho El Fresno',
    location: 'San Andrés Cholula, Puebla',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=roberto',
  },
  {
    _id: 'u4',
    name:  'Lupita Ramírez',
    email: 'lupita@ejemplo.com',
    password: '123456',
    role: 'consumer',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lupita',
  },
];

// ─── Productos (imágenes locales) ─────────────────────────────────────────────
const PRODUCTS = [
  {
    _id: 'p1', name: 'Jitomate Saladette', category: 'verduras',
    price: 28, unit: 'kg', minOrder: 0.5, maxOrder: 10,
    producer: { id: 'u3', name: 'Don Roberto Hernández', farmName: 'Rancho El Fresno', location: 'San Andrés Cholula, Puebla', rating: 4.8, reviewCount: 124, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=roberto' },
    harvestDate: '2026-04-27T05:00:00Z', origin: 'San Andrés Cholula, Puebla', stock: 85,
    image: '/images/Jitomate_Saladette.jpg', images: ['/images/Jitomate_Saladette.jpg'],
    description: 'Jitomate saladette cosechado esta madrugada en San Andrés Cholula. Firme, de color rojo intenso, ideal para salsas, guisados y ensaladas. Cultivo sin pesticidas, regado con agua de pozo natural.',
    freshnessHours: 8, supermarketPrice: 48, savings: 42,
    tags: ['cosechado hoy', 'orgánico', 'sin pesticidas'], nutritionHighlights: ['Vitamina C', 'Licopeno', 'Vitamina A', 'Potasio'], available: true,
  },
  {
    _id: 'p2', name: 'Chile Poblano', category: 'verduras',
    price: 45, unit: 'kg', minOrder: 0.25, maxOrder: 5,
    producer: { id: 'u3', name: 'Don Roberto Hernández', farmName: 'Rancho El Fresno', location: 'San Andrés Cholula, Puebla', rating: 4.8, reviewCount: 124, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=roberto' },
    harvestDate: '2026-04-27T04:30:00Z', origin: 'San Andrés Cholula, Puebla', stock: 40,
    image: '/images/Chile_Poblano.jpg', images: ['/images/Chile_Poblano.jpg'],
    description: 'Chile poblano auténtico de San Andrés Cholula, el corazón del chile en Puebla. Carnoso, de piel brillante y sin defectos. Perfecto para rajas, chiles en nogada o chile relleno. Grado comercial seleccionado a mano.',
    freshnessHours: 12, supermarketPrice: 78, savings: 42,
    tags: ['poblano auténtico', 'seleccionado'], nutritionHighlights: ['Vitamina B6', 'Vitamina C', 'Capsaicina', 'Hierro'], available: true,
  },
  {
    _id: 'p3', name: 'Lechuga Orejona', category: 'verduras',
    price: 18, unit: 'pieza', minOrder: 1, maxOrder: 20,
    producer: { id: 'p_sofia', name: 'Sofía Martínez', farmName: 'Huerta La Esperanza', location: 'Cuautlancingo, Puebla', rating: 4.6, reviewCount: 87, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sofia' },
    harvestDate: '2026-04-27T06:00:00Z', origin: 'Cuautlancingo, Puebla', stock: 60,
    image: '/images/lechuga-orejona.jpg', images: ['/images/lechuga-orejona.jpg'],
    description: 'Lechuga orejona hidropónica de Cuautlancingo. Hojas grandes, crujientes y de un verde brillante. Cultivo en invernadero sin tierra, cosechada esta mañana. Ideal para ensaladas, wraps y hamburgesas.',
    freshnessHours: 6, supermarketPrice: 31, savings: 42,
    tags: ['hidropónico', 'cosechada hoy', 'crujiente'], nutritionHighlights: ['Vitamina K', 'Folato', 'Vitamina A', 'Agua'], available: true,
  },
  {
    _id: 'p4', name: 'Cilantro Manojo', category: 'hierbas',
    price: 10, unit: 'manojo', minOrder: 1, maxOrder: 15,
    producer: { id: 'p_sofia', name: 'Sofía Martínez', farmName: 'Huerta La Esperanza', location: 'Cuautlancingo, Puebla', rating: 4.6, reviewCount: 87, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sofia' },
    harvestDate: '2026-04-27T05:30:00Z', origin: 'Cuautlancingo, Puebla', stock: 120,
    image: '/images/Cilantro%20_Manojo.webp', images: ['/images/Cilantro%20_Manojo.webp'],
    description: 'Cilantro fresco en manojo abundante, con aroma intenso y hojas perfectas. Cortado esta mañana en la huerta. Esencial para salsas, pozoles, tacos y caldo de res. Sin químicos ni conservadores.',
    freshnessHours: 4, supermarketPrice: 17, savings: 42,
    tags: ['aromático', 'cosechado hoy'], nutritionHighlights: ['Vitamina K', 'Vitamina C', 'Antioxidantes', 'Minerales'], available: true,
  },
  {
    _id: 'p5', name: 'Cebolla Morada', category: 'verduras',
    price: 22, unit: 'kg', minOrder: 0.5, maxOrder: 8,
    producer: { id: 'p_jorge', name: 'Jorge Sánchez', farmName: 'Campo Azul', location: 'Tehuacán, Puebla', rating: 4.7, reviewCount: 56, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jorge' },
    harvestDate: '2026-04-25T08:00:00Z', origin: 'Tehuacán, Puebla', stock: 95,
    image: '/images/Cebolla_Morada.webp', images: ['/images/Cebolla_Morada.webp'],
    description: 'Cebolla morada de Tehuacán, región de suelo volcánico que le da un sabor dulce y crujiente. Bulbos firmes y de color violeta intenso. Perfecta para encurtidos, guacamole y ceviche poblano.',
    freshnessHours: 72, supermarketPrice: 38, savings: 42,
    tags: ['Tehuacán', 'dulce', 'crujiente'], nutritionHighlights: ['Quercetina', 'Antocianinas', 'Vitamina C', 'Cromo'], available: true,
  },
  {
    _id: 'p6', name: 'Espinacas Baby', category: 'verduras',
    price: 35, unit: '200g', minOrder: 1, maxOrder: 10,
    producer: { id: 'p_sofia', name: 'Sofía Martínez', farmName: 'Huerta La Esperanza', location: 'Cuautlancingo, Puebla', rating: 4.6, reviewCount: 87, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sofia' },
    harvestDate: '2026-04-27T06:30:00Z', origin: 'Cuautlancingo, Puebla', stock: 45,
    image: '/images/Espinacas_Baby.webp', images: ['/images/Espinacas_Baby.webp'],
    description: 'Espinacas baby hidropónicas, hojas tiernas de hasta 5cm, perfectas para consumo en crudo. Lavadas y listas para usar. Cultivadas sin pesticidas en invernadero controlado. Alto contenido de hierro.',
    freshnessHours: 24, supermarketPrice: 60, savings: 42,
    tags: ['baby', 'hidropónico', 'listas para usar'], nutritionHighlights: ['Hierro', 'Vitamina K', 'Folato', 'Magnesio'], available: true,
  },
  {
    _id: 'p7', name: 'Manzana Gala', category: 'frutas',
    price: 42, unit: 'kg', minOrder: 0.5, maxOrder: 10,
    producer: { id: 'p_elena', name: 'Elena Vázquez', farmName: 'Huerto San Gabriel', location: 'Chignahuapan, Puebla', rating: 4.9, reviewCount: 203, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=elena' },
    harvestDate: '2026-04-26T07:00:00Z', origin: 'Chignahuapan, Puebla', stock: 120,
    image: '/images/Manzana_Gala.jpg', images: ['/images/Manzana_Gala.jpg'],
    description: 'Manzana Gala de Chignahuapan, municipio con microclima ideal para manzanas. Dulces, jugosas y de textura firme. Cosechadas en su punto óptimo de madurez. El frío de la sierra poblana le da un sabor excepcional.',
    freshnessHours: 48, supermarketPrice: 72, savings: 42,
    tags: ['sierra poblana', 'dulce', 'jugosa'], nutritionHighlights: ['Fibra', 'Vitamina C', 'Quercetina', 'Potasio'], available: true,
  },
  {
    _id: 'p8', name: 'Durazno Criollo', category: 'frutas',
    price: 38, unit: 'kg', minOrder: 0.5, maxOrder: 8,
    producer: { id: 'p_elena', name: 'Elena Vázquez', farmName: 'Huerto San Gabriel', location: 'Chignahuapan, Puebla', rating: 4.9, reviewCount: 203, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=elena' },
    harvestDate: '2026-04-27T07:30:00Z', origin: 'Chignahuapan, Puebla', stock: 55,
    image: '/images/Durazno-criollo.jpg', images: ['/images/Durazno-criollo.jpg'],
    description: 'Durazno criollo amarillo de la sierra de Chignahuapan. Variedad local con más sabor y aroma que las variedades comerciales. Pulpa firme y amarilla, piel aterciopelada. Ideal para ates, jaleas y consumo fresco.',
    freshnessHours: 36, supermarketPrice: 65, savings: 42,
    tags: ['criollo', 'sierra', 'temporada'], nutritionHighlights: ['Vitamina A', 'Niacina', 'Potasio', 'Antioxidantes'], available: true,
  },
  {
    _id: 'p9', name: 'Fresas del Valle', category: 'frutas',
    price: 55, unit: '500g', minOrder: 1, maxOrder: 10,
    producer: { id: 'p_manuel', name: 'Manuel Torres', farmName: 'Fresa Fresca', location: 'Atlixco, Puebla', rating: 4.5, reviewCount: 68, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=manuel' },
    harvestDate: '2026-04-27T05:00:00Z', origin: 'Atlixco, Puebla', stock: 35,
    image: '/images/Fresas_Valle.webp', images: ['/images/Fresas_Valle.webp'],
    description: 'Fresas del Valle de Atlixco, las más famosas de Puebla. Rojas hasta el centro, dulces, grandes y perfectas. Cosechadas esta mañana antes del amanecer para conservar su frescura. Sin refrigeración industrial.',
    freshnessHours: 12, supermarketPrice: 95, savings: 42,
    tags: ['Atlixco', 'cosechadas hoy', 'dulces'], nutritionHighlights: ['Vitamina C', 'Manganeso', 'Folato', 'Antioxidantes'], available: true,
  },
  {
    _id: 'p10', name: 'Pera Bartlett', category: 'frutas',
    price: 45, unit: 'kg', minOrder: 0.5, maxOrder: 8,
    producer: { id: 'p_elena', name: 'Elena Vázquez', farmName: 'Huerto San Gabriel', location: 'Chignahuapan, Puebla', rating: 4.9, reviewCount: 203, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=elena' },
    harvestDate: '2026-04-26T08:00:00Z', origin: 'Chignahuapan, Puebla', stock: 70,
    image: '/images/Pera_Bartlett.jpg', images: ['/images/Pera_Bartlett.jpg'],
    description: 'Pera Bartlett de Chignahuapan, jugosa y aromática. Verde cuando está firme, amarilla cuando madura en casa. De las huertas más reconocidas de la sierra norte poblana. Perfecta para postres y consumo directo.',
    freshnessHours: 48, supermarketPrice: 78, savings: 42,
    tags: ['sierra norte', 'aromática'], nutritionHighlights: ['Fibra', 'Vitamina C', 'Cobre', 'Potasio'], available: true,
  },
  {
    _id: 'p11', name: 'Epazote Fresco', category: 'hierbas',
    price: 12, unit: 'manojo', minOrder: 1, maxOrder: 20,
    producer: { id: 'u3', name: 'Don Roberto Hernández', farmName: 'Rancho El Fresno', location: 'San Andrés Cholula, Puebla', rating: 4.8, reviewCount: 124, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=roberto' },
    harvestDate: '2026-04-27T04:00:00Z', origin: 'San Andrés Cholula, Puebla', stock: 80,
    image: '/images/Epazote_Fresco.webp', images: ['/images/Epazote_Fresco.webp'],
    description: 'Epazote fresco de Rancho El Fresno, indispensable en la cocina poblana. Aromático, con hojas verdes intensas y sin señales de marchitez. Ideal para frijoles, quesillo, esquites y mole verde. Cortado esta madrugada.',
    freshnessHours: 8, supermarketPrice: 21, savings: 42,
    tags: ['tradicional', 'aromático', 'cosechado hoy'], nutritionHighlights: ['Hierro', 'Calcio', 'Zinc', 'Vitamina A'], available: true,
  },
  {
    _id: 'p12', name: 'Hierba Santa', category: 'hierbas',
    price: 15, unit: 'manojo', minOrder: 1, maxOrder: 15,
    producer: { id: 'u3', name: 'Don Roberto Hernández', farmName: 'Rancho El Fresno', location: 'San Andrés Cholula, Puebla', rating: 4.8, reviewCount: 124, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=roberto' },
    harvestDate: '2026-04-27T04:00:00Z', origin: 'San Andrés Cholula, Puebla', stock: 40,
    image: '/images/Hierba_Santa.webp', images: ['/images/Hierba_Santa.webp'],
    description: 'Hierba santa de Rancho El Fresno, hojas grandes con aroma anisado. Imprescindible en el mole verde, tamales oaxaqueños y pescados envueltos. Planta nativa de México con siglos de uso en la cocina tradicional.',
    freshnessHours: 16, supermarketPrice: 26, savings: 42,
    tags: ['nativa', 'mole', 'tamales'], nutritionHighlights: ['Calcio', 'Hierro', 'Vitamina C', 'Safrole'], available: true,
  },
  {
    _id: 'p13', name: 'Maíz Azul Poblano', category: 'granos',
    price: 32, unit: 'kg', minOrder: 0.5, maxOrder: 10,
    producer: { id: 'p_jorge', name: 'Jorge Sánchez', farmName: 'Campo Azul', location: 'Tehuacán, Puebla', rating: 4.7, reviewCount: 56, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jorge' },
    harvestDate: '2026-04-20T08:00:00Z', origin: 'Tehuacán, Puebla', stock: 200,
    image: '/images/maiz_azul.jpg', images: ['/images/maiz_azul.jpg'],
    description: 'Maíz azul criollo de Tehuacán, variedad nativa con más de 500 años de cultivo en Puebla. Grano duro, rico en antocianinas. Para tlayudas, tortillas azules, pinole y atole. Cosecha de esta temporada, secado al sol.',
    freshnessHours: 720, supermarketPrice: 55, savings: 42,
    tags: ['criollo', 'nativo', 'antocianinas'], nutritionHighlights: ['Antocianinas', 'Fibra', 'Proteína', 'Hierro'], available: true,
  },
  {
    _id: 'p14', name: 'Frijol Negro Cosecha', category: 'granos',
    price: 38, unit: 'kg', minOrder: 0.5, maxOrder: 10,
    producer: { id: 'p_jorge', name: 'Jorge Sánchez', farmName: 'Campo Azul', location: 'Tehuacán, Puebla', rating: 4.7, reviewCount: 56, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jorge' },
    harvestDate: '2026-04-15T08:00:00Z', origin: 'Tehuacán, Puebla', stock: 150,
    image: '/images/frijol-negro-cosechajpeg.jpeg', images: ['/images/frijol-negro-cosechajpeg.jpeg'],
    description: 'Frijol negro de la cosecha de esta temporada en Tehuacán. Grano seleccionado, sin piedras ni impurezas. Cocción más rápida que los frijoles de temporadas pasadas. Ideal para caldo, enfrijoladas y frijoles charros.',
    freshnessHours: 480, supermarketPrice: 65, savings: 42,
    tags: ['cosecha nueva', 'seleccionado', 'sin impurezas'], nutritionHighlights: ['Proteína', 'Hierro', 'Folato', 'Fibra'], available: true,
  },
  {
    _id: 'p15', name: 'Amaranto Tostado', category: 'granos',
    price: 52, unit: '500g', minOrder: 1, maxOrder: 8,
    producer: { id: 'p_jorge', name: 'Jorge Sánchez', farmName: 'Campo Azul', location: 'Tehuacán, Puebla', rating: 4.7, reviewCount: 56, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jorge' },
    harvestDate: '2026-04-18T08:00:00Z', origin: 'Tehuacán, Puebla', stock: 60,
    image: '/images/Amaranto_Tostado.webp', images: ['/images/Amaranto_Tostado.webp'],
    description: 'Amaranto tostado artesanalmente en Tehuacán, ciudad del amaranto en México. Grano reventado a comal de barro, sin aditivos. Para alegrías, atoles, yogurt, granola y barras energéticas. Proteína completa vegetal.',
    freshnessHours: 240, supermarketPrice: 90, savings: 42,
    tags: ['artesanal', 'proteína completa', 'Tehuacán'], nutritionHighlights: ['Proteína completa', 'Calcio', 'Hierro', 'Lisina'], available: true,
  },
  {
    _id: 'p16', name: 'Huitlacoche', category: 'granos',
    price: 85, unit: '250g', minOrder: 1, maxOrder: 6,
    producer: { id: 'p_jorge', name: 'Jorge Sánchez', farmName: 'Campo Azul', location: 'Tehuacán, Puebla', rating: 4.7, reviewCount: 56, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jorge' },
    harvestDate: '2026-04-27T04:30:00Z', origin: 'Tehuacán, Puebla', stock: 18,
    image: '/images/Huitlacoche.webp', images: ['/images/Huitlacoche.webp'],
    description: 'Huitlacoche fresco, hongo del maíz considerado el trufa mexicana. Sabor terroso, intenso y único. Cosechado esta madrugada de mazorcas de maíz criollo. Para quesadillas, tamales, cremas y gorditas. Disponibilidad muy limitada.',
    freshnessHours: 6, supermarketPrice: 146, savings: 42,
    tags: ['trufa mexicana', 'escaso', 'cosechado hoy'], nutritionHighlights: ['Proteína', 'Aminoácidos', 'Zinc', 'Vitamina B'], available: true,
  },
  {
    _id: 'p17', name: 'Papa Cambray', category: 'tuberculos',
    price: 30, unit: 'kg', minOrder: 0.5, maxOrder: 10,
    producer: { id: 'p_manuel', name: 'Manuel Torres', farmName: 'Fresa Fresca', location: 'Atlixco, Puebla', rating: 4.5, reviewCount: 68, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=manuel' },
    harvestDate: '2026-04-26T06:00:00Z', origin: 'Atlixco, Puebla', stock: 90,
    image: '/images/Papa_Cambray.webp', images: ['/images/Papa_Cambray.webp'],
    description: 'Papa cambray pequeña de Atlixco, tierna y de piel delgada. No necesita pelarse. Para asar, hervir con cáscara o freír entera. Perfecta para guarniciones, caldo tlalpeño y papas al horno con crema.',
    freshnessHours: 48, supermarketPrice: 52, savings: 42,
    tags: ['sin pelar', 'tierna', 'versátil'], nutritionHighlights: ['Vitamina C', 'Potasio', 'Vitamina B6', 'Fibra'], available: true,
  },
  {
    _id: 'p18', name: 'Camote Morado', category: 'tuberculos',
    price: 28, unit: 'kg', minOrder: 0.5, maxOrder: 8,
    producer: { id: 'p_manuel', name: 'Manuel Torres', farmName: 'Fresa Fresca', location: 'Atlixco, Puebla', rating: 4.5, reviewCount: 68, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=manuel' },
    harvestDate: '2026-04-25T07:00:00Z', origin: 'Atlixco, Puebla', stock: 75,
    image: '/images/Camote_Morado.png', images: ['/images/Camote_Morado.png'],
    description: 'Camote morado de Atlixco, variedad local con pulpa violeta intensa. Más dulce que el camote naranja. Rico en antocianinas. Para camotes de olla, purés de colores y postres tradicionales poblanos.',
    freshnessHours: 96, supermarketPrice: 48, savings: 42,
    tags: ['morado', 'antocianinas', 'dulce'], nutritionHighlights: ['Antocianinas', 'Vitamina A', 'Fibra', 'Potasio'], available: true,
  },
  {
    _id: 'p19', name: 'Betabel', category: 'tuberculos',
    price: 25, unit: 'kg', minOrder: 0.5, maxOrder: 8,
    producer: { id: 'p_sofia', name: 'Sofía Martínez', farmName: 'Huerta La Esperanza', location: 'Cuautlancingo, Puebla', rating: 4.6, reviewCount: 87, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sofia' },
    harvestDate: '2026-04-26T07:00:00Z', origin: 'Cuautlancingo, Puebla', stock: 55,
    image: '/images/Betabel.webp', images: ['/images/Betabel.webp'],
    description: 'Betabel fresco con tallo, color rojo intenso que indica alta concentración de pigmentos. Para jugos detox, ensaladas, hummus de betabel y encurtidos. Las hojas son comestibles, ricas en vitamina K.',
    freshnessHours: 48, supermarketPrice: 43, savings: 42,
    tags: ['detox', 'con tallo', 'color intenso'], nutritionHighlights: ['Folato', 'Manganeso', 'Nitratos', 'Betalaínas'], available: true,
  },
  {
    _id: 'p20', name: 'Flor de Calabaza', category: 'flores',
    price: 35, unit: '12 piezas', minOrder: 1, maxOrder: 8,
    producer: { id: 'u3', name: 'Don Roberto Hernández', farmName: 'Rancho El Fresno', location: 'San Andrés Cholula, Puebla', rating: 4.8, reviewCount: 124, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=roberto' },
    harvestDate: '2026-04-27T05:30:00Z', origin: 'San Andrés Cholula, Puebla', stock: 25,
    image: '/images/Flor_de_Calabaza.webp', images: ['/images/Flor_de_Calabaza.webp'],
    description: 'Flor de calabaza cosechada al amanecer, antes de que el sol las abra. Color amarillo vibrante, delicadas y frescas. Para quesadillas, caldos, sopas de flores y tamales. Típica de la cocina poblana y mexicana.',
    freshnessHours: 4, supermarketPrice: 60, savings: 42,
    tags: ['cosechadas hoy', 'delicadas', 'tradicional'], nutritionHighlights: ['Vitamina A', 'Calcio', 'Riboflavina', 'Agua'], available: true,
  },
  {
    _id: 'p21', name: 'Jamaica (flor seca)', category: 'flores',
    price: 65, unit: '250g', minOrder: 1, maxOrder: 6,
    producer: { id: 'p_jorge', name: 'Jorge Sánchez', farmName: 'Campo Azul', location: 'Tehuacán, Puebla', rating: 4.7, reviewCount: 56, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jorge' },
    harvestDate: '2026-04-22T08:00:00Z', origin: 'Tehuacán, Puebla', stock: 45,
    image: '/images/Jamaica.webp', images: ['/images/Jamaica.webp'],
    description: 'Flor de jamaica seca de Tehuacán, región con las mejores condiciones para su cultivo. Color rojo intenso, sabor ácido profundo. Para agua fresca, tés, mermelada y vinos artesanales.',
    freshnessHours: 120, supermarketPrice: 112, savings: 42,
    tags: ['Tehuacán', 'intenso', 'seca'], nutritionHighlights: ['Vitamina C', 'Antocianinas', 'Calcio', 'Antioxidantes'], available: true,
  },
  {
    _id: 'p22', name: 'Perejil Crespo', category: 'hierbas',
    price: 8, unit: 'manojo', minOrder: 1, maxOrder: 20,
    producer: { id: 'p_sofia', name: 'Sofía Martínez', farmName: 'Huerta La Esperanza', location: 'Cuautlancingo, Puebla', rating: 4.6, reviewCount: 87, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sofia' },
    harvestDate: '2026-04-27T06:30:00Z', origin: 'Cuautlancingo, Puebla', stock: 100,
    image: '/images/Perejil_Crespo.webp', images: ['/images/Perejil_Crespo.webp'],
    description: 'Perejil crespo fresco, vibrante y aromático. Cortado esta mañana. Ideal para tabule, chimichurri, sopas y caldos. Sin pesticidas, lavado y listo para usar.',
    freshnessHours: 6, supermarketPrice: 14, savings: 42,
    tags: ['crespo', 'cosechado hoy', 'aromático'], nutritionHighlights: ['Vitamina K', 'Vitamina C', 'Vitamina A', 'Hierro'], available: true,
  },
  {
    _id: 'p23', name: 'Ciruela Amarilla', category: 'frutas',
    price: 35, unit: 'kg', minOrder: 0.5, maxOrder: 8,
    producer: { id: 'p_elena', name: 'Elena Vázquez', farmName: 'Huerto San Gabriel', location: 'Chignahuapan, Puebla', rating: 4.9, reviewCount: 203, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=elena' },
    harvestDate: '2026-04-27T07:30:00Z', origin: 'Chignahuapan, Puebla', stock: 40,
    image: '/images/ciruela-amarilla.webp', images: ['/images/ciruela-amarilla.webp'],
    description: 'Ciruelas amarillas de temporada, piel fina y pulpa dulce-ácida. Ideales para mermeladas, aguas frescas o comerlas directamente. Cosechadas esta mañana a punto de madurez.',
    freshnessHours: 9, supermarketPrice: 60, savings: 42,
    tags: ['temporada', 'cosechado hoy'], nutritionHighlights: ['Vitamina C', 'Fibra', 'Potasio'], available: true,
  },
  {
    _id: 'p24', name: 'Quelites del Campo', category: 'verduras',
    price: 15, unit: 'manojo', minOrder: 1, maxOrder: 10,
    producer: { id: 'u3', name: 'Don Roberto Hernández', farmName: 'Rancho El Fresno', location: 'San Andrés Cholula, Puebla', rating: 4.8, reviewCount: 124, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=roberto' },
    harvestDate: '2026-04-27T04:00:00Z', origin: 'San Andrés Cholula, Puebla', stock: 25,
    image: '/images/Quelites_del_Campo.jpg', images: ['/images/Quelites_del_Campo.jpg'],
    description: 'Quelites silvestres recolectados al amanecer en los campos de San Andrés. Incluye mezcla de verdolagas y quintonil. Cocina mexicana tradicional en su máxima expresión. Disponibilidad muy limitada.',
    freshnessHours: 3, supermarketPrice: 26, savings: 42,
    tags: ['silvestre', 'tradicional', 'cosechado hoy'], nutritionHighlights: ['Omega-3', 'Vitamina E', 'Calcio', 'Magnesio'], available: true,
  },
];

async function seed() {
  await connectDB();

  console.log('\n📦 Sembrando usuarios...');
  for (const u of DEMO_USERS) {
    const exists = await User.findById(u._id);
    if (exists) {
      console.log(`  ↩ Usuario ${u.email} ya existe, omitiendo.`);
      continue;
    }
    const { password, ...rest } = u;
    const hashed = await bcrypt.hash(password, 12);
    await User.create({ ...rest, password: hashed });
    console.log(`  ✅ ${u.email} (${u.role})`);
  }

  console.log('\n🥦 Sembrando productos...');
  for (const p of PRODUCTS) {
    const exists = await Product.findById(p._id);
    if (exists) {
      // Actualiza imagen si cambió
      await Product.findByIdAndUpdate(p._id, { image: p.image, images: p.images });
      console.log(`  ↩ ${p.name} ya existe, imagen actualizada.`);
      continue;
    }
    await Product.create(p);
    console.log(`  ✅ ${p.name} (stock: ${p.stock})`);
  }

  console.log('\n✅ Seed completado.\n');
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Error en seed:', err);
  process.exit(1);
});
