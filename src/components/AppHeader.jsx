/**
 * AppHeader — Encabezado superior de la app
 * Adaptativo: título centrado en mobile, logo + nav en desktop
 */
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, ShoppingCart } from 'lucide-react';

/**
 * @param {string}  title        - título a mostrar
 * @param {boolean} showBack     - muestra botón de regresar
 * @param {boolean} showCart     - muestra ícono de carrito
 * @param {number}  cartCount    - cantidad en carrito
 * @param {boolean} showNotif    - muestra ícono de notificaciones
 * @param {React.ReactNode} right - elemento a mostrar en la derecha
 * @param {string}  className
 */
export default function AppHeader({
  title       = 'AgroDirecto',
  showBack    = false,
  showCart    = false,
  cartCount   = 0,
  showNotif   = false,
  right       = null,
  className   = '',
}) {
  const navigate = useNavigate();

  return (
    <header
      className={`sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm ${className}`}
    >
      <div className="flex items-center justify-between px-4 h-14 max-w-2xl mx-auto">

        {/* Izquierda — botón atrás o logo */}
        <div className="flex items-center w-10">
          {showBack ? (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-10 h-10 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Regresar"
            >
              <ChevronLeft size={24} className="text-gray-700" />
            </button>
          ) : (
            <span className="text-primary-600 font-bold text-xl leading-none">🌿</span>
          )}
        </div>

        {/* Centro — título */}
        <h1 className="text-base font-semibold text-gray-900 truncate flex-1 text-center mx-2">
          {title}
        </h1>

        {/* Derecha — acciones */}
        <div className="flex items-center gap-1 w-10 justify-end">
          {right}

          {showNotif && (
            <button
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Notificaciones"
            >
              <Bell size={22} className="text-gray-600" />
            </button>
          )}

          {showCart && (
            <button
              onClick={() => navigate('/carrito')}
              className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
              aria-label={`Carrito — ${cartCount} productos`}
            >
              <ShoppingCart size={22} className="text-gray-600" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary-600 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
