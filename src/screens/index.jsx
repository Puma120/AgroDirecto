/**
 * Pantallas placeholder — se reemplazarán en módulos 2-6
 * Mantienen la app compilable durante el desarrollo incremental
 */
import AppHeader from '../components/AppHeader';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROUTES } from '../utils/constants';

/** Pantalla de catálogo placeholder */
export function CatalogScreen() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="AgroDirecto" showNotif showCart />
      <EmptyState
        icon="🌿"
        title={`¡Hola${currentUser?.name ? `, ${currentUser.name.split(' ')[0]}` : ''}!`}
        message="El catálogo de productos se construirá en el Módulo 2. Por ahora el Módulo 1 (Autenticación) está completo."
        action={
          <div className="flex flex-col gap-2 w-full max-w-xs">
            <Button onClick={() => navigate(ROUTES.PROFILE)} variant="outline" size="full">
              Ver perfil
            </Button>
            <button
              onClick={() => { logout(); navigate(ROUTES.LOGIN); }}
              className="text-sm text-red-500 hover:text-red-700 min-h-[44px]"
            >
              Cerrar sesión
            </button>
          </div>
        }
      />
    </div>
  );
}

/** Placeholder genérico reutilizable */
function PlaceholderScreen({ title, emoji, module }) {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title={title} showBack />
      <EmptyState
        icon={emoji}
        title={`${title} — Próximamente`}
        message={`Esta pantalla se implementará en el ${module}. Regresa después de confirmar el módulo anterior.`}
        action={
          <Button onClick={() => navigate(-1)} variant="outline">
            ← Regresar
          </Button>
        }
      />
    </div>
  );
}

export function ProductDetailScreen() {
  return <PlaceholderScreen title="Detalle del Producto" emoji="🥦" module="Módulo 2" />;
}
export function CartScreen() {
  return <PlaceholderScreen title="Mi Carrito" emoji="🛒" module="Módulo 3" />;
}
export function CheckoutScreen() {
  return <PlaceholderScreen title="Checkout" emoji="💳" module="Módulo 3" />;
}
export function OrderSuccessScreen() {
  return <PlaceholderScreen title="Pedido Exitoso" emoji="🎉" module="Módulo 3" />;
}
export function OrdersScreen() {
  return <PlaceholderScreen title="Mis Pedidos" emoji="📦" module="Módulo 4" />;
}
export function OrderDetailScreen() {
  return <PlaceholderScreen title="Detalle del Pedido" emoji="🚚" module="Módulo 4" />;
}
export function ProfileScreen() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="Mi Perfil" />
      <div className="px-4 py-6 max-w-md mx-auto space-y-4">
        {/* Tarjeta de usuario */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <img
              src={currentUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=default`}
              alt={currentUser?.name}
              className="w-16 h-16 rounded-full bg-gray-100"
            />
            <div>
              <p className="font-bold text-gray-900 text-lg">{currentUser?.name || 'Invitado'}</p>
              <p className="text-sm text-gray-500">{currentUser?.email || '—'}</p>
              <span className="inline-block mt-1 text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-medium">
                {currentUser?.role === 'producer' ? '👨‍🌾 Productor' : '🛒 Consumidor'}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 text-center">
            La pantalla de perfil completa se implementará en el Módulo 5.
          </p>
        </div>

        <Button
          variant="danger"
          size="full"
          onClick={() => { logout(); navigate(ROUTES.LOGIN); }}
        >
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}
export function ProducerDashboard() {
  return <PlaceholderScreen title="Dashboard Productor" emoji="👨‍🌾" module="Módulo 6" />;
}
