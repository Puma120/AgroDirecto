/**
 * orders.js — Rutas de pedidos
 * POST /api/orders           — crear pedido (descuenta stock)
 * GET  /api/orders?userId=xx — lista de pedidos del usuario
 * GET  /api/orders/:id       — detalle de pedido
 * PATCH /api/orders/:id/status — actualizar estado (productor/admin)
 */
import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

const router = express.Router();

function generateOrderId() {
  const ts  = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `AGD-${ts}-${rnd}`;
}

function norm(o) {
  const obj = typeof o.toObject === 'function' ? o.toObject() : o;
  const { __v, ...rest } = obj;
  return { ...rest, id: obj._id, createdAt: obj.createdAt };
}

// ─── Crear pedido ─────────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { items, totals, deliveryInfo, paymentMethod, userId } = req.body;

    if (!items?.length || !userId) {
      return res.status(400).json({ error: 'items y userId son requeridos' });
    }

    // Verificar stock disponible antes de crear el pedido
    for (const item of items) {
      const product = await Product.findById(item.id).select('name stock').lean();
      if (!product) {
        return res.status(404).json({ error: `Producto no encontrado: ${item.name || item.id}` });
      }
      if (product.stock < item.qty) {
        return res.status(409).json({
          error: `Stock insuficiente para "${product.name}": disponible ${product.stock}, solicitado ${item.qty}`,
          productId: item.id,
          available: product.stock,
          requested: item.qty,
        });
      }
    }

    // Descontar stock atómicamente
    for (const item of items) {
      await Product.findOneAndUpdate(
        { _id: item.id, stock: { $gte: item.qty } },
        { $inc: { stock: -item.qty } }
      );
    }

    const now = new Date();
    const estimatedDelivery = new Date(now.getTime() + 20 * 3600 * 1000).toISOString();
    const orderId = generateOrderId();

    const order = await Order.create({
      _id: orderId,
      userId,
      items,
      totals,
      deliveryInfo,
      paymentMethod,
      status: 'confirmed',
      estimatedDelivery,
      timeline: [{ status: 'confirmed', label: 'Pedido confirmado', timestamp: now.toISOString() }],
    });

    res.status(201).json(norm(order));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Pedidos por productor ────────────────────────────────────────────────────
router.get('/producer/:producerId', async (req, res) => {
  try {
    const orders = await Order.find({
      'items.producerId': req.params.producerId,
    }).sort({ createdAt: -1 }).lean();
    res.json(orders.map(norm));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Listar pedidos ───────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    const filter = userId ? { userId } : {};
    const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();
    res.json(orders.map(norm));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Detalle ──────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).lean();
    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json(norm(order));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const STATUS_LABELS = {
  pending:    'Pedido pendiente',
  confirmed:  'Pedido confirmado',
  harvesting: 'Productores cosechando',
  in_transit: 'En camino',
  delivered:  'Entregado',
  cancelled:  'Pedido cancelado',
};

// ─── Actualizar estado ────────────────────────────────────────────────────────
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'harvesting', 'in_transit', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const closing = ['delivered', 'cancelled'].includes(status);

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        status,
        ...(closing ? { closedAt: new Date() } : {}),
        $push: {
          timeline: {
            status,
            label: STATUS_LABELS[status] || status,
            timestamp: new Date().toISOString(),
          },
        },
      },
      { new: true }
    ).lean();

    if (!order) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json(norm(order));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Limpiar pedidos expirados (closedAt > 2h) ────────────────────────────────
router.delete('/cleanup', async (req, res) => {
  try {
    const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000); // hace 2 horas
    const result = await Order.deleteMany({
      closedAt: { $ne: null, $lt: cutoff },
    });
    res.json({ deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
