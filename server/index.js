/**
 * index.js — Servidor principal de AgroDirecto API
 * Corre en http://localhost:3001
 */
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });
import express from 'express';
import cors from 'cors';
import { connectDB } from './db.js';
import authRoutes     from './routes/auth.js';
import productRoutes  from './routes/products.js';
import orderRoutes    from './routes/orders.js';

const app  = express();
const PORT = process.env.PORT || 3001;

// ─── CORS ─────────────────────────────────────────────────────────────────────
// El app usa JWT en localStorage (no cookies), por lo que no necesita credentials.
// Se permiten todos los orígenes para simplificar el deploy.
// Si quieres restringirlo, pon: ALLOWED_ORIGINS=https://tu-dominio.vercel.app
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : null; // null = todos los orígenes

app.use(cors({
  origin: allowedOrigins ?? '*',
  credentials: false,
}));
app.use(express.json());

// ─── Rutas ────────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders',   orderRoutes);

// ─── Utilidad: asignar todos los productos a un productor ────────────────────
// POST /api/admin/assign-producer  { producerId, name, farmName, location, rating, reviewCount, avatar }
app.post('/api/admin/assign-producer', async (_req, res) => {
  try {
    const { default: Product } = await import('./models/Product.js');
    const body = _req.body;
    const r = await Product.updateMany({}, {
      $set: {
        'producer.id':          body.producerId   || 'u3',
        'producer.name':        body.name         || 'Don Roberto Hernández',
        'producer.farmName':    body.farmName     || 'Rancho El Fresno',
        'producer.location':    body.location     || 'San Andrés Cholula, Puebla',
        'producer.rating':      body.rating       || 4.8,
        'producer.reviewCount': body.reviewCount  || 124,
        'producer.avatar':      body.avatar       || 'https://api.dicebear.com/7.x/avataaars/svg?seed=roberto',
      },
    });
    res.json({ modified: r.modifiedCount, matched: r.matchedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (_req, res) => res.json({ status: 'ok', ts: Date.now() }));

// ─── Arrancar ─────────────────────────────────────────────────────────────────
connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`🚀 AgroDirecto API corriendo en http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health`);
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Puerto ${PORT} en uso. Cierra el proceso anterior y vuelve a intentarlo.`);
      console.error(`   En Windows: netstat -ano | findstr :${PORT}  → taskkill /PID <id> /F`);
    } else {
      console.error('Error al iniciar servidor:', err);
    }
    process.exit(1);
  });
});
