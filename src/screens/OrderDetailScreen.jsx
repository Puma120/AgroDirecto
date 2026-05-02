/**
 * OrderDetailScreen — Detalle y seguimiento de un pedido
 * Timeline de estado, productos, info de entrega
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, MapPin, Clock, Package,
  Truck, Home, CheckCircle2, XCircle, Leaf,
} from 'lucide-react';
import Badge from '../components/Badge';
import Button from '../components/Button';
import { DetailSkeleton } from '../components/Skeleton';
import { fetchOrderById, cancelOrder } from '../mocks/mockOrders';
import { formatCurrency, formatRelativeDate } from '../utils/formatters';
import { ROUTES, ORDER_STATUS } from '../utils/constants';

// ─── Config visual de estados ─────────────────────────────────────────────────
const STATUS_CONFIG = {
  [ORDER_STATUS.PENDING]:    { label: 'Pendiente de confirmación', color: 'yellow', icon: Clock },
  [ORDER_STATUS.CONFIRMED]:  { label: 'Pedido confirmado',         color: 'blue',   icon: CheckCircle2 },
  [ORDER_STATUS.HARVESTING]: { label: 'Productores cosechando',    color: 'green',  icon: Leaf },
  [ORDER_STATUS.IN_TRANSIT]: { label: 'En camino a tu domicilio',  color: 'orange', icon: Truck },
  [ORDER_STATUS.DELIVERED]:  { label: 'Entregado',                 color: 'green',  icon: Home },
  [ORDER_STATUS.CANCELLED]:  { label: 'Pedido cancelado',          color: 'red',    icon: XCircle },
};

// Timeline visual: todos los pasos en orden
const TIMELINE_STEPS = [
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.HARVESTING,
  ORDER_STATUS.IN_TRANSIT,
  ORDER_STATUS.DELIVERED,
];

const STATUS_ORDER = Object.fromEntries(TIMELINE_STEPS.map((s, i) => [s, i]));

export default function OrderDetailScreen() {
  const { id }      = useParams();
  const location    = useLocation();
  const navigate    = useNavigate();

  const [order,       setOrder]       = useState(location.state?.order || null);
  const [loading,     setLoading]     = useState(!location.state?.order);
  const [cancelling,  setCancelling]  = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const canCancel = order &&
    [ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED].includes(order.status);

  const handleCancel = useCallback(async () => {
    setCancelling(true);
    try {
      const updated = await cancelOrder(order.id);
      setOrder((prev) => ({ ...prev, status: updated.status }));
    } finally {
      setCancelling(false);
      setShowConfirm(false);
    }
  }, [order]);

  useEffect(() => {
    if (!location.state?.order) {
      fetchOrderById(id).then((data) => {
        setOrder(data);
        setLoading(false);
      });
    }
  }, [id, location.state]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="h-14 bg-white border-b border-gray-100" />
        <DetailSkeleton />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 gap-4">
        <p className="text-gray-500">Pedido no encontrado.</p>
        <Button onClick={() => navigate(ROUTES.ORDERS)} variant="outline">Mis pedidos</Button>
      </div>
    );
  }

  const cfg            = STATUS_CONFIG[order.status] || STATUS_CONFIG[ORDER_STATUS.CONFIRMED];
  const currentStepIdx = STATUS_ORDER[order.status] ?? 0;

  const deliveryDate   = new Date(order.estimatedDelivery);
  const formattedDate  = deliveryDate.toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* ─── Header ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-3 px-4 h-14">
          <button
            onClick={() => navigate(ROUTES.ORDERS)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-90"
          >
            <ChevronLeft size={24} className="text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-gray-900 text-sm leading-tight">Detalle del pedido</h1>
            <p className="font-mono text-xs text-gray-400">{order.id}</p>
          </div>
          <Badge color={cfg.color} size="sm">{cfg.label}</Badge>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* ─── Timeline de seguimiento ────────────────────────────── */}
        {order.status !== ORDER_STATUS.CANCELLED && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="font-bold text-gray-900 mb-4">Seguimiento</p>

            <div className="relative">
              {/* Línea vertical de fondo */}
              <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-100" />
              {/* Línea vertical de progreso */}
              <div
                className="absolute left-4 top-4 w-0.5 bg-primary-400 transition-all duration-700"
                style={{ height: `${(currentStepIdx / (TIMELINE_STEPS.length - 1)) * 100}%` }}
              />

              <div className="space-y-5">
                {TIMELINE_STEPS.map((stepStatus, i) => {
                  const stepCfg     = STATUS_CONFIG[stepStatus];
                  const StepIcon    = stepCfg.icon;
                  const isCompleted = i <= currentStepIdx;
                  const isCurrent   = i === currentStepIdx;

                  return (
                    <div key={stepStatus} className="flex items-start gap-4 relative z-10">
                      {/* Círculo indicador */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all
                        ${isCompleted
                          ? 'bg-primary-500 shadow-sm shadow-primary-200'
                          : 'bg-gray-100'
                        }`}
                      >
                        <StepIcon
                          size={14}
                          className={isCompleted ? 'text-white' : 'text-gray-400'}
                        />
                      </div>

                      {/* Texto */}
                      <div className="pt-0.5 flex-1">
                        <p className={`text-sm font-semibold leading-tight
                          ${isCurrent ? 'text-primary-700' : isCompleted ? 'text-gray-900' : 'text-gray-400'}`}
                        >
                          {stepCfg.label}
                        </p>
                        {isCurrent && (
                          <p className="text-xs text-primary-500 mt-0.5">
                            {formatRelativeDate(order.createdAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Estimado de entrega */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
              <Clock size={14} className="text-primary-500" />
              <p className="text-xs text-gray-600">
                Entrega estimada:{' '}
                <span className="font-semibold text-gray-900 capitalize">{formattedDate}</span>
                {order.deliveryInfo?.slot?.time && (
                  <span className="text-gray-500"> · {order.deliveryInfo.slot.time}</span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* ─── Productos del pedido ────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Package size={16} className="text-primary-500" />
            Productos ({order.items?.length})
          </p>
          <div className="space-y-3">
            {(order.items || []).map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-12 h-12 rounded-xl object-cover bg-gray-100 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.producer}</p>
                  <p className="text-xs text-gray-400">{item.qty} {item.unit} × {formatCurrency(item.price)}</p>
                </div>
                <p className="font-semibold text-sm text-gray-900 flex-shrink-0">
                  {formatCurrency(item.price * item.qty)}
                </p>
              </div>
            ))}
          </div>

          {/* Totales */}
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(order.totals?.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Envío</span>
              <span className={order.totals?.shipping === 0 ? 'text-primary-600 font-medium' : ''}>
                {order.totals?.shipping === 0 ? 'Gratis' : formatCurrency(order.totals?.shipping)}
              </span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 text-base pt-1">
              <span>Total</span>
              <span className="text-primary-700">{formatCurrency(order.totals?.total)}</span>
            </div>
          </div>
        </div>

        {/* ─── Dirección ──────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <MapPin size={16} className="text-primary-500" />
            Dirección de entrega
          </p>
          <p className="text-sm font-medium text-gray-900">{order.deliveryInfo?.address?.name}</p>
          <p className="text-sm text-gray-600">
            {order.deliveryInfo?.address?.street} {order.deliveryInfo?.address?.exterior}
            {order.deliveryInfo?.address?.interior ? ` Int. ${order.deliveryInfo.address.interior}` : ''},{' '}
            {order.deliveryInfo?.address?.colonia}
          </p>
          <p className="text-sm text-gray-500">{order.deliveryInfo?.address?.municipio}, Puebla</p>
          {order.deliveryInfo?.address?.references && (
            <p className="text-xs text-gray-400 mt-1.5 italic">
              Ref: {order.deliveryInfo.address.references}
            </p>
          )}
        </div>

      </div>

      {/* ─── Botones fijos ─────────────────────────────────────── */}
      <div className="fixed bottom-14 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-2xl">
        <div className="px-4 py-3 max-w-lg mx-auto flex gap-3">
          {canCancel && (
            <Button
              variant="outline"
              size="full"
              onClick={() => setShowConfirm(true)}
              className="border-red-200 text-red-600 hover:bg-red-50 flex-1"
            >
              <XCircle size={16} className="mr-1.5" />
              Cancelar pedido
            </Button>
          )}
          <Button
            size="full"
            onClick={() => navigate(ROUTES.CATALOG)}
            className={canCancel ? 'flex-1' : ''}
          >
            Hacer otro pedido
          </Button>
        </div>
      </div>

      {/* ─── Modal confirmación cancelar ───────────────────────── */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <XCircle size={20} className="text-red-500" />
              </div>
              <div>
                <p className="font-bold text-gray-900">¿Cancelar pedido?</p>
                <p className="text-xs text-gray-500 font-mono">{order.id}</p>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Esta acción no se puede deshacer. El pedido será cancelado y no se realizará ningún cobro.
            </p>
            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                size="full"
                onClick={() => setShowConfirm(false)}
                className="flex-1"
              >
                Mantener pedido
              </Button>
              <Button
                size="full"
                loading={cancelling}
                onClick={handleCancel}
                className="flex-1 !bg-red-500 hover:!bg-red-600"
              >
                Sí, cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

