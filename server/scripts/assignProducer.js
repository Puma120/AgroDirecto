/**
 * assignProducer.js
 * Asigna todos los productos en MongoDB al productor demo u3 (Roberto Hernández)
 * Uso: node server/scripts/assignProducer.js
 */
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../.env') });

import mongoose from 'mongoose';
import Product  from '../models/Product.js';

const PRODUCER = {
  id:          'u3',
  name:        'Don Roberto Hernández',
  farmName:    'Rancho El Fresno',
  location:    'San Andrés Cholula, Puebla',
  rating:      4.8,
  reviewCount: 124,
  avatar:      'https://api.dicebear.com/7.x/avataaars/svg?seed=roberto',
};

async function run() {
  await mongoose.connect(process.env.MONGO_CLUSTER_URL);
  console.log('✅ Conectado a MongoDB');

  const result = await Product.updateMany(
    {},
    { $set: { producer: PRODUCER } }
  );

  console.log(`✅ ${result.modifiedCount} productos actualizados al productor u3 (Rancho El Fresno)`);
  await mongoose.disconnect();
}

run().catch((err) => { console.error(err); process.exit(1); });
