/**
 * mockOrders — API de pedidos de AgroDirecto
 * Llama a /api/orders primero; si no hay servidor, usa localStorage como fallback.
 */
import { STORAGE_KEYS, ORDER_STATUS } from '../utils/constants';

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// ─── Fallback: localStorage ───────────────────────────────────────────────────
function generateOrderId() {
  const ts  = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `AGD-${ts}-${rnd}`;
}
function getStoredOrders() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveOrders(orders) {
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
}

// ─── Crear pedido ─────────────────────────────────────────────────────────────
export async function createOrder({ items, totals, deliveryInfo, paymentMethod, userId }) {
  // 1) Intentar API real
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, totals, deliveryInfo, paymentMethod, userId }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch {
    console.warn('[orders] API no disponible, guardando en localStorage.');
  }

  // 2) Fallback localStorage
  await delay(1000);
  const now = new Date();
  const deliveryDate = new Date(now.getTime() + 20 * 3600 * 1000);
  const order = {
    id: generateOrderId(),
    userId,
    items: [...items],
    totals: { ...totals },
    deliveryInfo: { ...deliveryInfo },
    paymentMethod,
    status: ORDER_STATUS.CONFIRMED,
    createdAt: now.toISOString(),
    estimatedDelivery: deliveryDate.toISOString(),
    timeline: [{ status: ORDER_STATUS.CONFIRMED, label: 'Pedido confirmado', timestamp: now.toISOString() }],
  };
  const orders = getStoredOrders();
  orders.unshift(order);
  saveOrders(orders);
  return order;
}

// ─── Listar pedidos del usuario ───────────────────────────────────────────────
export async function fetchOrders(userId) {
  try {
    const res = await fetch(`/api/orders?userId=${encodeURIComponent(userId)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch {
    console.warn('[orders] API no disponible, leyendo de localStorage.');
    await delay(400);
    return getStoredOrders().filter((o) => o.userId === userId);
  }
}

// ─── Detalle de pedido ────────────────────────────────────────────────────────
export async function fetchOrderById(orderId) {
  try {
    const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch {
    await delay(300);
    return getStoredOrders().find((o) => o.id === orderId) || null;
  }
}
