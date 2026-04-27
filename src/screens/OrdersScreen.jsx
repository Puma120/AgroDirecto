/**
 * OrdersScreen — Lista de pedidos del usuario
 * Muestra historial con estado, productos y acciones
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, ChevronRight, RefreshCw } from 'lucide-react';
import AppHeader from '../components/AppHeader';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { ListItemSkeleton } from '../components/Skeleton';
import { useAuth } from '../context/AuthContext';
import { fetchOrders } from '../mocks/mockOrders';
import { formatCurrency, formatRelativeDate } from '../utils/formatters';
import { ROUTES, ORDER_STATUS } from '../utils/constants';

// ─── Configuración visual de cada estado ─────────────────────────────────────
const STATUS_CONFIG = {
  [ORDER_STATUS.PENDING]:    { label: 'Pendiente',     color: 'yellow',  emoji: '⏳' },
  [ORDER_STATUS.CONFIRMED]:  { label: 'Confirmado',    color: 'blue',    emoji: '✅' },
  [ORDER_STATUS.HARVESTING]: { label: 'Cosechando',    color: 'green',   emoji: '🌱' },
  [ORDER_STATUS.IN_TRANSIT]: { label: 'En camino',     color: 'orange',  emoji: '🚚' },
  [ORDER_STATUS.DELIVERED]:  { label: 'Entregado',     color: 'green',   emoji: '🏠' },
  [ORDER_STATUS.CANCELLED]:  { label: 'Cancelado',     color: 'red',     emoji: '❌' },
};

export default function OrdersScreen() {
  const navigate       = useNavigate();
  const { currentUser } = useAuth();

  const [orders,    setOrders]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function loadOrders(showRefresh = false) {
    if (showRefresh) setRefreshing(true);
    else             setLoading(true);

    const data = await fetchOrders(currentUser?.id || 'guest');
    setOrders(data);

    if (showRefresh) setRefreshing(false);
    else             setLoading(false);
  }

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader
        title="Mis Pedidos"
        right={
          <button
            onClick={() => loadOrders(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 min-h-0"
            aria-label="Actualizar pedidos"
          >
            <RefreshCw size={18} className={`text-gray-500 ${refreshing ? 'animate-spin text-primary-500' : ''}`} />
          </button>
        }
      />

      <main className="px-4 py-4 pb-24 space-y-3">
        {/* Cargando */}
        {loading && Array.from({ length: 3 }).map((_, i) => (
          <ListItemSkeleton key={i} />
        ))}

        {/* Sin pedidos */}
        {!loading && orders.length === 0 && (
          <div className="pt-16">
            <EmptyState
              icon="📦"
              title="Sin pedidos aún"
              message="Cuando realices tu primera compra, aquí podrás seguir el estado de tus pedidos en tiempo real."
              action={
                <Button onClick={() => navigate(ROUTES.CATALOG)}>
                  Explorar catálogo
                </Button>
              }
            />
          </div>
        )}

        {/* Lista de pedidos */}
        {!loading && orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            onClick={() => navigate(`/pedidos/${order.id}`, { state: { order } })}
          />
        ))}
      </main>
    </div>
  );
}

// ─── Tarjeta de pedido ────────────────────────────────────────────────────────
function OrderCard({ order, onClick }) {
  const cfg   = STATUS_CONFIG[order.status] || STATUS_CONFIG[ORDER_STATUS.CONFIRMED];
  const total = order.totals?.total || 0;
  const items = order.items || [];

  return (
    <button
      onClick={onClick}
      className="w-full bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow text-left active:scale-[0.99]"
    >
      {/* Cabecera: id + estado + chevron */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-mono text-xs text-gray-400">{order.id}</p>
          <p className="text-xs text-gray-400 mt-0.5">{formatRelativeDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge color={cfg.color} size="sm">
            {cfg.emoji} {cfg.label}
          </Badge>
          <ChevronRight size={16} className="text-gray-300" />
        </div>
      </div>

      {/* Miniaturas de productos */}
      <div className="flex items-center gap-1.5 mb-3">
        {items.slice(0, 4).map((item, i) => (
          <div key={item.id} className="relative">
            <img
              src={item.image}
              alt={item.name}
              className="w-10 h-10 rounded-xl object-cover bg-gray-100"
            />
            {i === 3 && items.length > 4 && (
              <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center">
                <span className="text-white text-xs font-bold">+{items.length - 4}</span>
              </div>
            )}
          </div>
        ))}
        <p className="text-xs text-gray-500 ml-1">
          {items.length} producto{items.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Total + dirección */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500 truncate max-w-[55%]">
          📍 {order.deliveryInfo?.address?.municipio || 'Puebla'}
        </p>
        <p className="font-bold text-primary-700">{formatCurrency(total)}</p>
      </div>
    </button>
  );
}

