/**
 * mockProducts — API de productos de AgroDirecto
 * Llama a /api/products primero; si no hay servidor, usa el JSON local como fallback.
 */
import productsData from './products.json';

/** Simula latencia de red (solo en fallback) */
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

// Copia local para fallback
let localProducts = [...productsData];

// ─── Helpers API ──────────────────────────────────────────────────────────────
async function apiFetch(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── Funciones principales ───────────────────────────────────────────────────
export async function fetchProducts() {
  try {
    const data = await apiFetch('/api/products');
    localProducts = data; // actualiza caché local
    return data;
  } catch {
    console.warn('[products] API no disponible, usando datos locales.');
    await delay(400);
    return sortProducts([...localProducts], 'freshness');
  }
}

export async function fetchProductById(id) {
  try {
    return await apiFetch(`/api/products/${id}`);
  } catch {
    await delay(300);
    return localProducts.find((p) => p.id === id) || null;
  }
}

export async function refreshProducts() {
  return fetchProducts();
}

// ─── Filtros/ordenamiento (sin cambios — operan en memoria) ──────────────────
export function filterByCategory(prods, category) {
  if (!category || category === 'all') return prods;
  return prods.filter((p) => p.category === category);
}

export function filterBySearch(prods, query) {
  const q = query.toLowerCase().trim();
  if (!q) return prods;
  return prods.filter((p) =>
    p.name.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q) ||
    p.producer.name.toLowerCase().includes(q) ||
    p.producer.farmName.toLowerCase().includes(q) ||
    p.origin.toLowerCase().includes(q) ||
    (p.tags || []).some((t) => t.toLowerCase().includes(q))
  );
}

/**
 * Ordena productos
 * @param {Array} prods
 * @param {'freshness'|'price_asc'|'price_desc'|'savings'|'rating'} sortBy
 * @returns {Array}
 */
export function sortProducts(prods, sortBy = 'freshness') {
  const sorted = [...prods];
  switch (sortBy) {
    case 'freshness':
      // Primero por frescura ASC (más fresco primero), luego precio ASC
      return sorted.sort((a, b) => {
        if (a.freshnessHours !== b.freshnessHours) return a.freshnessHours - b.freshnessHours;
        return a.price - b.price;
      });
    case 'price_asc':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price_desc':
      return sorted.sort((a, b) => b.price - a.price);
    case 'savings':
      return sorted.sort((a, b) => b.savings - a.savings);
    case 'rating':
      return sorted.sort((a, b) => (b.producer.rating || 0) - (a.producer.rating || 0));
    default:
      return sorted;
  }
}

/**
 * Aplica todos los filtros y ordenamiento en una sola pasada
 * @param {{ category, search, sortBy, maxPrice }} filters
 * @returns {Array}
 */
export function applyFilters(prods, { category, search, sortBy, maxPrice }) {
  let result = [...prods];

  if (category) result = filterByCategory(result, category);
  if (search)   result = filterBySearch(result, search);
  if (maxPrice) result = result.filter((p) => p.price <= maxPrice);

  return sortProducts(result, sortBy || 'freshness');
}

/**
 * Obtiene productos de un productor específico
 * @param {string} producerId
 * @returns {Promise<Array>}
 */
export async function fetchProductsByProducer(producerId) {
  try {
    return await apiFetch(`/api/products?producerId=${producerId}`);
  } catch {
    await delay(400);
    return localProducts.filter((p) => p.producer.id === producerId);
  }
}

export async function fetchRelatedProducts(productId, limit = 4) {
  await delay(300);
  const product = localProducts.find((p) => p.id === productId);
  if (!product) return [];
  return localProducts
    .filter((p) => p.category === product.category && p.id !== productId && p.available)
    .slice(0, limit);
}
