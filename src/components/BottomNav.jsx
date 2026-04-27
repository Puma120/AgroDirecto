/**
 * BottomNav — Navegación inferior para consumidores (mobile-first)
 * En desktop se oculta; el layout usa sidebar o nav superior
 */
import { NavLink, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Package, User } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/catalogo',  label: 'Inicio',    Icon: Home        },
  { to: '/catalogo',  label: 'Catálogo',  Icon: ShoppingBag, exact: false },
  { to: '/pedidos',   label: 'Pedidos',   Icon: Package     },
  { to: '/perfil',    label: 'Perfil',    Icon: User        },
];

// Definición correcta con rutas únicas
const TABS = [
  { to: '/catalogo', label: 'Inicio',   Icon: Home        },
  { to: '/carrito',  label: 'Carrito',  Icon: ShoppingBag },
  { to: '/pedidos',  label: 'Pedidos',  Icon: Package     },
  { to: '/perfil',   label: 'Perfil',   Icon: User        },
];

/**
 * @param {number} cartCount - badge del carrito
 */
export default function BottomNav({ cartCount = 0 }) {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 safe-area-inset-bottom"
      aria-label="Navegación principal"
    >
      <div className="flex items-stretch max-w-lg mx-auto">
        {TABS.map(({ to, label, Icon }) => {
          const isActive = location.pathname.startsWith(to);
          const isCart   = to === '/carrito';

          return (
            <NavLink
              key={to}
              to={to}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-1 min-h-[56px] transition-colors relative
                ${isActive
                  ? 'text-primary-600'
                  : 'text-gray-500 hover:text-gray-700'
                }`}
              aria-label={label}
            >
              {/* Indicador activo */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-600 rounded-b-full" />
              )}

              {/* Ícono con badge en carrito */}
              <span className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                {isCart && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-primary-600 text-white text-[10px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-0.5 leading-none">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </span>

              <span className={`text-[11px] mt-0.5 font-medium ${isActive ? 'text-primary-600' : 'text-gray-500'}`}>
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
