/**
 * ProducerDashboard — Panel del productor
 * Resumen de ventas, pedidos activos, gestión de productos
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, Package, ShoppingBag, Star, Plus,
  Edit3, Eye, EyeOff, BarChart2, Leaf, LogOut,
} from 'lucide-react';
import AppHeader from '../components/AppHeader';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { formatCurrency, formatRelativeDate } from '../utils/formatters';
import { ORDER_STATUS, ROUTES } from '../utils/constants';
import productsData from '../mocks/products.json';

// ─── Mock de pedidos del productor ────────────────────────────────────────────
function getProducerOrders(userId) {
  try {
    const all = JSON.parse(localStorage.getItem('agro_orders') || '[]');
    // Filtrar pedidos que contienen al menos 1 producto de este productor
    return all.filter((order) =>
      (order.items || []).some((item) => item.producerId === userId)
    );
  } catch { return []; }
}

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

  // Productos del productor
  const myProducts = productsData.filter(
    (p) => p.producer?.id === currentUser?.id
  );

  // Pedidos activos
  const [orders, setOrders]         = useState([]);
  const [hiddenProducts, setHiddenProducts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('agro_hidden_products') || '[]');
    } catch { return []; }
  });

  useEffect(() => {
    if (currentUser) {
      setOrders(getProducerOrders(currentUser.id));
    }
  }, [currentUser]);

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

        {/* ─── Pedidos activos ─────────────────────────────────────── */}
        <Section
          title="Pedidos activos"
          subtitle={activeOrders.length === 0 ? 'Sin pedidos en este momento' : undefined}
        >
          {activeOrders.length === 0 ? (
            <p className="text-sm text-gray-400 py-3 text-center">
              Cuando los compradores hagan pedidos de tus productos, aparecerán aquí.
            </p>
          ) : (
            <div className="space-y-2">
              {activeOrders.map((order) => {
                const cfg = STATUS_CONFIG[order.status];
                const myItems = (order.items || []).filter(
                  (i) => i.producerId === currentUser?.id
                );
                const myTotal = myItems.reduce((s, i) => s + i.price * i.qty, 0);
                return (
                  <div key={order.id} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-base">{cfg.emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono text-gray-500 truncate">{order.id}</p>
                      <p className="text-xs text-gray-400">{formatRelativeDate(order.createdAt)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge color={cfg.color} size="sm">{cfg.label}</Badge>
                      <p className="text-sm font-bold text-gray-900 mt-0.5">{formatCurrency(myTotal)}</p>
                    </div>
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
            <Button
              size="sm"
              variant="ghost"
              icon={<Plus size={14} />}
              onClick={() => showToast({ message: 'Próximamente: agregar producto', type: 'info' })}
            >
              Agregar
            </Button>
          }
        >
          {myProducts.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-gray-400 mb-3">Aún no tienes productos registrados</p>
              <Button
                variant="outline"
                size="sm"
                icon={<Plus size={15} />}
                onClick={() => showToast({ message: 'Próximamente: agregar producto', type: 'info' })}
              >
                Agregar mi primer producto
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {myProducts.map((product) => {
                const isHidden = hiddenProducts.includes(product.id);
                return (
                  <div
                    key={product.id}
                    className={`flex items-center gap-3 py-2 border-b border-gray-50 last:border-0 transition-opacity
                      ${isHidden ? 'opacity-50' : ''}`}
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-12 h-12 rounded-xl object-cover bg-gray-100 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(product.price)} / {product.unit}
                      </p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge color={product.stock > 10 ? 'green' : product.stock > 0 ? 'yellow' : 'red'} size="sm">
                          Stock: {product.stock}
                        </Badge>
                        {isHidden && <Badge color="gray" size="sm">Oculto</Badge>}
                      </div>
                    </div>
                    {/* Acciones */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => toggleProductVisibility(product.id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100"
                        title={isHidden ? 'Mostrar' : 'Ocultar'}
                      >
                        {isHidden
                          ? <Eye size={15} className="text-gray-400" />
                          : <EyeOff size={15} className="text-gray-400" />
                        }
                      </button>
                      <button
                        onClick={() => showToast({ message: 'Próximamente: editar producto', type: 'info' })}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100"
                        title="Editar"
                      >
                        <Edit3 size={15} className="text-gray-400" />
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

