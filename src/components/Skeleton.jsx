/**
 * Skeleton — Placeholders de carga animados
 * Usa pulse animation de Tailwind para simular contenido cargando
 */

/** Bloque rectangular genérico */
export function SkeletonBlock({ className = '' }) {
  return (
    <div className={`bg-gray-200 rounded-lg animate-pulse ${className}`} />
  );
}

/** Skeleton de tarjeta de producto (2 columnas mobile) */
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
      <SkeletonBlock className="w-full aspect-square" />
      <div className="p-3 space-y-2">
        <SkeletonBlock className="h-4 w-3/4" />
        <SkeletonBlock className="h-3 w-1/2" />
        <div className="flex justify-between items-center pt-1">
          <SkeletonBlock className="h-5 w-16" />
          <SkeletonBlock className="h-8 w-8 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/** Grid de skeletons de productos */
export function ProductGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 px-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Skeleton de fila en lista */
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white">
      <SkeletonBlock className="w-12 h-12 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBlock className="h-4 w-3/4" />
        <SkeletonBlock className="h-3 w-1/2" />
      </div>
      <SkeletonBlock className="h-6 w-16" />
    </div>
  );
}

/** Skeleton de pantalla de detalle */
export function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonBlock className="w-full aspect-square" />
      <div className="px-4 space-y-3">
        <SkeletonBlock className="h-6 w-2/3" />
        <SkeletonBlock className="h-4 w-1/3" />
        <SkeletonBlock className="h-20 w-full" />
      </div>
    </div>
  );
}
