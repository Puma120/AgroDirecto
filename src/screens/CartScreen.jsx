/**
 * CartScreen — Pantalla del carrito de compras
 * Lista de productos, ajuste de cantidad, resumen de orden y CTA a checkout
 */
import { useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, X } from 'lucide-react';
import AppHeader from '../components/AppHeader';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../utils/formatters';
import { ROUTES, BUSINESS_RULES } from '../utils/constants';

export default function CartScreen() {
  const navigate = useNavigate();
  const {
    items, totals,
    updateQty, removeItem, clearCart,
  } = useCart();

  const toFreeShipping = BUSINESS_RULES.FREE_SHIPPING_THRESHOLD - totals.subtotal;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader
        title="Mi Carrito"
        showBack
        right={
          items.length > 0 && (
            <button
              onClick={clearCart}
              className="text-sm text-red-500 font-medium min-h-[44px] px-1 flex items-center gap-1"
            >
              <X size={15} />
              Vaciar
            </button>
          )
        }
      />

      {/* ─── Carrito vacío ─────────────────────────────────────────── */}
      {items.length === 0 && (
        <div className="flex-1 flex items-center justify-center min-h-[70vh]">
          <EmptyState
            icon="🛒"
            title="Tu carrito está vacío"
            message="Agrega productos del catálogo para empezar tu pedido."
            action={
              <Button onClick={() => navigate(ROUTES.CATALOG)}>
                Explorar catálogo
              </Button>
            }
          />
        </div>
      )}

      {/* ─── Lista de productos ────────────────────────────────────── */}
      {items.length > 0 && (
        <div className="pb-48">
          {/* Banner de progreso hacia envío gratis */}
          {toFreeShipping > 0 && (
            <div className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-sm border border-primary-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-gray-600 font-medium">
                  🚚 Agrega{' '}
                  <span className="text-primary-700 font-bold">
                    {formatCurrency(toFreeShipping)}
                  </span>{' '}
                  más para envío gratis
                </p>
                <span className="text-xs text-gray-400">
                  {Math.round((totals.subtotal / BUSINESS_RULES.FREE_SHIPPING_THRESHOLD) * 100)}%
                </span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (totals.subtotal / BUSINESS_RULES.FREE_SHIPPING_THRESHOLD) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Artículos */}
          <div className="px-4 mt-4 space-y-3">
            {items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onQtyChange={(qty) => updateQty(item.id, qty)}
                onRemove={() => removeItem(item.id)}
              />
            ))}
          </div>

          {/* Resumen de orden */}
          <div className="mx-4 mt-4 bg-white rounded-2xl p-4 shadow-sm">
            <h2 className="font-bold text-gray-900 mb-3">Resumen del pedido</h2>

            <div className="space-y-2 text-sm">
              <SummaryRow label="Subtotal" value={formatCurrency(totals.subtotal)} />
              <SummaryRow
                label="Envío"
                value={totals.shipping === 0 ? '¡Gratis! 🎉' : formatCurrency(totals.shipping)}
                valueClass={totals.shipping === 0 ? 'text-primary-600 font-semibold' : 'text-gray-900'}
              />
              <div className="h-px bg-gray-100 my-2" />
              <SummaryRow
                label="Total"
                value={formatCurrency(totals.total)}
                labelClass="font-bold text-gray-900"
                valueClass="font-bold text-xl text-primary-700"
              />
            </div>

            <p className="text-[11px] text-gray-400 mt-3 text-center">
              Pago contra entrega disponible · Sin comisiones ocultas
            </p>
          </div>
        </div>
      )}

      {/* ─── CTA fijo al fondo ─────────────────────────────────────── */}
      {items.length > 0 && (
        <div className="fixed bottom-14 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-2xl">
          <div className="px-4 py-3 max-w-lg mx-auto">
            <Button
              size="full"
              onClick={() => navigate(ROUTES.CHECKOUT)}
              icon={<ArrowRight size={18} />}
            >
              Proceder al pago — {formatCurrency(totals.total)}
            </Button>
            <p className="text-xs text-gray-400 text-center mt-2">
              {totals.itemCount} producto{totals.itemCount !== 1 ? 's' : ''}
              {totals.shipping === 0 ? ' · Envío gratis incluido' : ` · +${formatCurrency(totals.shipping)} envío`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componente de item ───────────────────────────────────────────────────────
function CartItem({ item, onQtyChange, onRemove }) {
  return (
    <div className="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3">
      {/* Imagen */}
      <img
        src={item.image}
        alt={item.name}
        className="w-16 h-16 rounded-xl object-cover bg-gray-100 flex-shrink-0"
      />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm leading-tight truncate">
          {item.name}
        </p>
        <p className="text-[11px] text-gray-400 truncate">{item.producer}</p>
        <p className="text-primary-700 font-bold text-sm mt-0.5">
          {formatCurrency(item.price)}/{item.unit}
        </p>
      </div>

      {/* Controls: qty + remove */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        {/* Precio subtotal del item */}
        <p className="text-sm font-bold text-gray-900">
          {formatCurrency(item.price * item.qty)}
        </p>

        {/* Selector de cantidad */}
        <div className="flex items-center gap-1.5 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => onQtyChange(item.qty - 1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white transition-colors active:scale-90"
            aria-label="Reducir"
          >
            {item.qty <= 1 ? (
              <Trash2 size={13} className="text-red-500" />
            ) : (
              <Minus size={13} className="text-gray-600" />
            )}
          </button>
          <span className="w-6 text-center text-sm font-bold text-gray-900 tabular-nums">
            {item.qty}
          </span>
          <button
            onClick={() => onQtyChange(item.qty + 1)}
            disabled={item.qty >= item.maxOrder}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white transition-colors active:scale-90 disabled:opacity-30"
            aria-label="Aumentar"
          >
            <Plus size={13} className="text-gray-600" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Fila de resumen ──────────────────────────────────────────────────────────
function SummaryRow({ label, value, labelClass = 'text-gray-600', valueClass = 'text-gray-900 font-medium' }) {
  return (
    <div className="flex items-center justify-between">
      <span className={labelClass}>{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}

