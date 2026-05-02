import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../.env') });
import mongoose from 'mongoose';
import Product from '../models/Product.js';

await mongoose.connect(process.env.MONGO_CLUSTER_URL);

const r = await Product.updateMany(
  {},
  {
    $set: {
      'producer.id':          'u3',
      'producer.name':        'Don Roberto Hernández',
      'producer.farmName':    'Rancho El Fresno',
      'producer.location':    'San Andrés Cholula, Puebla',
      'producer.rating':      4.8,
      'producer.reviewCount': 124,
      'producer.avatar':      'https://api.dicebear.com/7.x/avataaars/svg?seed=roberto',
    },
  }
);
console.log('Actualizados:', r.modifiedCount, '/ Total match:', r.matchedCount);
await mongoose.disconnect();
