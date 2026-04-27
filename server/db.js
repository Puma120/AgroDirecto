/**
 * db.js — Conexión a MongoDB Atlas
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_CLUSTER_URL, {
      dbName: 'agrodirecto',
    });
    console.log('✅ MongoDB Atlas conectado — base: agrodirecto');
  } catch (err) {
    console.error('❌ Error MongoDB:', err.message);
    process.exit(1);
  }
}
