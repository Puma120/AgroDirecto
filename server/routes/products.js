/**
 * products.js — Rutas de productos
 * GET    /api/products              — lista con filtros opcionales
 * GET    /api/products/:id          — detalle
 * POST   /api/products              — crear producto (productor)
 * PUT    /api/products/:id          — editar producto completo (productor)
 * DELETE /api/products/:id          — archivar producto (available=false)
 * PATCH  /api/products/:id/stock    — ajuste de stock con comentario
 */
import express from 'express';
import Product from '../models/Product.js';

const router = express.Router();

function generateProductId() {
  return `p_${Date.now().toString(36)}`;
}

// Normaliza el documento para que el frontend reciba `id` en vez de `_id`
function norm(p) {
  const obj = typeof p.toObject === 'function' ? p.toObject() : p;
  const { __v, ...rest } = obj;
  return { ...rest, id: obj._id };
}

// ─── Listar ──────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { category, search, sortBy, maxPrice, producerId } = req.query;

    // Para el productor: mostrar todos sus productos (incl. archivados si pide sus propios)
    const filter = producerId ? { 'producer.id': producerId } : { available: true };
    if (producerId) filter['producer.id'] = producerId;
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

// ─── Actualizar stock con delta + comentario ──────────────────────────────────
router.patch('/:id/stock', async (req, res) => {
  try {
    const { delta, comment, absolute } = req.body;
    // Soporta dos modos: absolute (set fijo) o delta (incremento/decremento)
    let update;
    if (absolute != null) {
      if (absolute < 0) return res.status(400).json({ error: 'Stock no puede ser negativo' });
      update = { $set: { stock: absolute } };
    } else if (delta != null) {
      // Verificar que el stock resultante no sea negativo
      const current = await Product.findById(req.params.id).select('stock').lean();
      if (!current) return res.status(404).json({ error: 'Producto no encontrado' });
      const newStock = current.stock + Number(delta);
      if (newStock < 0) return res.status(400).json({ error: `Stock insuficiente (actual: ${current.stock})` });
      update = { $set: { stock: newStock } };
    } else {
      return res.status(400).json({ error: 'Se requiere delta o absolute' });
    }

    // Registrar en stockLog si hay comentario
    if (comment) {
      update.$push = {
        stockLog: {
          delta: delta ?? (absolute - (await Product.findById(req.params.id).select('stock').lean())?.stock ?? 0),
          comment,
          timestamp: new Date(),
        },
      };
    }

    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true }).lean();
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(norm(product));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Crear producto ───────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, category, price, unit, minOrder, maxOrder, description,
            origin, stock, image, tags, freshnessHours, supermarketPrice,
            producer, available } = req.body;

    if (!name || !category || !price || !producer?.id) {
      return res.status(400).json({ error: 'name, category, price y producer.id son requeridos' });
    }

    const id = generateProductId();
    const savings = supermarketPrice ? Math.round((1 - price / supermarketPrice) * 100) : 0;

    const product = await Product.create({
      _id: id,
      name, category, price, unit: unit || 'kg',
      minOrder: minOrder || 1,
      maxOrder: maxOrder || 99,
      description: description || '',
      origin: origin || producer?.location || '',
      stock: stock || 0,
      image: image || `https://picsum.photos/seed/${id}/400/400`,
      images: image ? [image] : [],
      tags: tags || [],
      freshnessHours: freshnessHours || 24,
      supermarketPrice: supermarketPrice || 0,
      savings,
      producer,
      harvestDate: new Date().toISOString(),
      available: available !== false,
    });

    res.status(201).json(norm(product));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Editar producto ──────────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const allowed = ['name','category','price','unit','minOrder','maxOrder',
      'description','origin','image','images','tags','freshnessHours',
      'supermarketPrice','savings','available','producer'];
    const update = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) update[key] = req.body[key];
    }
    if (update.supermarketPrice && update.price) {
      update.savings = Math.round((1 - update.price / update.supermarketPrice) * 100);
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id, update, { new: true }
    ).lean();
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(norm(product));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Archivar (soft-delete) ───────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id, { available: false }, { new: true }
    ).lean();
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ ok: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
