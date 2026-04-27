/**
 * ProductCard — Tarjeta de producto para el grid del catálogo
 * Mobile: 2 columnas. Tablet+: 3 columnas (controlado por el padre)
 * Muestra badge de frescura si freshnessHours < 24
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Check, ShoppingCart } from 'lucide-react';
import Badge from './Badge';
import { formatCurrency } from '../utils/formatters';
import { BUSINESS_RULES } from '../utils/constants';

/**
 * @param {Object}   product        - objeto de producto del mock
 * @param {Function} onAddToCart    - callback(product) al presionar +
 * @param {boolean}  isInCart       - si el producto ya está en el carrito
 * @param {number}   cartQty        - cantidad actual en carrito
 */
export default function ProductCard({ product, onAddToCart, isInCart = false, cartQty = 0 }) {
  const navigate          = useNavigate();
  const [added, setAdded] = useState(false);  // feedback visual al agregar

  const isFresh = product.freshnessHours < BUSINESS_RULES.FRESHNESS_BADGE_HOURS;

  /** Agrega al carrito con feedback de animación */
  function handleAdd(e) {
    e.stopPropagation(); // evita navegar al detalle
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  /** Navega al detalle del producto */
  function handleCardClick() {
    navigate(`/producto/${product.id}`);
  }

  return (
    <article
      className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer active:scale-[0.98] transition-transform"
      onClick={handleCardClick}
      aria-label={`Ver detalle de ${product.name}`}
    >
      {/* ─── Imagen con badges ──────────────────────────────────────── */}
      <div className="relative overflow-hidden aspect-square bg-gray-100">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          loading="lazy"
        />

        {/* Badge "Cosechado hoy" — solo si freshnessHours < 24 */}
        {isFresh && (
          <span className="absolute top-2 left-2 bg-fresh-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
            <span>🌱</span> Cosechado hoy
          </span>
        )}

        {/* Badge de ahorro */}
        {product.savings > 0 && (
          <span className="absolute top-2 right-2 bg-earth-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            -{product.savings}%
          </span>
        )}

        {/* Indicador de stock bajo */}
        {product.stock <= 5 && (
          <span className="absolute bottom-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
            ¡Últimas {product.stock}!
          </span>
        )}
      </div>

      {/* ─── Info del producto ───────────────────────────────────────── */}
      <div className="p-3">
        {/* Nombre */}
        <p className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
          {product.name}
        </p>

        {/* Nombre del rancho */}
        <p className="text-[11px] text-gray-400 mt-0.5 truncate">
          {product.producer.farmName}
        </p>

        {/* Precio y botón agregar */}
        <div className="flex items-center justify-between mt-2.5">
          <div className="flex flex-col">
            <span className="text-primary-700 font-bold text-base leading-none">
              {formatCurrency(product.price)}
            </span>
            <span className="text-gray-400 text-[11px] mt-0.5">
              /{product.unit}
            </span>
          </div>

          {/* Botón agregar al carrito */}
          <button
            onClick={handleAdd}
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 active:scale-90 flex-shrink-0
              ${added || isInCart
                ? 'bg-primary-600 text-white'
                : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
              }`}
            aria-label={`Agregar ${product.name} al carrito`}
          >
            {added ? (
              <Check size={16} strokeWidth={2.5} />
            ) : isInCart ? (
              <ShoppingCart size={15} strokeWidth={2} />
            ) : (
              <Plus size={18} strokeWidth={2.5} />
            )}
          </button>
        </div>

        {/* Indicador de cantidad en carrito */}
        {isInCart && cartQty > 0 && (
          <p className="text-[10px] text-primary-600 font-medium mt-1">
            {cartQty} en tu carrito
          </p>
        )}
      </div>
    </article>
  );
}
