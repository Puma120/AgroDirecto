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
  let networkError = false;
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, totals, deliveryInfo, paymentMethod, userId }),
    });
    if (!res.ok) {
      // Errores de negocio (4xx): propagar al usuario, no hacer fallback
      const body = await res.json().catch(() => ({ error: `Error ${res.status}` }));
      throw new Error(body.error || `Error ${res.status}`);
    }
    return res.json();
  } catch (err) {
    // Si el error viene de la API (no es TypeError de red), re-lanzar
    if (!(err instanceof TypeError)) throw err;
    networkError = true;
    console.warn('[orders] API no disponible, guardando en localStorage.');
  }

  if (!networkError) return; // no debería llegar aquí

  // 2) Fallback localStorage — validar stock local
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

// ─── Cancelar pedido ──────────────────────────────────────────────────────────
export async function cancelOrder(orderId) {
  return updateOrderStatus(orderId, 'cancelled');
}

// ─── Actualizar estado (genérico, para uso del productor) ─────────────────────
export async function updateOrderStatus(orderId, status) {
  try {
    const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch {
    await delay(400);
    const orders = getStoredOrders();
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx === -1) throw new Error('Pedido no encontrado');
    const closing = ['delivered', 'cancelled'].includes(status);
    orders[idx] = {
      ...orders[idx],
      status,
      ...(closing ? { closedAt: new Date().toISOString() } : {}),
    };
    saveOrders(orders);
    return orders[idx];
  }
}

// ─── Pedidos del productor ────────────────────────────────────────────────────
export async function fetchProducerOrders(producerId) {
  try {
    const res = await fetch(`/api/orders/producer/${encodeURIComponent(producerId)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } catch {
    await delay(300);
    // Fallback: filtrar localStorage por producerId en items
    return getStoredOrders().filter((o) =>
      (o.items || []).some((i) => i.producerId === producerId)
    );
  }
}

// ─── Limpieza de pedidos expirados ────────────────────────────────────────────
// Se llama en cada carga de la app. Borra pedidos con closedAt > 2h.
export async function cleanupExpiredOrders() {
  try {
    await fetch('/api/orders/cleanup', { method: 'DELETE' });
  } catch {
    // Fallback: limpiar localStorage también
  }
  // Limpiar localStorage sin importar si la API funcionó
  const cutoff = Date.now() - 2 * 60 * 60 * 1000;
  const orders = getStoredOrders();
  const filtered = orders.filter((o) => {
    if (!o.closedAt) return true;
    return new Date(o.closedAt).getTime() > cutoff;
  });
  if (filtered.length !== orders.length) {
    saveOrders(filtered);
  }
}
