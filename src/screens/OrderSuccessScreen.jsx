/**
 * OrderSuccessScreen — Confirmación de pedido exitoso
 * Muestra número de pedido, resumen y CTAs
 */
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Package, MapPin, Clock, ShoppingBag } from 'lucide-react';
import Button from '../components/Button';
import { formatCurrency } from '../utils/formatters';
import { ROUTES } from '../utils/constants';

export default function OrderSuccessScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const order    = location.state?.order;

  // Si no hay orden en el state (navegación directa), redirige
  if (!order) {
    navigate(ROUTES.CATALOG, { replace: true });
    return null;
  }

  const deliveryDate = new Date(order.estimatedDelivery);
  const formattedDelivery = deliveryDate.toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  const formattedTime = order.deliveryInfo?.slot?.time || '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex flex-col">
      <div className="flex-1 px-4 pt-12 pb-32 max-w-lg mx-auto w-full">
        {/* ─── Ícono de éxito ─────────────────────────────────────── */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-4">
            <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center">
              <CheckCircle2 size={52} className="text-primary-600" strokeWidth={1.5} />
            </div>
            {/* Anillo animado */}
            <div className="absolute inset-0 rounded-full border-4 border-primary-300 animate-ping opacity-30" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 text-center">
            ¡Pedido confirmado!
          </h1>
          <p className="text-gray-500 text-center mt-2 text-sm leading-relaxed">
            Tu pedido fue recibido y los productores ya están preparando tu cosecha.
          </p>
        </div>

        {/* ─── Número de pedido ───────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 text-center border border-primary-100">
          <p className="text-xs text-gray-500 mb-1">Número de pedido</p>
          <p className="font-mono font-bold text-primary-700 text-lg tracking-wider">
            {order.id}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Guarda este número para dar seguimiento
          </p>
        </div>

        {/* ─── Info de entrega ────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 space-y-3">
          <p className="font-semibold text-gray-900 text-sm">Detalles de entrega</p>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock size={16} className="text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {order.deliveryInfo?.slot?.label || 'Próximas 24 horas'}
              </p>
              <p className="text-xs text-gray-500 capitalize">{formattedDelivery}</p>
              {formattedTime && <p className="text-xs text-gray-400">{formattedTime}</p>}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <MapPin size={16} className="text-primary-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{order.deliveryInfo?.address?.name}</p>
              <p className="text-xs text-gray-500">
                {order.deliveryInfo?.address?.street} {order.deliveryInfo?.address?.exterior},
                {' '}{order.deliveryInfo?.address?.colonia}
              </p>
              <p className="text-xs text-gray-400">{order.deliveryInfo?.address?.municipio}, Puebla</p>
            </div>
          </div>
        </div>

        {/* ─── Resumen de productos ────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
          <p className="font-semibold text-gray-900 text-sm mb-3">
            Tu pedido ({order.items?.length} producto{order.items?.length !== 1 ? 's' : ''})
          </p>
          <div className="space-y-2">
            {(order.items || []).map((item) => (
              <div key={item.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-9 h-9 rounded-lg object-cover bg-gray-100"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 leading-tight">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.qty} {item.unit}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(item.price * item.qty)}
                </p>
              </div>
            ))}
          </div>

          <div className="h-px bg-gray-100 my-3" />
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-gray-900">Total pagado</span>
            <span className="font-bold text-lg text-primary-700">
              {formatCurrency(order.totals?.total)}
            </span>
          </div>
          {order.totals?.shipping === 0 && (
            <p className="text-xs text-primary-600 font-medium text-right mt-0.5">
              ¡Envío gratis incluido! 🚚
            </p>
          )}
        </div>

        {/* ─── Nota de frescura ────────────────────────────────────── */}
        <div className="bg-primary-50 rounded-2xl p-4 flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">🌱</span>
          <div>
            <p className="text-sm font-semibold text-primary-800">Cosechado para ti</p>
            <p className="text-xs text-primary-700 mt-0.5 leading-relaxed">
              Los productores de Puebla cosecharán tu pedido fresco en la madrugada, listo para que llegue a tu mesa en horas.
            </p>
          </div>
        </div>
      </div>

      {/* ─── CTAs fijos ────────────────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-2xl">
        <div className="px-4 py-3 max-w-lg mx-auto space-y-2">
          <Button
            size="full"
            onClick={() => navigate(ROUTES.ORDERS)}
            icon={<Package size={18} />}
          >
            Ver mis pedidos
          </Button>
          <Button
            size="full"
            variant="outline"
            onClick={() => navigate(ROUTES.CATALOG)}
            icon={<ShoppingBag size={18} />}
          >
            Seguir comprando
          </Button>
        </div>
      </div>
    </div>
  );
}

