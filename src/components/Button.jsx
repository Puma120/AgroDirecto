/**
 * Button — Botón reutilizable con variantes y estados de carga
 * Todos los botones cumplen ≥44px de altura (touch target)
 */
import { Loader2 } from 'lucide-react';

/**
 * @param {'primary'|'secondary'|'outline'|'ghost'|'danger'} variant
 * @param {'sm'|'md'|'lg'|'full'} size
 * @param {boolean} loading - muestra spinner y deshabilita
 * @param {boolean} disabled
 * @param {React.ReactNode} icon - ícono a mostrar a la izquierda
 */
export default function Button({
  children,
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  disabled = false,
  icon     = null,
  className = '',
  type     = 'button',
  onClick,
  ...rest
}) {
  // ─── Estilos base ───────────────────────────────────────────────────────────
  const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 select-none';

  // ─── Variantes de color ─────────────────────────────────────────────────────
  const variants = {
    primary:   'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 disabled:bg-primary-300',
    secondary: 'bg-earth-400 text-white hover:bg-earth-500 focus:ring-earth-400 disabled:bg-earth-200',
    outline:   'border-2 border-primary-600 text-primary-600 bg-transparent hover:bg-primary-50 focus:ring-primary-500 disabled:border-primary-200 disabled:text-primary-300',
    ghost:     'text-primary-600 bg-transparent hover:bg-primary-50 focus:ring-primary-500',
    danger:    'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300',
  };

  // ─── Tamaños (todos cumplen ≥44px) ─────────────────────────────────────────
  const sizes = {
    sm:   'min-h-[44px] px-4 py-2 text-sm gap-1.5',
    md:   'min-h-[44px] px-5 py-2.5 text-base gap-2',
    lg:   'min-h-[52px] px-6 py-3 text-lg gap-2',
    full: 'min-h-[52px] w-full px-6 py-3 text-lg gap-2',
  };

  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${sizes[size]} ${isDisabled ? 'cursor-not-allowed opacity-70' : ''} ${className}`}
      disabled={isDisabled}
      onClick={onClick}
      {...rest}
    >
      {/* Spinner de carga */}
      {loading && <Loader2 size={18} className="animate-spin" />}

      {/* Ícono opcional (no se muestra si está cargando) */}
      {!loading && icon && <span className="flex-shrink-0">{icon}</span>}

      {children}
    </button>
  );
}
