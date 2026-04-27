/**
 * ProductDetailScreen — Vista de detalle de un producto
 * Incluye: galería, frescura, comparación de precios,
 *          selector de cantidad y CTA fijo al fondo
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star, MapPin, Clock, Leaf, ShoppingCart,
  Minus, Plus, ChevronLeft, Share2, Heart,
  BadgeCheck, TrendingDown, Package,
} from 'lucide-react';
import AppHeader from '../components/AppHeader';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { DetailSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import ProductCard from '../components/ProductCard';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/Toast';
import {
  fetchProductById,
  fetchRelatedProducts,
} from '../mocks/mockProducts';
import { formatCurrency } from '../utils/formatters';
import { BUSINESS_RULES } from '../utils/constants';

export default function ProductDetailScreen() {
  const { id }             = useParams();
  const navigate           = useNavigate();
  const { addItem, isInCart, getItemQty, totals } = useCart();
  const { showToast }      = useToast();

  // ─── Estado del producto ────────────────────────────────────────────────────
  const [product,   setProduct]   = useState(null);
  const [related,   setRelated]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(false);

  // ─── UI local ───────────────────────────────────────────────────────────────
  const [activeImg, setActiveImg] = useState(0);   // índice de imagen activa
  const [qty,       setQty]       = useState(1);   // cantidad a agregar
  const [liked,     setLiked]     = useState(false);

  // ─── Carga del producto ─────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setActiveImg(0);

    Promise.all([
      fetchProductById(id),
      fetchRelatedProducts(id, 4),
    ]).then(([prod, rel]) => {
      if (!cancelled) {
        if (!prod) { setError(true); }
        else       { setProduct(prod); setRelated(rel); }
        setLoading(false);
      }
    });

    return () => { cancelled = true; };
  }, [id]);

  // Reset cantidad al cargar nuevo producto
  useEffect(() => {
    if (product) setQty(product.minOrder || 1);
  }, [product]);

  // ─── Acciones ───────────────────────────────────────────────────────────────
  const handleAddToCart = useCallback(() => {
    if (!product) return;
    addItem(product, qty);
    showToast({
      message: `${qty} ${product.unit} de ${product.name} agregado`,
      type: 'success',
      duration: 2500,
    });
  }, [product, qty, addItem, showToast]);

  function adjustQty(delta) {
    if (!product) return;
    setQty((prev) => {
      const next = prev + delta;
      return Math.max(product.minOrder || 1, Math.min(next, product.maxOrder || 99));
    });
  }

  // ─── Renders de estado ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <AppHeader showBack cartCount={totals.itemCount} showCart />
        <DetailSkeleton />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <AppHeader showBack cartCount={totals.itemCount} showCart />
        <div className="flex-1 flex items-center justify-center p-6">
          <EmptyState
            icon="😕"
            title="Producto no encontrado"
            message="Este producto ya no está disponible o el enlace es incorrecto."
            action={
              <Button onClick={() => navigate('/catalogo')}>
                Volver al catálogo
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  const isFresh    = product.freshnessHours < BUSINESS_RULES.FRESHNESS_BADGE_HOURS;
  const inCart     = isInCart(product.id);
  const cartQty    = getItemQty(product.id);
  const saving     = product.supermarketPrice - product.price;
  const images     = product.images?.length ? product.images : [product.image];

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* ─── Header flotante con back + carrito ──────────────────── */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="flex items-center justify-between px-4 h-14">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-90 transition-all"
            aria-label="Volver"
          >
            <ChevronLeft size={24} className="text-gray-700" />
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setLiked((v) => !v)}
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-90 transition-all"
              aria-label={liked ? 'Quitar de favoritos' : 'Agregar a favoritos'}
            >
              <Heart
                size={20}
                className={liked ? 'fill-red-500 text-red-500' : 'text-gray-500'}
              />
            </button>

            <button
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:scale-90 transition-all relative"
              aria-label="Ver carrito"
              onClick={() => navigate('/carrito')}
            >
              <ShoppingCart size={20} className="text-gray-700" />
              {totals.itemCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-primary-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {totals.itemCount > 9 ? '9+' : totals.itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Galería de imágenes ─────────────────────────────────── */}
      <div className="relative bg-gray-100">
        {/* Imagen principal */}
        <div className="relative aspect-square overflow-hidden">
          <img
            src={images[activeImg]}
            alt={product.name}
            className="w-full h-full object-cover"
          />

          {/* Badges superpuestos */}
          {isFresh && (
            <span className="absolute top-4 left-4 bg-fresh-400 text-white text-xs font-bold px-3 py-1 rounded-full shadow flex items-center gap-1">
              <Leaf size={12} />
              Cosechado hoy
            </span>
          )}
          {product.savings > 0 && (
            <span className="absolute top-4 right-4 bg-earth-400 text-white text-sm font-bold px-3 py-1 rounded-full shadow">
              -{product.savings}%
            </span>
          )}
        </div>

        {/* Miniaturas (solo si hay más de 1 imagen) */}
        {images.length > 1 && (
          <div className="flex gap-2 px-4 py-3 bg-white border-b border-gray-100 overflow-x-auto">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImg(i)}
                className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all
                  ${activeImg === i ? 'border-primary-500 scale-105' : 'border-transparent opacity-60'}`}
              >
                <img src={img} alt={`Vista ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─── Información principal ───────────────────────────────── */}
      <div className="px-4 pt-4">
        {/* Categoría + tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <Badge color="green" size="sm">{product.category}</Badge>
          {(product.tags || []).slice(0, 2).map((tag) => (
            <Badge key={tag} color="gray" size="sm">{tag}</Badge>
          ))}
        </div>

        {/* Nombre del producto */}
        <h1 className="text-2xl font-bold text-gray-900 leading-tight">
          {product.name}
        </h1>

        {/* Info de frescura */}
        <div className="flex items-center gap-2 mt-2">
          <Clock size={14} className={isFresh ? 'text-fresh-500' : 'text-gray-400'} />
          <span className={`text-sm font-medium ${isFresh ? 'text-fresh-600' : 'text-gray-500'}`}>
            {isFresh
              ? `Cosechado hace ${product.freshnessHours}h`
              : `Cosechado hace ${product.freshnessHours}h`
            }
          </span>
          {isFresh && (
            <span className="text-[11px] text-fresh-600 bg-fresh-50 px-2 py-0.5 rounded-full font-medium">
              Extra fresco
            </span>
          )}
        </div>

        {/* Origen */}
        <div className="flex items-center gap-1.5 mt-1.5">
          <MapPin size={14} className="text-gray-400" />
          <span className="text-sm text-gray-500">{product.origin}</span>
        </div>
      </div>

      {/* ─── Divider ─────────────────────────────────────────────── */}
      <div className="mx-4 my-4 h-px bg-gray-100" />

      {/* ─── Precios y ahorro ────────────────────────────────────── */}
      <div className="px-4">
        <div className="bg-gradient-to-r from-primary-50 to-earth-50 rounded-2xl p-4">
          <div className="flex items-end gap-3 mb-3">
            {/* Precio AgroDirecto */}
            <div>
              <p className="text-xs text-gray-500 mb-0.5">Precio AgroDirecto</p>
              <p className="text-3xl font-bold text-primary-700">
                {formatCurrency(product.price)}
                <span className="text-base font-normal text-gray-500">/{product.unit}</span>
              </p>
            </div>

            {/* vs Supermercado */}
            {product.supermarketPrice > product.price && (
              <div className="pb-1">
                <p className="text-xs text-gray-400">vs Supermercado</p>
                <p className="text-sm text-gray-400 line-through">
                  {formatCurrency(product.supermarketPrice)}
                </p>
              </div>
            )}
          </div>

          {/* Banner de ahorro */}
          {saving > 0 && (
            <div className="flex items-center gap-2 bg-white/70 rounded-xl px-3 py-2">
              <TrendingDown size={16} className="text-primary-600 flex-shrink-0" />
              <p className="text-sm text-gray-700">
                Ahorras{' '}
                <span className="font-bold text-primary-700">{formatCurrency(saving)}</span>
                {' '}({product.savings}%) comprando aquí
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Divider ─────────────────────────────────────────────── */}
      <div className="mx-4 my-4 h-px bg-gray-100" />

      {/* ─── Información del productor ───────────────────────────── */}
      <div className="px-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">El productor</h2>
        <div
          className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl cursor-pointer hover:bg-gray-100 transition-colors"
          role="button"
          tabIndex={0}
        >
          {/* Avatar */}
          <img
            src={product.producer.avatar}
            alt={product.producer.name}
            className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0"
          />

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-semibold text-gray-900 text-sm truncate">
                {product.producer.farmName}
              </p>
              <BadgeCheck size={14} className="text-primary-500 flex-shrink-0" />
            </div>
            <p className="text-xs text-gray-500 truncate">{product.producer.name}</p>
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
              <MapPin size={11} />
              {product.producer.location}
            </p>
          </div>

          {/* Rating */}
          <div className="flex flex-col items-center flex-shrink-0">
            <div className="flex items-center gap-1">
              <Star size={13} className="fill-amber-400 text-amber-400" />
              <span className="text-sm font-bold text-gray-900">
                {product.producer.rating}
              </span>
            </div>
            <span className="text-[10px] text-gray-400">
              {product.producer.reviewCount} reseñas
            </span>
          </div>
        </div>
      </div>

      {/* ─── Divider ─────────────────────────────────────────────── */}
      <div className="mx-4 my-4 h-px bg-gray-100" />

      {/* ─── Descripción ─────────────────────────────────────────── */}
      <div className="px-4">
        <h2 className="text-base font-bold text-gray-900 mb-2">Descripción</h2>
        <p className="text-sm text-gray-600 leading-relaxed">
          {product.description}
        </p>
      </div>

      {/* ─── Beneficios nutricionales ────────────────────────────── */}
      {product.nutritionHighlights?.length > 0 && (
        <>
          <div className="mx-4 my-4 h-px bg-gray-100" />
          <div className="px-4">
            <h2 className="text-base font-bold text-gray-900 mb-3">Beneficios nutricionales</h2>
            <div className="flex flex-wrap gap-2">
              {product.nutritionHighlights.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-1.5 bg-green-50 border border-green-100 px-3 py-1.5 rounded-full"
                >
                  <Leaf size={12} className="text-green-600" />
                  <span className="text-xs text-green-700 font-medium">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ─── Información de compra ───────────────────────────────── */}
      <div className="mx-4 my-4 h-px bg-gray-100" />
      <div className="px-4">
        <h2 className="text-base font-bold text-gray-900 mb-3">Información de compra</h2>
        <div className="space-y-2">
          <InfoRow icon={<Package size={15} />} label="Unidad de venta" value={product.unit} />
          <InfoRow
            icon={<ShoppingCart size={15} />}
            label="Pedido mínimo"
            value={`${product.minOrder} ${product.unit}`}
          />
          <InfoRow
            icon={<Package size={15} />}
            label="Stock disponible"
            value={`${product.stock} ${product.unit}`}
            valueClass={product.stock <= 5 ? 'text-red-600 font-semibold' : 'text-gray-900'}
          />
        </div>
      </div>

      {/* ─── Productos relacionados ──────────────────────────────── */}
      {related.length > 0 && (
        <>
          <div className="mx-4 my-4 h-px bg-gray-100" />
          <div className="px-4">
            <h2 className="text-base font-bold text-gray-900 mb-3">También te puede interesar</h2>
            <div className="grid grid-cols-2 gap-3">
              {related.map((rel) => (
                <ProductCard
                  key={rel.id}
                  product={rel}
                  onAddToCart={(p) => {
                    addItem(p);
                    showToast({ message: `${p.name} agregado`, type: 'success' });
                  }}
                  isInCart={isInCart(rel.id)}
                  cartQty={getItemQty(rel.id)}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* ─── CTA fijo al fondo ───────────────────────────────────── */}
      <div className="fixed bottom-14 left-0 right-0 z-30 bg-white border-t border-gray-100 shadow-2xl">
        <div className="px-4 py-3 max-w-lg mx-auto">
          {/* Ya en carrito — muestra cantidad */}
          {inCart && (
            <p className="text-xs text-center text-primary-600 font-medium mb-2">
              ✓ Ya tienes {cartQty} {product.unit} en tu carrito
            </p>
          )}

          <div className="flex items-center gap-3">
            {/* Selector de cantidad */}
            <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-1 py-1">
              <button
                onClick={() => adjustQty(-1)}
                disabled={qty <= (product.minOrder || 1)}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white transition-colors disabled:opacity-30 active:scale-90"
                aria-label="Reducir cantidad"
              >
                <Minus size={16} className="text-gray-700" />
              </button>
              <span className="w-10 text-center font-bold text-gray-900 text-base tabular-nums">
                {qty}
              </span>
              <button
                onClick={() => adjustQty(1)}
                disabled={qty >= (product.maxOrder || 99)}
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white transition-colors disabled:opacity-30 active:scale-90"
                aria-label="Aumentar cantidad"
              >
                <Plus size={16} className="text-gray-700" />
              </button>
            </div>

            {/* Botón agregar */}
            <Button
              variant="primary"
              size="lg"
              onClick={handleAddToCart}
              className="flex-1"
              icon={<ShoppingCart size={18} />}
            >
              {inCart ? 'Agregar más' : 'Agregar al carrito'} — {formatCurrency(product.price * qty)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Helper de fila de info ───────────────────────────────────────────────────
function InfoRow({ icon, label, value, valueClass = 'text-gray-900' }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2 text-gray-500">
        {icon}
        <span className="text-sm">{label}</span>
      </div>
      <span className={`text-sm font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}

