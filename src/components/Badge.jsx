/**
 * Badge — Etiqueta visual compacta para estados, categorías, etc.
 */

/**
 * @param {'green'|'orange'|'blue'|'red'|'gray'|'yellow'} color
 * @param {'sm'|'md'} size
 */
export default function Badge({ children, color = 'green', size = 'sm', className = '' }) {
  const colors = {
    green:  'bg-green-100 text-green-800',
    orange: 'bg-orange-100 text-orange-800',
    blue:   'bg-blue-100 text-blue-800',
    red:    'bg-red-100 text-red-800',
    gray:   'bg-gray-100 text-gray-700',
    yellow: 'bg-yellow-100 text-yellow-800',
    fresh:  'bg-fresh-400/20 text-fresh-500',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  };

  return (
    <span className={`inline-flex items-center font-semibold rounded-full ${colors[color]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}
