/**
 * db.js — Conexión a MongoDB Atlas
 * dotenv ya fue cargado en index.js; este import es solo por si db.js
 * se usa de forma standalone (seed.js, scripts, etc.).
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// En producción (Render) las variables ya están en process.env; el archivo
// .env no existe y dotenv simplemente lo ignora sin lanzar error.
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
