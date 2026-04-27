/**
 * ProfileScreen — Perfil y fidelización del consumidor
 * Avatar, puntos, pedidos recientes, preferencias, cuenta
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Package, Heart, Bell, MapPin, ChevronRight,
  LogOut, Star, Trophy, Edit3, Settings,
} from 'lucide-react';
import AppHeader from '../components/AppHeader';
import Badge from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { fetchOrders } from '../mocks/mockOrders';
import { formatCurrency, formatRelativeDate } from '../utils/formatters';
import { ROUTES, ORDER_STATUS, STORAGE_KEYS } from '../utils/constants';

// ─── Niveles de fidelización ──────────────────────────────────────────────────
const LOYALTY_LEVELS = [
  { name: 'Semilla',      min: 0,    max: 200,  color: '#8B7355', badge: '🌱' },
  { name: 'Brote',        min: 200,  max: 500,  color: '#4ade80', badge: '🌿' },
  { name: 'Cosechador',   min: 500,  max: 1000, color: '#22c55e', badge: '🌾' },
  { name: 'Raíz de Oro',  min: 1000, max: 2000, color: '#f59e0b', badge: '⭐' },
  { name: 'Maestro Agro', min: 2000, max: Infinity, color: '#8b5cf6', badge: '👑' },
];

function getLoyaltyLevel(points) {
  return LOYALTY_LEVELS.find((l) => points >= l.min && points < l.max) || LOYALTY_LEVELS[0];
}

const STATUS_CONFIG = {
  [ORDER_STATUS.PENDING]:    { label: 'Pendiente',   color: 'yellow' },
  [ORDER_STATUS.CONFIRMED]:  { label: 'Confirmado',  color: 'blue'   },
  [ORDER_STATUS.HARVESTING]: { label: 'Cosechando',  color: 'green'  },
  [ORDER_STATUS.IN_TRANSIT]: { label: 'En camino',   color: 'orange' },
  [ORDER_STATUS.DELIVERED]:  { label: 'Entregado',   color: 'green'  },
  [ORDER_STATUS.CANCELLED]:  { label: 'Cancelado',   color: 'red'    },
};

export default function ProfileScreen() {
  const navigate       = useNavigate();
  const { currentUser, logout } = useAuth();
  const { showToast }  = useToast();

  const [orders,       setOrders]       = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [preferences,  setPreferences]  = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.PREFERENCES) || '{}');
    } catch { return {}; }
  });

  // Puntos simulados: $10 MXN = 1 punto, basado en total de pedidos entregados
  const points  = orders
    .filter((o) => o.status === ORDER_STATUS.DELIVERED)
    .reduce((acc, o) => acc + Math.floor((o.totals?.total || 0) / 10), 0);

  const level   = getLoyaltyLevel(points);
  const nextLevel = LOYALTY_LEVELS[LOYALTY_LEVELS.indexOf(level) + 1];
  const progress = nextLevel
    ? ((points - level.min) / (nextLevel.min - level.min)) * 100
    : 100;

  useEffect(() => {
    if (!currentUser) return;
    fetchOrders(currentUser.id).then((data) => {
      setOrders(data);
      setLoadingOrders(false);
    });
  }, [currentUser]);

  // ─── Preferencias (notificaciones/categorías favoritas) ──────────────────
  function togglePref(key) {
    setPreferences((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(updated));
      return updated;
    });
  }

  async function handleLogout() {
    await logout();
    navigate(ROUTES.LOGIN, { replace: true });
    showToast({ message: 'Sesión cerrada. ¡Hasta pronto!', type: 'success' });
  }

  if (!currentUser) {
    navigate(ROUTES.LOGIN, { replace: true });
    return null;
  }

  const recentOrders = orders.slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <AppHeader
        title="Mi Perfil"
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

      {/* ─── Hero: avatar + nombre + nivel ────────────────────────── */}
      <div className="bg-white px-4 pt-5 pb-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative">
            <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-primary-400 to-fresh-400 flex items-center justify-center shadow-sm"
              style={{ width: 72, height: 72 }}>
              <span className="text-3xl font-bold text-white">
                {currentUser.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow text-sm">
              {level.badge}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-gray-900 text-lg leading-tight truncate">
              {currentUser.name}
            </h2>
            <p className="text-sm text-gray-500 truncate">{currentUser.email}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-sm">{level.badge}</span>
              <span className="text-sm font-semibold" style={{ color: level.color }}>
                {level.name}
              </span>
              <span className="text-xs text-gray-400">· {points} pts</span>
            </div>
          </div>

          {/* Editar (visual, sin funcionalidad real) */}
          <button className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
            <Edit3 size={15} className="text-gray-500" />
          </button>
        </div>

        {/* Barra de progreso de nivel */}
        {nextLevel && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{level.name}</span>
              <span>{nextLevel.name} ({nextLevel.min - points} pts)</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{ width: `${progress}%`, backgroundColor: level.color }}
              />
            </div>
          </div>
        )}

        {/* Stats rápidos */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <StatCard value={orders.length} label="Pedidos" icon={Package} />
          <StatCard value={points} label="Puntos" icon={Star} />
          <StatCard
            value={orders.filter((o) => o.status === ORDER_STATUS.DELIVERED).length}
            label="Entregados"
            icon={Trophy}
          />
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* ─── Pedidos recientes ────────────────────────────────── */}
        <Section
          title="Pedidos recientes"
          actionLabel="Ver todos"
          onAction={() => navigate(ROUTES.ORDERS)}
        >
          {loadingOrders ? (
            <div className="py-6 text-center text-sm text-gray-400">Cargando…</div>
          ) : recentOrders.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-gray-400">Aún no tienes pedidos</p>
              <button
                onClick={() => navigate(ROUTES.CATALOG)}
                className="text-sm text-primary-600 font-semibold mt-1"
              >
                Explorar catálogo →
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((order) => {
                const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG[ORDER_STATUS.CONFIRMED];
                return (
                  <button
                    key={order.id}
                    onClick={() => navigate(`/pedidos/${order.id}`, { state: { order } })}
                    className="w-full flex items-center gap-3 py-2 text-left hover:opacity-80 active:opacity-60"
                  >
                    <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Package size={18} className="text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate font-mono">{order.id}</p>
                      <p className="text-xs text-gray-400">{formatRelativeDate(order.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge color={cfg.color} size="sm">{cfg.label}</Badge>
                      <span className="text-sm font-semibold text-gray-900">
                        {formatCurrency(order.totals?.total)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </Section>

        {/* ─── Preferencias ──────────────────────────────────────── */}
        <Section title="Preferencias">
          <div className="space-y-1">
            <PrefToggle
              icon={Bell}
              label="Notificaciones de cosecha"
              desc="Avisa cuando haya productos frescos disponibles"
              checked={preferences.notifyHarvest ?? true}
              onChange={() => togglePref('notifyHarvest')}
            />
            <PrefToggle
              icon={Heart}
              label="Ofertas exclusivas"
              desc="Descuentos y productos de temporada"
              checked={preferences.notifyOffers ?? true}
              onChange={() => togglePref('notifyOffers')}
            />
            <PrefToggle
              icon={Package}
              label="Estado de pedidos"
              desc="Actualizaciones en tiempo real de tus pedidos"
              checked={preferences.notifyOrders ?? true}
              onChange={() => togglePref('notifyOrders')}
            />
          </div>
        </Section>

        {/* ─── Menú de cuenta ───────────────────────────────────── */}
        <Section title="Mi cuenta">
          <div className="space-y-0.5">
            <MenuRow
              icon={MapPin}
              label="Mis direcciones"
              desc="Gestiona tus puntos de entrega"
              onClick={() => showToast({ message: 'Próximamente: gestión de direcciones', type: 'info' })}
            />
            <MenuRow
              icon={Star}
              label="Mis favoritos"
              desc="Productos que guardaste"
              onClick={() => showToast({ message: 'Próximamente: lista de favoritos', type: 'info' })}
            />
            <MenuRow
              icon={Settings}
              label="Configuración"
              desc="Privacidad y seguridad"
              onClick={() => showToast({ message: 'Próximamente', type: 'info' })}
            />
          </div>
        </Section>

        {/* ─── Cerrar sesión ────────────────────────────────────── */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border-2 border-red-100 text-red-500 font-semibold text-sm hover:bg-red-50 active:scale-[0.98] transition-all"
        >
          <LogOut size={17} />
          Cerrar sesión
        </button>

        {/* Versión app */}
        <p className="text-center text-xs text-gray-300 pb-2">
          AgroDirecto v1.0.0 · Hecho en Puebla 🌶️
        </p>
      </div>
    </div>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────
function StatCard({ value, label, icon: Icon }) {
  return (
    <div className="bg-gray-50 rounded-2xl p-3 text-center">
      <div className="flex justify-center mb-1">
        <Icon size={16} className="text-primary-500" />
      </div>
      <p className="font-bold text-gray-900 text-lg leading-none">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function Section({ title, actionLabel, onAction, children }) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
        {actionLabel && (
          <button onClick={onAction} className="text-xs text-primary-600 font-semibold">
            {actionLabel}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function PrefToggle({ icon: Icon, label, desc, checked, onChange }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
        <Icon size={17} className="text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 leading-tight">{label}</p>
        <p className="text-xs text-gray-400 truncate">{desc}</p>
      </div>
      {/* Toggle switch */}
      <button
        onClick={onChange}
        className={`relative inline-flex w-10 h-6 rounded-full transition-colors flex-shrink-0
          ${checked ? 'bg-primary-500' : 'bg-gray-200'}`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform
            ${checked ? 'translate-x-4' : 'translate-x-0'}`}
        />
      </button>
    </div>
  );
}

function MenuRow({ icon: Icon, label, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-3 text-left hover:opacity-80 active:opacity-60"
    >
      <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
        <Icon size={17} className="text-gray-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 leading-tight">{label}</p>
        <p className="text-xs text-gray-400 truncate">{desc}</p>
      </div>
      <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
    </button>
  );
}

