/**
 * Constantes globales de AgroDirecto
 * Aquí se centralizan valores de negocio y llaves de almacenamiento
 */

// ─── Llaves de localStorage ───────────────────────────────────────────────────
export const STORAGE_KEYS = {
  TOKEN:       'agro_token',
  USER:        'agro_user',
  CART:        'agro_cart',
  PREFERENCES: 'agro_preferences',
  ADDRESSES:   'agro_addresses',
  ORDERS:      'agro_orders',
};

// ─── Roles de usuario ─────────────────────────────────────────────────────────
export const ROLES = {
  CONSUMER: 'consumer',
  PRODUCER: 'producer',
  GUEST:    'guest',
};

// ─── Reglas de negocio ────────────────────────────────────────────────────────
export const BUSINESS_RULES = {
  FREE_SHIPPING_THRESHOLD: 300,    // MXN — envío gratis a partir de $300
  SHIPPING_COST:           50,     // MXN — costo de envío base
  FRESHNESS_BADGE_HOURS:   24,     // horas — muestra "Cosechado hoy"
  PRICE_SAVING_PERCENT:    42,     // % de ahorro vs supermercado
  MAX_DELIVERY_HOURS:      24,     // horas máximas de entrega
};

// ─── Estados de pedido ────────────────────────────────────────────────────────
export const ORDER_STATUS = {
  PENDING:    'pending',
  CONFIRMED:  'confirmed',
  HARVESTING: 'harvesting',
  IN_TRANSIT: 'in_transit',
  DELIVERED:  'delivered',
  CANCELLED:  'cancelled',
};

// ─── Categorías del catálogo ─────────────────────────────────────────────────
export const CATEGORIES = [
  { id: 'all',        label: 'Todos',      emoji: '🌿' },
  { id: 'verduras',   label: 'Verduras',   emoji: '🥦' },
  { id: 'frutas',     label: 'Frutas',     emoji: '🍎' },
  { id: 'hierbas',    label: 'Hierbas',    emoji: '🌿' },
  { id: 'granos',     label: 'Granos',     emoji: '🌽' },
  { id: 'tuberculos', label: 'Tubérculos', emoji: '🥔' },
  { id: 'flores',     label: 'Flores',     emoji: '🌸' },
];

// ─── Rutas de la app ─────────────────────────────────────────────────────────
export const ROUTES = {
  LOGIN:            '/login',
  REGISTER:         '/register',
  ROLE_SELECTOR:    '/seleccionar-rol',
  WELCOME_GUEST:    '/bienvenido',
  CATALOG:          '/catalogo',
  PRODUCT_DETAIL:   '/producto/:id',
  CART:             '/carrito',
  CHECKOUT:         '/checkout',
  ORDER_SUCCESS:    '/pedido-exitoso',
  ORDERS:           '/pedidos',
  ORDER_DETAIL:     '/pedidos/:id',
  PROFILE:          '/perfil',
  PRODUCER_HOME:    '/productor',
};
