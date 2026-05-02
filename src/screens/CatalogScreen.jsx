/**
 * CatalogScreen — Pantalla principal del catálogo de productos
 * Incluye: búsqueda, filtros por categoría, grid de productos,
 *          bottom sheet de orden/filtros y pull-to-refresh simulado
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Search, SlidersHorizontal, X, RefreshCw, ChevronDown } from 'lucide-react';
import AppHeader from '../components/AppHeader';
import CategoryChips from '../components/CategoryChips';
import ProductCard from '../components/ProductCard';
import { ProductGridSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Button from '../components/Button';
import { useCart } from '../context/CartContext';
import { useToast } from '../components/Toast';
import { useAuth } from '../context/AuthContext';
import { fetchProducts, refreshProducts, applyFilters } from '../mocks/mockProducts';
import { CATEGORIES } from '../utils/constants';

// ─── Opciones de ordenamiento ─────────────────────────────────────────────────
const SORT_OPTIONS = [
  { value: 'freshness',  label: 'Más frescos primero' },
  { value: 'price_asc',  label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' },
  { value: 'savings',    label: 'Mayor ahorro' },
  { value: 'rating',     label: 'Mejor calificados' },
];

export default function CatalogScreen() {
  const { addItem, isInCart, getItemQty, totals } = useCart();
  const { showToast }    = useToast();
  const { currentUser }  = useAuth();

  // ─── Estado de datos ────────────────────────────────────────────────────────
  const [allProducts, setAllProducts] = useState([]);
  const [isLoading,   setIsLoading]   = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ─── Estado de filtros ──────────────────────────────────────────────────────
  const [search,        setSearch]        = useState('');
  const [selectedCat,   setSelectedCat]   = useState('all');
  const [sortBy,        setSortBy]        = useState('freshness');
  const [maxPrice,      setMaxPrice]      = useState(null);
  const [showFilters,   setShowFilters]   = useState(false);  // bottom sheet

  // ─── Carga inicial de productos ─────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    fetchProducts().then((data) => {
      if (!cancelled) {
        setAllProducts(data);
        setIsLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  // ─── Productos filtrados (derivado, sin estado extra) ───────────────────────
  const filteredProducts = useMemo(() => {
    return applyFilters(allProducts, {
      category: selectedCat,
      search,
      sortBy,
      maxPrice,
    });
  }, [allProducts, selectedCat, search, sortBy, maxPrice]);

  // ─── Conteo por categoría ───────────────────────────────────────────────────
  const categoryCounts = useMemo(() => {
    const counts = {};
    allProducts.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [allProducts]);

  // ─── Pull-to-refresh simulado ───────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    const fresh = await refreshProducts();
    setAllProducts(fresh);
    setIsRefreshing(false);
    showToast({ message: 'Catálogo actualizado', type: 'success' });
  }, [showToast]);

  // ─── Agregar al carrito ─────────────────────────────────────────────────────
  const handleAddToCart = useCallback((product) => {
    const currentQty = getItemQty(product.id);
    const maxOrder = product.maxOrder || 99;
    
    // Si el producto ya está en el carrito y se alcanzó el límite
    if (currentQty > 0 && currentQty >= maxOrder) {
      showToast({
        message: `Solo puedes tener ${maxOrder} ${product.unit} de ${product.name} en tu carrito`,
        type: 'warning',
        duration: 3500,
      });
      return;
    }
    
    addItem(product);
    showToast({
      message: `${product.name} agregado al carrito`,
      type: 'success',
      duration: 2000,
    });
  }, [addItem, showToast, getItemQty]);

  function clearSearch() {
    setSearch('');
  }

  function resetFilters() {
    setSelectedCat('all');
    setSortBy('freshness');
    setMaxPrice(null);
    setShowFilters(false);
  }

  const hasActiveFilters = selectedCat !== 'all' || sortBy !== 'freshness' || maxPrice !== null;
  const activeSortLabel  = SORT_OPTIONS.find((o) => o.value === sortBy)?.label;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ─── Header ──────────────────────────────────────────────────── */}
      <AppHeader
        title="AgroDirecto"
        showCart
        showNotif
        cartCount={totals.itemCount}
      />

      {/* ─── Bienvenida personalizada ─────────────────────────────────── */}
      {currentUser && currentUser.role !== 'guest' && (
        <div className="bg-white px-4 py-3 border-b border-gray-100">
          <p className="text-sm text-gray-500">
            Hola, <span className="font-semibold text-gray-900">{currentUser.name?.split(' ')[0]}</span> 👋
          </p>
          <p className="text-xs text-primary-600 font-medium mt-0.5">
            🌿 Cosechado hoy para ti en Puebla
          </p>
        </div>
      )}

      {/* ─── Barra de búsqueda ───────────────────────────────────────── */}
      <div className="bg-white px-4 pb-3 pt-3 sticky top-14 z-30 border-b border-gray-100 shadow-sm">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar productos, productores..."
              className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-gray-100 border-none text-sm focus:outline-none focus:ring-2 focus:ring-primary-400 transition-all"
            />
            {search && (
              <button
                onClick={clearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                aria-label="Limpiar búsqueda"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            onClick={() => setShowFilters(true)}
            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors min-h-[44px] flex-shrink-0
              ${hasActiveFilters
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            aria-label="Ordenar y filtrar"
          >
            <SlidersHorizontal size={17} />
            {hasActiveFilters && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
          </button>
        </div>
      </div>

      {/* ─── Categorías ──────────────────────────────────────────────── */}
      <div className="bg-white pt-3 pb-2 border-b border-gray-100">
        <CategoryChips
          selected={selectedCat}
          onSelect={setSelectedCat}
          counts={categoryCounts}
        />
      </div>

      {/* ─── Barra de resultados ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <p className="text-xs text-gray-500">
          {isLoading ? 'Cargando...' : (
            <>
              <span className="font-semibold text-gray-900">{filteredProducts.length}</span>
              {' '}producto{filteredProducts.length !== 1 ? 's' : ''}
              {search && <span> para &ldquo;<em>{search}</em>&rdquo;</span>}
            </>
          )}
        </p>

        <button
          onClick={() => setShowFilters(true)}
          className="flex items-center gap-1 text-xs text-primary-600 font-medium min-h-[36px] px-1"
        >
          {activeSortLabel}
          <ChevronDown size={14} />
        </button>
      </div>

      {/* ─── Grid de productos ───────────────────────────────────────── */}
      <main className="px-4 pb-28">
        {isLoading && <ProductGridSkeleton count={6} />}

        {!isLoading && filteredProducts.length === 0 && (
          <EmptyState
            icon="🔍"
            title="Sin resultados"
            message={
              search
                ? `No encontramos "${search}" en el catálogo.`
                : 'No hay productos en esta categoría.'
            }
            action={
              <Button variant="outline" onClick={() => { clearSearch(); setSelectedCat('all'); }}>
                Ver todos los productos
              </Button>
            }
          />
        )}

        {!isLoading && filteredProducts.length > 0 && (
          <>
            <div className="flex justify-center mb-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-primary-600 transition-colors min-h-[36px] px-2"
              >
                <RefreshCw
                  size={13}
                  className={isRefreshing ? 'animate-spin text-primary-500' : ''}
                />
                {isRefreshing ? 'Actualizando...' : 'Actualizar catálogo'}
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  isInCart={isInCart(product.id)}
                  cartQty={getItemQty(product.id)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* ─── Banner de envío gratis ───────────────────────────────────── */}
      {totals.itemCount > 0 && totals.subtotal > 0 && totals.subtotal < 300 && (
        <div className="fixed bottom-16 left-0 right-0 px-4 z-20">
          <div className="bg-primary-600 text-white text-center py-2 px-4 rounded-xl shadow-lg text-xs font-medium max-w-md mx-auto">
            🚚 Agrega{' '}
            <span className="font-bold">
              ${(300 - totals.subtotal).toFixed(0)} más
            </span>{' '}
            para envío gratis
          </div>
        </div>
      )}

      {/* ─── Bottom Sheet de filtros ──────────────────────────────────── */}
      {showFilters && (
        <FilterSheet
          sortBy={sortBy}
          maxPrice={maxPrice}
          onSortChange={setSortBy}
          onMaxPriceChange={setMaxPrice}
          onReset={resetFilters}
          onClose={() => setShowFilters(false)}
        />
      )}
    </div>
  );
}

// ─── Bottom Sheet de filtros/orden ───────────────────────────────────────────
function FilterSheet({ sortBy, maxPrice, onSortChange, onMaxPriceChange, onReset, onClose }) {
  const [localSort,  setLocalSort]  = useState(sortBy);
  const [localPrice, setLocalPrice] = useState(maxPrice);

  const PRICE_OPTIONS = [null, 20, 30, 50, 80];

  function handleApply() {
    onSortChange(localSort);
    onMaxPriceChange(localPrice);
    onClose();
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        <div className="px-5 pb-8">
          <div className="flex items-center justify-between py-3 mb-2">
            <h3 className="text-lg font-bold text-gray-900">Ordenar y filtrar</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <X size={20} className="text-gray-500" />
            </button>
          </div>

          {/* Ordenar por */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">Ordenar por</p>
            <div className="space-y-2">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setLocalSort(opt.value)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-colors text-left min-h-[48px]
                    ${localSort === opt.value
                      ? 'bg-primary-50 text-primary-700 font-semibold'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                >
                  {opt.label}
                  {localSort === opt.value && (
                    <span className="text-primary-600 font-bold">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Precio máximo */}
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">Precio máximo por unidad</p>
            <div className="flex flex-wrap gap-2">
              {PRICE_OPTIONS.map((price) => (
                <button
                  key={price ?? 'all'}
                  onClick={() => setLocalPrice(price)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors min-h-[40px]
                    ${localPrice === price
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                >
                  {price ? `Hasta $${price}` : 'Todos'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" size="md" onClick={onReset} className="flex-1">
              Limpiar
            </Button>
            <Button size="md" onClick={handleApply} className="flex-1">
              Aplicar
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

