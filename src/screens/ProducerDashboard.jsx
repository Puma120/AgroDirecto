/**
 * ProducerDashboard — Panel del productor
 * Resumen de ventas, pedidos activos, gestión de productos
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Package, ShoppingBag, Star, Plus,
  Edit3, Eye, EyeOff, BarChart2, Leaf, LogOut, ChevronDown,
  Trash2, ArrowUpCircle, ArrowDownCircle, X, Check,
} from 'lucide-react';
import AppHeader from '../components/AppHeader';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { formatCurrency, formatRelativeDate } from '../utils/formatters';
import { fetchProducerOrders, updateOrderStatus } from '../mocks/mockOrders';
import { fetchProductsByProducer, createProduct, updateProduct, deleteProduct, adjustStock } from '../mocks/mockProducts';
import { ORDER_STATUS, ROUTES } from '../utils/constants';
import productsDataFallback from '../mocks/products.json';

const STATUS_CONFIG = {
  [ORDER_STATUS.PENDING]:    { label: 'Pendiente',   color: 'yellow', emoji: '⏳' },
  [ORDER_STATUS.CONFIRMED]:  { label: 'Confirmado',  color: 'blue',   emoji: '✅' },
  [ORDER_STATUS.HARVESTING]: { label: 'Cosechando',  color: 'green',  emoji: '🌱' },
  [ORDER_STATUS.IN_TRANSIT]: { label: 'En camino',   color: 'orange', emoji: '🚚' },
  [ORDER_STATUS.DELIVERED]:  { label: 'Entregado',   color: 'green',  emoji: '🏠' },
  [ORDER_STATUS.CANCELLED]:  { label: 'Cancelado',   color: 'red',    emoji: '❌' },
};

export default function ProducerDashboard() {
  const { currentUser, logout } = useAuth();
  const { showToast }   = useToast();
  const navigate        = useNavigate();

  async function handleLogout() {
    await logout();
    navigate(ROUTES.LOGIN, { replace: true });
  }

  // Productos del productor (desde API, fallback al JSON local)
  const [myProducts, setMyProducts] = useState(() =>
    productsDataFallback.filter((p) => p.producer?.id === currentUser?.id)
  );

  useEffect(() => {
    if (!currentUser) return;
    fetchProductsByProducer(currentUser.id)
      .then((data) => { if (data?.length) setMyProducts(data); })
      .catch(() => {});
  }, [currentUser]);

  // Pedidos
  const [orders,     setOrders]     = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [updatingId, setUpdatingId] = useState(null); // id del pedido que se está actualizando
  const [hiddenProducts, setHiddenProducts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('agro_hidden_products') || '[]');
    } catch { return []; }
  });

  const loadOrders = useCallback(async () => {
    if (!currentUser) return;
    setLoadingOrders(true);
    try {
      const data = await fetchProducerOrders(currentUser.id);
      setOrders(data);
    } finally {
      setLoadingOrders(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusChange = useCallback(async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const updated = await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: updated.status } : o))
      );
      showToast({ message: 'Estado del pedido actualizado', type: 'success' });
    } catch {
      showToast({ message: 'Error al actualizar el estado', type: 'error' });
    } finally {
      setUpdatingId(null);
    }
  }, [showToast]);

  // ─── CRUD Productos ────────────────────────────────────────────────────────
  // productModal: null | { mode: 'create'|'edit', product?: {} }
  const [productModal, setProductModal] = useState(null);
  // stockModal: null | { product: {} }
  const [stockModal, setStockModal]     = useState(null);
  const [savingProduct, setSavingProduct] = useState(false);

  const openCreateModal = () => setProductModal({
    mode: 'create',
    product: { name: '', category: 'verduras', price: '', unit: 'kg',
               minOrder: 1, maxOrder: 99, stock: '', description: '',
               origin: '', image: '', available: true },
  });

  const openEditModal = (product) => setProductModal({ mode: 'edit', product: { ...product } });

  const handleSaveProduct = useCallback(async (formData) => {
    setSavingProduct(true);
    try {
      const payload = {
        ...formData,
        price:    Number(formData.price),
        stock:    Number(formData.stock),
        minOrder: Number(formData.minOrder) || 1,
        maxOrder: Number(formData.maxOrder) || 99,
        producer: {
          id:          currentUser.id,
          name:        currentUser.name,
          farmName:    currentUser.farmName || 'Rancho El Fresno',
          location:    currentUser.location || 'Puebla, México',
          rating:      4.8,
          reviewCount: 0,
          avatar:      currentUser.avatar || '',
        },
      };
      if (productModal.mode === 'create') {
        const created = await createProduct(payload);
        setMyProducts((prev) => [created, ...prev]);
        showToast({ message: 'Producto creado', type: 'success' });
      } else {
        const updated = await updateProduct(productModal.product.id, payload);
        setMyProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        showToast({ message: 'Producto actualizado', type: 'success' });
      }
      setProductModal(null);
    } catch (err) {
      showToast({ message: err.message || 'Error al guardar', type: 'error' });
    } finally {
      setSavingProduct(false);
    }
  }, [productModal, currentUser, showToast]);

  const handleDeleteProduct = useCallback(async (product) => {
    if (!window.confirm(`¿Archivar "${product.name}"? No aparecerá para los compradores.`)) return;
    try {
      await deleteProduct(product.id);
      setMyProducts((prev) => prev.filter((p) => p.id !== product.id));
      showToast({ message: 'Producto archivado', type: 'success' });
    } catch {
      showToast({ message: 'Error al archivar', type: 'error' });
    }
  }, [showToast]);

  const handleAdjustStock = useCallback(async ({ productId, delta, comment }) => {
    try {
      const updated = await adjustStock(productId, delta, comment);
      setMyProducts((prev) => prev.map((p) =>
        p.id === productId ? { ...p, stock: updated.stock ?? Math.max(0, (p.stock || 0) + delta) } : p
      ));
      showToast({ message: `Stock ${delta > 0 ? '+' : ''}${delta} registrado`, type: 'success' });
      setStockModal(null);
    } catch (err) {
      showToast({ message: err.message || 'Error al ajustar stock', type: 'error' });
    }
  }, [showToast]);

  function toggleProductVisibility(productId) {
    setHiddenProducts((prev) => {
      const updated = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      localStorage.setItem('agro_hidden_products', JSON.stringify(updated));
      return updated;
    });
    showToast({ message: 'Visibilidad del producto actualizada', type: 'success' });
  }

  // ─── Estadísticas ──────────────────────────────────────────────────────────
  const deliveredOrders   = orders.filter((o) => o.status === ORDER_STATUS.DELIVERED);
  const activeOrders      = orders.filter((o) =>
    [ORDER_STATUS.CONFIRMED, ORDER_STATUS.HARVESTING, ORDER_STATUS.IN_TRANSIT].includes(o.status)
  );

  const totalEarnings = deliveredOrders.reduce((acc, order) => {
    const myItems = (order.items || []).filter((i) => i.producerId === currentUser?.id);
    return acc + myItems.reduce((s, i) => s + i.price * i.qty, 0);
  }, 0);

  const avgRating = myProducts.length
    ? (myProducts.reduce((s, p) => s + (p.producer?.rating || 0), 0) / myProducts.length).toFixed(1)
    : '–';

  if (!currentUser) {
    navigate(ROUTES.LOGIN, { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <AppHeader
        title="Mi Dashboard"
        right={
          <button
            onClick={handleLogout}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-50 text-red-400"
            title="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        }
      />

      <div className="px-4 py-4 space-y-4">
        {/* ─── Bienvenida ──────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-primary-600 to-fresh-400 rounded-2xl p-5 text-white">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-primary-100 text-sm mb-1">Bienvenido de vuelta</p>
              <h2 className="text-xl font-bold leading-tight">{currentUser.name}</h2>
              {currentUser.farmName && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Leaf size={13} className="text-primary-200" />
                  <p className="text-sm text-primary-100">{currentUser.farmName}</p>
                </div>
              )}
            </div>
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <span className="text-2xl">
                {currentUser.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 mt-3">
            <Star size={14} className="text-yellow-300 fill-yellow-300" />
            <span className="text-sm font-semibold">{avgRating}</span>
            <span className="text-primary-200 text-xs ml-1">
              · {myProducts[0]?.producer?.reviewCount || 0} reseñas
            </span>
          </div>
        </div>

        {/* ─── Stats rápidos ───────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={TrendingUp}
            label="Ingresos totales"
            value={formatCurrency(totalEarnings)}
            color="primary"
          />
          <StatCard
            icon={ShoppingBag}
            label="Pedidos activos"
            value={activeOrders.length}
            color="orange"
          />
          <StatCard
            icon={Package}
            label="Mis productos"
            value={myProducts.length}
            color="green"
          />
          <StatCard
            icon={BarChart2}
            label="Pedidos totales"
            value={orders.length}
            color="blue"
          />
        </div>

        {/* ─── Pedidos ─────────────────────────────────────────────── */}
        <Section
          title="Pedidos"
          action={
            <button
              onClick={loadOrders}
              className="text-xs text-primary-600 font-semibold px-2 py-1 rounded-lg hover:bg-primary-50"
            >
              Actualizar
            </button>
          }
        >
          {loadingOrders ? (
            <div className="space-y-2 py-1">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <p className="text-sm text-gray-400 py-3 text-center">
              Cuando los compradores hagan pedidos de tus productos, aparecerán aquí.
            </p>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const cfg = STATUS_CONFIG[order.status];
                const myItems = (order.items || []).filter(
                  (i) => i.producerId === currentUser?.id
                );
                const myTotal = myItems.reduce((s, i) => s + i.price * i.qty, 0);
                const isUpdating = updatingId === order.id;

                // Siguientes estados posibles según estado actual
                const NEXT_STATUSES = {
                  confirmed:  [{ value: 'harvesting', label: '🌱 Iniciar cosecha' }],
                  harvesting: [{ value: 'in_transit', label: '🚚 Marcar en camino' }],
                  in_transit: [{ value: 'delivered',  label: '🏠 Marcar entregado' }],
                  pending:    [{ value: 'confirmed',  label: '✅ Confirmar pedido' }],
                };
                const nextOptions = NEXT_STATUSES[order.status] || [];

                return (
                  <div key={order.id} className="border border-gray-100 rounded-xl p-3 space-y-2.5">
                    {/* Cabecera */}
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{cfg.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-gray-500 truncate">{order.id}</p>
                        <p className="text-xs text-gray-400">{formatRelativeDate(order.createdAt)}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <Badge color={cfg.color} size="sm">{cfg.label}</Badge>
                        <p className="text-sm font-bold text-gray-900 mt-0.5">{formatCurrency(myTotal)}</p>
                      </div>
                    </div>

                    {/* Items del productor */}
                    {myItems.length > 0 && (
                      <div className="space-y-1 pl-1">
                        {myItems.map((item, idx) => (
                          <p key={idx} className="text-xs text-gray-600">
                            · {item.qty} {item.unit} de <span className="font-medium">{item.name}</span>
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Botones de avance de estado */}
                    {nextOptions.length > 0 && (
                      <div className="flex gap-2 pt-1">
                        {nextOptions.map((opt) => (
                          <button
                            key={opt.value}
                            disabled={isUpdating}
                            onClick={() => handleStatusChange(order.id, opt.value)}
                            className="flex-1 text-xs font-semibold py-2 px-3 rounded-lg bg-primary-50 text-primary-700
                              hover:bg-primary-100 active:scale-95 transition-all disabled:opacity-50"
                          >
                            {isUpdating ? '...' : opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* ─── Mis productos ───────────────────────────────────────── */}
        <Section
          title="Mis productos"
          action={
            <Button size="sm" variant="ghost" icon={<Plus size={14} />} onClick={openCreateModal}>
              Agregar
            </Button>
          }
        >
          {myProducts.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-gray-400 mb-3">Aún no tienes productos registrados</p>
              <Button variant="outline" size="sm" icon={<Plus size={15} />} onClick={openCreateModal}>
                Agregar mi primer producto
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {myProducts.map((product) => {
                const isHidden = !product.available || hiddenProducts.includes(product.id);
                const stockColor = product.stock > 10 ? 'green' : product.stock > 0 ? 'yellow' : 'red';
                return (
                  <div
                    key={product.id}
                    className={`flex items-center gap-3 py-2 border-b border-gray-50 last:border-0 transition-opacity
                      ${isHidden ? 'opacity-50' : ''}`}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      onError={(e) => { e.target.src = `https://picsum.photos/seed/${product.id}/80/80`; }}
                      className="w-12 h-12 rounded-xl object-cover bg-gray-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs text-gray-500">{formatCurrency(product.price)} / {product.unit}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <Badge color={stockColor} size="sm">Stock: {product.stock ?? '–'}</Badge>
                        {isHidden && <Badge color="gray" size="sm">Archivado</Badge>}
                      </div>
                    </div>
                    {/* Acciones */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => setStockModal({ product })}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-primary-50"
                        title="Ajustar stock"
                      >
                        <ArrowUpCircle size={15} className="text-primary-500" />
                      </button>
                      <button
                        onClick={() => openEditModal(product)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-blue-50"
                        title="Editar producto"
                      >
                        <Edit3 size={15} className="text-blue-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50"
                        title="Archivar"
                      >
                        <Trash2 size={15} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* ─── Consejo rápido ─────────────────────────────────────── */}
        <div className="bg-earth-50 rounded-2xl p-4 flex gap-3">
          <span className="text-2xl flex-shrink-0">💡</span>
          <div>
            <p className="text-sm font-semibold text-earth-800">Consejo de temporada</p>
            <p className="text-xs text-earth-700 mt-0.5 leading-relaxed">
              Actualiza tus fotos de cosecha para aumentar hasta 3× tus ventas. Los compradores confían más en imágenes recientes.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Modal Crear / Editar producto ─────────────────────── */}
      {productModal && (
        <ProductFormModal
          mode={productModal.mode}
          initial={productModal.product}
          saving={savingProduct}
          onSave={handleSaveProduct}
          onClose={() => setProductModal(null)}
        />
      )}

      {/* ─── Modal Ajuste de Stock ──────────────────────────────── */}
      {stockModal && (
        <StockModal
          product={stockModal.product}
          onConfirm={handleAdjustStock}
          onClose={() => setStockModal(null)}
        />
      )}
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    primary: 'bg-primary-50 text-primary-600',
    orange:  'bg-orange-50 text-orange-500',
    green:   'bg-green-50 text-green-600',
    blue:    'bg-blue-50 text-blue-600',
  };
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className={`w-9 h-9 rounded-xl ${colors[color]} flex items-center justify-center mb-2`}>
        <Icon size={18} />
      </div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="font-bold text-gray-900 text-lg leading-none">{value}</p>
    </div>
  );
}

function Section({ title, subtitle, action, children }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
          {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

// ─── Modal de Producto (crear / editar) ───────────────────────────────────────
const CATEGORIES = ['verduras', 'frutas', 'hierbas', 'hongos', 'otros'];
const UNITS = ['kg', 'manojo', 'pieza', 'caja', 'bolsa', 'litro'];

function ProductFormModal({ mode, initial, saving, onSave, onClose }) {
  const [form, setForm] = useState(initial);
  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  const isValid = form.name.trim() && form.price > 0 && form.category;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-t-3xl shadow-xl max-h-[90vh] flex flex-col">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-bold text-gray-900">{mode === 'create' ? 'Nuevo producto' : 'Editar producto'}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        {/* Formulario scrollable */}
        <div className="overflow-y-auto px-5 py-4 space-y-4 flex-1">
          {/* Nombre */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Nombre *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Ej: Jitomate Saladette"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>

          {/* Categoría + Unidad */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Categoría *</label>
              <select
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Unidad *</label>
              <select
                value={form.unit}
                onChange={(e) => set('unit', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 bg-white"
              >
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* Precio + Stock */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Precio (MXN) *</label>
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                placeholder="0.00"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Stock inicial</label>
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => set('stock', e.target.value)}
                placeholder="0"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
          </div>

          {/* Pedido mín/máx */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Pedido mínimo</label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={form.minOrder}
                onChange={(e) => set('minOrder', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 block mb-1">Pedido máximo</label>
              <input
                type="number"
                min="1"
                value={form.maxOrder}
                onChange={(e) => set('maxOrder', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
            </div>
          </div>

          {/* Origen */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Origen / Municipio</label>
            <input
              type="text"
              value={form.origin}
              onChange={(e) => set('origin', e.target.value)}
              placeholder="Ej: San Andrés Cholula, Puebla"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>

          {/* URL imagen */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">URL de imagen</label>
            <input
              type="url"
              value={form.image}
              onChange={(e) => set('image', e.target.value)}
              placeholder="https://..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Descripción</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Describe tu producto..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
            />
          </div>

          {/* Disponible */}
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => set('available', !form.available)}
              className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 ${form.available ? 'bg-primary-500' : 'bg-gray-200'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full shadow mt-0.5 transition-transform ${form.available ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-sm text-gray-700">Visible para compradores</span>
          </label>
        </div>

        {/* Botones */}
        <div className="px-5 pb-6 pt-3 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={!isValid || saving}
            className="flex-1 py-3 rounded-xl bg-primary-500 text-white text-sm font-semibold
              hover:bg-primary-600 active:scale-98 transition-all disabled:opacity-50"
          >
            {saving ? 'Guardando...' : mode === 'create' ? 'Crear producto' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal de Ajuste de Stock ──────────────────────────────────────────────────
const STOCK_PRESETS = [
  { label: 'Cosecha nueva',   delta: +10, emoji: '🌱', color: 'green'  },
  { label: 'Entrega cliente', delta:  -1, emoji: '📦', color: 'blue'   },
  { label: 'Desperdicio',     delta:  -1, emoji: '🗑️', color: 'red'    },
  { label: 'Ajuste manual',   delta:   0, emoji: '✏️', color: 'gray'   },
];

function StockModal({ product, onConfirm, onClose }) {
  const [delta,   setDelta]   = useState('');
  const [comment, setComment] = useState('');
  const [preset,  setPreset]  = useState(null);

  const numDelta = Number(delta) || 0;
  const newStock = Math.max(0, (product.stock || 0) + numDelta);
  const isValid  = delta !== '' && numDelta !== 0 && comment.trim();

  const applyPreset = (p) => {
    setPreset(p.label);
    if (p.delta !== 0) setDelta(String(p.delta));
    setComment(p.label);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-t-3xl shadow-xl">
        {/* Cabecera */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Ajustar stock</h2>
            <p className="text-xs text-gray-400 mt-0.5">{product.name} · Actual: <strong>{product.stock}</strong> {product.unit}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Presets rápidos */}
          <div className="grid grid-cols-2 gap-2">
            {STOCK_PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold text-left transition-all
                  ${preset === p.label
                    ? 'border-primary-400 bg-primary-50 text-primary-700'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}
              >
                <span className="text-base">{p.emoji}</span>
                {p.label}
                {p.delta !== 0 && (
                  <span className={`ml-auto ${p.delta > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {p.delta > 0 ? '+' : ''}{p.delta}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Delta manual */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              Cantidad <span className="font-normal text-gray-400">(+ entrada / − salida)</span>
            </label>
            <input
              type="number"
              value={delta}
              onChange={(e) => { setDelta(e.target.value); setPreset(null); }}
              placeholder="Ej: +15 o -3"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
            {delta !== '' && (
              <p className={`text-xs mt-1 ${newStock < product.stock ? 'text-red-500' : 'text-green-600'}`}>
                Stock resultante: <strong>{newStock} {product.unit}</strong>
              </p>
            )}
          </div>

          {/* Comentario */}
          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">Comentario *</label>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ej: Cosecha del lunes, desperdicio por lluvia…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
          </div>
        </div>

        {/* Botones */}
        <div className="px-5 pb-6 pt-1 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm({ productId: product.id, delta: numDelta, comment })}
            disabled={!isValid}
            className="flex-1 py-3 rounded-xl bg-primary-500 text-white text-sm font-semibold
              hover:bg-primary-600 active:scale-98 transition-all disabled:opacity-50"
          >
            Registrar ajuste
          </button>
        </div>
      </div>
    </div>
  );
}

