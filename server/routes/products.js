/**
 * products.js — Rutas de productos
 * GET /api/products          — lista con filtros opcionales
 * GET /api/products/:id      — detalle
 * PATCH /api/products/:id/stock — actualiza stock (uso interno)
 */
import express from 'express';
import Product from '../models/Product.js';

const router = express.Router();

// Normaliza el documento para que el frontend reciba `id` en vez de `_id`
function norm(p) {
  const obj = typeof p.toObject === 'function' ? p.toObject() : p;
  const { __v, ...rest } = obj;
  return { ...rest, id: obj._id };
}

// ─── Listar ──────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, search, sortBy, maxPrice } = req.query;

    const filter = { available: true };
    if (category && category !== 'all') filter.category = category;
    if (maxPrice) filter.price = { $lte: Number(maxPrice) };
    if (search) {
      filter.$or = [
        { name:             { $regex: search, $options: 'i' } },
        { 'producer.name':  { $regex: search, $options: 'i' } },
        { origin:           { $regex: search, $options: 'i' } },
      ];
    }

    const sortMap = {
      price_asc:  { price: 1 },
      price_desc: { price: -1 },
      rating:     { 'producer.rating': -1 },
    };
    const sort = sortMap[sortBy] || { freshnessHours: 1 };

    const products = await Product.find(filter).sort(sort).lean();
    res.json(products.map(norm));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Detalle ─────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).lean();
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(norm(product));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Actualizar stock ─────────────────────────────────────────────────────────
router.patch('/:id/stock', async (req, res) => {
  try {
    const { stock } = req.body;
    if (stock == null || stock < 0) {
      return res.status(400).json({ error: 'Stock inválido' });
    }
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { stock },
      { new: true }
    ).lean();
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(norm(product));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
